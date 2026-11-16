const BUILDER_IMAGE_DB = "athlete-workout-exercise-images";
const BUILDER_IMAGE_STORE = "images";
const uploadedExerciseImageUrls = window.uploadedExerciseImageUrls = new Map();
let builderDraftSections = [];
let builderEditingWorkoutId = null;
let builderEditingExerciseId = null;
let builderSelectedImage = null;
let builderRemoveCurrentImage = false;
let builderPreviewUrl = null;

function builderId(prefix) {
  const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${id}`;
}

function openBuilderImageDb() {
  if (!("indexedDB" in window)) return Promise.reject(new Error("This browser does not support IndexedDB, so uploaded exercise images cannot be saved."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(BUILDER_IMAGE_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(BUILDER_IMAGE_STORE)) request.result.createObjectStore(BUILDER_IMAGE_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open the exercise image database."));
    request.onblocked = () => reject(new Error("The exercise image database is blocked by another browser tab."));
  });
}

async function writeBuilderImage(id, blob, name) {
  const db = await openBuilderImageDb();
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(BUILDER_IMAGE_STORE, "readwrite");
      transaction.objectStore(BUILDER_IMAGE_STORE).put({ blob, name, type: blob.type }, id);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Could not save the exercise image."));
      transaction.onabort = () => reject(transaction.error || new Error("Saving the exercise image was aborted."));
    });
  } finally {
    db.close();
  }
}

async function deleteBuilderImage(id) {
  if (!id) return;
  const db = await openBuilderImageDb();
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(BUILDER_IMAGE_STORE, "readwrite");
      transaction.objectStore(BUILDER_IMAGE_STORE).delete(id);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Could not remove the stored exercise image."));
      transaction.onabort = () => reject(transaction.error || new Error("Removing the exercise image was aborted."));
    });
  } finally {
    db.close();
  }
}

async function deleteAllBuilderImages() {
  const db = await openBuilderImageDb();
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(BUILDER_IMAGE_STORE, "readwrite");
      transaction.objectStore(BUILDER_IMAGE_STORE).clear();
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Could not clear stored exercise images."));
      transaction.onabort = () => reject(transaction.error || new Error("Clearing exercise images was aborted."));
    });
  } finally {
    db.close();
  }
}

async function hydrateBuilderImages() {
  for (const url of uploadedExerciseImageUrls.values()) URL.revokeObjectURL(url);
  uploadedExerciseImageUrls.clear();
  const db = await openBuilderImageDb();
  try {
    const records = await new Promise((resolve, reject) => {
      const transaction = db.transaction(BUILDER_IMAGE_STORE, "readonly");
      const request = transaction.objectStore(BUILDER_IMAGE_STORE).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Could not load stored exercise images."));
    });
    const ids = await new Promise((resolve, reject) => {
      const transaction = db.transaction(BUILDER_IMAGE_STORE, "readonly");
      const request = transaction.objectStore(BUILDER_IMAGE_STORE).getAllKeys();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Could not load exercise image references."));
    });
    records.forEach((record, index) => {
      if (!record?.blob || !ids[index]) return;
      const exercise = state.customExercises.find(item => item.imageId === ids[index]);
      if (exercise) uploadedExerciseImageUrls.set(exercise.id, URL.createObjectURL(record.blob));
    });
    const storedIds = new Set(ids);
    const missingImages = state.customExercises.filter(exercise => exercise.imageId && !storedIds.has(exercise.imageId));
    if (missingImages.length) {
      const message = `Uploaded image data is missing for: ${missingImages.map(exercise => exercise.name).join(", ")}. Edit each exercise to upload its image again.`;
      console.error(message);
      builderSetStatus(message, true);
    }
    if ($("#builder-view")?.classList.contains("active")) renderBuilder();
    if (currentWorkout && $("#session-view")?.classList.contains("active")) renderTimeline();
  } finally {
    db.close();
  }
}

async function exportBuilderExerciseImages(exercises) {
  const referencedIds = new Set(exercises.map(exercise => exercise.imageId).filter(Boolean));
  if (!referencedIds.size) return [];
  const db = await openBuilderImageDb();
  try {
    const { ids, records } = await new Promise((resolve, reject) => {
      const transaction = db.transaction(BUILDER_IMAGE_STORE, "readonly");
      const store = transaction.objectStore(BUILDER_IMAGE_STORE);
      const keysRequest = store.getAllKeys();
      const recordsRequest = store.getAll();
      transaction.onerror = () => reject(transaction.error || new Error("Could not read uploaded images for backup."));
      Promise.all([
        new Promise((res, rej) => { keysRequest.onsuccess = () => res(keysRequest.result); keysRequest.onerror = () => rej(keysRequest.error); }),
        new Promise((res, rej) => { recordsRequest.onsuccess = () => res(recordsRequest.result); recordsRequest.onerror = () => rej(recordsRequest.error); })
      ]).then(([imageIds, allRecords]) => resolve({ ids: imageIds, records: allRecords }), reject);
    });
    const assets = [];
    for (let index = 0; index < ids.length; index += 1) {
      if (!referencedIds.has(ids[index]) || !records[index]?.blob) continue;
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error("Could not prepare an uploaded image for backup."));
        reader.readAsDataURL(records[index].blob);
      });
      assets.push({ imageId: ids[index], dataUrl, name: records[index].name || "exercise-image", type: records[index].type || records[index].blob.type });
    }
    return assets;
  } finally {
    db.close();
  }
}

async function importBuilderExerciseImages(exercises, assets) {
  const imageIdMap = new Map();
  const createdImageIds = [];
  try {
    for (const asset of Array.isArray(assets) ? assets : []) {
      if (!asset?.imageId || typeof asset.dataUrl !== "string" || !asset.dataUrl.startsWith("data:image/")) continue;
      const [metadata, encoded] = asset.dataUrl.split(",", 2);
      if (!encoded) continue;
      const type = asset.type || metadata.match(/^data:([^;]+)/)?.[1] || "application/octet-stream";
      const binary = atob(encoded);
      const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
      const newImageId = builderId("image");
      await writeBuilderImage(newImageId, new Blob([bytes], { type }), asset.name || "exercise-image");
      imageIdMap.set(asset.imageId, newImageId);
      createdImageIds.push(newImageId);
    }
    return {
      exercises: exercises.map(exercise => imageIdMap.has(exercise.imageId) ? { ...exercise, imageId: imageIdMap.get(exercise.imageId) } : exercise),
      createdImageIds
    };
  } catch (error) {
    for (const id of createdImageIds) {
      try {
        await deleteBuilderImage(id);
      } catch (cleanupError) {
        console.error("Could not clean up an incomplete image import:", cleanupError);
      }
    }
    throw error;
  }
}

function builderSetStatus(message, isError = false) {
  const status = $("#builder-status");
  status.hidden = !message;
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function builderLibraryExercises() {
  const unique = new Map();
  allExercises().forEach(exercise => {
    if (!unique.has(exercise.id)) unique.set(exercise.id, exercise);
  });
  return [...unique.values()];
}

function builderRenderWorkoutList() {
  const list = $("#builder-workout-list");
  list.innerHTML = state.customWorkouts.length ? state.customWorkouts.map(workout => `
    <article class="builder-workout-row">
      <div><strong>${escapeHtml(workout.title)}</strong><small>${escapeHtml(workout.day || "Unscheduled")} · ${(workout.sections || []).reduce((count, section) => count + (section.exerciseIds || []).length, 0)} exercises</small></div>
      <div class="builder-row-actions"><button class="secondary" type="button" data-builder-edit-workout="${workout.id}">Edit</button><button class="secondary" type="button" data-builder-duplicate-workout="${workout.id}">Duplicate</button><button class="danger-ghost" type="button" data-builder-delete-workout="${workout.id}">Delete</button></div>
    </article>`).join("") : '<p class="muted tiny">No custom workouts yet. Create one to get started.</p>';
}

function builderRenderLibrary() {
  const all = builderLibraryExercises();
  const search = $("#builder-library-search").value.trim().toLowerCase();
  const categories = [...new Set(all.map(exercise => exercise.category || "General").filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const categorySelect = $("#builder-library-category");
  const currentCategory = categorySelect.value;
  categorySelect.innerHTML = '<option value="">All categories</option>' + categories.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
  categorySelect.value = categories.includes(currentCategory) ? currentCategory : "";
  const workoutsList = allWorkouts();
  const matching = all.filter(exercise => {
    const matchesText = !search || `${exercise.name} ${exercise.category || ""}`.toLowerCase().includes(search);
    return matchesText && (!categorySelect.value || (exercise.category || "General") === categorySelect.value);
  });
  $("#builder-exercise-list").innerHTML = matching.length ? matching.map(exercise => {
    const uses = workoutsList.filter(workout => workout.items.some(item => item.id === exercise.id));
    const targetOptions = workoutsList.map(workout => `<option value="${workout.id}">${escapeHtml(workout.day || "Unscheduled")} · ${escapeHtml(workout.title)}</option>`).join("");
    const usage = uses.length ? `<div class="builder-exercise-usage"><span>Used in:</span>${uses.map(workout => `<span class="builder-usage-chip">${escapeHtml(workout.title)} <button type="button" aria-label="Remove ${escapeHtml(exercise.name)} from ${escapeHtml(workout.title)}" data-builder-remove-use="${workout.id}" data-exercise-id="${exercise.id}">×</button></span>`).join("")}</div>` : "";
    return `<article class="builder-exercise-row">
      <div class="builder-exercise-title"><strong>${escapeHtml(exercise.name)}</strong><span class="tag">${exercise.custom ? "Custom" : "Built in"}</span><small>${escapeHtml(exercise.category || "General")}</small></div>
      <div class="builder-exercise-actions"><select aria-label="Choose workout for ${escapeHtml(exercise.name)}" class="field-input" data-builder-target="${exercise.id}">${targetOptions}</select><button type="button" class="secondary" data-builder-add-existing="${exercise.id}">Add</button>${exercise.custom ? `<button type="button" class="secondary" data-builder-edit-exercise="${exercise.id}">Edit</button><button type="button" class="danger-ghost" data-builder-delete-exercise="${exercise.id}">Delete</button>` : ""}</div>
      ${usage}
    </article>`;
  }).join("") : '<p class="muted tiny">No exercises match your search.</p>';
  const exerciseSelect = $("#builder-add-exercise-select");
  const selectedExercise = exerciseSelect.value;
  exerciseSelect.innerHTML = all.map(exercise => `<option value="${exercise.id}">${escapeHtml(exercise.name)}${exercise.custom ? " · Custom" : ""}</option>`).join("");
  if (all.some(exercise => exercise.id === selectedExercise)) exerciseSelect.value = selectedExercise;
}

function builderRenderDraft() {
  const container = $("#builder-sections");
  container.innerHTML = builderDraftSections.map((section, index) => {
    const exercises = (section.exerciseIds || []).map((id, exerciseIndex) => {
      const exercise = builderLibraryExercises().find(item => item.id === id);
      if (!exercise) return "";
      return `<div class="builder-draft-exercise"><span>${escapeHtml(exercise.name)}</span><div><button type="button" class="secondary" aria-label="Move ${escapeHtml(exercise.name)} up" data-builder-move-exercise="${index}:${exerciseIndex}:-1" ${exerciseIndex === 0 ? "disabled" : ""}>↑</button><button type="button" class="secondary" aria-label="Move ${escapeHtml(exercise.name)} down" data-builder-move-exercise="${index}:${exerciseIndex}:1" ${exerciseIndex === section.exerciseIds.length - 1 ? "disabled" : ""}>↓</button><button type="button" class="danger-ghost" aria-label="Remove ${escapeHtml(exercise.name)} from workout" data-builder-remove-exercise="${index}:${exerciseIndex}">×</button></div></div>`;
    }).join("");
    return `<article class="builder-section">
      <div class="builder-section-heading"><label class="builder-field">Section name<input class="field-input" maxlength="60" value="${escapeHtml(section.name)}" data-builder-section-name="${index}"></label>
      <div class="builder-row-actions"><button type="button" class="secondary" aria-label="Move section up" data-builder-move-section="${index}:-1" ${index === 0 ? "disabled" : ""}>↑</button><button type="button" class="secondary" aria-label="Move section down" data-builder-move-section="${index}:1" ${index === builderDraftSections.length - 1 ? "disabled" : ""}>↓</button><button type="button" class="danger-ghost" data-builder-delete-section="${index}">Remove section</button></div></div>
      <div class="builder-draft-exercises">${exercises || '<p class="muted tiny">No exercises in this section yet.</p>'}</div>
    </article>`;
  }).join("");
  const sectionSelect = $("#builder-add-section-select");
  sectionSelect.innerHTML = builderDraftSections.map((section, index) => `<option value="${index}">${escapeHtml(section.name || `Section ${index + 1}`)}</option>`).join("");
  $("#builder-add-exercise").disabled = builderDraftSections.length === 0 || builderLibraryExercises().length === 0;
}

function renderBuilder() {
  if (!$("#builder-view")) return;
  builderRenderWorkoutList();
  builderRenderLibrary();
  builderRenderDraft();
}

function builderStartWorkoutEdit(workout = null) {
  builderEditingWorkoutId = workout?.id || null;
  $("#builder-workout-heading").textContent = workout ? "Edit workout" : "Create a workout";
  $("#builder-workout-name").value = workout?.title || "";
  $("#builder-workout-description").value = workout?.subtitle || "";
  $("#builder-workout-day").value = workout?.day && workout.day !== "Unscheduled" ? workout.day[0] + workout.day.slice(1).toLowerCase() : "";
  builderDraftSections = workout ? structuredClone(workout.sections || []) : [{ id: builderId("section"), name: "Main Workout", exerciseIds: [] }];
  builderRenderDraft();
  builderSetStatus("");
  $("#builder-workout-name").focus();
}

function builderCancelWorkoutEdit() {
  builderEditingWorkoutId = null;
  builderDraftSections = [];
  $("#builder-workout-form").reset();
  $("#builder-workout-heading").textContent = "Create a workout";
  builderRenderDraft();
}

function builderGetWorkoutUse(exerciseId) {
  return allWorkouts().filter(workout => workout.items.some(exercise => exercise.id === exerciseId));
}

function builderAddExerciseToWorkout(workoutId, exerciseId) {
  const workout = allWorkouts().find(item => item.id === workoutId);
  const exercise = builderLibraryExercises().find(item => item.id === exerciseId);
  if (!workout || !exercise) {
    builderSetStatus("Choose an existing workout and exercise first.", true);
    return;
  }
  if (timer.running && currentWorkout?.id === workoutId) {
    builderSetStatus("Finish or reset this active session before changing its exercise list.", true);
    return;
  }
  if (workout.items.some(item => item.id === exerciseId)) {
    builderSetStatus(`${exercise.name} is already in ${workout.title}.`);
    return;
  }
  const previousCustomWorkouts = structuredClone(state.customWorkouts);
  const previousAdditions = structuredClone(state.workoutAdditions);
  if (workout.id.startsWith("custom-workout-")) {
    const customWorkout = state.customWorkouts.find(item => item.id === workoutId);
    if (!customWorkout) return;
    if (builderEditingWorkoutId === workoutId) {
      builderDraftSections[0]?.exerciseIds.push(exerciseId);
      builderRenderDraft();
      builderSetStatus(`Added ${exercise.name} to the open workout draft. Save the workout to keep the change.`);
      return;
    }
    if (!customWorkout.sections.length) customWorkout.sections.push({ id: builderId("section"), name: "Main Workout", exerciseIds: [] });
    customWorkout.sections[0].exerciseIds.push(exerciseId);
  } else {
    state.workoutAdditions.push({ workoutId, exerciseId, section: exercise.category || "Added exercises" });
  }
  try {
    saveState();
  } catch (error) {
    state.customWorkouts = previousCustomWorkouts;
    state.workoutAdditions = previousAdditions;
    builderSetStatus(`Could not add exercise: ${error.message}`, true);
    return;
  }
  renderAll();
  builderSetStatus(`${exercise.name} added to ${workout.title}.`);
}

function builderRemoveExerciseFromWorkout(workoutId, exerciseId) {
  const workout = allWorkouts().find(item => item.id === workoutId);
  const exercise = builderLibraryExercises().find(item => item.id === exerciseId);
  if (!workout || !exercise) return;
  if (timer.running && currentWorkout?.id === workoutId) {
    builderSetStatus("Finish or reset this active session before changing its exercise list.", true);
    return;
  }
  const previousCustomWorkouts = structuredClone(state.customWorkouts);
  const previousAdditions = structuredClone(state.workoutAdditions);
  if (workout.id.startsWith("custom-workout-")) {
    const customWorkout = state.customWorkouts.find(item => item.id === workoutId);
    customWorkout.sections.forEach(section => {
      section.exerciseIds = section.exerciseIds.filter(id => id !== exerciseId);
    });
  } else {
    state.workoutAdditions = state.workoutAdditions.filter(item => item.workoutId !== workoutId || item.exerciseId !== exerciseId);
  }
  try {
    saveState();
  } catch (error) {
    state.customWorkouts = previousCustomWorkouts;
    state.workoutAdditions = previousAdditions;
    builderSetStatus(`Could not update workout: ${error.message}`, true);
    return;
  }
  renderAll();
  builderSetStatus(`Removed ${exercise.name} from ${workout.title}. The exercise remains in your library.`);
}

function builderOpenExerciseForm(exercise = null) {
  builderEditingExerciseId = exercise?.id || null;
  builderSelectedImage = null;
  builderRemoveCurrentImage = false;
  if (builderPreviewUrl) URL.revokeObjectURL(builderPreviewUrl);
  builderPreviewUrl = null;
  $("#builder-exercise-form").hidden = false;
  $("#builder-exercise-heading").textContent = exercise ? "Edit exercise" : "Create an exercise";
  $("#builder-exercise-name").value = exercise?.name || "";
  $("#builder-exercise-category").value = exercise?.category || "";
  $("#builder-exercise-instructions").value = exercise?.description || "";
  $("#builder-exercise-sets").value = exercise?.sets || 3;
  $("#builder-exercise-reps").value = exercise?.reps || "";
  $("#builder-exercise-duration").value = exercise?.duration || "";
  $("#builder-exercise-rest").value = exercise?.restSeconds ?? 90;
  $("#builder-exercise-weight").value = exercise?.weight || "";
  $("#builder-exercise-image").value = "";
  builderSetImagePreview(exercise?.imageId ? uploadedExerciseImageUrls.get(exercise.id) : null, Boolean(exercise?.imageId));
  $("#builder-exercise-form").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function builderSetImagePreview(url, canRemove) {
  const preview = $("#builder-image-preview");
  preview.replaceChildren();
  if (url) {
    const image = document.createElement("img");
    image.src = url;
    image.alt = "Exercise image preview";
    preview.append(image);
    preview.hidden = false;
  } else {
    preview.hidden = true;
  }
  $("#builder-remove-image").hidden = !canRemove;
  $("#builder-remove-image").textContent = "Remove image";
}

function builderCancelExerciseEdit() {
  $("#builder-exercise-form").reset();
  $("#builder-exercise-form").hidden = true;
  builderEditingExerciseId = null;
  builderSelectedImage = null;
  builderRemoveCurrentImage = false;
  if (builderPreviewUrl) URL.revokeObjectURL(builderPreviewUrl);
  builderPreviewUrl = null;
}

function builderSaveWorkout(event) {
  event.preventDefault();
  const title = $("#builder-workout-name").value.trim();
  const sections = builderDraftSections.map(section => ({ ...section, name: section.name.trim(), exerciseIds: [...new Set(section.exerciseIds)] })).filter(section => section.name);
  if (!title) {
    builderSetStatus("Enter a workout name.", true);
    return;
  }
  if (!sections.length) {
    builderSetStatus("Add at least one named section.", true);
    return;
  }
  if (!sections.some(section => section.exerciseIds.length)) {
    builderSetStatus("Add at least one exercise before saving this workout.", true);
    return;
  }
  if (timer.running && currentWorkout?.id === builderEditingWorkoutId) {
    builderSetStatus("Finish or reset this active session before editing its workout.", true);
    return;
  }
  const existing = builderEditingWorkoutId ? state.customWorkouts.find(item => item.id === builderEditingWorkoutId) : null;
  const savedWorkout = {
    id: existing?.id || builderId("custom-workout"),
    day: $("#builder-workout-day").value || "Unscheduled",
    type: "CUSTOM WORKOUT",
    title,
    subtitle: $("#builder-workout-description").value.trim() || "Custom workout",
    duration: 30,
    icon: "◇",
    sections
  };
  if (existing) state.customWorkouts[state.customWorkouts.indexOf(existing)] = savedWorkout;
  else state.customWorkouts.push(savedWorkout);
  try {
    saveState();
  } catch (error) {
    if (existing) state.customWorkouts[state.customWorkouts.findIndex(item => item.id === savedWorkout.id)] = existing;
    else state.customWorkouts = state.customWorkouts.filter(item => item.id !== savedWorkout.id);
    builderSetStatus(`Could not save workout: ${error.message}`, true);
    return;
  }
  builderCancelWorkoutEdit();
  renderAll();
  if (currentWorkout?.id === savedWorkout.id) {
    currentWorkout = allWorkouts().find(item => item.id === savedWorkout.id);
    timer.plan = estimatePlanFor(currentWorkout);
    renderTimeline();
    updateProgress();
    updateTimerPanel();
  }
  builderSetStatus("Workout saved.");
}

async function builderSaveExercise(event) {
  event.preventDefault();
  const name = $("#builder-exercise-name").value.trim();
  const enteredReps = $("#builder-exercise-reps").value.trim();
  const durationSeconds = Number($("#builder-exercise-duration").value);
  if (!name || (!enteredReps && !(durationSeconds > 0))) {
    builderSetStatus("Enter an exercise name and either repetitions or a duration per set.", true);
    return;
  }
  const reps = enteredReps || `${durationSeconds} sec`;
  const oldExercise = state.customExercises.find(item => item.id === builderEditingExerciseId);
  const sets = Math.max(1, Math.min(30, Number($("#builder-exercise-sets").value) || 1));
  const computedMinutes = durationSeconds > 0 ? Math.max(0.1, sets * durationSeconds / 60) : Math.max(0.1, sets * repUnits(reps) * 3 / 60);
  const category = $("#builder-exercise-category").value.trim() || "General";
  const description = $("#builder-exercise-instructions").value.trim();
  const exerciseId = oldExercise?.id || builderId("custom-exercise");
  let imageId = oldExercise?.imageId || null;
  let newImageId = null;
  let imageWarning = "";
  try {
    if (builderSelectedImage) {
      newImageId = builderId("image");
      await writeBuilderImage(newImageId, builderSelectedImage, builderSelectedImage.name || "exercise-image");
      imageId = newImageId;
    } else if (builderRemoveCurrentImage) {
      imageId = null;
    }
    const exercise = {
      id: exerciseId,
      name,
      sets,
      reps,
      category,
      minutes: computedMinutes,
      duration: durationSeconds > 0 ? Math.min(durationSeconds, 3600) : null,
      description,
      muscles: [category],
      steps: description ? description.split(/\r?\n/).map(line => line.trim()).filter(Boolean) : ["Use a controlled range and stop if technique changes."],
      equipment: $("#builder-exercise-weight").value.trim() || "Bodyweight",
      weight: $("#builder-exercise-weight").value.trim(),
      weighted: Boolean($("#builder-exercise-weight").value.trim()),
      restSeconds: Math.max(0, Math.min(600, Number($("#builder-exercise-rest").value) || 0)),
      imageId
    };
    const previousExercises = state.customExercises;
    state.customExercises = oldExercise ? state.customExercises.map(item => item.id === exerciseId ? exercise : item) : [...state.customExercises, exercise];
    try {
      saveState();
    } catch (error) {
      state.customExercises = previousExercises;
      throw error;
    }
    if (oldExercise?.imageId && oldExercise.imageId !== imageId && !builderRemoveCurrentImage) {
      uploadedExerciseImageUrls.delete(exerciseId);
      try {
        await deleteBuilderImage(oldExercise.imageId);
      } catch (error) {
        console.error("Could not remove replaced exercise image:", error);
        imageWarning = `The exercise was saved, but its old image could not be removed: ${error.message}`;
      }
    }
    if (newImageId) {
      const oldUrl = uploadedExerciseImageUrls.get(exerciseId);
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      uploadedExerciseImageUrls.set(exerciseId, URL.createObjectURL(builderSelectedImage));
    } else if (builderRemoveCurrentImage) {
      const oldUrl = uploadedExerciseImageUrls.get(exerciseId);
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      uploadedExerciseImageUrls.delete(exerciseId);
      if (oldExercise?.imageId) {
        try {
          await deleteBuilderImage(oldExercise.imageId);
        } catch (error) {
          console.error("Could not remove exercise image:", error);
          imageWarning = `The exercise was saved, but its image could not be removed: ${error.message}`;
        }
      }
    }
    builderCancelExerciseEdit();
    renderAll();
    if (currentWorkout) {
      currentWorkout = allWorkouts().find(item => item.id === currentWorkout.id) || currentWorkout;
      timer.plan = estimatePlanFor(currentWorkout);
      renderTimeline();
      updateProgress();
      updateTimerPanel();
    }
    builderSetStatus(imageWarning || "Exercise saved in your library.", Boolean(imageWarning));
  } catch (error) {
    if (newImageId) {
      try {
        await deleteBuilderImage(newImageId);
      } catch (cleanupError) {
        console.error("Could not clean up an unsaved exercise image:", cleanupError);
      }
    }
    builderSetStatus(`Could not save exercise: ${error.message}`, true);
  }
}

function builderDeleteWorkout(id) {
  const workout = state.customWorkouts.find(item => item.id === id);
  if (!workout) return;
  if (timer.running && currentWorkout?.id === id) {
    builderSetStatus("Finish or reset this active session before deleting its workout.", true);
    return;
  }
  if (!confirm(`Delete "${workout.title}"? Its exercises will remain in the exercise library.`)) return;
  const previous = state.customWorkouts;
  state.customWorkouts = state.customWorkouts.filter(item => item.id !== id);
  try {
    saveState();
  } catch (error) {
    state.customWorkouts = previous;
    builderSetStatus(`Could not delete workout: ${error.message}`, true);
    return;
  }
  renderAll();
  builderSetStatus("Workout deleted. Its exercises remain in the library.");
}

function builderDuplicateWorkout(id) {
  const workout = state.customWorkouts.find(item => item.id === id);
  if (!workout) return;
  const duplicate = structuredClone(workout);
  duplicate.id = builderId("custom-workout");
  duplicate.title = `${workout.title} (copy)`;
  state.customWorkouts.push(duplicate);
  try {
    saveState();
  } catch (error) {
    state.customWorkouts = state.customWorkouts.filter(item => item.id !== duplicate.id);
    builderSetStatus(`Could not duplicate workout: ${error.message}`, true);
    return;
  }
  renderAll();
  builderSetStatus("Workout duplicated.");
}

async function builderDeleteExercise(id) {
  const exercise = state.customExercises.find(item => item.id === id);
  if (!exercise) return;
  if (timer.running && currentWorkout?.items.some(item => item.id === id)) {
    builderSetStatus("Finish or reset the active session before deleting an exercise it uses.", true);
    return;
  }
  const uses = builderGetWorkoutUse(id);
  const impact = uses.length ? `\n\nIt is used in: ${uses.map(workout => workout.title).join(", ")}. Confirming will also remove it from those workouts.` : "";
  if (!confirm(`Permanently delete "${exercise.name}" from the exercise library?${impact}`)) return;
  const oldExercises = state.customExercises;
  const oldAdditions = state.workoutAdditions;
  const oldWorkouts = state.customWorkouts;
  state.customExercises = state.customExercises.filter(item => item.id !== id);
  state.workoutAdditions = state.workoutAdditions.filter(item => item.exerciseId !== id);
  state.customWorkouts = state.customWorkouts.map(workout => ({
    ...workout,
    sections: workout.sections.map(section => ({ ...section, exerciseIds: section.exerciseIds.filter(exerciseId => exerciseId !== id) }))
  }));
  try {
    saveState();
  } catch (error) {
    state.customExercises = oldExercises;
    state.workoutAdditions = oldAdditions;
    state.customWorkouts = oldWorkouts;
    builderSetStatus(`Could not delete exercise: ${error.message}`, true);
    return;
  }
  const url = uploadedExerciseImageUrls.get(id);
  if (url) URL.revokeObjectURL(url);
  uploadedExerciseImageUrls.delete(id);
  let imageWarning = "";
  if (exercise.imageId) {
    try {
      await deleteBuilderImage(exercise.imageId);
    } catch (error) {
      console.error("Could not delete the exercise image:", error);
      imageWarning = `Exercise deleted, but its image could not be removed: ${error.message}`;
    }
  }
  renderAll();
  builderSetStatus(imageWarning || "Exercise deleted from the library and its listed workouts.", Boolean(imageWarning));
}

function initWorkoutBuilder() {
$("#builder-new-workout").addEventListener("click", () => builderStartWorkoutEdit());
$("#builder-cancel-workout").addEventListener("click", builderCancelWorkoutEdit);
$("#builder-workout-form").addEventListener("submit", builderSaveWorkout);
$("#builder-add-section").addEventListener("click", () => {
  builderDraftSections.push({ id: builderId("section"), name: "New section", exerciseIds: [] });
  builderRenderDraft();
});
$("#builder-add-exercise").addEventListener("click", () => {
  if (!builderDraftSections.length) return;
  const sectionIndex = Number($("#builder-add-section-select").value) || 0;
  const exerciseId = $("#builder-add-exercise-select").value;
  const existing = builderDraftSections.some(section => section.exerciseIds.includes(exerciseId));
  if (existing) {
    builderSetStatus("That exercise is already in this workout.");
    return;
  }
  builderDraftSections[sectionIndex].exerciseIds.push(exerciseId);
  builderRenderDraft();
  builderSetStatus("");
});
$("#builder-new-exercise").addEventListener("click", () => builderOpenExerciseForm());
$("#builder-cancel-exercise").addEventListener("click", builderCancelExerciseEdit);
$("#builder-exercise-form").addEventListener("submit", builderSaveExercise);
$("#builder-upload-image").addEventListener("click", () => $("#builder-exercise-image").click());
$("#builder-exercise-image").addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (!file) return;
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  const allowedExtensions = /\.(jpe?g|png|webp)$/i;
  if (!(allowedTypes.has(file.type) || (!file.type && allowedExtensions.test(file.name)))) {
    event.target.value = "";
    builderSetStatus("Choose a JPG, JPEG, PNG, or WEBP image.", true);
    return;
  }
  builderSelectedImage = file;
  builderRemoveCurrentImage = false;
  if (builderPreviewUrl) URL.revokeObjectURL(builderPreviewUrl);
  builderPreviewUrl = URL.createObjectURL(file);
  builderSetImagePreview(builderPreviewUrl, true);
});
$("#builder-remove-image").addEventListener("click", () => {
  builderSelectedImage = null;
  builderRemoveCurrentImage = true;
  $("#builder-exercise-image").value = "";
  if (builderPreviewUrl) URL.revokeObjectURL(builderPreviewUrl);
  builderPreviewUrl = null;
  builderSetImagePreview(null, false);
  builderSetStatus("The image will be removed when you save this exercise.");
});
$("#builder-library-search").addEventListener("input", builderRenderLibrary);
$("#builder-library-category").addEventListener("change", builderRenderLibrary);
$("#builder-exercise-list").addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.builderAddExisting) {
    const target = $(`[data-builder-target="${button.dataset.builderAddExisting}"]`).value;
    builderAddExerciseToWorkout(target, button.dataset.builderAddExisting);
  } else if (button.dataset.builderEditExercise) {
    builderOpenExerciseForm(state.customExercises.find(item => item.id === button.dataset.builderEditExercise));
  } else if (button.dataset.builderDeleteExercise) {
    builderDeleteExercise(button.dataset.builderDeleteExercise);
  } else if (button.dataset.builderRemoveUse) {
    builderRemoveExerciseFromWorkout(button.dataset.builderRemoveUse, button.dataset.exerciseId);
  }
});
$("#builder-workout-list").addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;
  const id = button.dataset.builderEditWorkout || button.dataset.builderDuplicateWorkout || button.dataset.builderDeleteWorkout;
  if (button.dataset.builderEditWorkout) builderStartWorkoutEdit(state.customWorkouts.find(item => item.id === id));
  else if (button.dataset.builderDuplicateWorkout) builderDuplicateWorkout(id);
  else if (button.dataset.builderDeleteWorkout) builderDeleteWorkout(id);
});
$("#builder-sections").addEventListener("input", event => {
  const input = event.target.closest("[data-builder-section-name]");
  if (input) {
    builderDraftSections[Number(input.dataset.builderSectionName)].name = input.value;
    const current = $("#builder-add-section-select").value;
    builderRenderDraft();
    $("#builder-add-section-select").value = current;
  }
});
$("#builder-sections").addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.builderDeleteSection !== undefined) {
    builderDraftSections.splice(Number(button.dataset.builderDeleteSection), 1);
  } else if (button.dataset.builderMoveSection) {
    const [index, direction] = button.dataset.builderMoveSection.split(":").map(Number);
    const target = index + direction;
    [builderDraftSections[index], builderDraftSections[target]] = [builderDraftSections[target], builderDraftSections[index]];
  } else if (button.dataset.builderMoveExercise) {
    const [sectionIndex, exerciseIndex, direction] = button.dataset.builderMoveExercise.split(":").map(Number);
    const ids = builderDraftSections[sectionIndex].exerciseIds;
    const target = exerciseIndex + direction;
    [ids[exerciseIndex], ids[target]] = [ids[target], ids[exerciseIndex]];
  } else if (button.dataset.builderRemoveExercise) {
    const [sectionIndex, exerciseIndex] = button.dataset.builderRemoveExercise.split(":").map(Number);
    builderDraftSections[sectionIndex].exerciseIds.splice(exerciseIndex, 1);
  }
  builderRenderDraft();
});

hydrateBuilderImages().catch(error => {
  console.error("Could not restore uploaded exercise images:", error);
  builderSetStatus(`Stored exercise images could not be loaded: ${error.message}`, true);
});
}

queueMicrotask(initWorkoutBuilder);

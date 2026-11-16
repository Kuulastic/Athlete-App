const exerciseDemoSources = Object.freeze({
  backSquat: {
    title: "Barbell Full Squat",
    author: "Workout Guru",
    url: "https://wger.de/api/v2/exerciseinfo/1801/",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  romanianDeadlift: {
    title: "Dumbbell Romanian Deadlift",
    author: "AlucardEvil40",
    url: "https://wger.de/api/v2/exerciseinfo/1652/",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  bulgarianSplitSquat: {
    title: "Bulgarian split squats left",
    author: "Franpol",
    url: "https://wger.de/api/v2/exerciseinfo/988/",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  seatedLegCurl: {
    title: "Leg Curls (sitting)",
    author: "Everkinetic",
    url: "https://wger.de/api/v2/exerciseinfo/366/",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/"
  },
  standingCalfRaise: {
    title: "Standing Calf Raises",
    author: "clafal",
    url: "https://wger.de/api/v2/exerciseinfo/622/",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  benchPress: {
    title: "Bench Press",
    author: "Everkinetic",
    url: "https://wger.de/api/v2/exerciseinfo/73/",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/"
  },
  pullUps: {
    title: "Pull-ups",
    author: "Imobard",
    url: "https://wger.de/api/v2/exerciseinfo/475/",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  inclineDumbbellPress: {
    title: "Incline Bench Press - Dumbbell",
    author: "Everkinetic",
    url: "https://wger.de/api/v2/exerciseinfo/537/",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/"
  },
  chestSupportedRow: {
    title: "Incline Chest-Supported Dumbbell Row",
    author: "carlos3c",
    url: "https://wger.de/api/v2/exerciseinfo/1283/",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  latPulldown: {
    title: "Close-grip supinated lat pulldown",
    author: "Franpol",
    url: "https://wger.de/api/v2/exerciseinfo/1127/",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  cableLateralRaise: {
    title: "Cable Lateral Raises (Single Arm)",
    author: "carlos3c",
    url: "https://wger.de/api/v2/exerciseinfo/1378/",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  cableRearDeltFly: {
    title: "Cable Rear Delt Fly",
    author: "cshep442",
    url: "https://wger.de/api/v2/exerciseinfo/822/",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  dumbbellBicepCurl: {
    title: "Biceps Curls With Dumbbell",
    author: "Everkinetic",
    url: "https://wger.de/api/v2/exerciseinfo/92/",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/"
  },
  hammerCurl: {
    title: "Hammer Curls",
    author: "Everkinetic",
    url: "https://wger.de/api/v2/exerciseinfo/272/",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/"
  },
  tricepsPushdown: {
    title: "Triceps Pushdown",
    author: "anto.kreegyr",
    url: "https://wger.de/api/v2/exerciseinfo/1185/",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/"
  }
});

const exerciseDemonstrations = Object.freeze({
  squat: [
    { source: "backSquat", src: "assets/exercises/back-squat.jpg", stage: "Squat position", alt: "Illustration of a lifter holding a barbell across the upper back at the bottom of a back squat." }
  ],
  rdl: [
    { source: "romanianDeadlift", src: "assets/exercises/romanian-deadlift.jpg", stage: "Hinge and stand", alt: "Two side-by-side positions of a dumbbell Romanian deadlift, showing the hip hinge and standing finish." }
  ],
  bulgarian: [
    { source: "bulgarianSplitSquat", src: "assets/exercises/bulgarian-split-squat.jpg", stage: "Rear-foot elevated split squat", alt: "Illustration of a dumbbell Bulgarian split squat with the rear foot supported on a bench." }
  ],
  legcurl: [
    { source: "seatedLegCurl", src: "assets/exercises/seated-leg-curl-start.jpg", stage: "Legs extended", alt: "Seated leg curl machine setup with the legs extended." },
    { source: "seatedLegCurl", src: "assets/exercises/seated-leg-curl-finish.jpg", stage: "Knees flexed", alt: "Seated leg curl machine with the knees bent and lower legs curled beneath the seat." }
  ],
  calf: [
    { source: "standingCalfRaise", src: "assets/exercises/standing-calf-raise.jpg", stage: "Lower and rise", alt: "Two positions of a standing calf raise, from heels lowered to heels raised." }
  ],
  bench: [
    { source: "benchPress", src: "assets/exercises/barbell-bench-press-start.png", stage: "Lowered position", alt: "Barbell bench press at the chest with the lifter lying on a flat bench." },
    { source: "benchPress", src: "assets/exercises/barbell-bench-press-finish.png", stage: "Press position", alt: "Barbell bench press with the bar pressed upward over the chest." }
  ],
  pullup: [
    { source: "pullUps", src: "assets/exercises/pull-ups.jpg", stage: "Hang and pull", alt: "Two positions of a pull-up, from a controlled hang to the chin above the bar." }
  ],
  incline: [
    { source: "inclineDumbbellPress", src: "assets/exercises/incline-dumbbell-press-start.png", stage: "Lowered position", alt: "Incline dumbbell press with the dumbbells lowered beside the chest on an angled bench." },
    { source: "inclineDumbbellPress", src: "assets/exercises/incline-dumbbell-press-finish.png", stage: "Press position", alt: "Incline dumbbell press with the weights pressed above the chest." }
  ],
  row: [
    { source: "chestSupportedRow", src: "assets/exercises/chest-supported-row.jpg", stage: "Row and return", alt: "Two positions of a chest-supported dumbbell row on an inclined bench." }
  ],
  lat: [
    { source: "latPulldown", src: "assets/exercises/lat-pulldown.jpg", stage: "Close-grip variation", alt: "Close-grip, palms-toward-you lat pulldown shown from arms extended to the bar pulled toward the chest." }
  ],
  lateral: [
    { source: "cableLateralRaise", src: "assets/exercises/cable-lateral-raise.jpg", stage: "Single-arm cable variation", alt: "Single-arm cable lateral raise with the working arm lifted out to the side." }
  ],
  rear: [
    { source: "cableRearDeltFly", src: "assets/exercises/rear-delt-fly.jpg", stage: "Rear delt fly", alt: "Bent-over cable rear-delt fly with the arms opened out to the sides." }
  ],
  curl: [
    { source: "dumbbellBicepCurl", src: "assets/exercises/dumbbell-bicep-curl-start.png", stage: "Arms extended", alt: "Standing dumbbell biceps curl with the arms lowered." },
    { source: "dumbbellBicepCurl", src: "assets/exercises/dumbbell-bicep-curl-finish.png", stage: "Curl position", alt: "Standing dumbbell biceps curl with the weights raised toward the shoulders." }
  ],
  hammer: [
    { source: "hammerCurl", src: "assets/exercises/hammer-curl-start.png", stage: "Arms extended", alt: "Standing neutral-grip hammer curl with the arms lowered." },
    { source: "hammerCurl", src: "assets/exercises/hammer-curl-finish.png", stage: "Curl position", alt: "Standing neutral-grip hammer curl with the dumbbells raised." }
  ],
  pushdown: [
    { source: "tricepsPushdown", src: "assets/exercises/triceps-pushdown.jpg", stage: "Cable pushdown", alt: "Cable triceps pushdown using a bar attachment, with elbows kept close to the sides." }
  ]
});

const supportedExercisePhotoExtensions = Object.freeze([".jpg", ".jpeg", ".jfif", ".webp", ".avif"]);
const exercisePhotoFiles = Object.freeze({
  "dynamic-warm-up": "dynamic-warm-up.jpeg",
  "power-clean": "power-clean.jpg",
  "trap-bar-jump": "trap-bar-jump.jfif",
  "pogo-jump": "pogo-jump.jfif",
  "approach-jump": "approach-jump.jpg",
  "overcoming-isometric-split-squat": "overcoming-isometric-split-squat.jfif",
  "back-squat": "back-squat.jfif",
  "romanian-deadlift": "romanian-deadlift.webp",
  "bulgarian-split-squat": "bulgarian-split-squat.avif",
  "spanish-squat": "spanish-squat.jfif",
  "single-leg-rdl": "single-leg-rdl.jfif",
  "bridge-abduction": "bridge-abduction.jfif",
  "single-leg-wall-sit": "single-leg-wall-sit.jfif",
  "pull-up": "pull-up.jfif",
  "shoulder-press": "shoulder-press.jfif",
  "lateral-raise": "lateral-raise.webp",
  "concentration-curl": "concentration-curl.jfif",
  "sit-up": "sit-up.jfif",
  "bicycle-crunch": "bicycle-crunch.jfif",
  "plank": "plank.jfif",
  "hamstring-stretch": "hamstring-stretch.jfif",
  "quad-stretch": "quad-stretch.jfif",
  "butterfly-stretch": "butterfly-stretch.jfif",
  "pigeon-stretch": "pigeon-stretch.jfif",
  "hip-thrust": "hip-thrust.jfif",
  "hack-squats": "hack-squats.jfif",
  "seated-leg-curl": "seated-leg-curl.jpg",
  "overhead-triceps-extension": "overhead-triceps-extension.jfif",
  "triceps-extension": "triceps-extension.jpg",
  "standing-calf-raise": "standing-calf-raise.webp",
  "tibialis-raise": "tibialis-raise.webp",
  "hip-abduction-machine": "hip-abduction-machine.webp",
  "single-leg-calf-isometric": "single-leg-calf-isometric.jfif",
  "hanging-leg-raise": "hanging-leg-raise.jfif",
  "cable-crunch": "cable-crunch.jfif",
  "leg-raise-twists": "leg-raise-twists.jfif",
  "dragon-flag": "dragon-flag.jfif",
  "side-plank": "side-plank.jpg"
});

const exercisePhotoNames = Object.freeze({
  warmup: ["dynamic-warm-up"],
  homewarmup: ["dynamic-warm-up"],
  spanish: ["spanish-squat"],
  sldl: ["single-leg-rdl"],
  bridgeabd: ["bridge-abduction"],
  singlelegwallsit: ["single-leg-wall-sit"],
  homepullup: ["pull-up"],
  powerclean: {
    A: ["power-clean"],
    B: ["trap-bar-jump"]
  },
  overheadtri: ["overhead-triceps-extension"],
  pushdown: ["triceps-extension"],
  pogos: ["pogo-jump"],
  approach: ["approach-jump"],
  isometric: ["overcoming-isometric-split-squat"],
  squat: ["back-squat"],
  rdl: ["romanian-deadlift"],
  bulgarian: ["bulgarian-split-squat"],
  shoulderpress: ["shoulder-press"],
  lateralraise: ["lateral-raise"],
  concentrationcurl: ["concentration-curl"],
  situps: ["sit-up"],
  bicyclecrunch: ["bicycle-crunch"],
  plank: ["plank"],
  hamstretch: ["hamstring-stretch"],
  quadstretch: ["quad-stretch"],
  butterflystretch: ["butterfly-stretch"],
  pigeonstretch: ["pigeon-stretch"],
  hipthrust: ["hip-thrust"],
  hacksquat: ["hack-squats"],
  legcurl: ["seated-leg-curl"],
  calf: ["standing-calf-raise"],
  tib: ["tibialis-raise"],
  abduct: ["hip-abduction-machine"],
  calfiso: ["single-leg-calf-isometric"],
  core: ["hanging-leg-raise", "cable-crunch", "side-plank"],
  uppercore: ["hanging-leg-raise", "cable-crunch"],
  weightedhanging: ["hanging-leg-raise"],
  cablecrunch: ["cable-crunch"],
  legraisetwist: ["leg-raise-twists"],
  dragonflag: ["dragon-flag"]
});

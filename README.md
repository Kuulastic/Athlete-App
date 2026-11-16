# ATHLETE — Training Dashboard

A local-first workout tracker built with plain HTML, CSS and JavaScript.

## Run it in VS Code
1. Extract this folder.
2. Open the `athlete-workout-app` folder in VS Code.
3. Open `index.html` in your browser, or use the VS Code **Live Server** extension and choose **Open with Live Server**.
4. Your workouts and settings are saved in this browser using `localStorage`.

## Included
- Tuesday lower-body gym workout (power clean / trap-bar jump alternating slot)
- Friday upper-body gym workout
- Saturday post-Dreamers recovery and mobility routine
- Vertical exercise timeline with completion and auto-scroll
- Expandable exercise instructions with responsive, locally bundled demonstrations where a movement-matched, openly licensed source was verified
- Floating overall session timer with elapsed time, estimated exercise position, and persistent progress
- Week A / Week B rotation for the designated alternating exercise
- Beginner-adjusted session estimates that keep rest periods separate
- Dunking Progress dashboard with dated bodyweight and lift trends, editable strength references, and relative-load comparisons
- Default rest between sets and between exercises
- Per-exercise rest overrides
- Session time windows
- Workout history, exercise notes, and data export/import
- Workout Builder for custom workouts, reusable exercises, sections, and exercise ordering
- Persistent exercise-image uploads using IndexedDB, with previews and image-aware JSON backups

## Important notes
- The Saturday routine is deliberately light because it follows basketball training.
- Verified, locally bundled Creative Commons demonstrations cover Back Squat, Romanian Deadlift, Bulgarian Split Squat, seated leg curl, standing calf raise, bench press, pull-ups, incline dumbbell press, chest-supported row, lat pulldown, cable lateral raise, cable rear-delt fly, dumbbell biceps curl, hammer curl, and triceps pushdown.
- Exercise demonstration assets, alt text, attribution, source records, and Creative Commons license links are maintained in `exercise-images.js`; bundled images are under `assets/exercises/`. Optional local exercise photos are mapped from the sibling `exercise-photos/` folder, and missing or unsupported matches retain a verified movement image when available or show a clean fallback.
- Optional exercise photos are read from the sibling `exercise-photos/` folder by normalized exercise basename. Supported extensions are `.jpg`, `.jpeg`, `.jfif`, `.webp`, and `.avif`; the image catalog records each actual filename and maps photos to the matching workout movement (including the current Week A/B power variation). Photo galleries show no filename or source captions.
- Friday's core finisher is weighted hanging leg raises, cable crunches, leg raise twists, and dragon flags. Their matching photos, including the user-provided `leg-raise-twists.jfif` and `dragon-flag.jfif`, are mapped to their respective exercises.
- Data is stored locally in the browser. Export a JSON backup before changing devices or clearing browser data.
- Session estimates scale exercise work time for beginners (about 1.5× for non-weighted movements and 2× for weighted movements) while counting set and transition rests once. The floating timer is a guide, not a deadline, and keeps running during rest.
- The designated Tuesday exercise alternates between its Week A and Week B variations. Weeks advance on Monday and the current week can be corrected in Settings.
- Exercise estimates use each workout's original duration as a baseline, scale work time for beginner planning, and count set/transition rests separately. Individual estimates, sets, and reps can be edited in the expanded exercise details.
- Dunking Progress records bodyweight and external lift loads (Bulgarian split squat per hand; trap-bar jump loads separately). Its configurable strength references are estimates only, not validated dunking requirements or guarantees.
- Custom workout and exercise metadata is added to the existing `athlete-training-v1` localStorage record without clearing existing settings, history, or progress. Uploaded image blobs are stored separately in the `athlete-workout-exercise-images` IndexedDB database; saved exercises reference those blobs by ID. Images persist across refreshes and browser restarts in the same browser profile and app origin. JSON backups include custom uploaded images.
- Open **Workout Builder** in the sidebar to create and manage custom workouts, organize exercises into named sections, reuse library exercises across workouts, and edit or delete custom exercises. Built-in exercises cannot be deleted. Added exercises can be removed from an individual workout without deleting the library entry.
- Exact photos from the sibling `exercise-photos/` folder are mapped by actual filename and extension only to matching movements, including all supplied home-routine movements, the four home stretches, Hip Thrusts, and Hack Squats. No similar movement is used as a substitute.
- Hip Thrusts (3 × 10–12, 90 sec rest) and Hack Squats (3 × 8–10, 120 sec rest) were restored to Tuesday after Bulgarian split squats. Both are marked as restored additions in the workout.

## Project files
- `index.html` — page structure
- `styles.css` — responsive styling
- `session-guide.css` — floating session timer and training-week styling
- `progress.css` — compact timer and responsive Dunking Progress charts and forms
- `app.js` — workouts, timeline, settings, timer and local storage
- `workout-builder.js` — custom workout/exercise management and IndexedDB image persistence
- `workout-builder.css` — responsive Workout Builder layout

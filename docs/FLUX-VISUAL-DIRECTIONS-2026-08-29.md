# Three Flux visual directions — 2026-08-29

Status: **WAKE rejected and removed 2026-08-29**. PLUMB reached one local
exact-viewport prototype, triggered its own retirement criterion, and was
rejected before publication. Its runtime was removed. SLIP remains unselected.
WAKE was selected and implemented, but repeated live review found that its
ribbons read as disordered rain rather than convincing 3D. Its catalog entry,
renderer, fallback, tests and current QA captures are removed. The design study
below remains a historical decision record, not an active implementation contract.

Shared constraints: continuous low-amplitude motion at rest; strong peripheral
speed and acceleration legibility; no starburst, particles, moire, halftone,
static typography, conventional buildings, road imitation, or information
graphics; Canvas2D/WebGL2 implementation within the Tesla budget.

## 1. PLUMB — inertial suspension

**Perceptual thesis.** The screen is a suspended physical body subject to the
same longitudinal forces as the passenger. Seventeen weighted rods hang from a
strict Swiss top grid. Each is a damped oscillator with a slightly different
natural frequency, so an impulse travels across the field instead of moving it
as one decorative curtain.

Rest motion has a physical cause: a vehicle-mounted suspended mass never fully
settles. The rod tips travel only 1–2 physical pixels at standstill.

| Speed | Field state |
|---:|---|
| 0 km/h | vertical, 55% length, residual independent motion |
| 20 km/h | 2° rear bias, 62% length |
| 40 km/h | 4° rear bias, 72% length; the field is already unmistakably alive |
| 80 km/h | 7° rear bias, 88% length, higher damping |
| 130 km/h | 9° saturated bias, full length, firm rather than frantic |

Speed governs length and damping; acceleration governs angle and wave energy.
OPEN briefly lowers damping and stiffens the rods, sending one crisp travelling
wave. UNDERWATER doubles damping and pulls the rods toward vertical over 550 ms,
as if the field entered a denser medium.

**Minimum prototype.** Canvas2D, seventeen preallocated rods, fixed-step
second-order integration, two palette colours, no blur.

**Retire if:** a 0→40 km/h run is not identifiable in peripheral vision without
reading the speed display, or the field is described primarily as strings,
rain, equalizer bars, or a decorative screen saver.

## 2. SLIP — elastic colour shear

**Perceptual thesis.** The whole screen is one piece of elastic material under
longitudinal load. Two large colour slabs meet at a single oblique seam. Motion
is read from the seam's continuous shear and elastic lag, not from objects
crossing the frame.

At rest, mechanical preload moves slowly along the seam as one broad deformation
with a 6–8 second period. It never loops through an obvious first frame.

| Speed | Field state |
|---:|---|
| 0 km/h | seam near centre, 2% travelling preload |
| 20 km/h | 6% rearward shear, slow material creep |
| 40 km/h | 14% shear and clearly asymmetric colour mass |
| 80 km/h | 28% shear; the leading slab becomes narrow and taut |
| 130 km/h | 40% saturated shear with slow, high-tension motion |

Speed sets sustained shear and seam velocity. Acceleration produces an elastic
overshoot that crosses the screen once and settles; deceleration reverses its
sign without reversing time. OPEN makes the seam momentarily sharper and sends
one 400 ms tensile pulse. UNDERWATER broadens the seam, reduces contrast, and
returns the slabs toward equal pressure.

**Minimum prototype.** One full-screen triangle strip with 24 vertices, one
signed-distance seam, two flat palette masses, no texture and no post-processing.

**Retire if:** speed reads only as a colour change, the seam looks like a static
wallpaper after ten seconds, or acceleration cannot be distinguished from
steady speed in a silent screen recording.

## 3. WAKE — negative-space displacement

**Perceptual thesis.** A stable central absence displaces a small number of broad
material streams. The passenger reads motion from how the field bends around the
void, like pressure around an unseen body, without depicting a car, road, tunnel,
or particle flow.

Seven broad solid surfaces circulate continuously at rest with sub-pixel
lateral drift. Their spacing is deliberately broad, so the field cannot become
a retino or moire pattern. The count and composition follow the approved source
rather than the earlier five-band proposal sketch.

The implemented material is not a stationary drape with travelling light.
Compression, width, folds and twist are advected directionally along each
spline. At low speed the motion reads as slow velvet cloth; road energy raises
the transport rate, sway and fold travel before allowing crossings and
temporary knots at high speed.

| Speed | Field state |
|---:|---|
| 0 km/h | compact void, short symmetric circulation |
| 20 km/h | wake reaches the middle third of the screen |
| 40 km/h | wake reaches the full width and peripheral flow is obvious |
| 80 km/h | void narrows; bands stretch 1.8× with stronger edge curvature |
| 130 km/h | long stable wake, saturated stretch, no extra bands |

Speed controls wake length and band tension. Acceleration compresses the void
for 120 ms before releasing a single outward pressure wave; this anticipation
separates a launch from cruising at the same speed. OPEN increases edge tension
and makes the wake snap outward. UNDERWATER expands the void, slows circulation,
and bends the bands inward as if external pressure increased.

**Implemented form.** One project-authored WebGL2 draw call tessellates seven
Catmull-Rom material sheets with tapered cross-sections, depth, fold normals,
theme colour, restrained grain and highlights. Canvas2D provides a broad-path
fallback. Exact source-versus-runtime evidence and the blocking fidelity verdict
are recorded in `design-qa.md`.

**Retire if:** the central absence is read as a tunnel or portal, the bands are
read as a road, or steady 20 km/h and standstill are not distinguishable within
two seconds of peripheral viewing.

### WAKE licensed-source study (not imported)

No external runtime or asset entered the repository. The project-authored
renderer was selected, so the candidates below remain historical research only:

- [`sumisonic/bezier-kit`](https://github.com/sumisonic/bezier-kit) is MIT,
  current, zero-dependency in its core package, and provides allocation-aware 3D
  paths plus twist-free Frenet frames suitable for broad ribbon geometry. It is
  not audio-reactive by itself.
- [`tgcnzn/Interactive-Particles-Music-Visualizer`](https://github.com/tgcnzn/Interactive-Particles-Music-Visualizer)
  is an MIT Codrops project with a modern Vite/Three.js audio-band pipeline.
  Its particle form and included music are unsuitable for WAKE; only its code
  architecture is a possible attributed reference, never its media.
- [`niko-dellic/wavefield`](https://github.com/niko-dellic/wavefield) is a
  current MIT Three.js audio visualizer with tested feature extraction and modal
  interpolation. Its cymatic field, post-processing stack and reported GPU
  appetite make wholesale integration inappropriate for the Tesla target.
- [`shader-park/shader-park-core`](https://github.com/shader-park/shader-park-core)
  and its [Codrops audio-reactive Three.js
  study](https://tympanus.net/codrops/2023/02/07/audio-reactive-shaders-with-three-js-and-shader-park/)
  are MIT-licensed routes to genuinely volumetric, audio-driven form. The
  signed-distance/ray-march approach is visually stronger than a conventional
  spectrum display, but it needs a deliberately low iteration budget and must
  be tested on the Tesla GPU before it can qualify as WAKE's renderer.
- [`spite/THREE.MeshLine`](https://github.com/spite/THREE.MeshLine) is an
  established MIT triangle-strip replacement for wide Three.js lines. Its
  variable width and 3D-path support map directly to WAKE's five broad streams;
  the older API and 2020 release make it a mechanics reference rather than a
  dependency to adopt without a small compatibility proof.
- [`kekkorider/threejs-audio-reactive-visual`](https://github.com/kekkorider/threejs-audio-reactive-visual)
  is MIT but uses Parcel 1, Three.js `0.133`, Node 14-era tooling and one global
  average-frequency influence. It is neither a maintainable base nor a musical
  enough reaction model.
- Codrops Animated Mesh Lines demonstrates useful ribbon grammar, but its demo
  repository uses custom redistribution terms rather than a standard OSS
  license. It remains visual research only. Public CodePens and repositories
  that merely claim a license without a committed license file are excluded
  until their exact code, imported dependencies and assets are verified.

If WAKE is later selected, speed should own macro depth, length and tension;
the existing internal score snapshot should own slow band energy and authored
section changes; acceleration and braking should create bounded signed pressure
impulses. PARK must retain slow material life without beat-driven twitch. This
avoids a microphone/file-player subsystem and keeps the visual synchronized to
the score the listener actually hears.

## Selection note

PLUMB's exact `773 × 601` capture was read as the decorative strings/bars named
by its retirement rule and was rejected as visually banal and emotionally
empty. That product verdict supersedes its earlier implementation-risk
advantage. SLIP remains the most radically minimal but still risks becoming
static wallpaper. WAKE remains the most atmospheric and is the strongest
candidate for further selection review, provided any 3D or audio-reactive
mechanics are independently licensed, attributed and adapted to the existing
speed and score signals. Neither SLIP nor WAKE is selected or implemented.

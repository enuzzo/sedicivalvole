# Three Flux visual directions — 2026-08-29

Status: **proposal only**. None of these directions is selected or implemented.
They replace the rejected REGISTER study and must wait for explicit product-owner
selection before a visual build.

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

Five solid bands circulate continuously at rest with sub-pixel lateral drift.
Their spacing is deliberately broad, so the field cannot become a retino or
moire pattern.

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

**Minimum prototype.** WebGL2 signed-distance void plus five analytic ribbon
bands in one draw call; Canvas2D fallback uses five preallocated Bezier paths.

**Retire if:** the central absence is read as a tunnel or portal, the bands are
read as a road, or steady 20 km/h and standstill are not distinguishable within
two seconds of peripheral viewing.

## Selection note

PLUMB gives the clearest physical relationship to acceleration and the lowest
implementation risk. SLIP is the most radically minimal and brandable. WAKE is
the most atmospheric, but also carries the highest risk of being mistaken for
the rejected tunnel/road family. Build only the selected direction.

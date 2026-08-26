# Reference Study: Infinite Lights

Status: **external study source only; no source code incorporated**.

## Provenance

- Work: **High-speed Light Trails in Three.js**
- Author: Daniel Velasquez / Anemolo, published by Codrops/Tympanus
- Article: <https://tympanus.net/codrops/2019/11/13/high-speed-light-trails-in-three-js/>
- Repository: <https://github.com/Anemolo/InfiniteLights>
- Locally reviewed commit: `e58d58520bc0dfde21f9e14e6a1b8c7f0a2a2a9e`
- Local location: ignored `_references/repos/tympanus-infinite-lights/`

## What is useful

The reference creates forward motion from a small set of coherent systems:

- instanced tube geometry for opposing light trails;
- a road plane and repeated side markers that establish scale and travel direction;
- time-based movement with an interpolated speed-up offset;
- FOV interpolation that strengthens acceleration without only moving geometry faster;
- shader-based longitudinal distortion with matching camera look-at behavior;
- fog and bounded bloom to stage depth.

The most useful lesson is not the literal motorway. It is the coordination of projection, repeated depth cues, distortion, and temporal easing around one speed state.

## What must not be copied

- The demo's road, traffic-light, bloom-heavy appearance is not the selected sedicivalvole style.
- Mouse-down speed toggling is not a valid vehicle mapping.
- Raw `devicePixelRatio` rendering, full-resolution post-processing, large scene depth, and many instanced objects are not assumed safe on Tesla without profiling.
- The old Three.js/post-processing bundles and global-script architecture are not suitable production dependencies.
- The reference does not solve audio synchronization, GPS uncertainty, reduced motion, compact controls, or safe degradation.

## License constraint

The repository README uses a custom Codrops usage notice, not MIT, Apache, BSD, or AGPL. It allows integration or building upon the resource in personal or commercial projects, but forbids redistribution or republication as-is and requests visible credit for free plugins. Included libraries retain their own licenses.

Therefore:

- keep the source in the ignored reference library;
- do not copy files or substantial implementation into the AGPL repository;
- implement any selected behavior independently from documented concepts;
- retain this provenance record;
- review attribution and dependency obligations before any derived implementation ships;
- add exact notices to `THIRD_PARTY_NOTICES.md` if code, assets, or a dependency from the reference ever enters the product.

## sedicivalvole translation

⭐️ Recommended translation: replace the literal dual carriageway with a sparse abstract depth field. At rest it reads as a flat, quiet chromatic plane. As normalized energy rises, a bounded projection shift, longitudinal repetition, and field distortion form a centered tunnel. Acceleration affects transient stretch and pressure; sustained speed affects travel rate and depth density; deceleration releases them on a musically coordinated envelope.

This keeps the reference's strongest motion grammar while satisfying the minimal visual direction and avoiding a themed racing-road imitation.

## Product Design outcome

The selected **Modular Aperture** direction is independently implemented from rectangular field mathematics and does not reproduce the reference's road, light trails, bloom, or scene structure. The unselected **Laminar** direction remains preserved only in the ignored visual-study library. Its visible resemblance to Infinite Lights is explicitly recorded: it must not be implemented as shown and would require a stronger independent reinterpretation before reconsideration.

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

The selected **Modular Aperture** direction is independently implemented from rectangular field mathematics and does not reproduce the reference's road, light trails, bloom, or scene structure.

The user subsequently selected **Vertigo / Interstate 7** as the second Flux environment and explicitly asked that the real implementation be read before translation. The reviewed `deepDistortion` mechanics combine a sinusoidal X displacement with a power-curve-plus-sine Y displacement, while the camera target samples a related distortion delta. This explains the characteristic small lateral drift and rolling wave: it is not a straight road that merely turns upward.

The independent `VERTIGO 02` translation was subsequently rejected because it omitted defining Interstate 7 systems, especially the repeated luminous side markers, and was not visually faithful enough. The current implementation instead vendors the complete upstream commit `e58d58520bc0dfde21f9e14e6a1b8c7f0a2a2a9e` under its original usage notice. The core HTML, CSS, Three.js build, post-processing build, `InfiniteLights.js`, and `Distortions.js` are protected by deterministic SHA-256 tests and remain byte-identical.

The integration code lives outside the vendor tree. It hides the upstream editorial shell only so the canvas occupies the full product viewport, then maps normalized road speed to the original runtime controls without changing the scene. A target of `-1` cancels the original base clock at `0 km/h`; the target rises to `0` at `130 km/h`, which restores the original non-boosted `1×` time rate. The original FOV moves continuously from `90°` to `150°` across the same domain. The original click boost would reach an effective `3×` rate and is intentionally not invoked by the product bridge.

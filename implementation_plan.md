# Implementation Plan: Realistic UI & Visual Upgrade

This phase focuses strictly on upgrading the visual fidelity and material realism of the prototype without changing the underlying mechanical logic.

## Goal Description
Enhance the sniper prototype with photorealistic UI elements, PBR (Physically Based Rendering) materials, persistent bullet holes, dynamic lighting, and a post-processing stack (bloom, film grain) to elevate it from a tech demo to a cinematic experience.

## Proposed Changes

### 1. External Dependencies (`index.html`)
- Add CDN links for Three.js post-processing tools: `EffectComposer`, `RenderPass`, `ShaderPass`, `CopyShader`, `UnrealBloomPass`, `FilmPass`, and their shader dependencies.

### 2. Post-Processing Stack (`main.js`)
- Replace the standard `renderer.render()` call with an `EffectComposer`.
- Add a `RenderPass`, a subtle `UnrealBloomPass` (for muzzle flashes and bright highlights), and a `FilmPass` (for cinematic grain).
- **Kill-Cam Grading:** When `bulletCamStart` fires, dynamically tweak the Bloom and FilmPass values (or add a Color Correction shader pass) to create a cooler, desaturated cinematic grade.

### 3. PBR Materials & Lighting (`Level.js` & `Guard.js`)
- **Level/Assets:** Convert `MeshLambertMaterial` usages to `MeshStandardMaterial`. Apply subtle `roughness` and `metalness` values. The static target board will get a wood-like color and high roughness.
- **Guard Uniforms:** Convert guard materials to `MeshStandardMaterial` to ensure they catch ambient and directional light correctly.

### 4. Dynamic Lighting (`Weapon.js` & `Ballistics.js`)
- **Muzzle Flash:** Add a brief `PointLight` at the camera's position when firing, tied to the muzzle flash timer.
- **Tracer Light:** Add a small, faint, fast-decaying `PointLight` attached to the bullet mesh so it casts light on nearby surfaces as it travels.

### 5. Advanced Bullet Decals (`Ballistics.js`)
- Modify `createBulletHole` to check the material type of the intersected object (or hardcode target board = wood, ground = dirt).
- Change the color/shape of the decal depending on the surface (e.g., dark brown splintered holes for wood, black scorching for metal). Make them persist indefinitely instead of destroying them.

### 6. Photorealistic UI & Optic Glass (`style.css` & `index.html`)
- **Scope Glass:** Replace the flat SVG radial gradient with a complex CSS `backdrop-filter: blur(2px) grayscale(20%)` combined with layered internal `box-shadow` to simulate the thick, curved edge of a sniper optic. 
- **Reticle Bevel:** Add a drop-shadow/emboss effect to the SVG reticle strokes so they look laser-etched into the glass.
- **Parallax Shift:** (Optional/Stretch) Link the scope's background position slightly to mouse movement to simulate eye relief parallax.
- **HUD Panels:** Redesign the Ammo and Compass backgrounds using CSS linear-gradients that simulate brushed metal and noise (using base64 noise textures if necessary), paired with LED-style text glowing (`text-shadow`).

## Verification Plan
1. Fire the weapon and verify the dynamic point light illuminates the gun and immediate surroundings.
2. Check the scope glass against a bright background to ensure the backdrop-filter and etching shadows look physical.
3. Trigger a Kill-Cam to ensure the post-processing stack smoothly transitions to the cinematic desaturated look.
4. Spawn multiple guards (Phase 3 compound) and monitor framerate to ensure the PBR/Post-Processing stack remains performant.

## Open Questions
> [!IMPORTANT]
> **Performance vs. Shadows**
> Turning on full dynamic shadow casting for the tracer PointLight will likely destroy performance. I propose making the Tracer light *non-shadow casting*, and only the main DirectionalLight casts shadows. Is this acceptable?

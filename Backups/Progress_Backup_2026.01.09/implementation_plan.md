# Plan: Explosion Centering & Visual Consolidation

The goal is to ensure all explosion effects are pixel-perfectly aligned and visually cohesive.

## Proposed Changes

### [Component] UI Positioning Math

#### [MODIFY] [game.js](file:///d:/AntiGravityWorkSpace/CELLULAR%20WARS/game.js)
- **Add `getCenterInOverlay(slot)`**: A helper that calculates the center of any slot relative to the `#effects-overlay`, correctly dividing by the battlefield's current scale factor (`getBoundingClientRect().width / clientWidth`).
- **Update `triggerExplosion`**:
  - Use `getCenterInOverlay` for all flare, shockwave, and debris positions.
  - Remove the `exploding` class from the monster if it's redundant (consistently use the overlay instead).
  - Synchronize removal of the `preFlare` so it doesn't overlap the main `flare` awkwardly.
- **Update `triggerBurstEffect`**: Use the new helper for reflect visuals.

### [Component] CSS Refinement

#### [MODIFY] [style.css](file:///d:/AntiGravityWorkSpace/CELLULAR%20WARS/style.css)
- **Simplify `.overload-flare`**: Ensure it's a single, high-intensity flash.
- **Adjust `.shockwave`**: Make it feel like an integral part of the blast rather than a separate ring.

## Verification Plan

### Automated Tests
- None.

### Manual Verification
1. Trigger an Overload explosion.
2. Observe the "Bang":
   - **Expected**: A single, centered, blinding flash with particles and ripples.
   - **Persistence**: Visuals should not jump when the board re-renders at the 800ms mark.
3. Verify Nitrophil reflect visuals are also perfectly centered.

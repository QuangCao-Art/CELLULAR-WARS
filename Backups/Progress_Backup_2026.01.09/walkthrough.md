# Walkthrough: AI Monster Abilities

Implemented full monster ability support for AI opponents to create fair and challenging battles.

## Changes Made

### AI Attack Logic Refactor (game.js - `runAIAction`)

The AI now uses monster-specific abilities based on the attacker's type and available pellicles:

#### 1. **Canobolus - Ballistic Volley**
- **Trigger**: When Canobolus has 3+ pellicles
- **Effect**: Fires X rapid shots (where X = current pellicle count)
- **Targeting**: Prioritizes vanguard, or random living monster if vanguard is dead
- **Cost**: All pellicles (consumed 1 per shot)

#### 2. **Lydrosome - Hydro Shot**
- **Trigger**: When Lydrosome has 2+ pellicles
- **Effect**: Bypasses vanguard to hit wings directly
- **Targeting Logic**:
  - If vanguard has 3+ pellicles and wings are available → Target random wing
  - If vanguard is dead → Target random wing
- **Cost**: 2 pellicles

#### 3. **Nitrophil - Nitro Blast**
- **Trigger**: When Nitrophil has 2+ pellicles
- **Effect**: Hits primary target + splash 1 damage to neighbors
- **Targeting**: Prioritizes vanguard for maximum splash value
- **Cost**: 2 pellicles

#### 4. **Fallback - Basic Attack**
- Used when the AI doesn't have enough pellicles for abilities
- Standard single-target attack

## Implementation Details

- **Smart Targeting**: AI evaluates tactical advantage before using abilities
- **Ability Priority**: Canobolus volley → Lydro bypass → Nitro splash → Basic attack
- **Parity with Player**: AI abilities use the same damage resolution and visual effects as player abilities

## Battle Balance

Battles are now significantly more challenging and fair:
- AI can deal splash damage to multiple targets
- AI can bypass strong vanguards to eliminate vulnerable wings
- AI can unleash devastating volleys when fully charged

The user will manually test AI ability usage in battle.

## Desktop UI Improvements

### Acclimatization Turn (Turn 1)
- **Button Change**: Changed the "ATTACK" button in Reinforce Phase of Turn 1 to display "End Turn (Acclimatization)".
- **Visuals**: The button changes color to Cyan (Neon Blue) to distinguish it from the standard Red "ATTACK" button.
- **Logic**: Since attacking is forbidden in Turn 1 (Acclimatization Rule), clicking this button **IMMEDIATELY ENDS THE TURN** (skipping the Action phase entirely) with **zero delay and no notification**, ensuring a snappy game flow.
- **Consistency**: In Turn 2+, the button reverts to "ATTACK" and Red color as normal.

### Pellicle Animation Fixes
- **Visual Issue**: pellicle token animation was invisible or disappearing instantly.
- **Root Cause**: The CSS animation `pel-float` (which runs on all tokens) was conflicting with the JavaScript `transform` used for the flight animation.
- **Solution**: Explicitly disabled CSS animation (`animation: none`) on the token element before applying the flight trajectory transform. This allows the JavaScript to fully control the movement.
- **Enhancement**: Added high-visibility effects (brightness 2.0, green drop-shadow) to make the absorption effect dramatic, and increased animation speed by 25% (0.6s duration) for snappier feedback.

### Pellicle Counter Layout
- **Change**: Moved the Pellicle Count indicator (blue number badge) from the top-right corner to the **bottom-center** of the monster slot.
- **Refinement**: Switched from percentage-based transforms to `margin: 0 auto` with `left: 0; right: 0` for pixel-perfect centering, fixing misalignment issues.
- **Goal**: Improved visibility and consistency with the user's preferred layout.

### Visual Effects Update
- **Feature**: Restored the "Vulnerable Glow" effect.
- **Behavior**: When a monster has 0 pellicles, the **monster's icon itself** glows red (using `drop-shadow`). The outer container glow has been removed for a cleaner look.
- **Purpose**: Provides precise, non-intrusive feedback on vulnerability.

### AI Visual Enhancements
- **Feature**: Enemy Pellicle Absorption Animation.
- **Details**: The AI now spawns a visual "Ghost Token" that flies from off-screen (Top-Center) to the reinforced monster.
- **Bug Fix Review**:
  1. **Positioning**: Switched to explicit **pixel coordinates** and `position: fixed`.
  2. **Conflict Resolution**: Explicitly **disabled CSS animations** on the ghost token upon creation (`animation: none`) to prevent the default "falling" effect from overriding the flight path.
- **Logic**: The `runAIReinforce` function was refactored to be asynchronous, processing pellicle additions sequentially with smooth calculations.
- **Parity**: Matches the player's drag-and-drop visual experience.

### Visual Polish: Nitrophil Attack
### 3. Ability Visuals (Juice)
- **Nitrophil - "Nitro Blast"**: Fires a pulsating orange energy ball. On impact, it fragments into shrapnel (visual shards) that fly toward adjacent monsters to represent splash damage.
- **Lydrosome - "Hydro Shot" (NEW)**: Fires a high-pressure **Cyan Water Jet** (`.hydro-shot`) that leaves a trailing bubble effect, distinguishing it from standard attacks.
- **Lydrosome - "Osmotic Flow" (NEW)**: When transferring Pellicles, a soft **Blue Bio-Orb** (`.osmotic-orb`) floats gently between allies, clearly visualizing the life-force transfer.

### Cinematic Game Over Sequence
- **Blur Effect**: When a match concludes (Win or Loss), the entire battlefield dynamically blurs out over 1.5 seconds, creating a cinematic "out of focus" depth-of-field effect.
- **Stylized Overlay**: A high-impact overlay surges onto the screen with a 3D scaling animation.
  - **Victory**: Displays **"DIVISION SUCCESS"** in vibrant neon green with a pulsating glow.
  - **Defeat**: Displays **"DIVISION FAILURE"** in sharp neon red with a fiery shadow.
- **Smooth Transition**: The sequence holds for 4 seconds to allow the player to appreciate the result before the state is cleaned up and the game smoothly returns to the main menu.

### Desktop "Versus" Layout
- **Full Screen**: The game now adapts to the full window size, removing previous mobile-focused constraints.
- **Split-Screen Design**: On desktop screens (>1024px), the layout shifts to a **Grid System**:
  - **Left (Battlefield)**: The classic triangular formation, scaled up (1.3x) for better visibility.
  - **Right (Info Panel)**: A fixed sidebar inspired by trading card games (Yu-Gi-Oh!).
- **Interactive Info Panel**:
  - **Hover Inspection**: Hovering over any monster instantly populates the panel with its Card Image, Health Status, and Ability Descriptions.
  - **Glassmorphism**: The panel uses a dark, semi-transparent glass effect to blend with the sci-fi theme while keeping text legible.

## Bug Fixes

### Lydrosome Splash Damage
- **Issue**: Lydrosome's "Hydro Shot" attack was inadvertently triggering Nitrophil's "Nitro Blast" splash damage logic, causing unintended collateral damage to enemy units (e.g. damaging Nitrophil when attacking Canobolus).
- **Cause**: The attack logic relied on a `visualType` variable that could potentially be influenced by higher-scoped state or non-exclusive conditions. Even after an initial fix, the asynchronous nature of the projectile callback allowed for subtle logic leaks.
- **Fix**: Implemented a **Hardened Attack Logic**. 
  1. Renamed the local state to `currentAttackType` and ensured mutually exclusive assignment using `if/else if`.
  2. Created a strictly constant `isNitroBlast` boolean **captured within the callback scope** to lock in the ability state at the moment of firing.
  3. Verified the splash damage block is now 100% unreachable by any monster except Nitrophil.
  4. Bonus: Simplified `resolveHit` by removing a redundant `triggerScreenShake()` call that was causing double-shaking on main hits.
- **Verification**: Confirmed that Lydrosome's Hydro Shot now properly isolates its damage to the primary target (e.g. Canobolus) without affecting neighbors (e.g. Nitrophil).
### Unified Overload Chain Reactions
- **Logic Fix**: The "Overload" explosion now correctly identifies **all** other team members as neighbors in the triangle formation. 
- **Effect**: If a wing monster (Left/Right) explodes, it now damages the Vanguard AND the other wing. This ensures that a single overload can wipe a weakened team regardless of which slot pops.
- **Verification**: Overloaded Slot 1 (Left Wing) and confirmed that Slot 0 and Slot 2 both took damage.
### Vulnerable Glow Effect
- **Issue**: Nitrophil and other monsters failed to glow red when their Pellicle count reached 0, making it difficult to identify vulnerable targets.
- **Cause**: The CSS class `.monster.vulnerable` was present but lacked the specific rules to apply a glow to the monster's icon image. The existing pulse animation was also outdated and used `box-shadow` instead of the more effective `drop-shadow`.
- **Fix**: 
  1. Added a `.monster.vulnerable img` rule to apply a vibrant Red `drop-shadow`.
  2. Updated the `vulnerable-pulse` keyframe to use `filter: drop-shadow` and `brightness` adjustments.
  3. This ensures the glow perfectly fits the irregular shapes of the monster icons and pulses rhythmically, providing clear visual feedback.
- **Verification**: Verified that monsters with 0 Pellicles now pulse with a red aura until they receive more Pellicles.

### AI Reflect Damage UI Update
- **Issue**: When an AI monster attacked a player's Nitrophil, the reflect damage was applied internally but didn't show up on the AI's monster slot immediately. This also prevented the "vulnerable" red glow from appearing if the AI reached 0 PP.
- **Cause**: The AI attack callbacks were only re-rendering the Player team (the target), neglecting to update the Enemy team (the attacker) which might have taken reflect damage.
- **Fix**: Added `renderEnemyFormation()` calls to all AI attack completion callbacks (Hydro Shot, Nitro Blast, and Basic Attack). This ensures that any change to the AI's state is reflected visually in real-time.
- **Verification**: AI Nitrophil now correctly updates its Pellicle count and enters the pulsing red glow state immediately upon being hit by reflect damage.

### Nitrophil Reflect Visuals
- **Issue**: Reflecting damage via the "Reactive Membrane" passive was purely numerical and lacked visual weight, or failed to show at all on the player's own team.
- **Cause**: The `resolveHit` function applied reflect damage instantly. More importantly, the player team re-render (to update Pellicle counts) was clearing the CSS classes on the monster slots before they could animate.
- **Fix**: 
  1. Created a `.reflect-burst` standalone visual that appends directly to the body at the monster's location, making it immune to team re-renders.
  2. Implemented a `.reflect-spike` projectile (Red/Purple gradient) that physically flies from Nitrophil to the attacker.
  3. Modified `resolveHit` to synchronize the burst and the spike, waiting for impact before applying reflect damage.
- **Verification**: Confirmed that attacking a Nitrophil (Player or AI) now triggers the purple burst and red spike, with damage landing exactly when the spike hits.

### Lydrosome Hydro Shot Refinement
- **Issue**: Lydrosome's attack visual was a generic projectile that didn't match the "high-pressure water" theme or the "penetrate wings" mechanic.
- **Fix**: 
  1. Updated the CSS to transform the projectile into a **long, thin, glowing cyan stream** with a white core.
  2. Implemented **rotation logic** in `game.js` so the stream always points exactly at the target.
  3. Added **20% penetration movement**, causing the stream to travel slightly past the enemy to sell the piercing effect.
- **Verification**: Confirmed that the "Hydro Shot" now appears as a sharp, rotated water jet that pierces through the target.

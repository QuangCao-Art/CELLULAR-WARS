import { getSlotElement } from './renderer.js';

export function triggerScreenShake() {
    const battlefield = document.querySelector('.battlefield');
    battlefield.classList.add('screen-shake');
    setTimeout(() => battlefield.classList.remove('screen-shake'), 400);
}

export function triggerProjectile(attackerIndex, victimIndex, isPlayerAttacking, onHit, duration = 100, visualType = 'standard') {
    const attackerSlot = getSlotElement(attackerIndex, isPlayerAttacking);
    const victimSlot = getSlotElement(victimIndex, !isPlayerAttacking);

    if (!attackerSlot || !victimSlot) {
        if (onHit) onHit();
        return;
    }

    const sourceRect = attackerSlot.getBoundingClientRect();
    const targetRect = victimSlot.getBoundingClientRect();

    const bullet = document.createElement('div');
    bullet.classList.add('projectile');

    if (visualType === 'nitro') {
        bullet.classList.add('nitro-blast');
        const img = document.createElement('img');
        img.src = 'Images/Bullet.png';
        bullet.appendChild(img);
    } else if (visualType === 'hydro') {
        bullet.classList.add('hydro-shot');
        const img = document.createElement('img');
        img.src = 'Images/Bullet.png';
        bullet.appendChild(img);
    } else if (visualType === 'osmotic') {
        bullet.classList.add('osmotic-orb');
        const img = document.createElement('img');
        img.src = 'Images/Bullet.png';
        bullet.appendChild(img);
    } else {
        const img = document.createElement('img');
        img.src = 'Images/Bullet.png';
        bullet.appendChild(img);
    }

    const sourceX = sourceRect.left + sourceRect.width / 2;
    const sourceY = sourceRect.top + sourceRect.height / 2;
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;

    const deltaX = targetX - sourceX;
    const deltaY = targetY - sourceY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    let bW = 40, bH = 40;
    if (visualType === 'nitro') { bW = 60; bH = 60; }
    else if (visualType === 'hydro') { bW = 60; bH = 6; }
    else if (visualType === 'osmotic') { bW = 30; bH = 30; }

    if (visualType === 'hydro') {
        bullet.style.left = sourceX + 'px';
        bullet.style.top = (sourceY - bH / 2) + 'px';
    } else {
        bullet.style.left = (sourceX - bW / 2) + 'px';
        bullet.style.top = (sourceY - bH / 2) + 'px';
    }

    document.body.appendChild(bullet);

    if (visualType === 'hydro' || visualType === 'osmotic') {
        bullet.style.transform = `rotate(${angle}deg)`;
    }

    void bullet.offsetWidth;
    bullet.style.transition = `transform ${duration / 1000}s linear`;

    if (visualType === 'hydro' || visualType === 'osmotic') {
        let travelDist = distance;
        if (visualType === 'hydro') travelDist *= 1.25;
        bullet.style.transform = `rotate(${angle}deg) translate(${travelDist}px, 0px)`;
    } else {
        bullet.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    }

    setTimeout(() => {
        bullet.remove();
        if (onHit) onHit();
    }, duration);
}

export function triggerBurstEffect(index, isPlayer, effectType) {
    const slot = getSlotElement(index, isPlayer);
    if (!slot) return;

    const rect = slot.getBoundingClientRect();
    const burst = document.createElement('div');
    burst.className = `burst-effect ${effectType}`;
    burst.style.left = (rect.left + rect.width / 2) + 'px';
    burst.style.top = (rect.top + rect.height / 2) + 'px';

    document.body.appendChild(burst);
    setTimeout(() => burst.remove(), 600);
}

export function triggerShrapnel(sourceSlot, targetSlot, onHit) {
    if (!sourceSlot || !targetSlot) {
        if (onHit) onHit();
        return;
    }

    const sourceRect = sourceSlot.getBoundingClientRect();
    const targetRect = targetSlot.getBoundingClientRect();
    const shrapnel = document.createElement('div');
    shrapnel.classList.add('projectile', 'shrapnel');
    shrapnel.style.position = 'fixed';

    const img = document.createElement('img');
    img.src = 'Images/Bullet.png';
    shrapnel.appendChild(img);
    document.body.appendChild(shrapnel);

    const startX = sourceRect.left + (sourceRect.width / 2) - 15;
    const startY = sourceRect.top + (sourceRect.height / 2) - 15;
    shrapnel.style.left = `${startX}px`;
    shrapnel.style.top = `${startY}px`;

    void shrapnel.offsetWidth;
    const duration = 300;
    shrapnel.style.transition = `transform ${duration / 1000}s linear`;

    const deltaX = (targetRect.left + targetRect.width / 2) - (sourceRect.left + sourceRect.width / 2);
    const deltaY = (targetRect.top + targetRect.height / 2) - (sourceRect.top + sourceRect.height / 2);
    shrapnel.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

    setTimeout(() => {
        shrapnel.remove();
        if (onHit) onHit();
    }, duration);
}

export function animatePellicleToMonster(tokenEl, monsterIndex, onComplete, isPlayerAndTarget = true) {
    const slot = getSlotElement(monsterIndex, isPlayerAndTarget);
    if (!tokenEl || !slot) {
        if (onComplete) onComplete();
        return;
    }

    const tokenRect = tokenEl.getBoundingClientRect();
    const slotRect = slot.getBoundingClientRect();

    // GLOBAL STRATEGY: move token to body (fixed overlay) to avoid scale miscalculations
    // We will animate using pure viewport coordinates.
    document.body.appendChild(tokenEl);

    tokenEl.classList.add('flying');
    tokenEl.style.transition = 'none';
    tokenEl.style.position = 'fixed';
    tokenEl.style.margin = '0';
    tokenEl.style.pointerEvents = 'none';
    tokenEl.style.zIndex = '9999'; // Ensure above everything

    // Set initial position (Screen Space)
    tokenEl.style.left = tokenRect.left + 'px';
    tokenEl.style.top = tokenRect.top + 'px';

    // Force Reflow
    void tokenEl.offsetWidth;

    // LANDING MATH: Pure Screen Coordinates
    // Center of slot - Half of token
    const targetX = (slotRect.left + slotRect.width / 2) - (tokenRect.width / 2);
    const targetY = (slotRect.top + slotRect.height / 2) - (tokenRect.height / 2);

    // DYNAMIC DURATION: Maintain constant speed regardless of distance
    // Velocity: ~1.2 pixels/ms seems like a good balance (1000px in ~800ms)
    // Distance = sqrt(dx^2 + dy^2)
    const dx = targetX - tokenRect.left;
    const dy = targetY - tokenRect.top;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // speed = 0.8 px/ms (slower than before for AI, faster for short drops)
    // 500px distance -> 625ms
    // 50px distance -> 62ms (clamped to 300ms)
    const speed = 0.8;
    const calculatedDuration = distance / speed;
    const duration = Math.min(Math.max(calculatedDuration, 300), 1000); // Clamp between 300ms and 1s

    tokenEl.style.transition = `all ${duration}ms cubic-bezier(0.175, 0.885, 0.32, 1.275)`;

    tokenEl.style.left = targetX + 'px';
    tokenEl.style.top = targetY + 'px';
    tokenEl.style.transform = 'scale(0.5) rotate(180deg)'; // Scale effect on landing
    tokenEl.style.opacity = '0';

    setTimeout(() => {
        tokenEl.remove();

        // Trigger Absorbtion Shake on Monster
        const monsterImg = slot.querySelector('.monster img');
        if (monsterImg) {
            monsterImg.classList.remove('pp-absorb');
            void monsterImg.offsetWidth; // Force Reflow
            monsterImg.classList.add('pp-absorb');

            // Remove class after animation
            setTimeout(() => {
                if (monsterImg) monsterImg.classList.remove('pp-absorb');
            }, 400);
        }

        if (onComplete) onComplete();
    }, duration);
}

/**
 * Spawns a temporary pellicle token at the top of the screen and flies it into an enemy monster's slot.
 * @param {number} monsterIndex - Index of the enemy monster to reinforce.
 * @param {Function} onComplete - Callback after animation finishes.
 */
export function triggerAIRenforceAnimation(monsterIndex, onComplete) {
    // Create a temporary token
    // Create a temporary token directly in the pellicle layer
    const pellicleLayer = document.getElementById('pellicle-layer');
    if (!pellicleLayer) { if (onComplete) onComplete(); return; }

    const token = document.createElement('div');
    token.className = 'pellicle-token';
    token.style.position = 'absolute';
    // Center horizontally relative to the 1000px wide battlefield (assumed width from CSS)
    // Or just use 50% left minus half width
    token.style.left = 'calc(50% - 35px)';
    token.style.top = '-100px';
    token.style.zIndex = '10000';
    // Remove any transform that might mess up getBoundingClientRect logic later
    token.style.transform = 'none';

    pellicleLayer.appendChild(token);

    // Use existing animation logic (isPlayerAndTarget = false for enemy)
    animatePellicleToMonster(token, monsterIndex, onComplete, false);
}

export function triggerReflectVisual(sourceSlot, targetSlot, onHit) {
    if (!sourceSlot || !targetSlot) {
        if (onHit) onHit();
        return;
    }

    const sourceRect = sourceSlot.getBoundingClientRect();
    const targetRect = targetSlot.getBoundingClientRect();

    const spike = document.createElement('div');
    spike.classList.add('projectile', 'reflect-spike');
    spike.style.position = 'fixed';
    document.body.appendChild(spike);

    const startX = sourceRect.left + (sourceRect.width / 2) - 15;
    const startY = sourceRect.top + (sourceRect.height / 2) - 5;
    spike.style.left = `${startX}px`;
    spike.style.top = `${startY}px`;

    const angle = Math.atan2(targetRect.top - sourceRect.top, targetRect.left - sourceRect.left) * (180 / Math.PI);
    spike.style.transform = `rotate(${angle}deg)`;

    void spike.offsetWidth;
    const duration = 400;
    spike.style.transition = `transform ${duration / 1000}s ease-in, left ${duration / 1000}s ease-in, top ${duration / 1000}s ease-in`;

    const endX = targetRect.left + (targetRect.width / 2) - 15;
    const endY = targetRect.top + (targetRect.height / 2) - 5;
    spike.style.left = `${endX}px`;
    spike.style.top = `${endY}px`;

    setTimeout(() => {
        spike.remove();
        if (onHit) onHit();
    }, duration);
}

function getCenterInOverlay(el) {
    const rect = el.getBoundingClientRect();
    const overlay = document.getElementById('effects-overlay');
    const overlayRect = overlay.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2 - overlayRect.left,
        y: rect.top + rect.height / 2 - overlayRect.top
    };
}

export function triggerExplosionVisual(team, index, isPlayer, onComplete) {
    const slot = getSlotElement(index, isPlayer);
    const monsterDiv = slot ? slot.querySelector('.monster') : null;
    const overlay = document.getElementById('effects-overlay');

    if (!slot || !overlay) return;
    const { x: centerX, y: centerY } = getCenterInOverlay(slot);

    if (monsterDiv) {
        monsterDiv.classList.add('jitter');
        const preFlare = document.createElement('div');
        preFlare.className = 'overload-flare';
        preFlare.style.left = centerX + 'px';
        preFlare.style.top = centerY + 'px';
        preFlare.style.animation = 'flare-pop 0.8s ease-in forwards';
        overlay.appendChild(preFlare);
        setTimeout(() => preFlare.remove(), 800);
    }

    setTimeout(() => {
        if (monsterDiv) {
            monsterDiv.classList.remove('jitter');
            monsterDiv.classList.add('exploding');
            const shock = document.createElement('div');
            shock.className = 'shockwave';
            shock.style.left = centerX + 'px';
            shock.style.top = centerY + 'px';
            overlay.appendChild(shock);
            setTimeout(() => shock.remove(), 1000);

            for (let i = 0; i < 12; i++) {
                const debris = document.createElement('div');
                debris.className = 'debris';
                debris.style.left = centerX + 'px';
                debris.style.top = centerY + 'px';
                const angle = Math.random() * Math.PI * 2;
                const dist = 100 + Math.random() * 200;
                debris.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
                debris.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
                overlay.appendChild(debris);
                setTimeout(() => debris.remove(), 800);
            }

            const flare = document.createElement('div');
            flare.className = 'overload-flare';
            flare.style.left = centerX + 'px';
            flare.style.top = centerY + 'px';
            overlay.appendChild(flare);
            setTimeout(() => flare.remove(), 1000);
        }
        if (onComplete) onComplete();
    }, 800);
}

export function triggerDeathVisual(team, index, isPlayer, onComplete) {
    const slot = getSlotElement(index, isPlayer);
    if (!slot) {
        if (onComplete) onComplete();
        return;
    }

    const monsterDiv = slot.querySelector('.monster');
    if (!monsterDiv) {
        if (onComplete) onComplete();
        return;
    }

    // Apply death animation class
    monsterDiv.classList.add('death-anim');

    // Wait for animation to finish before calling callback (which will re-render)
    setTimeout(() => {
        if (onComplete) onComplete();
    }, 500);
}

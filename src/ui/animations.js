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

    tokenEl.classList.add('flying');
    tokenEl.style.transition = 'none';

    tokenEl.style.left = tokenRect.left + 'px';
    tokenEl.style.top = tokenRect.top + 'px';
    tokenEl.style.position = 'fixed';
    tokenEl.style.margin = '0';
    tokenEl.style.pointerEvents = 'none';

    void tokenEl.offsetWidth;

    const duration = 500;
    tokenEl.style.transition = `all ${duration}ms cubic-bezier(0.175, 0.885, 0.32, 1.275)`;

    const targetX = slotRect.left + (slotRect.width / 2) - (tokenRect.width / 2);
    const targetY = slotRect.top + (slotRect.height / 2) - (tokenRect.height / 2);

    tokenEl.style.left = targetX + 'px';
    tokenEl.style.top = targetY + 'px';
    tokenEl.style.transform = 'scale(1.5) rotate(180deg)';
    tokenEl.style.opacity = '0';

    setTimeout(() => {
        tokenEl.remove();
        if (onComplete) onComplete();
    }, duration);
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

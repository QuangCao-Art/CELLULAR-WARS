import { gameState, CONSTANTS } from '../engine/state.js';
import { MONSTER_DATABASE } from '../data/monsters.js';

// DOM References (To be initialized in main or via a setup function)
let selectors = {};

export function initializeSelectors(refs) {
    selectors = refs;
}

export function showGameMessage(text, color = 'white') {
    if (!selectors.gameMessage) return;
    selectors.gameMessage.innerText = text;
    selectors.gameMessage.style.color = color === 'red' ? 'var(--neon-red)' : (color === 'blue' ? 'var(--neon-blue)' : 'var(--neon-green)');
    selectors.gameMessage.classList.remove('pop-anim');
    void selectors.gameMessage.offsetWidth;
    selectors.gameMessage.classList.add('pop-anim');
}

export function updateBattleLog(text) {
    if (!selectors.battleLog) return;
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerText = `> ${text}`;
    selectors.battleLog.prepend(logEntry);
    if (selectors.battleLog.childNodes.length > 50) selectors.battleLog.lastChild.remove();
}

export function updatePhaseUI() {
    if (gameState.currentPhase !== gameState.lastAnnouncedPhase) {
        showGameMessage(`PHASE: ${gameState.currentPhase}`, 'blue');
        gameState.lastAnnouncedPhase = gameState.currentPhase;
        updateBattleLog(`PHASE START: ${gameState.currentPhase}`);
    }

    if (selectors.currentPhaseEl) selectors.currentPhaseEl.innerText = gameState.currentPhase;
    if (selectors.turnNumberEl) selectors.turnNumberEl.innerText = gameState.turnNumber;

    if (selectors.instructionMsg) {
        if (gameState.currentPhase === 'REINFORCE') {
            selectors.instructionMsg.innerText = `Pool: ${gameState.pelliclePool}P | Drag tokens to monsters.`;
        } else if (gameState.currentPhase === 'ACTION') {
            selectors.instructionMsg.innerText = gameState.actionTaken ? "Action used. End turn?" : "Drag monster to enemy to attack, or swap slots.";
        }
    }

    // Toggle Phase Buttons
    if (selectors.btnEndReinforce) selectors.btnEndReinforce.classList.toggle('hidden', gameState.currentPhase !== 'REINFORCE');
    if (selectors.btnEndTurn) selectors.btnEndTurn.classList.toggle('hidden', gameState.currentPhase !== 'ACTION');
}

export function getSlotElement(index, isPlayer) {
    const teamClass = isPlayer ? '.player-team' : '.enemy-team';
    return document.querySelector(`${teamClass} .slot[data-index="${index}"]`);
}

export function renderFormation(handlers = {}) {
    if (!selectors.playerFormation) return;
    selectors.playerFormation.innerHTML = '';

    // Add Reserve Highlight Box
    const highlight = document.createElement('div');
    highlight.className = 'reserve-highlight-box';
    selectors.playerFormation.appendChild(highlight);

    gameState.playerTeam.forEach((monster, index) => {
        const slot = createSlotDOM(monster, index, true, handlers);
        selectors.playerFormation.appendChild(slot);
    });
}

export function renderEnemyFormation() {
    if (!selectors.enemyFormation) return;
    selectors.enemyFormation.innerHTML = '';

    // Add Reserve Highlight Box
    const highlight = document.createElement('div');
    highlight.className = 'reserve-highlight-box';
    selectors.enemyFormation.appendChild(highlight);

    gameState.enemyTeam.forEach((monster, index) => {
        const slot = createSlotDOM(monster, index, false);
        selectors.enemyFormation.appendChild(slot);
    });
}

function createSlotDOM(monster, index, isPlayer, handlers = {}) {
    const slot = document.createElement('div');
    slot.className = `slot ${index === 0 ? 'vanguard' : 'wing'}`;
    slot.dataset.index = index;

    // Drag and Drop Listeners
    if (handlers.handleDragOver) slot.addEventListener('dragover', handlers.handleDragOver);
    if (handlers.handleDragEnter) slot.addEventListener('dragenter', handlers.handleDragEnter);
    if (handlers.handleDragLeave) slot.addEventListener('dragleave', handlers.handleDragLeave);
    if (handlers.handleDrop) slot.addEventListener('drop', (e) => handlers.handleDrop(e, index, isPlayer));

    if (monster) {
        const monsterDiv = createMonsterDOM(monster, index, isPlayer, handlers);
        slot.appendChild(monsterDiv);
    }

    return slot;
}

function createMonsterDOM(monster, index, isPlayer, handlers = {}) {
    const div = document.createElement('div');
    div.className = 'monster';
    if (monster.isDead) div.classList.add('dead');

    // SATURATION RULE: Reserves (3,4) are desaturated
    if (index >= 3) {
        div.style.filter = 'saturate(0.5)';
    }

    const img = document.createElement('img');
    const imgName = monster.name.replace(/\s+/g, '');
    img.src = `Images/${imgName}.png`;
    div.appendChild(img);

    // Pellicle Counters
    const counters = document.createElement('div');
    counters.className = 'pellicle-counters';
    for (let i = 0; i < monster.pellicle; i++) {
        const p = document.createElement('div');
        p.className = 'p-dot';
        counters.appendChild(p);
    }
    div.appendChild(counters);

    // Ability Glow
    if (isPlayer && gameState.selectedAbilitySourceIndex === index) {
        div.classList.add('selected-glow');
    }

    if (isPlayer) {
        div.draggable = true;
        if (handlers.handleDragStart) div.addEventListener('dragstart', (e) => handlers.handleDragStart(e, index));
        if (handlers.handleDragEnd) div.addEventListener('dragend', handlers.handleDragEnd);
        if (handlers.handleMonsterClick) div.onclick = () => handlers.handleMonsterClick(index);

        // Touch Support
        if (handlers.handleTouchStart) div.addEventListener('touchstart', (e) => handlers.handleTouchStart(e, index), { passive: false });
    }

    // Info Hover
    if (handlers.handleMonsterHover) {
        div.onmouseover = () => handlers.handleMonsterHover(monster, div);
        div.onmouseout = handlers.handleMonsterUnhover;
    }

    return div;
}

export function updateInfoPanel(monster) {
    if (!selectors.infoPanel || !monster) return;
    const template = MONSTER_DATABASE[monster.id.replace('e_', '')];
    selectors.infoPanel.innerHTML = `
        <div class="info-header">
            <span class="info-name">${monster.name} [Slot ${gameState.playerTeam.indexOf(monster) !== -1 ? gameState.playerTeam.indexOf(monster) : gameState.enemyTeam.indexOf(monster)}]</span>
            <span class="info-faction">${monster.faction}</span>
        </div>
        <div class="info-stats">
            <span>Armor: ${monster.pellicle}/${monster.max}</span>
            <span>Status: ${monster.isDead ? 'OUT' : 'ACTIVE'}</span>
        </div>
        <div class="info-abilities">
            <p><strong>ATK:</strong> ${template.ability.attack}</p>
            <p><strong>PAS:</strong> ${template.ability.passive}</p>
        </div>
    `;
}

export function clearActionIndicators() {
    document.querySelectorAll('.slot').forEach(s => {
        s.classList.remove('swap-indicator', 'attack-indicator');
        const badge = s.querySelector('.action-badge');
        if (badge) badge.remove();
    });
}

export function showActionIndicator(slot, type) {
    clearActionIndicators();
    slot.classList.add(`${type}-indicator`);
    const badge = document.createElement('div');
    badge.className = 'action-badge';
    badge.innerText = type === 'swap' ? 'SWAP' : 'TARGET';
    slot.appendChild(badge);
}

export function triggerVisualEffect(index, isPlayer, type) {
    const slot = getSlotElement(index, isPlayer);
    if (!slot) return;
    const monsterDiv = slot.querySelector('.monster');
    if (!monsterDiv) return;

    if (type === 'hit-flash') {
        monsterDiv.classList.add('hit-flash');
        setTimeout(() => monsterDiv.classList.remove('hit-flash'), 200);
    } else if (type === 'power-up') {
        monsterDiv.classList.add('power-up-glow');
        setTimeout(() => monsterDiv.classList.remove('power-up-glow'), 500);
    }
}

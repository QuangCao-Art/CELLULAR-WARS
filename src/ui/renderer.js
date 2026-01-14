import { gameState, CONSTANTS } from '../engine/state.js';
import { MONSTER_DATABASE } from '../data/monsters.js';
import { CARDS_DATABASE } from '../data/cards.js';

// DOM References (To be initialized in main or via a setup function)
let selectors = {};
let currentInspection = { monster: null, isPlayer: false };
let handlersCache = {};

export function initializeSelectors(refs) {
    selectors = refs;
}

export function setHandlersCache(handlers) {
    handlersCache = handlers;
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

    if (selectors.currentPhaseEl) {
        selectors.currentPhaseEl.innerText = gameState.currentPhase;
        if (gameState.isAITurn) {
            selectors.currentPhaseEl.style.color = 'var(--neon-red)';
            selectors.currentPhaseEl.style.textShadow = '0 0 10px var(--neon-red)';
        } else {
            selectors.currentPhaseEl.style.color = ''; // Revert to CSS default
            selectors.currentPhaseEl.style.textShadow = '';
        }
    }
    if (selectors.turnNumberEl) selectors.turnNumberEl.innerText = gameState.turnNumber;

    if (selectors.instructionMsg) {
        if (gameState.currentPhase === 'REINFORCE') {
            selectors.instructionMsg.innerText = `Pool: ${gameState.pelliclePool}P | Drag tokens to monsters.`;
        } else if (gameState.currentPhase === 'ACTION') {
            selectors.instructionMsg.innerText = gameState.specialUsedThisTurn ? "Pellicle Trail used. Move to Attack Phase?" : "Click monster to use Pellicle Trail.";
        } else if (gameState.currentPhase === 'ATTACK') {
            if (gameState.turnNumber === 1) {
                selectors.instructionMsg.innerText = "ACCLIMATION: Attacks Locked. End Turn to proceed.";
            } else {
                selectors.instructionMsg.innerText = gameState.attackUsedThisTurn ? "Attack used. End turn?" : "Drag monster to enemy to attack.";
            }
        }
    }

    // Toggle Phase Buttons
    if (selectors.btnEndReinforce) {
        selectors.btnEndReinforce.classList.toggle('invisible', gameState.isAITurn || gameState.currentPhase !== 'REINFORCE');
        if (gameState.currentPhase === 'REINFORCE' && !gameState.isAITurn) {
            selectors.btnEndReinforce.innerText = (gameState.turnNumber === 1) ? 'END FIRST TURN' : 'ACTION PHASE';
        }
    }
    if (selectors.btnEndAction) {
        selectors.btnEndAction.classList.toggle('invisible', gameState.isAITurn || gameState.currentPhase !== 'ACTION');
    }
    if (selectors.btnEndTurn) {
        selectors.btnEndTurn.classList.toggle('invisible', gameState.isAITurn || gameState.currentPhase !== 'ATTACK');
        if (gameState.currentPhase === 'ATTACK' && !gameState.isAITurn) {
            selectors.btnEndTurn.innerText = (gameState.turnNumber === 1) ? 'END TURN (ACCLIMATION)' : 'END TURN';
        }
    }
}

export function getSlotElement(index, isPlayer) {
    const teamClass = isPlayer ? '.player-team' : '.enemy-team';
    return document.querySelector(`${teamClass} .slot[data-index="${index}"]`);
}

export function renderFormation(handlers = null) {
    if (!selectors.playerFormation) return;
    if (handlers) handlersCache = handlers;
    const finalHandlers = handlers || handlersCache;

    selectors.playerFormation.innerHTML = '';

    // Re-add background zones
    const zones = document.createElement('div');
    zones.className = 'formation-zones';
    selectors.playerFormation.appendChild(zones);

    gameState.playerTeam.forEach((monster, index) => {
        const slot = createSlotDOM(monster, index, true, finalHandlers);
        selectors.playerFormation.appendChild(slot);
    });

    refreshInfoPanel();
}

export function renderEnemyFormation(handlers = null) {
    if (!selectors.enemyFormation) return;
    if (handlers) handlersCache = handlers;
    const finalHandlers = handlers || handlersCache;

    selectors.enemyFormation.innerHTML = '';

    const zones = document.createElement('div');
    zones.className = 'formation-zones';
    selectors.enemyFormation.appendChild(zones);

    gameState.enemyTeam.forEach((monster, index) => {
        const slot = createSlotDOM(monster, index, false, finalHandlers);
        selectors.enemyFormation.appendChild(slot);
    });

    refreshInfoPanel();
}

function createSlotDOM(monster, index, isPlayer, handlers = {}) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.dataset.index = index;
    const pos = index === 0 ? 'vanguard' : (index === 1 ? 'wing-left' : 'wing-right');
    slot.dataset.pos = pos;

    if (monster.isDead) {
        slot.classList.add('dead');
        // Use a dedicated persistent flag so it only plays once
        const shouldAnimate = !monster.deathAnimPlayed;
        if (shouldAnimate) monster.deathAnimPlayed = true;

        const animationClass = shouldAnimate ? 'animate-appear' : '';

        slot.innerHTML = `<div class="monster dead">
            <img src="Images/CellContainer.png" class="dead-container-icon ${animationClass}">
        </div>`;

        const monsterDiv = slot.querySelector('.monster');
        monsterDiv.onmouseenter = () => handlers.handleMouseEnter && handlers.handleMouseEnter(monster, isPlayer, index);
        monsterDiv.onmouseleave = () => handlers.handleMouseLeave && handlers.handleMouseLeave();

        // ENABLE DROP ON DEAD SLOTS (For global card effects)
        slot.ondragover = (e) => e.preventDefault();
        slot.ondrop = (e) => {
            e.preventDefault();
            handlers.handleDrop && handlers.handleDrop(e, index, isPlayer);
        };

        return slot;
    }

    const monsterDiv = document.createElement('div');
    monsterDiv.className = 'monster';
    if (monster.pellicle === 0 && !monster.isDead) {
        monsterDiv.classList.add('vulnerable');
    }
    if (monster.isMarked) {
        monsterDiv.classList.add('marked');
    }
    monsterDiv.dataset.id = monster.id;

    monsterDiv.innerHTML = `
        <img src="Images/${monster.name.replace(/\s+/g, '')}.png" alt="${monster.name}">
    `;

    // 3. Pellicle Rings
    const ringContainer = document.createElement('div');
    ringContainer.className = 'pellicle-ring-container';
    ringContainer.style.position = 'absolute';
    ringContainer.style.top = '0';
    ringContainer.style.left = '0';
    ringContainer.style.width = '100%';
    ringContainer.style.height = '100%';
    ringContainer.style.pointerEvents = 'none';
    monsterDiv.appendChild(ringContainer);

    const renderCount = Math.min(monster.pellicle, 10);
    for (let i = 0; i < renderCount; i++) {
        const ring = document.createElement('div');
        ring.classList.add('pellicle-ring');
        if (!isPlayer) ring.classList.add('enemy-ring');
        const scale = 0.6 + (i * 0.1);
        ring.style.transform = `translate(-50%, -50%) scale(${scale})`;
        ringContainer.appendChild(ring);
    }

    // 4. Pellicle Badge
    const badge = document.createElement('div');
    badge.classList.add('pellicle-count');
    badge.innerText = monster.pellicle;
    if (!isPlayer) {
        badge.style.borderColor = "#ff9900";
        badge.style.color = "#ff9900";
        badge.style.boxShadow = "0 0 5px #ff9900";
    }
    if (monster.pellicle >= 5) {
        badge.style.color = "var(--neon-red)";
        badge.style.borderColor = "var(--neon-red)";
    }
    monsterDiv.appendChild(badge);

    // Interaction handlers
    if (isPlayer) {
        monsterDiv.onclick = () => handlers.handleMonsterClick && handlers.handleMonsterClick(index);
        monsterDiv.draggable = true;
        monsterDiv.ondragstart = (e) => handlers.handleDragStart && handlers.handleDragStart(e, index);
    }

    monsterDiv.onmouseenter = () => handlers.handleMouseEnter && handlers.handleMouseEnter(monster, isPlayer, index);
    monsterDiv.onmouseleave = () => handlers.handleMouseLeave && handlers.handleMouseLeave();

    slot.appendChild(monsterDiv);

    // Drop logic for slot
    slot.ondragover = (e) => e.preventDefault();
    slot.ondrop = (e) => {
        e.preventDefault();
        handlers.handleDrop && handlers.handleDrop(e, index, isPlayer);
    };

    return slot;
}


function applyGlowRules(color) {
    const sidebar = document.querySelector('.right-sidebar');
    const previewContainer = document.querySelector('.monster-preview-container');
    const imgEl = document.getElementById('panel-img');
    const nameEl = document.getElementById('panel-name');

    let baseHex = "#ffffff";
    if (color === "var(--neon-pink)") baseHex = "#ff00cc";
    else if (color === "var(--neon-green)") baseHex = "#0aff00";
    else if (color === "var(--neon-blue)") baseHex = "#00f3ff";
    else if (color === "white") baseHex = "#ffffff";

    if (sidebar) {
        sidebar.style.borderLeftColor = baseHex;
        sidebar.style.boxShadow = `-5px 0 20px ${baseHex}33`;
    }
    if (previewContainer) {
        previewContainer.style.borderColor = `${baseHex}33`;
        previewContainer.style.background = `radial-gradient(circle, ${baseHex}1a 0%, transparent 70%)`;
    }
    if (imgEl) {
        imgEl.style.filter = `drop-shadow(0 0 15px ${baseHex}80)`;
    }
    if (nameEl) {
        nameEl.style.textShadow = `0 0 10px ${baseHex}`;
    }
}

export function updateInfoPanel(monster, isPlayer) {
    currentInspection = { monster, isPlayer };
    if (!selectors.infoPanel) return;
    const { infoPanel } = selectors;

    const nameEl = document.getElementById('panel-name');
    const imgEl = document.getElementById('panel-img');
    const pellicleLabelEl = document.getElementById('panel-pellicle-label');
    const pellicleEl = document.getElementById('panel-pellicle');
    const statusEl = document.getElementById('panel-status');
    const attackTitleEl = document.getElementById('panel-attack-title');
    const attackEl = document.getElementById('panel-attack');
    const passiveTitleEl = document.getElementById('panel-passive-title');
    const passiveEl = document.getElementById('panel-passive');

    if (monster === 'token') {
        applyGlowRules("white");
        if (nameEl) {
            nameEl.innerText = "PELLICLE TOKEN";
            nameEl.style.color = "white";
        }
        if (imgEl) {
            imgEl.src = "Images/PelliclePoint.png";
            imgEl.classList.remove('hidden');
        }
        if (pellicleLabelEl) pellicleLabelEl.innerText = "PELLICLES:";
        if (pellicleEl) {
            pellicleEl.innerText = "1 / 1";
            pellicleEl.style.color = "white";
        }
        if (statusEl) {
            statusEl.innerText = "STABLE";
            statusEl.style.color = "var(--neon-blue)";
        }
        if (attackTitleEl) {
            attackTitleEl.innerText = "SYSTEM RESOURCE";
            attackTitleEl.style.color = "white";
        }
        if (attackEl) attackEl.innerText = "Essential data unit used to reinforce unit integrity and catalyze cellular growth.";
        if (passiveTitleEl) {
            passiveTitleEl.innerText = "INTEGRATION";
            passiveTitleEl.style.color = "white";
        }
        if (passiveEl) passiveEl.innerText = "Drag onto a monster to restore 1 Pellicle. Can be used during the Reinforce Phase.";

        const boxes = document.querySelectorAll('#info-panel .ability-box');
        boxes.forEach(box => box.style.borderLeftColor = "white");
        return;
    }

    if (!monster) {
        applyGlowRules("white");
        if (nameEl) {
            nameEl.innerText = "BATTLE OVERVIEW";
            nameEl.style.color = "white";
        }
        if (imgEl) {
            imgEl.src = "Images/TrianglePosition.png";
            imgEl.classList.remove('hidden');
        }
        if (pellicleLabelEl) pellicleLabelEl.innerText = "PELLICLES:";
        if (pellicleEl) {
            pellicleEl.innerText = `TURN ${gameState.turnNumber}`;
            pellicleEl.style.color = "white";
        }
        if (statusEl) {
            statusEl.innerText = gameState.isAITurn ? "ENEMY TURN" : "YOUR TURN";
            statusEl.style.color = gameState.isAITurn ? "var(--neon-red)" : "var(--neon-green)";
        }

        const boxes = infoPanel.querySelectorAll('.ability-box');
        if (attackTitleEl) {
            attackTitleEl.innerText = "ENEMY SQUAD";
            attackTitleEl.style.color = "white"; // Overriding the orange for consistency with user request
            if (boxes[0]) boxes[0].style.borderLeftColor = "var(--neon-orange, #ff8c00)";
        }
        if (attackEl) {
            attackEl.innerHTML = gameState.enemyTeam.slice(0, 3).map(m => {
                if (m.isDead) return `<div style="color:var(--necrosis)">${m.name}: 0P [NECROSIS]</div>`;
                const status = m.pellicle === 0 ? '<span style="color:var(--neon-red)">VULNERABLE</span>' : '<span style="color:var(--neon-green)">ACTIVE</span>';
                return `<div>${m.name}: ${m.pellicle}P [${status}]</div>`;
            }).join('');
        }

        if (passiveTitleEl) {
            passiveTitleEl.innerText = "YOUR SQUAD";
            passiveTitleEl.style.color = "white";
            if (boxes[1]) boxes[1].style.borderLeftColor = "white";
        }

        // Ensure both boxes are white for overview
        const allBoxes = document.querySelectorAll('#info-panel .ability-box');
        allBoxes.forEach(box => box.style.borderLeftColor = "white");
        if (passiveEl) {
            passiveEl.innerHTML = gameState.playerTeam.slice(0, 3).map(m => {
                const special = m.specialUsed ? ' (•)' : '';
                if (m.isDead) return `<div style="color:var(--necrosis)">${m.name}: 0P [NECROSIS]${special}</div>`;
                const status = m.pellicle === 0 ? '<span style="color:var(--neon-red)">VULNERABLE</span>' : '<span style="color:var(--neon-green)">ACTIVE</span>';
                return `<div>${m.name}: ${m.pellicle}P [${status}]${special}</div>`;
            }).join('');
        }
        return;
    }

    applyGlowRules("var(--neon-green)");

    if (nameEl) {
        nameEl.innerText = monster.isDead ? "CELL CONTAINER" : monster.name;
        nameEl.style.color = "var(--neon-green)";
    }
    if (imgEl) {
        imgEl.src = monster.isDead ? "Images/CellContainer.png" : `Images/${monster.name.replace(/\s+/g, '')}.png`;
        imgEl.classList.remove('hidden');
    }
    if (pellicleEl) {
        pellicleEl.innerText = monster.isDead ? "0 / 0" : `${monster.pellicle} / ${monster.max}`;
        pellicleEl.style.color = "var(--neon-green)";
    }
    if (statusEl) {
        if (monster.isDead) {
            statusEl.innerText = "NECROSIS";
            statusEl.style.color = "var(--necrosis)";
        } else if (monster.pellicle === 0) {
            statusEl.innerText = "VULNERABLE";
            statusEl.style.color = "var(--neon-red)";
        } else {
            statusEl.innerText = "ACTIVE";
            statusEl.style.color = "var(--neon-green)";
        }
    }

    const boxes = infoPanel.querySelectorAll('.ability-box');
    if (attackTitleEl) {
        attackTitleEl.innerText = monster.isDead ? "DECOMMISSIONED" : "OFFENSIVE TRAIL";
        attackTitleEl.style.color = "var(--neon-green)";
        if (boxes[0]) boxes[0].style.borderLeftColor = "var(--neon-green)";
    }
    if (attackEl) {
        if (monster.isDead) {
            const deadPuns = [
                "This container is feeling a bit empty inside.",
                "Currently serving as a very expensive paperweight.",
                "Biological functions: 404 Not Found.",
                "Resting in pieces (of code).",
                "It's not dead, it's just digitally challenged.",
                "Out of order. Please insert 2P to continue (just kidding, it's gone)."
            ];
            attackEl.innerText = deadPuns[Math.floor(Math.random() * deadPuns.length)];
        } else {
            attackEl.innerText = monster.offensiveTrail;
        }
    }

    if (passiveTitleEl) {
        passiveTitleEl.innerText = monster.isDead ? "BIO-SCRAP" : "PELLICLE TRAIL";
        passiveTitleEl.style.color = "var(--neon-green)";
        if (boxes[1]) boxes[1].style.borderLeftColor = "var(--neon-green)";
    }
    if (passiveEl) {
        if (monster.isDead) {
            passiveEl.innerText = "Unit status: OUT. The only trait remaining is its ability to take up space.";
        } else {
            passiveEl.innerText = monster.pellicleTrail;
        }
    }
}

export function updateCardInfoPanel(cardData) {
    if (!selectors.infoPanel) return;
    applyGlowRules("var(--neon-pink)");

    const nameEl = selectors.infoPanel.querySelector('#panel-name');
    const imgEl = selectors.infoPanel.querySelector('#panel-img');
    const pellicleLabelEl = selectors.infoPanel.querySelector('#panel-pellicle-label');
    const pellicleEl = selectors.infoPanel.querySelector('#panel-pellicle');
    const statusEl = selectors.infoPanel.querySelector('#panel-status');

    // Ability Areas
    const attackTitleEl = selectors.infoPanel.querySelector('#panel-attack-title');
    const attackEl = selectors.infoPanel.querySelector('#panel-attack');
    const passiveTitleEl = selectors.infoPanel.querySelector('#panel-passive-title');
    const passiveEl = selectors.infoPanel.querySelector('#panel-passive');

    if (pellicleLabelEl) pellicleLabelEl.innerText = "PELLICLES:";

    if (nameEl) {
        nameEl.innerText = cardData.name;
        nameEl.style.color = "var(--neon-pink)"; // Pink title
    }
    if (imgEl) {
        imgEl.src = cardData.icon;
        imgEl.classList.remove('hidden');
    }
    if (pellicleLabelEl) {
        pellicleLabelEl.innerText = "TYPE:";
    }
    if (pellicleEl) {
        pellicleEl.innerText = cardData.type === 'global' ? "GLOBAL DEBUFF" : "TARGETED ABILITY";
        pellicleEl.style.color = "var(--neon-pink)"; // Use neon-pink to match the title
    }
    if (statusEl) {
        if (!gameState.cardsUnlocked) {
            statusEl.innerText = "Cooking...";
            statusEl.style.color = "var(--neon-yellow)";
        } else {
            statusEl.innerText = "READY";
            statusEl.style.color = "var(--neon-blue)";
        }
    }

    if (attackTitleEl) {
        attackTitleEl.innerText = "CHEMICAL EFFECT";
        attackTitleEl.style.color = "var(--neon-pink)"; // Pink title
    }

    const boxes = selectors.infoPanel.querySelectorAll('.ability-box');
    boxes.forEach(box => box.style.borderLeftColor = "var(--neon-pink)");
    if (attackEl) {
        attackEl.innerText = cardData.desc;
    }

    if (passiveTitleEl) {
        passiveTitleEl.innerText = "TYPE";
        passiveTitleEl.style.color = "var(--neon-pink)"; // Pink title
    }
    if (passiveEl) {
        passiveEl.innerText = cardData.type === 'global' ? "GLOBAL DEBUFF" : "TARGETED ABILITY";
    }
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
    badge.innerText = 'TARGET';
    slot.appendChild(badge);
}

export function refreshInfoPanel() {
    updateInfoPanel(currentInspection.monster, currentInspection.isPlayer);
}

export function triggerVisualEffect(index, isPlayer, type) {
    const slot = getSlotElement(index, isPlayer);
    if (!slot) return;
    const monsterDiv = slot.querySelector('.monster');
    if (!monsterDiv) return;

    if (type === 'hit-flash') {
        monsterDiv.classList.remove('hit-flash');
        void monsterDiv.offsetWidth; // Force reflow
        monsterDiv.classList.add('hit-flash');
        setTimeout(() => monsterDiv.classList.remove('hit-flash'), 400);
    } else if (type === 'hit-light') {
        monsterDiv.classList.remove('hit-light');
        void monsterDiv.offsetWidth;
        monsterDiv.classList.add('hit-light');
        setTimeout(() => monsterDiv.classList.remove('hit-light'), 200);
    } else if (type === 'power-up' || type === 'ability-activation') {
        const effectClass = type === 'ability-activation' ? 'ability-activation' : 'power-up';
        monsterDiv.classList.remove(effectClass);
        void monsterDiv.offsetWidth;
        monsterDiv.classList.add(effectClass);
        setTimeout(() => monsterDiv.classList.remove(effectClass), 500);
    }
}

export function renderHand(handlers = {}) {
    if (!selectors.heroCardZone) return;

    // Show/Hide container based on hand size
    if (gameState.playerHand.length === 0) {
        selectors.heroCardZone.classList.add('hidden');
        return;
    }
    selectors.heroCardZone.classList.remove('hidden');
    selectors.heroCardZone.innerHTML = '';

    gameState.playerHand.forEach(cardId => {
        const cardData = CARDS_DATABASE[cardId];
        if (!cardData) return;

        const cardEl = document.createElement('div');
        cardEl.className = 'action-card';
        if (!gameState.cardsUnlocked) {
            cardEl.classList.add('locked');
            cardEl.title = "Unlocks on Turn 3";
        } else {
            cardEl.classList.add('draggable');
            cardEl.draggable = true;
            cardEl.style.boxShadow = `0 0 10px ${cardData.color || 'white'}`;
            cardEl.style.borderColor = cardData.color || 'white';
        }

        // Card Content
        cardEl.innerHTML = `
            <img src="${cardData.icon}" class="card-icon" onerror="this.src='Images/PelliclePoint.png'">
            <div class="card-name" style="color:${cardData.color}">${cardData.name}</div>
            <div class="card-desc">${cardData.desc}</div>
        `;

        // Drag Logic & Interaction
        if (gameState.cardsUnlocked) {
            cardEl.ondragstart = (e) => {
                e.dataTransfer.setData('text/plain', `type:card,id:${cardId}`);
                cardEl.style.opacity = '0.5';
            };
            cardEl.ondragend = (e) => {
                cardEl.style.opacity = '1';
            };
        }

        // Info Panel Hover
        cardEl.onmouseenter = () => updateCardInfoPanel(cardData);
        cardEl.onmouseleave = () => updateInfoPanel(); // Revert to game state

        selectors.heroCardZone.appendChild(cardEl);
    });
}

import { MONSTER_DATABASE } from './data/monsters.js';
import { gameState, CONSTANTS, createMonsterInstance, resetGameState } from './engine/state.js';
import * as Renderer from './ui/renderer.js';
import * as Animations from './ui/animations.js';
import * as Combat from './engine/combat.js';
import * as AI from './engine/ai.js';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize DOM Selectors in Renderer
    const refs = {
        playerFormation: document.querySelector('.player-team .team-formation'),
        enemyFormation: document.querySelector('.enemy-team .team-formation'),
        gameMessage: document.getElementById('game-message'),
        battleLog: document.getElementById('battle-log'),
        currentPhaseEl: document.getElementById('current-phase'),
        turnNumberEl: document.getElementById('turn-number'),
        instructionMsg: document.getElementById('instruction-msg'),
        btnEndReinforce: document.getElementById('btn-end-reinforce'),
        btnEndTurn: document.getElementById('btn-end-turn'),
        infoPanel: document.getElementById('info-panel'),
        mainMenu: document.getElementById('main-menu-screen'),
        battlefield: document.getElementById('battlefield-screen'),
        cellContainerScreen: document.getElementById('cell-container-screen'),
        rulebookScreen: document.getElementById('rulebook-screen'),
        databaseScreen: document.getElementById('database-screen')
    };
    Renderer.initializeSelectors(refs);

    // 2. Global Event Bindings
    document.getElementById('btn-quick-start').onclick = startGame;
    document.getElementById('btn-cell-pool').onclick = () => {
        refs.mainMenu.classList.add('hidden');
        refs.cellContainerScreen.classList.remove('hidden');
        initCellContainer();
    };
    document.getElementById('btn-rulebook').onclick = () => toggleScreen(refs.rulebookScreen);
    document.getElementById('btn-database').onclick = () => toggleScreen(refs.databaseScreen);
    document.querySelectorAll('.btn-back').forEach(btn => btn.onclick = showMainMenu);

    refs.btnEndReinforce.onclick = endReinforcePhase;
    refs.btnEndTurn.onclick = endTurn;

    // 3. Initialize Global Systems
    initCellContainer();
});

// --- CORE GAME FLOW ---
function startGame() {
    document.getElementById('main-menu-screen').classList.add('hidden');
    document.getElementById('battlefield-screen').classList.remove('hidden');

    resetGameState();
    Renderer.renderFormation(getHandlers());
    Renderer.renderEnemyFormation();
    startTurn();
}

function startTurn() {
    gameState.actionTaken = false;
    gameState.playerTeam.forEach(m => { m.attackCount = 0; m.hasSwapped = false; });
    gameState.enemyTeam.forEach(m => { m.attackCount = 0; m.hasSwapped = false; });

    if (gameState.isAITurn) {
        AI.runAIReinforce(() => {
            gameState.currentPhase = 'ACTION';
            Renderer.updatePhaseUI();
            setTimeout(() => AI.runAIAction(endTurn), 1000);
        });
    } else {
        gameState.currentPhase = 'REINFORCE';
        gameState.pelliclePool = CONSTANTS.REINFORCE_AMOUNT;
        spawnPellicleTokens();
        Renderer.updatePhaseUI();
    }
}

function endReinforcePhase() {
    if (gameState.currentPhase !== 'REINFORCE' || gameState.isAITurn) return;

    // Auto-clean tokens
    const tokens = document.querySelectorAll('.pellicle-token');
    tokens.forEach(t => t.remove());

    gameState.currentPhase = 'ACTION';
    Renderer.updatePhaseUI();
}

function endTurn() {
    if (gameState.isGameOver) return;
    gameState.turnNumber++;
    gameState.isAITurn = !gameState.isAITurn;
    startTurn();
}

// --- TOKEN LOGIC ---
function spawnPellicleTokens() {
    const container = document.getElementById('token-pool');
    container.innerHTML = '';
    for (let i = 0; i < gameState.pelliclePool; i++) {
        const token = document.createElement('div');
        token.className = 'pellicle-token';
        token.draggable = true;
        token.id = `token-${Date.now()}-${i}`;

        token.addEventListener('dragstart', (e) => {
            gameState.isDraggingPellicleFlag = true;
            gameState.isDraggingPlayerFlag = false;
            e.dataTransfer.setData('text/plain', `type:pellicle;id:${token.id}`);
            setTimeout(() => token.style.opacity = '0.3', 0);
        });

        token.addEventListener('dragend', () => {
            token.style.opacity = '1';
            gameState.isDraggingPellicleFlag = false;
        });

        container.appendChild(token);
    }
}

// --- HANDLERS (Delegated to Modules) ---
function getHandlers() {
    return {
        handleDragStart: (e, index) => {
            if (gameState.isAITurn || gameState.isGameOver) { e.preventDefault(); return; }
            const monster = gameState.playerTeam[index];
            const isTransfer = (gameState.currentPhase === 'REINFORCE' && monster.id.includes('lydro') && monster.pellicle > 0);

            if (!isTransfer && (monster.pellicle <= 0 || index >= 3)) {
                if (index >= 3) Renderer.showGameMessage("Reserves cannot initiate attacks!", "red");
                e.preventDefault();
                return;
            }

            gameState.draggedIndex = index;
            gameState.isDraggingPlayerFlag = true;
            const dragType = isTransfer ? 'type:transfer' : 'type:monster';
            e.dataTransfer.setData('text/plain', `${dragType};index:${index}`);
            setTimeout(() => e.target.style.opacity = '0.5', 0);
        },
        handleDragEnd: (e) => {
            e.target.style.opacity = '1';
            gameState.isDraggingPlayerFlag = false;
            Renderer.clearActionIndicators();
            document.querySelectorAll('.slot').forEach(s => s.classList.remove('drag-over', 'invalid-target', 'target-lock'));
        },
        handleDragOver: (e) => {
            if (gameState.isAITurn) return;
            e.preventDefault();
        },
        handleDragEnter: (e) => {
            if (gameState.isAITurn) return;
            e.preventDefault();
            const slot = e.currentTarget;
            slot.classList.add('drag-over');

            if (gameState.currentPhase === 'ACTION' && gameState.isDraggingPlayerFlag) {
                if (slot.closest('.player-team')) Renderer.showActionIndicator(slot, 'swap');
                else if (slot.closest('.enemy-team')) {
                    const idx = parseInt(slot.dataset.index);
                    if (idx < 3) Renderer.showActionIndicator(slot, 'attack');
                }
            }
        },
        handleDragLeave: (e) => {
            e.currentTarget.classList.remove('drag-over');
            Renderer.clearActionIndicators();
        },
        handleDrop: (e, targetIndex, isPlayer) => {
            e.preventDefault();
            const rawData = e.dataTransfer.getData('text/plain');
            if (isPlayer) handleDropPlayerSlot(targetIndex, rawData);
            else handleDropEnemySlot(targetIndex, rawData);
        },
        handleMonsterClick: (index) => {
            if (gameState.currentPhase !== 'REINFORCE' || gameState.isAITurn) return;
            // Logic for Osmotic Flow click-selection
            handleOsmoticFlow(index);
        },
        handleMonsterHover: (monster, el) => Renderer.updateInfoPanel(monster),
        handleMonsterUnhover: () => { }
    };
}

function handleDropPlayerSlot(targetIndex, rawData) {
    if (rawData.includes('type:pellicle')) {
        const tokenId = rawData.split('id:')[1];
        addPellicleFromDrag(targetIndex, tokenId);
    } else if (rawData.includes('type:monster')) {
        if (gameState.currentPhase !== 'ACTION') {
            Renderer.showGameMessage("Cannot swap during Reinforce!", "red");
            return;
        }
        const sourceIndex = parseInt(rawData.split('index:')[1]);
        if (sourceIndex !== targetIndex) executeSwap(sourceIndex, targetIndex);
    } else if (rawData.includes('type:transfer')) {
        const sourceIndex = parseInt(rawData.split('index:')[1]);
        executeTransfer(sourceIndex, targetIndex);
    }
}

function handleDropEnemySlot(enemyIndex, rawData) {
    if (gameState.currentPhase === 'REINFORCE') {
        const tokenId = rawData.split('id:')[1];
        addPellicleToEnemyFromDrag(enemyIndex, tokenId);
    } else if (rawData.includes('type:monster')) {
        const sourceIndex = parseInt(rawData.split('index:')[1]);
        if (enemyIndex < 3) triggerCombatSequence(sourceIndex, enemyIndex);
        else Renderer.showGameMessage("Reserves are out of reach!", "red");
    }
}

function addPellicleFromDrag(index, tokenId) {
    if (index >= 3) { Renderer.showGameMessage("Reserves can't be reinforced!", "red"); return; }
    const monster = gameState.playerTeam[index];
    const isCano = monster.id.includes('cano');
    const amount = isCano ? 2 : 1;

    if (monster.pellicle + amount >= 6) {
        gameState.pelliclePool--;
        Combat.triggerExplosion(gameState.playerTeam, index);
    } else {
        monster.pellicle += amount;
        gameState.pelliclePool--;
        const tokenEl = document.getElementById(tokenId);
        Animations.animatePellicleToMonster(tokenEl, index, () => {
            Renderer.triggerVisualEffect(index, true, 'power-up');
            Renderer.renderFormation(getHandlers());
        });
    }
    Renderer.updatePhaseUI();
}

function addPellicleToEnemyFromDrag(index, tokenId) {
    if (index >= 3) { Renderer.showGameMessage("Enemy reserves are out of reach!", "red"); return; }
    const monster = gameState.enemyTeam[index];
    if (monster.pellicle + 1 >= 6) {
        gameState.pelliclePool--;
        Combat.triggerExplosion(gameState.enemyTeam, index);
    } else {
        monster.pellicle += 1;
        gameState.pelliclePool--;
        const tokenEl = document.getElementById(tokenId);
        Animations.animatePellicleToMonster(tokenEl, index, () => {
            Renderer.renderEnemyFormation();
        }, false);
    }
    Renderer.updatePhaseUI();
}

function executeSwap(sIdx, tIdx) {
    if (gameState.actionTaken) { Renderer.showGameMessage("Action already taken!", "red"); return; }

    // Tactic Switch Check
    const isTacticSwitch = (sIdx < 3 !== tIdx < 3);
    const temp = gameState.playerTeam[sIdx];
    gameState.playerTeam[sIdx] = gameState.playerTeam[tIdx];
    gameState.playerTeam[tIdx] = temp;

    if (isTacticSwitch) gameState.actionTaken = true;
    Renderer.renderFormation(getHandlers());
    Renderer.updatePhaseUI();
    Combat.checkVanguardHealth();
}

function executeTransfer(sIdx, tIdx) {
    const source = gameState.playerTeam[sIdx];
    const target = gameState.playerTeam[tIdx];
    if (tIdx >= 3 || target.isDead || target.pellicle >= target.max) return;

    source.pellicle--;
    target.pellicle++;
    Renderer.triggerVisualEffect(sIdx, true, 'power-up');
    Renderer.triggerVisualEffect(tIdx, true, 'power-up');
    Renderer.renderFormation(getHandlers());
}

function triggerCombatSequence(aIdx, vIdx) {
    const attacker = gameState.playerTeam[aIdx];
    const victim = gameState.enemyTeam[vIdx];

    if (gameState.actionTaken || attacker.attackCount > 0) return;

    // Check Vanguard Barrier
    if (vIdx !== 0 && !gameState.enemyTeam[0].isDead && !attacker.id.includes('lydro')) {
        Renderer.showGameMessage("Eliminate Vanguard first!", "red");
        return;
    }

    let cost = attacker.id.includes('cano') ? attacker.pellicle : (attacker.id.includes('nitro') || attacker.id.includes('lydro') ? 2 : 1);
    if (attacker.pellicle < cost) return;

    attacker.attackCount++;
    gameState.actionTaken = true;

    if (attacker.id.includes('cano')) {
        const count = attacker.pellicle;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (attacker.isDead || attacker.pellicle <= 0) return;
                attacker.pellicle--;
                Renderer.renderFormation(getHandlers());
                Animations.triggerProjectile(aIdx, vIdx, true, () => {
                    Combat.resolveHit(victim, vIdx, gameState.enemyTeam, attacker, aIdx, gameState.playerTeam);
                    Renderer.renderEnemyFormation();
                }, 100);
            }, i * 80);
        }
    } else {
        attacker.pellicle -= cost;
        Renderer.renderFormation(getHandlers());
        Animations.triggerProjectile(aIdx, vIdx, true, () => {
            Combat.resolveHit(victim, vIdx, gameState.enemyTeam, attacker, aIdx, gameState.playerTeam);
            Renderer.renderEnemyFormation();
        }, 200, attacker.id.includes('nitro') ? 'nitro' : (attacker.id.includes('lydro') ? 'hydro' : 'standard'));
    }
    Renderer.updatePhaseUI();
}

// --- DEBUG & UTILS ---
window.setupTestScenario = () => {
    console.log("SETTING UP TEST SCENARIO");
    gameState.playerTeam[1].pellicle = 5;
    gameState.enemyTeam.forEach(m => m.damage = 0);
    Renderer.renderFormation(getHandlers());
    Renderer.renderEnemyFormation();
    Renderer.updatePhaseUI();
};

function toggleScreen(screen) {
    screen.classList.toggle('hidden');
}

function showMainMenu() {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('main-menu-screen').classList.remove('hidden');
}

function initCellContainer() {
    // Basic Cell Pool Logic
    const grid = document.getElementById('monster-pool-grid');
    if (!grid) return;
    grid.innerHTML = '';
    Object.values(MONSTER_DATABASE).forEach(m => {
        const item = document.createElement('div');
        item.className = 'pool-item';
        item.innerHTML = `<img src="Images/${m.name.replace(/\s+/g, '')}.png"><span>${m.name}</span>`;
        grid.appendChild(item);
    });
}

function handleOsmoticFlow(index) {
    const monster = gameState.playerTeam[index];
    if (gameState.selectedAbilitySourceIndex === null) {
        if (monster.id.includes('lydro')) {
            gameState.selectedAbilitySourceIndex = index;
            Renderer.showGameMessage("Select transfer target", "blue");
            Renderer.renderFormation(getHandlers());
        }
    } else {
        if (gameState.selectedAbilitySourceIndex === index) {
            gameState.selectedAbilitySourceIndex = null;
        } else {
            executeTransfer(gameState.selectedAbilitySourceIndex, index);
            gameState.selectedAbilitySourceIndex = null;
        }
        Renderer.renderFormation(getHandlers());
        Renderer.updatePhaseUI();
    }
}

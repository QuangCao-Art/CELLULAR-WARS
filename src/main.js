import { MONSTER_DATABASE } from './data/monsters.js';
import { gameState, CONSTANTS, createMonsterInstance, resetGameState, getReinforceAmount } from './engine/state.js';
import * as Renderer from './ui/renderer.js';
import * as Animations from './ui/animations.js';
import * as Combat from './engine/combat.js';
import * as AI from './engine/ai.js';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize DOM Selectors in Renderer
    const refs = {
        playerFormation: document.querySelector('.team-formation.player-team'),
        enemyFormation: document.querySelector('.team-formation.enemy-team'),
        gameMessage: document.getElementById('game-message'),
        battleLog: document.getElementById('battle-log'),
        currentPhaseEl: document.getElementById('phase-msg'),
        turnNumberEl: document.querySelector('.turn-counter'),
        instructionMsg: document.getElementById('phase-sub-msg'),
        btnEndReinforce: document.getElementById('btn-end-reinforce'),
        btnEndAction: document.getElementById('btn-end-action'),
        btnEndTurn: document.getElementById('btn-end-turn'),
        infoPanel: document.getElementById('info-panel'),
        mainMenu: document.getElementById('main-menu'),
        battlefield: document.getElementById('game-board'),
        cellContainerScreen: document.getElementById('cell-container-screen'),
        rulebookScreen: document.getElementById('rulebook-screen'),
        databaseScreen: document.getElementById('database-screen')
    };
    Renderer.initializeSelectors(refs);

    // 2. Global Event Bindings
    document.getElementById('btn-start').onclick = startGame;
    document.getElementById('btn-cell-container').onclick = () => {
        refs.mainMenu.classList.add('hidden');
        refs.cellContainerScreen.classList.remove('hidden');
        initCellContainer();
    };
    // Back Buttons (Except Rulebook which has special logic now)
    document.querySelectorAll('.btn-back, #btn-db-back, #btn-battle-back, #btn-container-back').forEach(btn => {
        if (btn) btn.onclick = showMainMenu;
    });

    // Special Rulebook Back Logic
    document.getElementById('btn-rulebook').onclick = () => {
        document.getElementById('btn-rb-back').innerText = "BACK TO MENU";
        toggleScreen(refs.rulebookScreen);
        refs.mainMenu.classList.add('hidden');
    };

    document.getElementById('btn-battle-db').onclick = () => {
        document.getElementById('btn-rb-back').innerText = "BACK TO BATTLE";
        toggleScreen(refs.rulebookScreen);
        refs.battlefield.classList.add('hidden');
    };

    document.getElementById('btn-rb-back').onclick = () => {
        refs.rulebookScreen.classList.add('hidden');
        if (document.getElementById('btn-rb-back').innerText === "BACK TO BATTLE") {
            refs.battlefield.classList.remove('hidden');
        } else {
            showMainMenu();
        }
    };

    refs.btnEndReinforce.onclick = endReinforcePhase;
    refs.btnEndAction.onclick = endActionPhase;
    refs.btnEndTurn.onclick = endTurn;

    // 3. Initialize Global Systems
    initCellContainer();
});

// --- CORE GAME FLOW ---
function startGame() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-board').classList.remove('hidden');

    resetGameState();
    Renderer.renderFormation(getHandlers());
    Renderer.renderEnemyFormation(getHandlers());
    startTurn();
}

function startTurn() {
    gameState.actionTaken = false;
    gameState.specialUsedThisTurn = false;
    gameState.attackUsedThisTurn = false;
    gameState.playerTeam.forEach(m => { m.attackCount = 0; m.hasSwapped = false; m.isLocked = false; });
    gameState.enemyTeam.forEach(m => { m.attackCount = 0; m.hasSwapped = false; m.isLocked = false; });

    if (gameState.isAITurn) {
        AI.runAIReinforce(() => {
            gameState.currentPhase = 'ACTION';
            Renderer.updatePhaseUI();
            setTimeout(() => {
                AI.runAIActionPhase(() => {
                    gameState.currentPhase = 'ATTACK';
                    Renderer.updatePhaseUI();
                    setTimeout(() => AI.runAIAttackPhase(endTurn), 1000);
                });
            }, 1000);
        });
    } else {
        gameState.currentPhase = 'REINFORCE';
        gameState.pelliclePool = getReinforceAmount(false);

        // Restore handlers/listeners that might have been lost during AI rendering
        Renderer.renderFormation(getHandlers());
        Renderer.renderEnemyFormation(getHandlers());

        spawnPellicleTokens();
        Renderer.updatePhaseUI();
    }
}

function endReinforcePhase() {
    if (gameState.currentPhase !== 'REINFORCE' || gameState.isAITurn) return;

    const tokens = document.querySelectorAll('.pellicle-token');
    tokens.forEach(t => t.remove());

    if (gameState.turnNumber === 1) {
        endTurn();
        return;
    }

    gameState.currentPhase = 'ACTION';
    Renderer.updatePhaseUI();
}

function endActionPhase() {
    if (gameState.currentPhase !== 'ACTION' || gameState.isAITurn) return;
    gameState.currentPhase = 'ATTACK';
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
    const container = document.getElementById('pellicle-layer');
    container.innerHTML = '';

    for (let i = 0; i < gameState.pelliclePool; i++) {
        const token = document.createElement('div');
        token.className = 'pellicle-token';
        token.draggable = true;
        token.id = `token-${Date.now()}-${i}`;

        // Randomly choose Left or Right Zone
        const isLeft = Math.random() > 0.5;
        let randomLeft, randomTop;

        if (isLeft) {
            // Left Zone: 5% to 25% horizontal, 50% to 75% vertical
            randomLeft = Math.floor(Math.random() * 20) + 5;
        } else {
            // Right Zone: 75% to 95% horizontal, 50% to 75% vertical
            randomLeft = Math.floor(Math.random() * 20) + 75;
        }
        randomTop = Math.floor(Math.random() * 25) + 50;

        const randomDelay = (Math.random() * 0.5).toFixed(2);

        token.style.left = `${randomLeft}%`;
        token.style.top = `${randomTop}%`;
        token.style.animationDelay = `${randomDelay}s, ${parseFloat(randomDelay) + 0.6}s`;

        // Info Panel Hover
        token.addEventListener('mouseover', () => Renderer.updateInfoPanel('token'));
        token.addEventListener('mouseout', () => Renderer.updateInfoPanel(null));

        token.addEventListener('dragstart', (e) => {
            gameState.isDraggingPellicleFlag = true;
            gameState.isDraggingPlayerFlag = false;
            e.dataTransfer.setData('text/plain', `type:pellicle;id:${token.id}`);
            setTimeout(() => {
                token.style.opacity = '0.3';
                token.style.pointerEvents = 'none'; // Allow drop on slots beneath
            }, 0);
        });

        token.addEventListener('dragend', () => {
            token.style.opacity = '1';
            token.style.pointerEvents = 'auto'; // Restore interaction
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

            // ACCLIMATION RULE (Turn 1): Only Reinforce allowed. No Attacks/Swaps.
            // Exception: Pellicle Trail (Transfer) might be allowed for 2nd player, but here Player is 1st.
            // So Player Phase Turn 1 = Reinforce Only.
            if (gameState.turnNumber === 1 && gameState.currentPhase === 'ACTION') {
                Renderer.showGameMessage("ACCLIMATION: Combat Locked Turn 1!", "red");
                e.preventDefault();
                return;
            }

            const monster = gameState.playerTeam[index];
            const isTransfer = (gameState.currentPhase === 'REINFORCE' && monster.id.includes('cell02') && monster.pellicle > 0);

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
            e.currentTarget.classList.remove('drag-over');
            const rawData = e.dataTransfer.getData('text/plain');
            if (isPlayer) handleDropPlayerSlot(targetIndex, rawData);
            else handleDropEnemySlot(targetIndex, rawData);
        },
        handleMonsterClick: (index) => {
            if (gameState.isAITurn || gameState.currentPhase !== 'ACTION') return;

            // If an ability selection is in progress, route to target handler
            if (gameState.selectedAbilitySourceIndex !== null) {
                handleOsmoticFlow(index);
                return;
            }

            activateSpecialAbility(index);
        },
        handleMouseEnter: (monster) => Renderer.updateInfoPanel(monster),
        handleMouseLeave: () => Renderer.updateInfoPanel(null)
    };
}

function activateSpecialAbility(index) {
    if (gameState.currentPhase !== 'ACTION' || gameState.isAITurn || gameState.specialUsedThisTurn) return;
    const monster = gameState.playerTeam[index];
    if (!monster || monster.isDead || monster.specialUsed) return;

    // Cambihil (cell01): Energy Burst (+2P)
    if (monster.id.includes('cell01')) {
        monster.pellicle = Math.min(monster.max, monster.pellicle + 2);
        monster.specialUsed = true;
        gameState.specialUsedThisTurn = true;
        Renderer.showGameMessage(`${monster.name}: ENERGY BURST! +2P`, "green");
        Renderer.triggerVisualEffect(index, true, 'ability-activation');
        Renderer.renderFormation(getHandlers());
        Renderer.updatePhaseUI();
        updateBattleLog(`${monster.name} activated Energy Burst!`);
    } else if (monster.id.includes('cell02')) {
        handleOsmoticFlow(index);
    } else {
        Renderer.showGameMessage("No active ability found.", "gray");
    }
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
        console.log("Drop on enemy slot:", enemyIndex, "rawData:", rawData);
        const sourceIndex = parseInt(rawData.split('index:')[1]);
        if (enemyIndex < 3) {
            console.log("Calling triggerCombatSequence with:", sourceIndex, enemyIndex);
            triggerCombatSequence(sourceIndex, enemyIndex);
        } else {
            console.log("Enemy slot is a reserve slot:", enemyIndex);
            Renderer.showGameMessage("Reserves are out of reach!", "red");
        }
    }
}

function addPellicleFromDrag(index, tokenId) {
    if (index >= 3) { Renderer.showGameMessage("Reserves can't be reinforced!", "red"); return; }
    const monster = gameState.playerTeam[index];
    if (monster.isDead) { Renderer.showGameMessage("Dead monsters can't be reinforced!", "red"); return; }
    const isCano = monster.id.includes('cell01');
    const amount = 1; // Standard amount for all, no more bonus for Canobolus

    const overloadLimit = monster.max + 1;
    if (monster.pellicle + amount >= overloadLimit) {
        gameState.pelliclePool--;
        Combat.triggerExplosion(gameState.playerTeam, index);
        Renderer.updatePhaseUI(); // Ensure UI updates even if explosion
    } else {
        monster.pellicle += amount;
        gameState.pelliclePool--;
        const tokenEl = document.getElementById(tokenId);

        // Immediate fallback if token missing or animation fails
        if (!tokenEl) {
            Renderer.triggerVisualEffect(index, true, 'power-up');
            Renderer.renderFormation(getHandlers());
            Renderer.updatePhaseUI();
            return;
        }

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
    if (monster.isDead) { Renderer.showGameMessage("This monster is OUT!", "red"); return; }
    const overloadLimit = monster.max + 1;
    if (monster.pellicle + 1 >= overloadLimit) {
        gameState.pelliclePool--;
        Combat.triggerExplosion(gameState.enemyTeam, index);
    } else {
        monster.pellicle += 1;
        gameState.pelliclePool--;
        const tokenEl = document.getElementById(tokenId);

        if (!tokenEl) {
            Renderer.renderEnemyFormation(getHandlers());
            Renderer.updatePhaseUI();
            return;
        }

        Animations.animatePellicleToMonster(tokenEl, index, () => {
            Renderer.renderEnemyFormation(getHandlers());
        }, false);
    }
    Renderer.updatePhaseUI();
}

function executeSwap(sIdx, tIdx) {
    if (gameState.attackUsedThisTurn) { Renderer.showGameMessage("Action already taken!", "red"); return; }

    // Tactic Switch Check
    const isTacticSwitch = (sIdx < 3 !== tIdx < 3);
    const temp = gameState.playerTeam[sIdx];
    gameState.playerTeam[sIdx] = gameState.playerTeam[tIdx];
    gameState.playerTeam[tIdx] = temp;

    if (isTacticSwitch) {
        gameState.attackUsedThisTurn = true;
        gameState.actionTaken = true;
    }
    Renderer.renderFormation(getHandlers());
    Renderer.updatePhaseUI();
    Combat.checkVanguardHealth();
}

function executeTransfer(sIdx, tIdx) {
    if (gameState.specialUsedThisTurn) return;
    const source = gameState.playerTeam[sIdx];
    const target = gameState.playerTeam[tIdx];
    if (tIdx >= 3 || target.isDead || target.pellicle >= target.max) return;
    if (source.pellicle <= 0) {
        Renderer.showGameMessage("No Pellicle to transfer!", "red");
        return;
    }

    source.pellicle = Math.max(0, source.pellicle - 1);
    target.pellicle = Math.min(target.max, target.pellicle + 1);
    gameState.specialUsedThisTurn = true;
    Renderer.triggerVisualEffect(sIdx, true, 'ability-activation');
    Renderer.triggerVisualEffect(tIdx, true, 'ability-activation');
    Renderer.renderFormation(getHandlers());
    Renderer.updatePhaseUI();
}

function triggerCombatSequence(aIdx, vIdx) {
    console.log("triggerCombatSequence started:", { aIdx, vIdx });
    const attacker = gameState.playerTeam[aIdx];
    const victim = gameState.enemyTeam[vIdx];
    console.log("Attacker:", attacker, "Victim:", victim);

    if (gameState.currentPhase !== 'ATTACK') {
        Renderer.showGameMessage("Attack in Attack Phase!", "blue");
        return;
    }
    if (gameState.attackUsedThisTurn) {
        console.log("Combat aborted: attackUsedThisTurn is true");
        return;
    }
    if (attacker.attackCount > 0) {
        console.log("Combat aborted: attacker.attackCount > 0");
        return;
    }

    if (attacker.isLocked) {
        Renderer.showGameMessage(`${attacker.name} is LOCKED and cannot act!`, "blue");
        return;
    }

    // Check Vanguard Barrier
    if (vIdx !== 0 && !gameState.enemyTeam[0].isDead && !attacker.id.includes('cell02')) {
        console.log("Combat aborted: Vanguard barrier active");
        Renderer.showGameMessage("Eliminate Vanguard first!", "red");
        return;
    }

    let cost = attacker.id.includes('cell011') ? attacker.pellicle : (attacker.id.includes('cell02') ? 2 : 1);
    console.log("Combat cost calculated:", cost, "Attacker pellicle:", attacker.pellicle);
    if (attacker.pellicle < cost) {
        console.log("Combat aborted: Insufficient pellicle");
        Renderer.showGameMessage("Insufficient Pellicle!", "red");
        return;
    }

    attacker.attackCount++;
    gameState.attackUsedThisTurn = true;
    gameState.actionTaken = true; // Still keep for compatibility for now
    Renderer.updatePhaseUI();

    if (attacker.id.includes('cell011')) {
        const count = attacker.pellicle;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (attacker.isDead || attacker.pellicle <= 0 || victim.isDead) return;
                attacker.pellicle--;
                Renderer.renderFormation(getHandlers());
                Animations.triggerProjectile(aIdx, vIdx, true, () => {
                    Combat.resolveHit(victim, vIdx, gameState.enemyTeam, attacker, aIdx, gameState.playerTeam, 'heavy', null, () => {
                        Renderer.renderEnemyFormation(getHandlers());
                        Combat.checkGameOver();
                    });
                }, 100);
            }, i * 80);
        }
    } else if (attacker.id.includes('cell04')) {
        // PHAGOBURST: TRIPLE POP (3 SHOTS)
        attacker.pellicle -= 2;
        Renderer.renderFormation(getHandlers());
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                if (attacker.isDead || victim.isDead) return;
                Animations.triggerProjectile(aIdx, vIdx, true, () => {
                    Combat.resolveHit(victim, vIdx, gameState.enemyTeam, attacker, aIdx, gameState.playerTeam, 'light', null, () => {
                        Renderer.renderEnemyFormation(getHandlers());
                        Combat.checkGameOver();
                    });
                }, 100);
            }, i * 200);
        }
    } else {
        attacker.pellicle -= cost;
        Renderer.renderFormation(getHandlers());
        Animations.triggerProjectile(aIdx, vIdx, true, () => {
            Combat.resolveHit(victim, vIdx, gameState.enemyTeam, attacker, aIdx, gameState.playerTeam, 'heavy', null, () => {
                // MITONEGY: Auto-Repair (Heal lowest ally)
                if (attacker.id.includes('cell07')) {
                    const allies = gameState.playerTeam.filter((m, i) => !m.isDead && i < 3);
                    if (allies.length > 0) {
                        let lowestP = Math.min(...allies.map(m => m.pellicle));
                        let candidates = allies.filter(m => m.pellicle === lowestP);
                        let target = candidates[Math.floor(Math.random() * candidates.length)];
                        target.pellicle = Math.min(target.max, target.pellicle + 1);
                        Renderer.showGameMessage(`Auto-Repair: ${target.name} healed!`, "green");
                        Renderer.triggerVisualEffect(gameState.playerTeam.indexOf(target), true, 'power-up');
                    }
                }

                // CHLAROB: Quick Rob (Steal 1P)
                if (attacker.id.includes('cell08')) {
                    attacker.pellicle = Math.min(attacker.max, attacker.pellicle + 1);
                    Renderer.showGameMessage(`${attacker.name} stole 1 Pellicle!`, "green");
                    Renderer.triggerVisualEffect(aIdx, true, 'power-up');
                }

                setTimeout(() => {
                    Renderer.renderEnemyFormation(getHandlers());
                    Renderer.renderFormation(getHandlers());
                    Combat.checkGameOver();
                }, 600);
            });
        }, 375, attacker.id.includes('cell03') ? 'nitro' : (attacker.id.includes('cell02') ? 'hydro' : 'standard'));
    }
    Renderer.updatePhaseUI();
}

// --- DEBUG & UTILS ---
window.setupTestScenario = () => {
    console.log("SETTING UP TEST SCENARIO");
    gameState.playerTeam[1].pellicle = 5;
    gameState.enemyTeam.forEach(m => m.damage = 0);
    Renderer.renderFormation(getHandlers());
    Renderer.renderEnemyFormation(getHandlers());
    Renderer.updatePhaseUI();
};

function toggleScreen(screen) {
    screen.classList.toggle('hidden');
}

function showMainMenu() {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const mainMenu = document.getElementById('main-menu');
    if (mainMenu) mainMenu.classList.remove('hidden');
}

function initCellContainer() {
    // Basic Cell Pool Logic
    const grid = document.getElementById('monster-pool-grid');
    if (!grid) return;
    grid.innerHTML = '';
    Object.values(MONSTER_DATABASE).forEach(m => {
        const item = document.createElement('div');
        item.className = 'pool-item';
        item.draggable = true;
        item.dataset.id = m.id;
        item.ondragstart = (e) => handlePoolDragStart(e, m.id);
        item.innerHTML = `<img src="Images/${m.name.replace(/\s+/g, '')}.png"><span>${m.name}</span>`;
        grid.appendChild(item);
    });

    // Populate Active Squad
    // Populate Active Squad
    const squadSlots = document.querySelectorAll('.loadout-slot');
    squadSlots.forEach(slot => {
        const index = parseInt(slot.dataset.slot);

        // Add Drag Handlers for Slots
        slot.ondragover = (e) => e.preventDefault();
        slot.ondragenter = (e) => {
            e.preventDefault();
            slot.classList.add('drag-target-glow');
        };
        slot.ondragleave = (e) => {
            // Fix flickering: only remove if we are truly leaving the slot container
            if (!slot.contains(e.relatedTarget)) {
                slot.classList.remove('drag-target-glow');
            }
        };
        slot.ondrop = (e) => handleSquadDrop(e, index);

        const content = slot.querySelector('.slot-content');

        // Determine ID: Use active team if valid, otherwise fallback to saved config
        let dbId = null;
        if (gameState.playerTeam[index]) {
            dbId = gameState.playerTeam[index].id;
        } else if (gameState.savedSquadConfig[index]) {
            dbId = gameState.savedSquadConfig[index];
        }

        if (dbId && content) {
            // Player IDs might have 'id_' prefix in some contexts, or e_ prefix
            const cleanId = dbId.replace('e_', '');
            const template = MONSTER_DATABASE[cleanId];
            if (template) {
                slot.dataset.id = template.id;
                content.innerHTML = `<img src="Images/${template.name.replace(/\s+/g, '')}.png" class="squad-img">`;
            }
        }
    });

    // Wire Confirm Button
    const btnSave = document.getElementById('btn-loadout-save');
    if (btnSave) btnSave.onclick = showMainMenu;

    // --- NEW: HOVER TOOLTIP & CLICK MODAL LOGIC ---
    const tooltip = document.getElementById('loadout-tooltip');
    const modal = document.getElementById('loadout-modal');

    const showTooltip = (e, dbId) => {
        const monster = MONSTER_DATABASE[dbId];
        if (!monster || !tooltip) return;

        document.getElementById('lt-name').innerText = monster.name;
        document.getElementById('lt-offensive').innerText = monster.offensiveTrail;
        document.getElementById('lt-pellicle').innerText = monster.pellicleTrail;

        tooltip.classList.remove('hidden');
        tooltip.style.left = (e.clientX + 15) + 'px';
        tooltip.style.top = (e.clientY + 15) + 'px';
    };

    const hideTooltip = () => tooltip?.classList.add('hidden');

    const openModal = (dbId) => {
        const monster = MONSTER_DATABASE[dbId];
        if (!monster || !modal) return;

        document.getElementById('lm-img').src = `Images/${monster.name.replace(/\s+/g, '')}.png`;
        document.getElementById('lm-title').innerText = monster.name.toUpperCase();
        document.getElementById('lm-attack').innerText = monster.offensiveTrail;
        document.getElementById('lm-passive').innerText = monster.pellicleTrail;

        // Add info bio if available
        let bioEl = document.getElementById('lm-bio');
        if (!bioEl) {
            bioEl = document.createElement('p');
            bioEl.id = 'lm-bio';
            bioEl.style.fontSize = '1.0rem';
            bioEl.style.color = 'rgba(255,255,255,0.6)';
            bioEl.style.marginTop = '20px';
            bioEl.style.fontStyle = 'italic';
            document.querySelector('.modal-body').appendChild(bioEl);
        }
        bioEl.innerText = monster.info || "";

        modal.classList.remove('hidden');
        hideTooltip();
    };

    const closeModal = () => modal?.classList.add('hidden');

    // UI Listeners for Pool and Squad
    const cards = document.querySelectorAll('.pool-item, .loadout-slot');
    cards.forEach(card => {
        card.addEventListener('mouseenter', (e) => {
            const dbId = card.dataset.id;
            if (dbId) showTooltip(e, dbId.replace('e_', ''));
        });

        card.addEventListener('mousemove', (e) => {
            if (!tooltip.classList.contains('hidden')) {
                tooltip.style.left = (e.clientX + 15) + 'px';
                tooltip.style.top = (e.clientY + 15) + 'px';
            }
        });

        card.addEventListener('mouseleave', hideTooltip);

        card.addEventListener('click', (e) => {
            const dbId = card.dataset.id;
            if (dbId) openModal(dbId.replace('e_', ''));
        });
    });

    // Modal Close Logic
    const closeBtn = document.querySelector('.modal-close');
    const modalBg = document.getElementById('loadout-modal-bg');
    if (closeBtn) closeBtn.onclick = closeModal;
    if (modalBg) modalBg.onclick = closeModal;
}

function handlePoolDragStart(e, dbId) {
    e.dataTransfer.setData('text/plain', `type:new-squad-member;id:${dbId}`);
}

function handleSquadDrop(e, slotIndex) {
    e.preventDefault();
    // Clean visual state
    const slots = document.querySelectorAll('.loadout-slot');
    slots.forEach(s => s.classList.remove('drag-target-glow'));

    const rawData = e.dataTransfer.getData('text/plain');
    if (!rawData.includes('type:new-squad-member')) return;

    const newDbId = rawData.split('id:')[1];

    // Validate Max 2 duplicates
    // Create temp config to check rule
    const tempConfig = [...gameState.savedSquadConfig];
    tempConfig[slotIndex] = newDbId;

    const count = tempConfig.filter(id => id === newDbId).length;
    if (count > 2) {
        const msgEl = document.getElementById('loadout-msg');
        if (msgEl) {
            msgEl.innerText = "MAX 2 DUPLICATES ALLOWED!";
            msgEl.style.color = "var(--neon-red)";
            setTimeout(() => {
                msgEl.innerText = "Drag a monster to a slot.";
                msgEl.style.color = "var(--text-dim)";
            }, 2000);
        }
        return;
    }

    // Apply Change
    gameState.savedSquadConfig[slotIndex] = newDbId;

    // Update Slot UI
    initCellContainer();

    // Feedback
    const msgEl = document.getElementById('loadout-msg');
    if (msgEl) {
        msgEl.innerText = "SQUAD UPDATED!";
        msgEl.style.color = "var(--neon-green)";
        setTimeout(() => {
            msgEl.innerText = "Drag a monster to a slot.";
            msgEl.style.color = "var(--text-dim)";
        }, 1500);
    }
}

function handleOsmoticFlow(index) {
    const monster = gameState.playerTeam[index];
    if (gameState.selectedAbilitySourceIndex === null) {
        if (monster.id.includes('cell02')) {
            gameState.selectedAbilitySourceIndex = index;
            Renderer.triggerVisualEffect(index, true, 'ability-activation');
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

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT REFERENCES ---
    const mainMenu = document.getElementById('main-menu');
    const gameBoard = document.getElementById('game-board');
    const startBtn = document.getElementById('btn-start');
    const rotateBtn = document.getElementById('btn-rotate');
    const turnCounter = document.querySelector('.turn-counter');

    // New UI Elements
    const reinforceZone = document.getElementById('reinforce-zone');
    const pellicleSource = document.getElementById('pellicle-source');
    const poolCounter = document.querySelector('.pool-counter');
    const phaseMsg = document.getElementById('phase-msg');
    const phaseSubMsg = document.getElementById('phase-sub-msg');
    const endTurnBtn = document.getElementById('end-turn-btn');
    const startActionBtn = document.getElementById('start-action-btn');
    const databaseScreen = document.getElementById('database-screen');
    const btnCollection = document.getElementById('btn-collection');
    const btnDbBack = document.getElementById('btn-db-back');
    const btnBattleBack = document.getElementById('btn-battle-back');
    const btnBattleDb = document.getElementById('btn-battle-db');
    const rulebookScreen = document.getElementById('rulebook-screen');
    const btnRulebook = document.getElementById('btn-db-rulebook');
    const btnRbBack = document.getElementById('btn-rb-back');

    // Tooltip Elements
    const tooltip = document.getElementById('ability-tooltip');
    const tooltipName = document.getElementById('tooltip-name');
    const tooltipAttack = document.getElementById('tooltip-attack');
    const tooltipPassive = document.getElementById('tooltip-passive');

    // Battle Log Element
    const battleLog = document.getElementById('battle-log');

    // PRELOAD DRAG IMAGE (Reference DOM element directly for reliable sizing)
    const attackDragIcon = document.getElementById('drag-attack-icon');

    // --- GAME CONSTANTS ---
    const MAX_PELLICLE = 5;
    const REINFORCE_AMOUNT = 2;
    const ATTACK_COST = 1;

    // --- GAME STATE ---

    // PLAYER TEAM
    let playerTeam = [
        {
            id: 'nitro', name: 'Nitrophil', pellicle: 1, max: 5, hasSwapped: false, attackCount: 0, isDead: false,
            ability: {
                attack: "Nitro Blast (2P): Destroy 1 Pellicle + splash 1 damage to neighbors.",
                passive: "Reactive Membrane: Reflect 1 damage to attacker when hit."
            }
        },
        {
            id: 'lydro', name: 'Lydrosome', pellicle: 1, max: 5, hasSwapped: false, attackCount: 0, isDead: false,
            ability: {
                attack: "Hydro Shot (2P): Bypass Vanguard to hit Wings directly.",
                passive: "Osmotic Flow: Transfer Pellicles to allies during Reinforce Phase."
            }
        },
        {
            id: 'cano', name: 'Canobolus', pellicle: 1, max: 5, hasSwapped: false, attackCount: 0, isDead: false,
            ability: {
                attack: "Ballistic Volley (XP): Burn all X Pellicles to destroy X enemy Pellicles.",
                passive: "Root Synergy: Receive +1 bonus Pellicle when reinforced."
            }
        }
    ];

    // ENEMY TEAM
    let enemyTeam = [
        {
            id: 'e_nitro', name: 'Nitrophil', pellicle: 1, max: 5, isDead: false,
            ability: {
                attack: "Nitro Blast (2P): Destroy 1 Pellicle + splash 1 damage to neighbors.",
                passive: "Reactive Membrane: Reflect 1 damage to attacker when hit."
            }
        },
        {
            id: 'e_lydro', name: 'Lydrosome', pellicle: 1, max: 5, isDead: false,
            ability: {
                attack: "Hydro Shot (2P): Bypass Vanguard to hit Wings directly.",
                passive: "Osmotic Flow: Transfer Pellicles to allies during Reinforce Phase."
            }
        },
        {
            id: 'e_cano', name: 'Canobolus', pellicle: 1, max: 5, isDead: false,
            ability: {
                attack: "Ballistic Volley (XP): Burn all X Pellicles to destroy X enemy Pellicles.",
                passive: "Root Synergy: Receive +1 bonus Pellicle when reinforced."
            }
        }
    ];

    let currentPhase = 'REINFORCE'; // PHASES: REINFORCE, ACTION
    let lastAnnouncedPhase = ''; // To track phase changes for animation
    let pelliclePool = 0;
    let turnNumber = 1;
    let isAITurn = false; // Tracks if the AI is currently moving
    let previousScreen = 'main-menu'; // Tracks where to return from Database screen
    let actionTaken = false; // Tracks if an action (move or attack) was taken this turn
    let isGameOver = false; // Prevents further actions after game ends

    // Drag State (GLOBAL FLAGS - EXTREMELY ROBUST)
    let draggedIndex = null;
    let isDraggingPlayerFlag = false;
    let isDraggingPellicleFlag = false;

    // Ability State
    let selectedAbilitySourceIndex = null; // For Click-to-Activate abilities

    // --- UTILS: BATTLE LOG ---
    function updateBattleLog(message) {
        if (!battleLog) return;
        battleLog.innerText = message.toUpperCase();

        // Trigger small animation reset
        battleLog.style.animation = 'none';
        void battleLog.offsetWidth; // trigger reflow
        battleLog.style.animation = 'log-fade-in 0.5s ease-out';
    }

    function initGame() {
        console.log("Initializing Game UI...");
        if (rotateBtn) rotateBtn.style.display = 'none';

        updateUI();
        bindSlotDropZones();
        bindEnemyDropZones();
    }

    // --- BUTTON EVENT LISTENERS (BOUND ONCE) ---
    if (endTurnBtn) {
        endTurnBtn.addEventListener('click', () => {
            if (isGameOver) return;
            updateBattleLog("PLAYER ENDS TURN MANUALLY");
            endTurn();
        });
    }

    if (startActionBtn) {
        startActionBtn.addEventListener('click', () => {
            if (isGameOver) return;

            if (turnNumber === 1) {
                // Skip Action Phase directly to End Turn (Silent & Immediate)
                endReinforcePhase(); // Transition state
                endTurn();
            } else {
                updateBattleLog("PLAYER STARTS ACTION PHASE MANUALLY");
                endReinforcePhase();
            }
        });
    }

    function resetGameState() {
        console.log("Resetting Game State...");
        isGameOver = false;
        turnNumber = 1;
        pelliclePool = 0;
        actionTaken = false;
        isAITurn = false;
        currentPhase = 'REINFORCE';
        lastAnnouncedPhase = '';

        // Reset Teams (restore initial stats)
        playerTeam = [
            {
                id: 'nitro', name: 'Nitrophil', pellicle: 1, max: 5, hasSwapped: false, attackCount: 0, isDead: false,
                ability: {
                    attack: "Nitro Blast (2P): Destroy 1 Pellicle + splash 1 damage to neighbors.",
                    passive: "Reactive Membrane: Reflect 1 damage to attacker when hit."
                }
            },
            {
                id: 'lydro', name: 'Lydrosome', pellicle: 1, max: 5, hasSwapped: false, attackCount: 0, isDead: false,
                ability: {
                    attack: "Hydro Shot (2P): Bypass Vanguard to hit Wings directly.",
                    passive: "Osmotic Flow: Transfer Pellicles to allies during Reinforce Phase."
                }
            },
            {
                id: 'cano', name: 'Canobolus', pellicle: 1, max: 5, hasSwapped: false, attackCount: 0, isDead: false,
                ability: {
                    attack: "Ballistic Volley (XP): Burn all X Pellicles to destroy X enemy Pellicles.",
                    passive: "Root Synergy: Receive +1 bonus Pellicle when reinforced."
                }
            }
        ];

        enemyTeam = [
            {
                id: 'e_nitro', name: 'Nitrophil', pellicle: 1, max: 5, isDead: false,
                ability: {
                    attack: "Nitro Blast (2P): Destroy 1 Pellicle + splash 1 damage to neighbors.",
                    passive: "Reactive Membrane: Reflect 1 damage to attacker when hit."
                }
            },
            {
                id: 'e_lydro', name: 'Lydrosome', pellicle: 1, max: 5, isDead: false,
                ability: {
                    attack: "Hydro Shot (2P): Bypass Vanguard to hit Wings directly.",
                    passive: "Osmotic Flow: Transfer Pellicles to allies during Reinforce Phase."
                }
            },
            {
                id: 'e_cano', name: 'Canobolus', pellicle: 1, max: 5, isDead: false,
                ability: {
                    attack: "Ballistic Volley (XP): Burn all X Pellicles to destroy X enemy Pellicles.",
                    passive: "Root Synergy: Receive +1 bonus Pellicle when reinforced."
                }
            }
        ];

        updateBattleLog("WAITING FOR ACTION...");
    }

    // --- UTILS: SPAWN TOKENS ---
    function spawnPellicleTokens(count) {
        const layer = document.getElementById('pellicle-layer');
        if (!layer) return;

        // Clear existing tokens
        layer.innerHTML = '';

        const layerWidth = layer.offsetWidth;
        const layerHeight = layer.offsetHeight;

        for (let i = 0; i < count; i++) {
            const token = document.createElement('div');
            token.classList.add('pellicle-token');
            token.draggable = true;
            token.style.pointerEvents = 'auto'; // Re-enable pointer events on the token itself
            token.id = `pellicle-token-${i}`;

            // SPAWN POSITIONING
            // We want tokens to appear on the left and right sides of the battlefield
            // focusing on the bottom half where the player is.
            const side = (i % 2 === 0) ? -1 : 1; // -1 Left, 1 Right

            let x, y;
            const xOffset = Math.random() * 60 + 40; // 40-100px from edge

            if (side === -1) {
                x = xOffset;
            } else {
                x = layerWidth - xOffset - 70; // 70 is token width
            }

            // Y: Mostly in the bottom half (Player area)
            // Battlefield height is roughly split 40/20/40. 
            // We'll target 60% to 90% height range.
            y = (layerHeight * 0.6) + (Math.random() * layerHeight * 0.3);

            token.style.left = `${x}px`;
            token.style.top = `${y}px`;

            // RANDOM DELAY
            token.style.animationDelay = `${i * 0.1}s, ${0.6 + Math.random() * 0.5}s`;

            // DRAG EVENTS
            token.addEventListener('dragstart', (e) => {
                if (currentPhase !== 'REINFORCE' || isAITurn) {
                    e.preventDefault();
                    return;
                }
                isDraggingPellicleFlag = true;
                isDraggingPlayerFlag = false;
                e.dataTransfer.effectAllowed = 'copyMove';
                e.dataTransfer.setData('text/plain', `type:pellicle;id:${token.id}`);
                token.style.opacity = '0.5';
            });

            token.addEventListener('dragend', (e) => {
                isDraggingPellicleFlag = false;
                token.style.opacity = '1';
                // If consumed, it is removed in drop handler
            });

            // TOUCH EVENTS
            token.addEventListener('touchstart', (e) => handleTouchStart(e, i, 'pellicle'), { passive: false });
            token.addEventListener('touchmove', handleTouchMove, { passive: false });
            token.addEventListener('touchend', handleTouchEnd, { passive: false });

            layer.appendChild(token);
        }
    }

    // --- CORE MECHANICS ---

    // 1. REINFORCE LOGIC
    function checkLastStand(team) {
        let livingCount = 0;
        team.forEach(m => { if (!m.isDead) livingCount++; });
        return (livingCount === 1);
    }

    function startReinforcePhase() {
        currentPhase = 'REINFORCE';

        // LAST STAND CHECK
        const isLastStand = checkLastStand(playerTeam);
        if (isLastStand) {
            pelliclePool = 3; // Bonus for survivor
            showGameMessage("LAST STAND ACTIVE!", "red");
        } else {
            pelliclePool = REINFORCE_AMOUNT;
        }

        // RESET TURN FLAGS
        playerTeam.forEach(m => {
            m.hasSwapped = false;
            m.attackCount = 0; // Reset counter
        });

        actionTaken = false; // Reset team action flag

        updateTurnIndicator();
        updateTurnIndicator();
        updatePhaseUI();

        // SPAWN PELLICLE TOKENS
        spawnPellicleTokens(pelliclePool);

        updateBattleLog(isLastStand ? "LAST STAND: +3 PELLICLE GENERATED" : `REINFORCE PHASE: +${pelliclePool} PELLICLE GENERATED`);
    }

    function endReinforcePhase() {
        currentPhase = 'ACTION';
        selectedAbilitySourceIndex = null; // Clear selection

        // Remove unused tokens
        document.querySelectorAll('.pellicle-token').forEach(el => el.remove());

        updateTurnIndicator();
        updatePhaseUI();
    }

    function endTurn() {
        if (!isAITurn) {
            // Player ended turn -> AI Turn
            isAITurn = true;
            runAITurn();
        } else {
            // AI ended turn -> Player Turn (Next Turn Number)
            isAITurn = false;
            turnNumber++;
            startReinforcePhase();
        }
    }

    // --- AI LOGIC ---
    async function runAITurn() {
        // AI orchestrator with delays for "thinking" feel
        currentPhase = 'REINFORCE';
        updatePhaseUI();
        updateTurnIndicator();

        await new Promise(r => setTimeout(r, 1500));
        runAIReinforce();

        await new Promise(r => setTimeout(r, 1500));
        currentPhase = 'ACTION';
        updatePhaseUI();

        await new Promise(r => setTimeout(r, 1500));
        runAIAction();
    }

    async function runAIReinforce() {
        // AI - VISUAL REINFORCEMENT LOGIC
        let availablePP = REINFORCE_AMOUNT;

        // Loop with delay for animation
        for (let i = 0; i < availablePP; i++) {
            const livingEnemies = enemyTeam.filter(m => !m.isDead);
            if (livingEnemies.length === 0) break;

            // AI LOGIC: Priority Vanguard (0) < 3, else Random
            let target;
            const vanguard = enemyTeam[0];
            if (!vanguard.isDead && vanguard.pellicle < 3) {
                target = vanguard;
            } else {
                target = livingEnemies[Math.floor(Math.random() * livingEnemies.length)];
            }

            if (target.pellicle < target.max) {
                const targetIndex = enemyTeam.indexOf(target);

                // 1. CREATE GHOST TOKEN (Visual Only)
                const ghostToken = document.createElement('div');
                ghostToken.classList.add('pellicle-token');

                // CRITICAL FIX: Disable CSS "falling" animation immediately
                ghostToken.style.animation = 'none';

                // FORCE FIXED POSITIONING with EXPLICIT PIXELS
                // Calculate start position: Top Center, Off-screen
                const startX = window.innerWidth / 2;
                const startY = -100; // 100px above screen

                ghostToken.style.position = 'fixed';
                ghostToken.style.left = `${startX}px`;
                ghostToken.style.top = `${startY}px`;
                ghostToken.style.zIndex = '10000';

                document.body.appendChild(ghostToken);

                // 2. WAIT FOR ANIMATION
                await new Promise(resolve => {
                    animatePellicleToMonster(ghostToken, targetIndex, () => {
                        // 3. APPLY EFFECT ON ARRIVAL
                        const gain = target.id.includes('cano') ? 2 : 1; // AI Cano Bonus? Logic implies 1 per loop usually but keep existing rule
                        // Actually loop is 1 by 1, so existing logic `target.pellicle += gain` might over-pump if gain is 2. 
                        // But `availablePP` counts down by 1. Keep consistent with previous logic.
                        // Previous logic: `target.pellicle += gain; availablePP--` 
                        // Logic check: if `gain` is 2, does it cost 1 PP from pool? Yes in previous code.
                        // So AI gets free extra point? Yes. Preserving that behavior.

                        target.pellicle += gain;
                        if (target.pellicle > target.max) target.pellicle = target.max;

                        updateBattleLog(`AI: ${target.name} absorbs Pellicle`);
                        triggerVisualEffect(targetIndex, false, 'power-up');
                        renderEnemyFormation();
                        resolve();
                    }, false); // isPlayer = false
                });
            } else {
                // Optimization: If picked full target, try one more random pick or just skip to save time?
                // Simple: just skip iteration effectively wasting a "thought" but conserving PP? 
                // Previous code broke loop. Let's just break for safety or continue to try finding another.
                // Better: Filter for non-full enemies at start of loop? 
                // To keep it simple and robust like before:
                break;
            }
        }
        renderEnemyFormation();
    }

    function runAIAction() {
        // AI action logic with full ability support
        const livingAI = enemyTeam.filter(m => !m.isDead && m.pellicle > 0);
        if (livingAI.length === 0) {
            setTimeout(() => endTurn(), 1000);
            return;
        }

        // Pick an attacker (Prefer one with most Pellicles)
        const attacker = livingAI.sort((a, b) => b.pellicle - a.pellicle)[0];
        const attackerIdx = enemyTeam.indexOf(attacker);

        // Pick a victim based on attacker type
        const livingPlayer = playerTeam.filter(m => !m.isDead);
        if (livingPlayer.length === 0) {
            setTimeout(() => endTurn(), 1000);
            return;
        }

        let victimIdx = 0; // Default: Vanguard
        let useAbility = false;

        // CANOBOLUS: Ballistic Volley (use if 3+ pellicles)
        if (attacker.id.includes('cano') && attacker.pellicle >= 3) {
            // Target vanguard or random living monster
            if (!playerTeam[0].isDead) {
                victimIdx = 0;
            } else {
                const wings = livingPlayer.map(m => playerTeam.indexOf(m));
                victimIdx = wings[Math.floor(Math.random() * wings.length)];
            }

            const count = attacker.pellicle;
            updateBattleLog(`AI: ${attacker.name} FIRES BALLISTIC VOLLEY (${count} SHOTS)`);

            // Fire volley
            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    if (!attacker.isDead && attacker.pellicle > 0) {
                        attacker.pellicle -= 1;
                        renderEnemyFormation();
                    }

                    triggerProjectile(attackerIdx, victimIdx, false, () => {
                        resolveHit(playerTeam[victimIdx], victimIdx, playerTeam, attacker, attackerIdx, enemyTeam);
                        renderFormation();
                        renderEnemyFormation();
                    }, 100);
                }, i * 80);
            }

            setTimeout(() => endTurn(), count * 80 + 1000);
            return;
        }

        // LYDROSOME: Hydro Shot (bypass vanguard if it's strong)
        if (attacker.id.includes('lydro') && attacker.pellicle >= 2) {
            // Bypass vanguard if it has 3+ pellicles and wings are available
            if (playerTeam[0].pellicle >= 3 && (livingPlayer.length > 1)) {
                const wings = livingPlayer.filter(m => playerTeam.indexOf(m) !== 0);
                if (wings.length > 0) {
                    victimIdx = playerTeam.indexOf(wings[Math.floor(Math.random() * wings.length)]);
                    useAbility = true;
                }
            } else if (playerTeam[0].isDead) {
                // Vanguard is dead, target wings
                const wings = livingPlayer.map(m => playerTeam.indexOf(m));
                victimIdx = wings[Math.floor(Math.random() * wings.length)];
                useAbility = true;
            }

            if (useAbility || attacker.pellicle >= 2) {
                attacker.pellicle -= 2;
                renderEnemyFormation();

                triggerProjectile(attackerIdx, victimIdx, false, () => {
                    updateBattleLog(`AI: ${attacker.name} USES HYDRO SHOT!`);
                    resolveHit(playerTeam[victimIdx], victimIdx, playerTeam, attacker, attackerIdx, enemyTeam);
                    renderFormation();
                    setTimeout(() => endTurn(), 1000);
                }, 200);
                return;
            }
        }

        // NITROPHIL: Nitro Blast (splash damage)
        if (attacker.id.includes('nitro') && attacker.pellicle >= 2) {
            // Prefer vanguard for splash to neighbors
            victimIdx = 0;
            if (playerTeam[0].isDead && livingPlayer.length > 0) {
                // If vanguard dead, target a wing (splash to other wing)
                const wings = livingPlayer.map(m => playerTeam.indexOf(m));
                victimIdx = wings[Math.floor(Math.random() * wings.length)];
            }

            attacker.pellicle -= 2;
            renderEnemyFormation();

            triggerProjectile(attackerIdx, victimIdx, false, () => {
                updateBattleLog(`AI: ${attacker.name} USES NITRO BLAST!`);
                resolveHit(playerTeam[victimIdx], victimIdx, playerTeam, attacker, attackerIdx, enemyTeam);

                // SPLASH DAMAGE
                let neighbors = (victimIdx === 0) ? [1, 2] : [0];
                const splashIdx = getBestSplashTarget(neighbors, playerTeam);

                if (splashIdx !== null) {
                    const neighbor = playerTeam[splashIdx];
                    // Visual Shrapnel from Victim (Player) -> Neighbor (Player)
                    const sourceSlot = getSlotElement(victimIdx, true);
                    const targetSlot = getSlotElement(splashIdx, true);

                    triggerShrapnel(sourceSlot, targetSlot, () => {
                        resolveHit(neighbor, splashIdx, playerTeam, null, -1, null, 'heavy', 'splash-impact');
                        updateBattleLog(`AI SPLASH hits ${neighbor.name}!`);
                        renderFormation(); // Re-render player team
                    });
                }

                renderFormation();
                setTimeout(() => endTurn(), 1000);
            }, 200, 'nitro');
            return;
        }

        // FALLBACK: Basic attack (if not enough pellicles for ability)
        const cost = (attacker.id.includes('nitro') || attacker.id.includes('lydro')) ? 2 : 1;

        if (attacker.pellicle >= cost) {
            // Default targeting
            if (playerTeam[0].isDead) {
                const wings = livingPlayer.map(m => playerTeam.indexOf(m));
                victimIdx = wings[Math.floor(Math.random() * wings.length)];
            }

            attacker.pellicle -= cost;
            renderEnemyFormation();

            triggerProjectile(attackerIdx, victimIdx, false, () => {
                updateBattleLog(`AI: ${attacker.name} attacks ${playerTeam[victimIdx].name}!`);
                resolveHit(playerTeam[victimIdx], victimIdx, playerTeam, attacker, attackerIdx, enemyTeam);
                renderFormation();
                setTimeout(() => endTurn(), 1000);
            }, 200);
        } else {
            // Cannot afford attack
            setTimeout(() => endTurn(), 1000);
        }
    }

    function addPellicleFromDrag(index, tokenId) {
        if (currentPhase !== 'REINFORCE' || pelliclePool <= 0) return;

        const monster = playerTeam[index];

        // CHECK OVERLOAD (6th point)
        const isCano = monster.id.includes('cano');
        const gainAmount = isCano ? 2 : 1;
        const isLastStand = checkLastStand(playerTeam); // Check immunity

        if (monster.pellicle + gainAmount >= 6 && !isLastStand) {
            pelliclePool--;
            triggerExplosion(playerTeam, index);

            return;
        }

        if (!monster.isDead && (monster.pellicle < monster.max || isLastStand)) {
            monster.pellicle += gainAmount;
            pelliclePool--;

            // ANIMATE TOKEN FLYING TO MONSTER
            if (tokenId) {
                const tokenEl = document.getElementById(tokenId);
                console.log(`Trying to animate token: ${tokenId}, found:`, tokenEl);
                if (tokenEl) {
                    console.log('Animating pellicle to monster index:', index);
                    animatePellicleToMonster(tokenEl, index, () => {
                        // POWER UP EFFECT after animation
                        triggerVisualEffect(index, true, 'power-up');
                        renderFormation();
                    });
                } else {
                    console.log('Token not found by ID, showing immediate effect');
                    // Fallback if token not found
                    triggerVisualEffect(index, true, 'power-up');
                    renderFormation();
                }
            } else {
                console.log('No token ID provided (touch drag?), showing immediate effect');
                // No token ID (e.g., touch drag), just show effect
                triggerVisualEffect(index, true, 'power-up');
                renderFormation();
            }

            console.log(`Reinforced ${monster.name}${isCano ? " (Synergy!)" : ""}. Pool: ${pelliclePool}`);
            updateBattleLog(`${monster.name} ABSORBS PELLICLE${isCano ? " (ROOT SYNERGY)" : ""}`);

        } else if (monster.isDead) {
            showGameMessage("Dead monsters cannot be reinforced!", "red");
        } else {
            showGameMessage("Max Pellicles reached!", "blue");
        }

        updateTurnIndicator();
        updatePhaseUI();
    }

    function animatePellicleToMonster(tokenEl, monsterIndex, onComplete, isPlayerAndTarget = true) {
        console.log('animatePellicleToMonster called for monster index:', monsterIndex);

        // FORCE REFLOW IMMEDIATELY to ensure start position is rendered
        void tokenEl.offsetWidth;

        // Get monster position
        const slot = getSlotElement(monsterIndex, isPlayerAndTarget);
        if (!slot) {
            console.log('Slot not found for monster index:', monsterIndex);
            tokenEl.remove();
            if (onComplete) onComplete();
            return;
        }

        const monsterRect = slot.getBoundingClientRect();
        const tokenRect = tokenEl.getBoundingClientRect();

        console.log('Monster rect:', monsterRect);
        console.log('Token rect:', tokenRect);

        // Calculate target position (center of monster)
        const targetX = monsterRect.left + monsterRect.width / 2;
        const targetY = monsterRect.top + monsterRect.height / 2;

        // Calculate current position
        const startX = tokenRect.left + tokenRect.width / 2;
        const startY = tokenRect.top + tokenRect.height / 2;

        const deltaX = targetX - startX;
        const deltaY = targetY - startY;

        console.log(`Animating from (${startX}, ${startY}) to (${targetX}, ${targetY}), delta: (${deltaX}, ${deltaY})`);

        // disable CSS animation to prevent conflict with transform
        tokenEl.style.animation = 'none';
        // Force reflow
        void tokenEl.offsetWidth;

        // Make token highly visible and animate
        tokenEl.style.zIndex = '10000'; // Bring to front
        tokenEl.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        tokenEl.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.3)`;
        tokenEl.style.opacity = '1';
        tokenEl.style.filter = 'brightness(2) drop-shadow(0 0 20px var(--neon-green))';

        console.log('Animation started, will complete in 600ms');

        // Remove after animation
        setTimeout(() => {
            console.log('Animation complete, removing token');
            tokenEl.remove();
            if (onComplete) onComplete();
        }, 600);
    }

    function triggerExplosion(team, index) {
        const monster = team[index];
        const isPlayer = (team === playerTeam);

        // 1. VISUAL EXPLOSION START
        const slot = getSlotElement(index, isPlayer);
        const monsterDiv = slot ? slot.querySelector('.monster') : null;

        if (monsterDiv) {
            monsterDiv.classList.add('exploding');

            // OVERLOAD FLARE EFFECT
            const flare = document.createElement('div');
            flare.classList.add('overload-flare');
            monsterDiv.appendChild(flare);
        }

        setTimeout(() => {
            monster.isDead = true;
            monster.pellicle = 0;

            // SHAKE EFFECT (Overload impact)
            triggerScreenShake();

            // Neighbor Damage (Chain Reaction)
            let neighbors = (index === 0) ? [1, 2] : [0];

            neighbors.forEach(nIdx => {
                const neighbor = team[nIdx];
                if (!neighbor.isDead) {
                    // HIT EFFECT for collateral damage
                    triggerVisualEffect(nIdx, isPlayer, 'hit-flash');

                    if (neighbor.pellicle > 0) {
                        neighbor.pellicle -= 1;
                    } else {
                        neighbor.isDead = true;
                        neighbor.deathTime = Date.now(); // Mark death time
                        neighbor.pellicle = 0;
                    }
                }
            });

            renderFormation();
            renderEnemyFormation();
            console.log(`BOOM! ${monster.name} exploded!`);

            checkGameOver();
        }, 800);
    }

    function addPellicleToEnemyFromDrag(index) {
        if (currentPhase !== 'REINFORCE' || pelliclePool <= 0) return;

        const monster = enemyTeam[index];

        // CHECK OVERLOAD (6th point)
        const isCano = monster.id.includes('cano');
        const gainAmount = isCano ? 2 : 1; // This gainAmount is for player's Canobolus, enemy always gains 1

        if (monster.pellicle + 1 >= 6) { // Enemy always gains 1 pellicle from drag
            pelliclePool--;
            triggerExplosion(enemyTeam, index);
            return;
        }

        if (!monster.isDead && monster.pellicle < monster.max) {
            monster.pellicle++; // Enemy always gains 1 pellicle from drag

            // CANOBOLUS PELLICLE ABILITY EFFECT: ROOT SYNERGY
            // (Receiving P triggers his passive, so show the Power Up visual)
            // This is for player's Canobolus. For enemy, it's just a regular pellicle gain.
            // If enemy Canobolus also had Root Synergy, we'd check `isCano` and trigger effect.
            // For now, assuming enemy Canobolus doesn't get bonus pellicle from player's drag.
            // If the intent was to show a visual for *any* pellicle gain on enemy Canobolus,
            // then the `if (isCano)` block below would be relevant.
            // However, the instruction implies adding a visual for *Canobolus pellicle gain*
            // which in the context of `addPellicleToEnemyFromDrag` means the enemy Canobolus
            // is receiving a pellicle.
            if (isCano) {
                // Trigger visual effect for enemy Canobolus receiving a pellicle
                triggerVisualEffect(index, false, 'power-up'); // `false` for enemy team
            }

            pelliclePool--;
            console.log(`Pumping ${monster.name}. Pool: ${pelliclePool}`);
        } else if (monster.isDead) {
            showGameMessage("Cannot pump a dead cell!", "red");
        } else {
            showGameMessage("Monster is full!", "red");
        }

        renderEnemyFormation();
        updatePhaseUI();
    }

    // 2. DRAG & DROP LOGIC (HARDENED)

    // A. PELLICLE SOURCE (REINFORCE)
    // A. PELLICLE SOURCE (REINFORCE) - DEPRECATED
    // Dynamic tokens are now used instead of a static source.
    // 4. DRAG & DROP HANDLERS
    function handleDragStartMonster(e, index) {
        if (isAITurn || isGameOver) {
            e.preventDefault();
            return;
        }

        const monster = playerTeam[index];

        // CUSTOM: Lydrosome Osmotic Flow (Transfer PP from Lydrosome during Reinforce)
        const isTransfer = (currentPhase === 'REINFORCE' && monster.id.includes('lydro') && monster.pellicle > 0);

        if (!isTransfer && monster.pellicle <= 0) {
            e.preventDefault();
            return;
        }

        draggedIndex = index;
        isDraggingPlayerFlag = true;
        isDraggingPellicleFlag = false;

        e.dataTransfer.effectAllowed = 'copyMove';

        const dragType = isTransfer ? 'type:transfer' : 'type:monster';
        e.dataTransfer.setData('text/plain', `${dragType};index:${index}`);

        setTimeout(() => e.target.style.opacity = '0.5', 0);

        // Disable pointer events on other monsters
        document.querySelectorAll('.monster').forEach(m => {
            if (m !== e.target) m.style.pointerEvents = 'none';
        });
    }

    function handleDragEndMonster(e) {
        e.target.style.opacity = '1';
        draggedIndex = null;
        isDraggingPlayerFlag = false;
        isDraggingPellicleFlag = false;

        document.querySelectorAll('.slot').forEach(s => s.classList.remove('drag-over', 'invalid-target'));
        document.querySelectorAll('.enemy-team .slot').forEach(s => s.classList.remove('target-lock', 'invalid-target'));

        // Restore pointer events
        document.querySelectorAll('.monster').forEach(m => m.style.pointerEvents = 'auto');
        clearActionIndicators();
    }

    // C. GENERIC DROP HANDLERS
    function handleDragOver(e) {
        if (isAITurn) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copyMove';
    }
    function handleDragEnter(e) {
        if (isAITurn) return;
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');

        // Show Swap indicator if dragging a monster over a player slot (Action Phase only)
        if (currentPhase === 'ACTION' && isDraggingPlayerFlag && !e.currentTarget.classList.contains('vanguard') && !e.currentTarget.classList.contains('wing')) {
            // Check if it's a player slot by team-formation parent
            if (e.currentTarget.closest('.player-team')) {
                showActionIndicator(e.currentTarget, 'swap');
            }
        } else if (currentPhase === 'ACTION' && isDraggingPlayerFlag && e.currentTarget.closest('.player-team')) {
            showActionIndicator(e.currentTarget, 'swap');
        }
    }
    function handleDragLeave(e) {
        if (isAITurn || isGameOver) return;
        e.currentTarget.classList.remove('drag-over');
        clearActionIndicators(e.currentTarget);
    }

    // DROP ON PLAYER SLOT
    function handleDropPlayerSlot(e, targetIndex) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        clearActionIndicators(e.currentTarget);

        if (isAITurn || isGameOver) return;

        // 1. Check DataTransfer FIRST to get Token ID
        const rawData = e.dataTransfer.getData('text/plain');

        if (rawData && rawData.includes('type:pellicle')) {
            // Extact Token ID to remove it
            const tokenId = rawData.split('id:')[1];
            addPellicleFromDrag(targetIndex, tokenId); // Pass token ID
            return;
        }

        // 2. Check Global Flag (Fallback - might miss ID)
        if (isDraggingPellicleFlag) {
            console.warn("Fallback drag used, token might not remove visuals correctly.");
            addPellicleFromDrag(targetIndex);
            return;
        }

        if (!rawData) return;

        if (rawData.includes('type:monster')) {
            // ...existing swap logic
        }

        if (rawData.includes('type:transfer')) {
            const sourceIndex = parseInt(rawData.split('index:')[1]);
            // const targetIndex is provided by handleDropPlayerSlot arg

            if (!isNaN(sourceIndex) && sourceIndex !== targetIndex) {
                const source = playerTeam[sourceIndex];
                const target = playerTeam[targetIndex];

                if (target.isDead) return;
                if (target.pellicle >= target.max) { alert("Target is full!"); return; }

                source.pellicle--;
                target.pellicle++;

                // PELLICLE ABILITY EFFECT (Green Glow + Power Up)
                triggerVisualEffect(sourceIndex, true, 'power-up');
                triggerVisualEffect(targetIndex, true, 'power-up');

                console.log(`OSMOTIC FLOW: 1P transferred from ${source.name} to ${target.name}`);
                renderFormation();
            }
            return;
        }

        if (rawData.includes('type:monster')) {
            // Only swap in ACTION phase
            if (currentPhase !== 'ACTION') {
                showGameMessage("Cannot swap during Reinforce Phase!", "red");
                return;
            }

            if (actionTaken) {
                showGameMessage("Action already taken this turn!", "red");
                return;
            }

            const sourceIndex = parseInt(rawData.split('index:')[1]);
            if (!isNaN(sourceIndex) && sourceIndex !== targetIndex) {
                console.log(`Swapping Monster ${sourceIndex} -> ${targetIndex}`);

                const source = playerTeam[sourceIndex];
                const target = playerTeam[targetIndex];

                // ALLOW swapping even if target is dead (moving wreckage)
                const temp = { ...source };
                playerTeam[sourceIndex] = { ...target };
                playerTeam[targetIndex] = temp;

                actionTaken = true; // Mark action as taken
                renderFormation();
                updatePhaseUI();
                setTimeout(() => {
                    updateBattleLog(`${source.name} SWAPS WITH ${target.name}`);
                }, 100);
            }
        }
    }

    // DROP ON ENEMY SLOT
    function handleDropEnemySlot(e, enemyIndex) {
        e.preventDefault();
        e.currentTarget.classList.remove('target-lock');
        clearActionIndicators(e.currentTarget);

        if (isAITurn || isGameOver) return;

        // IF REINFORCE PHASE
        if (currentPhase === 'REINFORCE') {
            if (isDraggingPellicleFlag) {
                // ALLOW BOMBING ENEMY DURING REINFORCE
                addPellicleToEnemyFromDrag(enemyIndex);
            } else {
                showGameMessage("Action Phase hasn't started!", "red");
            }
            return;
        }

        // RULE: TRIANGLE DEFENSE (Must hit Vanguard first)
        const vanguard = enemyTeam[0];
        const rawData = e.dataTransfer.getData('text/plain');
        const attackerIndex = rawData.includes('index:') ? parseInt(rawData.split('index:')[1]) : draggedIndex;
        const attacker = playerTeam[attackerIndex];

        // LYDRO SHOT BYPASS: If Lydro has 2+ PP, bypass Vanguard
        const canBypass = (attacker && attacker.id.includes('lydro') && attacker.pellicle >= 2);

        if (enemyIndex !== 0 && !vanguard.isDead && !canBypass) {
            showGameMessage("You must eliminate the Vanguard first!", "red");
            return;
        }

        if (!rawData) {
            // Fallback to flag
            if (isDraggingPlayerFlag && draggedIndex !== null) {
                triggerCombatSequence(draggedIndex, enemyIndex);
            }
            return;
        }

        if (rawData.includes('type:monster')) {
            const sourceIndex = parseInt(rawData.split('index:')[1]);
            if (!isNaN(sourceIndex)) {
                triggerCombatSequence(sourceIndex, enemyIndex);
            }
        }
    }

    // --- ATTACK LOGIC ---
    function triggerCombatSequence(attackerIndex, victimIndex) {
        const attacker = playerTeam[attackerIndex];
        const victim = enemyTeam[victimIndex];

        // VALIDATION & COST DETERMINATION
        if (victim.isDead) return;

        let cost = 1;
        if (attacker.id.includes('nitro') || attacker.id.includes('lydro')) cost = 2;
        if (attacker.id.includes('cano')) cost = attacker.pellicle;

        if (attacker.pellicle < cost || (attacker.id.includes('cano') && cost === 0)) {
            showGameMessage(`${attacker.name} needs ${cost} Pellicles!`, "red");
            return;
        }

        if (attacker.hasSwapped) {
            showGameMessage(`${attacker.name} moved this turn!`, "red");
            return;
        }

        if (actionTaken) {
            showGameMessage("Action already taken this turn!", "red");
            return;
        }

        const isLastStand = checkLastStand(playerTeam);
        const maxAttacks = isLastStand ? 2 : 1;

        if (attacker.attackCount >= maxAttacks) {
            showGameMessage(`${attacker.name} exhausted!`, "red");
            return;
        }

        // A. SPECIAL: Canobolus Multi-Shot
        if (attacker.id.includes('cano')) {
            const count = attacker.pellicle;
            if (count === 0) { showGameMessage("Cano has no ammo!", "red"); return; }

            attacker.attackCount++; // Increment counter

            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    // DEDUCT 1 PELLICLE PER SHOT FIRED (Ammunition = Armor)
                    // Even if attacker is dead, the "fired" shot consumes potential armor if logic allowed, 
                    // but visual deduction stops if dead.
                    if (!attacker.isDead && attacker.pellicle > 0) {
                        attacker.pellicle -= 1;
                        renderFormation();
                    }

                    const isLastShot = (i === count - 1);
                    triggerProjectile(attackerIndex, victimIndex, true, () => {
                        // All shots resolve using STANDARD Hit Effect
                        resolveHit(victim, victimIndex, enemyTeam, attacker, attackerIndex, playerTeam);
                        renderEnemyFormation();
                        renderFormation(); // Update Canobolus in case of reflect damage
                    }, 100); // Canobolus remains fast (100ms)
                }, i * 80); // RAPID FIRE: 80ms interval (Super Fast)
            }

            updateBattleLog(`${attacker.name} FIRES BALLISTIC VOLLEY (${count} SHOTS)`);
            actionTaken = true; // Mark action as taken (even though volley is multiple shots)
            updatePhaseUI();

            return;
        }

        // B. ABILITY ATTACK (Nitro/Lydro - Always 2P)
        attacker.pellicle -= 2;
        attacker.attackCount++; // Increment counter
        renderFormation();

        const visualType = attacker.id.includes('nitro') ? 'nitro' : 'standard';

        triggerProjectile(attackerIndex, victimIndex, true, () => {
            updateBattleLog(`${attacker.name} USES ${attacker.id.includes('nitro') ? 'NITRO BLAST' : 'HYDRO SHOT'}!`);
            resolveHit(victim, victimIndex, enemyTeam, attacker, attackerIndex, playerTeam);

            // NITRO SPLASH (Nitro Blast Ability)
            if (attacker.id.includes('nitro')) {
                let neighbors = (victimIndex === 0) ? [1, 2] : [0];
                const splashIdx = getBestSplashTarget(neighbors, enemyTeam);
                if (splashIdx !== null) {
                    const neighbor = enemyTeam[splashIdx];
                    // Visual Shrapnel from Victim -> Neighbor
                    const sourceSlot = getSlotElement(victimIndex, false); // Enemy Main Victim
                    const targetSlot = getSlotElement(splashIdx, false);   // Enemy Neighbor

                    triggerShrapnel(sourceSlot, targetSlot, () => {
                        resolveHit(neighbor, splashIdx, enemyTeam, null, -1, null, 'heavy', 'splash-impact');
                        updateBattleLog(`SPLASH hits ${neighbor.name}!`);
                        renderEnemyFormation(); // Re-render to show damage
                    });
                }
            }

            renderEnemyFormation();
            renderFormation();
            checkGameOver();
        }, 200, visualType); // Pass special visual type

        actionTaken = true; // Mark action as taken
        updatePhaseUI();
    }

    function triggerProjectile(attackerIndex, victimIndex, isPlayerAttacking, onHit, duration = 100, visualType = 'standard') {
        const attackerSlot = getSlotElement(attackerIndex, isPlayerAttacking);
        const victimSlot = getSlotElement(victimIndex, !isPlayerAttacking);

        if (!attackerSlot || !victimSlot) {
            console.warn("Projectile Aborted: Missing Slot.");
            if (onHit) onHit();
            return;
        }

        const sourceRect = attackerSlot.getBoundingClientRect();
        const targetRect = victimSlot.getBoundingClientRect();

        const bullet = document.createElement('div');
        bullet.classList.add('projectile');

        // Custom visual logic
        if (visualType === 'nitro') {
            bullet.classList.add('nitro-blast');
            // Maybe no image, just pure CSS energy ball? Or filter the bullet?
            // Let's keep the image but colorize it via CSS filter
            const img = document.createElement('img');
            img.src = 'Images/Bullet.png';
            bullet.appendChild(img);
        } else {
            const img = document.createElement('img');
            img.src = 'Images/Bullet.png';
            bullet.appendChild(img);
        }

        // Start position

        // Start position
        bullet.style.left = (sourceRect.left + sourceRect.width / 2 - 20) + 'px';
        bullet.style.top = (sourceRect.top + sourceRect.height / 2 - 20) + 'px';
        document.body.appendChild(bullet);

        // Force reflow
        void bullet.offsetWidth;

        // Custom duration
        bullet.style.transition = `transform ${duration / 1000}s linear`;

        // End position
        bullet.style.transform = `translate(${targetRect.left - sourceRect.left}px, ${targetRect.top - sourceRect.top}px)`;

        setTimeout(() => {
            bullet.remove();
            if (onHit) onHit();
        }, duration);
    }

    function triggerShrapnel(sourceSlot, targetSlot, onHit) {
        if (!sourceSlot || !targetSlot) {
            console.warn("Shrapnel Aborted: Missing Slot. Source:", sourceSlot, "Target:", targetSlot);
            if (onHit) onHit(); // FAIL-SAFE: Ensure damage happens even if visual fails
            return;
        }

        const sourceRect = sourceSlot.getBoundingClientRect();
        const targetRect = targetSlot.getBoundingClientRect();

        const shrapnel = document.createElement('div');
        shrapnel.classList.add('projectile', 'shrapnel');
        shrapnel.style.position = 'fixed'; // FIXED positioning for viewport coordinates

        // Reuse projectile image or a specific fragment
        const img = document.createElement('img');
        img.src = 'Images/Bullet.png'; // Corrected path
        shrapnel.appendChild(img);

        document.body.appendChild(shrapnel);

        // Start at Source Center
        const startX = sourceRect.left + (sourceRect.width / 2) - 15;
        const startY = sourceRect.top + (sourceRect.height / 2) - 15;

        shrapnel.style.left = `${startX}px`;
        shrapnel.style.top = `${startY}px`;

        // Force reflow
        void shrapnel.offsetWidth;

        // Custom duration - Visible Speed
        const duration = 300;
        shrapnel.style.transition = `transform ${duration / 1000}s linear`;

        // End position calculation is strictly geometric difference
        const deltaX = (targetRect.left + targetRect.width / 2) - (sourceRect.left + sourceRect.width / 2);
        const deltaY = (targetRect.top + targetRect.height / 2) - (sourceRect.top + sourceRect.height / 2);

        shrapnel.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

        setTimeout(() => {
            shrapnel.remove();
            if (onHit) onHit();
        }, duration);
    }

    function resolveHit(victim, victimIndex, team, attacker = null, attackerIndex = -1, attackerTeam = null, hitType = 'heavy', visualEffectOverride = null) {
        if (victim.isDead) return;

        // VISUAL EFFECTS ON HIT (Standardized: All hits trigger Flash + Shake)
        // Allowing override for Splash etc.
        const effectName = visualEffectOverride || 'hit-flash';
        triggerVisualEffect(victimIndex, (team === playerTeam), effectName);

        if (!visualEffectOverride) triggerScreenShake(); // Only shake on main hits? Or all? Let's keep shake for main only maybe?
        // Actually splash should probably not shake screen 3 times.
        if (!visualEffectOverride) triggerScreenShake();

        // A. REACTIVE MEMBRANE (Nitrophil Passive)
        let reflectDamage = false;
        if (victim.id.includes('nitro') && victim.pellicle > 0 && attacker && attackerTeam) {
            reflectDamage = true;
        }

        // B. Apply Damage
        if (victim.pellicle > 0) {
            victim.pellicle -= 1;
            console.log(`${victim.name} blocked with a Pellicle!`);
        } else {
            victim.isDead = true;
            victim.deathTime = Date.now(); // Mark death time for animation
            victim.pellicle = 0;
            showGameMessage(`${victim.name} is OUT!`, "gray");
        }

        // C. Process Reflect
        if (reflectDamage) {
            console.log(`REACTIVE MEMBRANE: ${victim.name} reflects damage!`);

            // HIT EFFECT for Reflected Damage
            // (attackerIndex is -1 if undefined, need to pass it properly or find it)
            if (attackerIndex !== -1 && attacker) {
                triggerVisualEffect(attackerIndex, true, 'hit-flash'); // Attacker is player
            }

            if (attacker.pellicle > 0) {
                attacker.pellicle -= 1;
            } else {
                attacker.isDead = true;
                attacker.deathTime = Date.now(); // Mark death time for animation
                attacker.pellicle = 0;
                showGameMessage(`${attacker.name} killed by reflect!`, "gray");
            }
        }

        checkGameOver();
    }

    // --- WIN/LOSS LOGIC ---
    function checkGameOver() {
        if (isGameOver) return;

        const playerWipe = playerTeam.every(m => m.isDead);
        const enemyWipe = enemyTeam.every(m => m.isDead);

        if (enemyWipe) {
            isGameOver = true;
            showGameOverEffect("DIVISION COMPLETE", "var(--neon-green)");
        } else if (playerWipe) {
            isGameOver = true;
            showGameOverEffect("DIVISION FAILURE", "var(--neon-red)");
        }
    }

    function showGameOverEffect(message, color) {
        // 1. UPDATE PHASE UI
        phaseMsg.innerText = message;
        phaseMsg.style.color = color;
        phaseMsg.style.textShadow = `0 0 10px ${color}, 0 0 20px ${color}`;
        phaseSubMsg.innerText = "RETURNING TO BASE...";
        phaseSubMsg.classList.remove('exhausted');

        // Hide buttons
        if (endTurnBtn) endTurnBtn.classList.add('hidden');
        if (startActionBtn) startActionBtn.classList.add('hidden');

        // 2. DELAYED RETURN TO MENU
        setTimeout(() => {
            gameBoard.classList.add('hidden');
            mainMenu.classList.remove('hidden');
            // reset state for next game?
            // we probably need a reset function if we want to play again without refreshing
        }, 3000);
    }

    // --- VISUAL RENDERING SYSTEM ---

    function updatePhaseUI() {
        if (poolCounter) poolCounter.innerText = `x${pelliclePool}`;

        // ONLY UPDATE PHASE TEXT & ANIMATION IF CHANGED
        if (currentPhase !== lastAnnouncedPhase) {
            lastAnnouncedPhase = currentPhase;

            // TRIGGER ANIMATION
            phaseMsg.classList.remove('phase-announce');
            void phaseMsg.offsetWidth; // Trigger Reflow
            phaseMsg.classList.add('phase-announce');

            if (currentPhase === 'REINFORCE') {
                phaseMsg.innerText = isAITurn ? "AI REINFORCING" : "REINFORCE PHASE";
                phaseMsg.style.color = "var(--neon-green)";
                phaseMsg.style.textShadow = "0 0 10px var(--neon-green), 0 0 20px var(--neon-green)";
                phaseSubMsg.innerText = isAITurn ? "COMPUTER IS PREPARING..." : "DRAG PELLICLE TO REINFORCE";
                phaseSubMsg.classList.remove('exhausted'); // Clear exhaustion style
                if (reinforceZone) reinforceZone.classList.remove('disabled');
                if (endTurnBtn) endTurnBtn.classList.add('hidden');

                if (reinforceZone) reinforceZone.classList.remove('disabled');
                if (endTurnBtn) endTurnBtn.classList.add('hidden');
            } else {
                // ACTION PHASE
                if (turnNumber === 1 && !isAITurn) {
                    phaseMsg.innerText = "ACCLIMATIZATION";
                    phaseMsg.style.color = "var(--neon-blue)"; // Blue for calm/statuesque
                    phaseMsg.style.textShadow = "0 0 10px var(--neon-blue), 0 0 20px var(--neon-blue)";
                    phaseSubMsg.innerText = "CANNOT ATTACK OR SWAP IN TURN 1";
                    phaseSubMsg.classList.remove('exhausted');
                } else {
                    phaseMsg.innerText = isAITurn ? "AI ATTACKING" : "ATTACK PHASE";
                    phaseMsg.style.color = "var(--neon-red)";
                    phaseMsg.style.textShadow = "0 0 10px var(--neon-red), 0 0 20px var(--neon-red)";

                    if (actionTaken && !isAITurn) {
                        phaseSubMsg.innerText = "ACTION EXHAUSTED - END TURN";
                        phaseSubMsg.classList.add('exhausted');
                    } else {
                        phaseSubMsg.innerText = isAITurn ? "BRACE YOURSELF!" : "ATTACK OR MOVE";
                        phaseSubMsg.classList.remove('exhausted');
                    }
                }

                if (reinforceZone) reinforceZone.classList.add('disabled');
                if (startActionBtn) startActionBtn.classList.add('hidden');

                // Show manual end turn button only during Player Action phase
                if (endTurnBtn) {
                    if (!isAITurn) endTurnBtn.classList.remove('hidden');
                    else endTurnBtn.classList.add('hidden');
                }
            }
        }

        // ALWAYS UPDATE DYNAMIC BUTTONS (Outside the phase change check)
        // ALWAYS UPDATE DYNAMIC BUTTONS (Outside the phase change check)
        if (currentPhase === 'REINFORCE') {
            if (startActionBtn) {
                if (!isAITurn) {
                    startActionBtn.classList.remove('hidden');

                    if (turnNumber === 1) {
                        // Turn 1: Acclimatization -> END TURN (Cyan)
                        const btnText = "End Turn (Acclimatization)";
                        if (startActionBtn.innerText !== btnText) startActionBtn.innerText = btnText;

                        startActionBtn.style.color = "var(--neon-blue)";
                        startActionBtn.style.borderColor = "var(--neon-blue)";
                        startActionBtn.style.boxShadow = "0 0 10px var(--neon-blue), inset 0 0 10px var(--neon-blue)";
                    } else {
                        // Turn 2+: Normal Attack (Red)
                        const btnText = "ATTACK";
                        if (startActionBtn.innerText !== btnText) startActionBtn.innerText = btnText;

                        startActionBtn.style.color = "var(--neon-red)";
                        startActionBtn.style.borderColor = "var(--neon-red)";
                        startActionBtn.style.boxShadow = "0 0 10px var(--neon-red), inset 0 0 10px var(--neon-red)";
                    }

                } else {
                    startActionBtn.classList.add('hidden');
                }
            }
        }
    }

    function updateTurnIndicator() {
        if (!turnCounter) return;

        const ordinals = ["FIRST", "SECOND", "THIRD", "FOURTH", "FIFTH", "SIXTH", "SEVENTH", "EIGHTH", "NINTH", "TENTH"];
        let turnText = "";

        if (turnNumber <= 10) {
            turnText = ordinals[turnNumber - 1];
        } else {
            turnText = turnNumber + "TH"; // Simple fallback
        }

        if (isAITurn) {
            turnCounter.innerText = `ENEMY'S DIVISION`;
            turnCounter.style.color = "var(--neon-red)";
            turnCounter.style.textShadow = "0 0 10px var(--neon-red)";
        } else {
            turnCounter.innerText = `${turnText} CELL DIVISION`;
            turnCounter.style.color = "var(--neon-blue)";
            turnCounter.style.textShadow = "0 0 10px var(--neon-blue)";
        }
    }

    function bindSlotDropZones() {
        const vSlot = document.querySelector('.player-team .vanguard');
        const lSlot = document.querySelector('.player-team .wing[data-pos="wing-left"]');
        const rSlot = document.querySelector('.player-team .wing[data-pos="wing-right"]');

        [vSlot, lSlot, rSlot].forEach((slot, index) => {
            slot.addEventListener('dragover', handleDragOver);
            slot.addEventListener('dragenter', handleDragEnter);
            slot.addEventListener('dragleave', handleDragLeave);
            slot.addEventListener('drop', (e) => handleDropPlayerSlot(e, index));
        });
    }

    function handleDragEnterEnemy(el, e, index) {
        e.preventDefault();

        // VISUAL FEEDBACK: Target Lock
        el.classList.add('target-lock');

        // Show Attack indicator if dragging a monster over an enemy slot
        if (isDraggingPlayerFlag || (draggedIndex !== null && currentPhase === 'ACTION')) {
            showActionIndicator(el, 'attack');
        }

        // VISUAL FEEDBACK: Invalid Target (Red X)
        const isAttackerDragging = isDraggingPlayerFlag || (draggedIndex !== null && currentPhase === 'ACTION');

        if (isAttackerDragging) {
            const attacker = playerTeam[draggedIndex];
            const victim = enemyTeam[index];
            const vanguard = enemyTeam[0];

            let isInvalid = false;

            // Rule 1: Phase check
            if (currentPhase !== 'ACTION') isInvalid = true;

            if (attacker && !isInvalid) {
                // Rule 2: Already acted
                if (attacker.hasSwapped || attacker.hasAttacked) isInvalid = true;

                // Rule 3: Insufficient PP
                let cost = (attacker.id.includes('nitro') || attacker.id.includes('lydro')) ? 2 : 1;
                if (attacker.id.includes('cano')) cost = 1; // Need at least 1
                if (attacker.pellicle < cost) isInvalid = true;

                // Rule 4: Triangle Defense
                const canBypass = (attacker.id.includes('lydro') && attacker.pellicle >= 2);
                if (index !== 0 && !vanguard.isDead && !canBypass) isInvalid = true;
            }

            // Rule 5: Victim check
            if (victim && victim.isDead) isInvalid = true;

            if (isInvalid) {
                el.classList.add('invalid-target');
            }
        }
    }

    function handleDragLeaveEnemy(el, e) {
        el.classList.remove('target-lock', 'invalid-target');
        clearActionIndicators(el);
    }

    function bindEnemyDropZones() {
        const enemyContainer = document.querySelector('.enemy-team');
        const mapping = [
            { slot: enemyContainer.querySelector('.vanguard'), index: 0 },
            { slot: enemyContainer.querySelector('.wing[data-pos="wing-left"]'), index: 1 },
            { slot: enemyContainer.querySelector('.wing[data-pos="wing-right"]'), index: 2 }
        ];

        mapping.forEach(obj => {
            obj.slot.addEventListener('dragover', handleDragOver);
            obj.slot.addEventListener('dragenter', (e) => handleDragEnterEnemy(obj.slot, e, obj.index));
            obj.slot.addEventListener('dragleave', (e) => handleDragLeaveEnemy(obj.slot, e));
            obj.slot.addEventListener('drop', (e) => handleDropEnemySlot(e, obj.index));
        });
    }

    function renderFormation() {
        for (let i = 0; i < 3; i++) {
            const slot = getSlotElement(i, true);
            if (slot) {
                slot.innerHTML = '';
                createMonsterDOM(playerTeam[i], slot, i, true);
            }
        }
    }

    function renderEnemyFormation() {
        for (let i = 0; i < 3; i++) {
            const slot = getSlotElement(i, false);
            if (slot) {
                slot.innerHTML = '';
                createMonsterDOM(enemyTeam[i], slot, i, false);
            }
        }
    }

    function handleMonsterClick(index) {
        // Only valid for Player Team interaction
        if (currentPhase !== 'REINFORCE' || isAITurn || isGameOver) return;

        const clickedMonster = playerTeam[index];
        if (clickedMonster.isDead) return;

        // 1. IF SELECTING SOURCE (Nothing selected yet)
        if (selectedAbilitySourceIndex === null) {
            // Check if it's Lydrosome (Osmotic Flow)
            if (clickedMonster.id.includes('lydro')) {
                selectedAbilitySourceIndex = index;
                showGameMessage("Select a target to transfer Pellicle", "blue");
                renderFormation(); // Trigger Glow
            }
            return;
        }

        // 2. IF SOURCE ALREADY SELECTED
        if (selectedAbilitySourceIndex !== null) {
            // If clicked self -> Cancel
            if (selectedAbilitySourceIndex === index) {
                selectedAbilitySourceIndex = null;
                updatePhaseUI(); // Clear "Select target" prompt
                renderFormation();
                return;
            }

            // If clicked Target -> Execute Transfer
            const source = playerTeam[selectedAbilitySourceIndex];
            const target = playerTeam[index];

            if (source.pellicle <= 0) {
                showGameMessage("Not enough Pellicles!", "red");
                // Don't deselect, allow user to realize or pick another
                return;
            }
            if (target.pellicle >= target.max) {
                showGameMessage("Target is full!", "red");
                return;
            }

            // EXECUTE TRANSFER
            source.pellicle--;
            target.pellicle++;

            // VISUALS
            triggerVisualEffect(selectedAbilitySourceIndex, true, 'power-up');
            triggerVisualEffect(index, true, 'power-up');

            console.log(`OSMOTIC FLOW: 1P transferred from ${source.name} to ${target.name}`);
            updateBattleLog(`OSMOTIC FLOW: ${source.name} TRANSFERS PELLICLE TO ${target.name}`);

            // Clear instruction after use
            updatePhaseUI();
            renderFormation();
        }
    }

    function createMonsterDOM(monster, container, index, isPlayer) {
        if (monster.isDead) {
            const div = document.createElement('div');
            div.classList.add('monster', 'dead');

            // Apply spawn animation only if died recently (< 2000ms)
            if (monster.deathTime && (Date.now() - monster.deathTime < 2000)) {
                div.classList.add('container-spawn');
            }

            // Background Container (Grayscale)
            const img = document.createElement('img');
            img.src = `Images/CellContainer.png`;
            img.style.filter = "grayscale(100%) opacity(0.5)";
            div.appendChild(img);

            // Death X Mark
            const xMark = document.createElement('div');
            xMark.classList.add('death-x');
            xMark.innerText = 'X';
            div.appendChild(xMark);

            container.appendChild(div);
            return;
        }

        const div = document.createElement('div');
        div.classList.add('monster');

        // ABILITY GLOW STATE (Only for Player)
        if (isPlayer && index === selectedAbilitySourceIndex) {
            div.classList.add('ability-active');
        }

        // VULNERABLE STATE (0 Pellicles)
        if (monster.pellicle === 0 && !monster.isDead) {
            div.classList.add('vulnerable');
        }

        // ID for specific styling if needed
        div.dataset.id = monster.id;

        // CLICK HANDLER (Player Only)
        if (isPlayer) {
            div.onclick = () => handleMonsterClick(index);
        }

        // 1. Monster Image
        const img = document.createElement('img');
        const imgName = monster.name.replace(/\s+/g, '');
        img.src = `Images/${imgName}.png`;
        img.alt = monster.name;
        // Image itself shouldn't be draggable separately if main div is
        img.draggable = false;

        // DRAG HANDLERS (On the main DIV for better hit area)
        if (isPlayer) {
            div.draggable = true;
            div.addEventListener('dragstart', (e) => handleDragStartMonster(e, index));
            div.addEventListener('dragend', handleDragEndMonster);

            // TOUCH EVENTS
            div.addEventListener('touchstart', (e) => handleTouchStart(e, index, 'monster'), { passive: false });
            div.addEventListener('touchmove', handleTouchMove, { passive: false });
            div.addEventListener('touchend', handleTouchEnd, { passive: false });
        }

        div.appendChild(img);

        // 3. Pellicle Rings
        const ringContainer = document.createElement('div');
        ringContainer.style.position = 'absolute';
        ringContainer.style.width = '100%';
        ringContainer.style.height = '100%';
        ringContainer.style.pointerEvents = 'none'; // Click-through
        div.appendChild(ringContainer);

        // Render Rings based on Pellicle count
        // Last Stand can have > 5, but we only have so much space visually.
        // Cap visual rings at 10 or just let them stack? Let's cap visual scaling to avoid breaking UI.
        const renderCount = Math.min(monster.pellicle, 10);

        for (let i = 0; i < renderCount; i++) {
            const ring = document.createElement('div');
            ring.classList.add('pellicle-ring');
            if (!isPlayer) ring.classList.add('enemy-ring');

            // Scale rings: 1st is smallest (inner), last is largest (outer)
            // base scale 0.6, step 0.1
            const scale = 0.6 + (i * 0.1);
            ring.style.transform = `translate(-50%, -50%) scale(${scale})`;
            ringContainer.appendChild(ring);
        }

        // 4. Pellicle Badge (Top Right)
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
        div.appendChild(badge);

        // Tooltip Events
        div.addEventListener('mouseenter', (e) => showTooltip(e, monster));
        div.addEventListener('mouseleave', hideTooltip);

        container.appendChild(div);
    }

    function updateUI() {
        renderFormation();
        renderEnemyFormation();
        updateTurnIndicator();
        updatePhaseUI();
    }

    startBtn.addEventListener('click', () => {
        mainMenu.classList.add('hidden');
        gameBoard.classList.remove('hidden');
        resetGameState();
        initGame();
        startReinforcePhase();
    });

    if (btnCollection) {
        btnCollection.addEventListener('click', () => {
            previousScreen = 'main-menu';
            mainMenu.classList.add('hidden');
            databaseScreen.classList.remove('hidden');
        });
    }

    if (btnDbBack) {
        btnDbBack.addEventListener('click', () => {
            databaseScreen.classList.add('hidden');
            if (previousScreen === 'game-board') {
                gameBoard.classList.remove('hidden');
            } else {
                mainMenu.classList.remove('hidden');
            }
        });
    }

    if (btnBattleBack) {
        btnBattleBack.addEventListener('click', () => {
            gameBoard.classList.add('hidden');
            mainMenu.classList.remove('hidden');
            // Optional: reset game state if needed, but simple hide for now
        });
    }

    if (btnBattleDb) {
        btnBattleDb.addEventListener('click', () => {
            previousScreen = 'game-board';
            gameBoard.classList.add('hidden');
            databaseScreen.classList.remove('hidden');
        });
    }

    if (btnRulebook) {
        btnRulebook.addEventListener('click', () => {
            databaseScreen.classList.add('hidden');
            rulebookScreen.classList.remove('hidden');
        });
    }

    if (btnRbBack) {
        btnRbBack.addEventListener('click', () => {
            rulebookScreen.classList.add('hidden');
            databaseScreen.classList.remove('hidden');
        });
    }

    // --- TOOLTIP LOGIC ---
    function showTooltip(monster, x, y) {
        if (!tooltip) return;
        tooltipName.innerText = monster.name;

        const labels = tooltip.querySelectorAll('.tooltip-label');
        if (monster.name.includes("Pellicle Points")) {
            labels.forEach(l => l.style.display = 'none');
        } else {
            labels.forEach(l => l.style.display = 'block');
        }

        tooltipAttack.innerText = monster.ability.attack;
        tooltipPassive.innerText = monster.ability.passive;

        tooltip.classList.remove('hidden');
        moveTooltip(x, y);
    }

    function moveTooltip(x, y) {
        if (!tooltip) return;

        let posX = x + 25;
        let posY = y - 50; // Align middle-ish vertically to cursor

        // SCREEN BOUNDS CHECK
        const tooltipWidth = 260;
        const tooltipHeight = tooltip.offsetHeight || 150;

        if (posX + tooltipWidth > window.innerWidth) {
            posX = x - tooltipWidth - 25;
        }

        if (posY + tooltipHeight > window.innerHeight) {
            posY = window.innerHeight - tooltipHeight - 20;
        }

        if (posY < 10) posY = 10;

        tooltip.style.left = posX + 'px';
        tooltip.style.top = posY + 'px';
    }

    function hideTooltip() {
        if (!tooltip) return;
        tooltip.classList.add('hidden');
    }

    // --- NEW VISUAL EFFECT HELPERS ---
    function triggerScreenShake() {
        gameBoard.classList.remove('shake');
        void gameBoard.offsetWidth; // trigger reflow
        gameBoard.classList.add('shake');
        setTimeout(() => gameBoard.classList.remove('shake'), 500);
    }

    function triggerVisualEffect(index, isPlayer, className) {
        const slot = getSlotElement(index, isPlayer);
        const monsterDiv = slot ? slot.querySelector('.monster') : null;

        if (monsterDiv) {
            monsterDiv.classList.remove(className); // Reset if already there
            void monsterDiv.offsetWidth; // Trigger reflow
            monsterDiv.classList.add(className);
            // Match animation duration (0.2s) more closely 
            setTimeout(() => monsterDiv.classList.remove(className), 300);
        }
    }

    function getSlotElement(index, isPlayer) {
        const teamClass = isPlayer ? '.player-team' : '.enemy-team';
        const container = document.querySelector(teamClass);
        if (!container) return null;

        if (index === 0) return container.querySelector('.vanguard');
        if (index === 1) return container.querySelector('.wing[data-pos="wing-left"]');
        if (index === 2) return container.querySelector('.wing[data-pos="wing-right"]');
        return null;
    }

    function showActionIndicator(slot, type) {
        // Clear existing in this slot
        clearActionIndicators(slot);

        const indicator = document.createElement('div');
        indicator.classList.add('action-indicator', type);
        slot.appendChild(indicator);
    }

    function clearActionIndicators(slot = null) {
        if (slot) {
            const indicators = slot.querySelectorAll('.action-indicator');
            indicators.forEach(ind => ind.remove());
        } else {
            const allIndicators = document.querySelectorAll('.action-indicator');
            allIndicators.forEach(ind => ind.remove());
        }
    }

    function showGameMessage(text, colorType) {
        if (!phaseSubMsg) return;

        let color = "rgba(255, 255, 255, 0.6)";
        if (colorType === 'red') color = "var(--neon-red)";
        if (colorType === 'blue') color = "var(--neon-blue)";
        if (colorType === 'gray') color = "#888";

        phaseSubMsg.innerText = text;
        phaseSubMsg.style.color = color;

        // Reset message after 2 seconds to current guidance
        setTimeout(() => {
            updatePhaseUI();
        }, 2000);
    }

    // --- TOUCH SUPPORT FOR MOBILE ---
    let touchGhost = null;
    let touchedToken = null; // Store reference to touched pellicle token

    function handleTouchStart(e, index, type) {
        // Prevent scrolling while dragging
        if (e.cancelable) e.preventDefault();

        const touch = e.touches[0];
        const target = e.currentTarget;

        // Initialization
        if (type === 'monster') {
            if (isAITurn || isGameOver) return;
            const monster = playerTeam[index];
            const isTransfer = (currentPhase === 'REINFORCE' && monster.id.includes('lydro') && monster.pellicle > 0);
            if (!isTransfer && monster.pellicle <= 0) return;

            draggedIndex = index;
            isDraggingPlayerFlag = true;
            isDraggingPellicleFlag = false;

            // Ghost setup
            createTouchGhost(target, touch);
        } else if (type === 'pellicle') {
            if (currentPhase !== 'REINFORCE' || isAITurn || isGameOver) return;
            isDraggingPellicleFlag = true;
            isDraggingPlayerFlag = false;

            // Store token reference but keep it visible
            touchedToken = target;
            touchedToken.style.pointerEvents = 'none';

            createTouchGhost(target, touch);
        }
    }

    function createTouchGhost(source, touch) {
        if (touchGhost) touchGhost.remove();

        touchGhost = source.cloneNode(true);
        touchGhost.classList.add('touch-drag-ghost');

        // Remove all animations from the ghost
        touchGhost.style.animation = 'none';
        touchGhost.style.animationDelay = '0s';

        // Position at touch point (centered on finger)
        touchGhost.style.left = touch.clientX + 'px';
        touchGhost.style.top = touch.clientY + 'px';

        // Fix size scaling if parent is scaled
        const rect = source.getBoundingClientRect();
        touchGhost.style.width = rect.width + 'px';
        touchGhost.style.height = rect.height + 'px';

        document.body.appendChild(touchGhost);
    }

    function handleTouchMove(e) {
        if (!touchGhost) return;
        if (e.cancelable) e.preventDefault();

        const touch = e.touches[0];
        touchGhost.style.left = touch.clientX + 'px';
        touchGhost.style.top = touch.clientY + 'px';

        // Check target under finger for visual feedback
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const slot = el ? el.closest('.slot') : null;

        document.querySelectorAll('.slot').forEach(s => s.classList.remove('drag-over', 'target-lock', 'invalid-target'));
        clearActionIndicators();

        if (slot) {
            slot.classList.add('drag-over');

            // Feedback logic parity with mouse handlers
            if (slot.closest('.enemy-team')) {
                slot.classList.add('target-lock');
                if (currentPhase === 'ACTION' && isDraggingPlayerFlag) {
                    showActionIndicator(slot, 'attack');
                }
            } else if (slot.closest('.player-team')) {
                if (currentPhase === 'ACTION' && isDraggingPlayerFlag) {
                    showActionIndicator(slot, 'swap');
                }
            }
        }
    }

    function handleTouchEnd(e) {
        if (!touchGhost) return;
        const touch = e.changedTouches[0];

        // Resolve Drop
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const slot = el ? el.closest('.slot') : null;

        if (slot) {
            const isPlayerSlot = slot.closest('.player-team');
            const isEnemySlot = slot.closest('.enemy-team');

            // Find index of slot
            const slots = document.querySelectorAll(isPlayerSlot ? '.player-team .slot' : '.enemy-team .slot');
            const targetIndex = Array.from(slots).indexOf(slot);

            if (isPlayerSlot) {
                // Mocking DataTransfer for touch
                const mockEvent = {
                    preventDefault: () => { },
                    currentTarget: slot,
                    dataTransfer: {
                        getData: (key) => {
                            if (isDraggingPellicleFlag) {
                                // Use the actual token ID if available
                                const tokenId = touchedToken ? touchedToken.id : 'touch-token';
                                return `type:pellicle;id:${tokenId}`;
                            }
                            if (isDraggingPlayerFlag) return `type:monster;index:${draggedIndex}`;
                            return '';
                        }
                    }
                };
                handleDropPlayerSlot(mockEvent, targetIndex);

                // Don't animate here - let addPellicleFromDrag handle it
                // Just clean up the reference
                touchedToken = null;
            } else if (isEnemySlot) {
                const mockEvent = {
                    preventDefault: () => { },
                    currentTarget: slot,
                    dataTransfer: {
                        getData: (key) => `type:monster;index:${draggedIndex}`
                    }
                };
                handleDropEnemySlot(mockEvent, targetIndex);
            }
        }

        // Cleanup
        if (touchGhost) touchGhost.remove();
        touchGhost = null;

        // Restore token if not dropped successfully
        if (touchedToken) {
            touchedToken.style.opacity = '1';
            touchedToken.style.pointerEvents = 'auto';
            touchedToken = null;
        }

        draggedIndex = null;
        isDraggingPlayerFlag = false;
        isDraggingPellicleFlag = false;
        document.querySelectorAll('.slot').forEach(s => s.classList.remove('drag-over', 'target-lock', 'invalid-target'));
        clearActionIndicators();
    }

    // --- INTEGRATION: Adding touch listeners to elements ---
    // Modified createMonsterDOM and spawnPellicleTokens to include touch listeners

    function getBestSplashTarget(neighborIndices, team) {
        // 1. Filter Alive Neighbors
        let candidates = neighborIndices.map(idx => ({ index: idx, monster: team[idx] }))
            .filter(c => !c.monster.isDead);


        if (candidates.length === 0) return null;

        // 2. Find Max PP
        const maxPP = Math.max(...candidates.map(c => c.monster.pellicle));

        // 3. Filter for Top Contenders (Ties)
        const topContenders = candidates.filter(c => c.monster.pellicle === maxPP);

        // 4. Pick Random from Top Contenders
        const choice = topContenders[Math.floor(Math.random() * topContenders.length)];
        return choice.index;
    }

    console.log("CELLULAR WARS: Robust System Ready v0.9 (Mobile Support Enabled)");
});


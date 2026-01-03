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

    // --- INITIALIZATION ---
    function initGame() {
        console.log("Initializing Game State...");
        if (rotateBtn) rotateBtn.style.display = 'none';

        if (endTurnBtn) {
            endTurnBtn.addEventListener('click', () => {
                updateBattleLog("PLAYER ENDS TURN MANUALLY");
                endTurn();
            });
        }

        updateUI();
        bindSlotDropZones();
        bindEnemyDropZones();
        // REMOVED: bindPellicleSource(); -> Replaced by spawnPellicleTokens logic
    }

    // --- UTILS: SPAWN TOKENS ---
    function spawnPellicleTokens(count) {
        const container = document.querySelector('.team-formation.player-team'); // Use Player Team area
        if (!container) return; // Should exist

        // Clear existing tokens just in case
        document.querySelectorAll('.pellicle-token').forEach(el => el.remove());

        for (let i = 0; i < count; i++) {
            const token = document.createElement('div');
            token.classList.add('pellicle-token');
            token.draggable = true;
            token.id = `pellicle-token-${i}`; // Unique ID

            // SPAWN LOGIC: Asymmetric Randomness
            // Use wider ranges and independent random checks to avoid "mirror" look.

            const isLeft = (Math.random() > 0.5); // Completely random side for each token? No, might overlap.
            // Better: Keep side separation for safety but randomize Y drastically.
            const side = (i % 2 === 0) ? -1 : 1; // -1 Left, 1 Right

            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;

            let x, y;

            // X: Variation from 60px to 140px distance from edge
            const xOffset = Math.random() * 80 + 60;

            if (side === -1) {
                x = -xOffset;
            } else {
                x = containerWidth + xOffset - 70; // -70 for token width
            }

            // Y: Full height randomness (10% to 90%)
            y = Math.random() * (containerHeight * 0.8) + (containerHeight * 0.1);

            token.style.left = `${x}px`;
            token.style.top = `${y}px`;

            // RANDOM DELAY for natural feel
            token.style.animationDelay = `${i * 0.1}s, ${0.6 + Math.random() * 0.5}s`;
            // 1st time is for spawn, 2nd is for float start offset (approx)

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

            container.appendChild(token);
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

    function runAIReinforce() {
        // AI simple reinforcement logic: Give to Vanguard if low, else random
        let availablePP = REINFORCE_AMOUNT;
        const livingEnemies = enemyTeam.filter(m => !m.isDead);

        if (livingEnemies.length === 0) return;

        while (availablePP > 0) {
            // Priority: Vanguard (index 0) if has less than 3 Pellicles
            let target;
            const vanguard = enemyTeam[0];
            if (!vanguard.isDead && vanguard.pellicle < 3) {
                target = vanguard;
            } else {
                target = livingEnemies[Math.floor(Math.random() * livingEnemies.length)];
            }

            if (target.pellicle < target.max) {
                const gain = target.id.includes('cano') ? 2 : 1;
                target.pellicle += gain;
                updateBattleLog(`AI: ${target.name} absorbs Pellicle`);
                triggerVisualEffect(enemyTeam.indexOf(target), false, 'power-up');
                availablePP--;
            } else {
                // If everyone's full or randomized into a full one, break to avoid infinite loop
                break;
            }
        }
        renderEnemyFormation();
    }

    function runAIAction() {
        // AI simple action logic: Attack player Vanguard if alive
        const livingAI = enemyTeam.filter(m => !m.isDead && m.pellicle > 0);
        if (livingAI.length === 0) {
            setTimeout(() => endTurn(), 1000);
            return;
        }

        // Pick an attacker (Prefer one with most Pellicles)
        const attacker = livingAI.sort((a, b) => b.pellicle - a.pellicle)[0];
        const attackerIdx = enemyTeam.indexOf(attacker);

        // Pick a victim (Prefer player Vanguard)
        const livingPlayer = playerTeam.filter(m => !m.isDead);
        if (livingPlayer.length === 0) {
            setTimeout(() => endTurn(), 1000);
            return;
        }

        let victimIdx = 0; // Vanguard
        if (playerTeam[0].isDead) {
            const wings = livingPlayer.map(m => playerTeam.indexOf(m));
            victimIdx = wings[Math.floor(Math.random() * wings.length)];
        }

        // Action Cost (Keep it simple: standard attack for AI)
        const cost = (attacker.id.includes('nitro') || attacker.id.includes('lydro')) ? 2 : 1;

        if (attacker.pellicle >= cost) {
            attacker.pellicle -= cost;
            renderEnemyFormation();

            triggerProjectile(attackerIdx, victimIdx, false, () => {
                updateBattleLog(`AI: ${attacker.name} attacks ${playerTeam[victimIdx].name}!`);
                resolveHit(playerTeam[victimIdx], victimIdx, playerTeam, attacker, attackerIdx, enemyTeam);
                renderFormation();
                setTimeout(() => endTurn(), 1000);
            });
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

            if (pelliclePool === 0) {
                endReinforcePhase();
            }
            return;
        }

        if (!monster.isDead && (monster.pellicle < monster.max || isLastStand)) {
            monster.pellicle += gainAmount;
            pelliclePool--;

            // REMOVE TOKEN VISUALLY IMMEDIATELY
            if (tokenId) {
                const tokenEl = document.getElementById(tokenId);
                if (tokenEl) tokenEl.remove();
            }

            // POWER UP EFFECT
            triggerVisualEffect(index, true, 'power-up');

            console.log(`Reinforced ${monster.name}${isCano ? " (Synergy!)" : ""}. Pool: ${pelliclePool}`);
            updateBattleLog(`${monster.name} ABSORBS PELLICLE${isCano ? " (ROOT SYNERGY)" : ""}`);

            if (pelliclePool === 0) {
                endReinforcePhase();
            }
        } else if (monster.isDead) {
            showGameMessage("Dead monsters cannot be reinforced!", "red");
        } else {
            showGameMessage("Max Pellicles reached!", "blue");
        }



        renderFormation();
        updateTurnIndicator();
        updatePhaseUI();
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
            if (pelliclePool === 0) endReinforcePhase();
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
            if (pelliclePool === 0) endReinforcePhase();
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
        if (isAITurn) {
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

        // CUSTOM ATTACK DRAG IMAGE (Using pre-sized DOM element)
        if (currentPhase === 'ACTION') {
            // TURN 1 RESTRICTION: ACCLIMATIZATION
            if (turnNumber === 1) {
                e.preventDefault();
                showGameMessage("Acclimatization: Actions disabled Turn 1", "blue");
                return;
            }

            if (attackDragIcon) {
                e.dataTransfer.setDragImage(attackDragIcon, 20, 20);
            }
        }

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
    }
    function handleDragLeave(e) {
        if (isAITurn) return;
        e.currentTarget.classList.remove('drag-over');
    }

    // DROP ON PLAYER SLOT
    function handleDropPlayerSlot(e, targetIndex) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');

        if (isAITurn) return;

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

            const sourceIndex = parseInt(rawData.split('index:')[1]);
            if (!isNaN(sourceIndex) && sourceIndex !== targetIndex) {
                console.log(`Swapping Monster ${sourceIndex} -> ${targetIndex}`);

                const source = playerTeam[sourceIndex];
                const target = playerTeam[targetIndex];

                // ALLOW swapping even if target is dead (moving wreckage)
                const temp = { ...source };
                playerTeam[sourceIndex] = { ...target };
                playerTeam[targetIndex] = temp;

                renderFormation();
                // RULE: MOVE ENDS TURN
                setTimeout(() => {
                    updateBattleLog(`${source.name} SWAPS WITH ${target.name}`);
                    endTurn();
                }, 100);
            }
        }
    }

    // DROP ON ENEMY SLOT
    function handleDropEnemySlot(e, enemyIndex) {
        e.preventDefault();
        e.currentTarget.classList.remove('target-lock');

        if (isAITurn) return;

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

        // ATTACK LIMIT CHECK (Normal: 1, Last Stand: 2)
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
                    });
                }, i * 80); // RAPID FIRE: 80ms interval (Super Fast)
            }

            updateBattleLog(`${attacker.name} FIRES BALLISTIC VOLLEY (${count} SHOTS)`);

            // End turn after last shot sequence + buffer
            setTimeout(() => endTurn(), (count * 80) + 600);
            return;
        }

        // B. ABILITY ATTACK (Nitro/Lydro - Always 2P)
        attacker.pellicle -= 2;
        attacker.attackCount++; // Increment counter
        renderFormation();

        triggerProjectile(attackerIndex, victimIndex, true, () => {
            updateBattleLog(`${attacker.name} USES ${attacker.id.includes('nitro') ? 'NITRO BLAST' : 'HYDRO SHOT'}!`);
            resolveHit(victim, victimIndex, enemyTeam, attacker, attackerIndex, playerTeam);

            // NITRO SPLASH (Nitro Blast Ability)
            if (attacker.id.includes('nitro')) {
                let neighbors = (victimIndex === 0) ? [1, 2] : [0];
                neighbors.forEach(nIdx => {
                    const neighbor = enemyTeam[nIdx];
                    if (!neighbor.isDead) resolveHit(neighbor, nIdx, enemyTeam);
                });
            }

            renderEnemyFormation();
            setTimeout(() => endTurn(), 500);
        });
    }

    function triggerProjectile(attackerIndex, victimIndex, isPlayerAttacking, onHit) {
        const sourceSlot = getSlotElement(attackerIndex, isPlayerAttacking);
        const targetSlot = getSlotElement(victimIndex, !isPlayerAttacking);

        if (!sourceSlot || !targetSlot) return;

        const sourceRect = sourceSlot.getBoundingClientRect();
        const targetRect = targetSlot.getBoundingClientRect();

        const bullet = document.createElement('div');
        bullet.classList.add('projectile');
        const img = document.createElement('img');
        img.src = 'Images/Bullet.png';
        bullet.appendChild(img);

        // Start position
        bullet.style.left = (sourceRect.left + sourceRect.width / 2 - 20) + 'px';
        bullet.style.top = (sourceRect.top + sourceRect.height / 2 - 20) + 'px';
        document.body.appendChild(bullet);

        // Force reflow
        void bullet.offsetWidth;

        // Custom duration for snappier feel
        bullet.style.transition = "transform 0.1s linear";

        // End position
        bullet.style.transform = `translate(${targetRect.left - sourceRect.left}px, ${targetRect.top - sourceRect.top}px)`;

        setTimeout(() => {
            bullet.remove();
            if (onHit) onHit();
        }, 100); // 0.1s travel time
    }

    function resolveHit(victim, victimIndex, team, attacker = null, attackerIndex = -1, attackerTeam = null, hitType = 'heavy') {
        if (victim.isDead) return;

        // VISUAL EFFECTS ON HIT (Standardized: All hits trigger Flash + Shake)
        // Ignoring hitType 'light' request for damage to ensure "Hit Effect" consistency
        triggerVisualEffect(victimIndex, (team === playerTeam), 'hit-flash');
        triggerScreenShake();

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
                if (reinforceZone) reinforceZone.classList.remove('disabled');
                if (endTurnBtn) endTurnBtn.classList.add('hidden');
            } else {
                // ACTION PHASE
                if (turnNumber === 1 && !isAITurn) {
                    phaseMsg.innerText = "ACCLIMATIZATION";
                    phaseMsg.style.color = "var(--neon-blue)"; // Blue for calm/statuesque
                    phaseMsg.style.textShadow = "0 0 10px var(--neon-blue), 0 0 20px var(--neon-blue)";
                    phaseSubMsg.innerText = "CANNOT ATTACK OR SWAP IN TURN 1";
                } else {
                    phaseMsg.innerText = isAITurn ? "AI ATTACKING" : "ATTACK PHASE";
                    phaseMsg.style.color = "var(--neon-red)";
                    phaseMsg.style.textShadow = "0 0 10px var(--neon-red), 0 0 20px var(--neon-red)";
                    phaseSubMsg.innerText = isAITurn ? "BRACE YOURSELF!" : "ATTACK OR MOVE";
                }

                if (reinforceZone) reinforceZone.classList.add('disabled');

                // Show manual end turn button only during Player Action phase
                if (endTurnBtn) {
                    if (!isAITurn) endTurnBtn.classList.remove('hidden');
                    else endTurnBtn.classList.add('hidden');
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
        if (currentPhase !== 'REINFORCE' || isAITurn) return;

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
        initGame();
        startReinforcePhase();
    });

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

    console.log("CELLULAR WARS: Robust System Ready v0.9");
});


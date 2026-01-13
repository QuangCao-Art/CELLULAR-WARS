import { gameState, CONSTANTS, getReinforceAmount } from './state.js';
import * as Renderer from '../ui/renderer.js';
import * as Animations from '../ui/animations.js';
import * as Combat from './combat.js';

export function runAIReinforce(endReinforceCallback) {
    if (!gameState.isAITurn) return;

    try {
        let availablePP = getReinforceAmount(true);
        let pCount = 0;

        function processNextPellicle() {
            if (pCount >= availablePP) {
                Renderer.updatePhaseUI();
                if (endReinforceCallback) setTimeout(endReinforceCallback, 1000);
                return;
            }

            const livingEnemies = gameState.enemyTeam.filter((m, idx) => !m.isDead && idx < 3);
            if (livingEnemies.length === 0) {
                if (endReinforceCallback) setTimeout(endReinforceCallback, 1000);
                return;
            }

            let targetIdx = 0;
            const vanguard = gameState.enemyTeam[0];

            if (!vanguard.isDead && vanguard.pellicle < 2) {
                targetIdx = 0;
            } else {
                const candidatesIdx = livingEnemies.map(m => gameState.enemyTeam.indexOf(m));
                const highImpactIdx = candidatesIdx.find(idx => {
                    const m = gameState.enemyTeam[idx];
                    return (m.id.includes('cell011') || m.id.includes('cell02')) && m.pellicle < 4;
                });

                if (highImpactIdx !== undefined) targetIdx = highImpactIdx;
                else targetIdx = candidatesIdx[Math.floor(Math.random() * candidatesIdx.length)];
            }

            const monster = gameState.enemyTeam[targetIdx];
            const overloadLimit = monster.id.includes('cell011') ? 7 : 6;

            Animations.triggerAIRenforceAnimation(targetIdx, () => {
                if (monster.pellicle + 1 >= overloadLimit) {
                    Combat.triggerExplosion(gameState.enemyTeam, targetIdx);
                } else {
                    monster.pellicle += 1;
                    Renderer.triggerVisualEffect(targetIdx, false, 'power-up');
                }
                Renderer.renderEnemyFormation();
                Renderer.updatePhaseUI();

                pCount++;
                setTimeout(processNextPellicle, 400);
            });
        }

        setTimeout(processNextPellicle, 800);
    } catch (e) {
        console.error("AI Reinforce Error:", e);
        if (endReinforceCallback) endReinforceCallback();
    }
}

export function runAIActionPhase(callback) {
    if (!gameState.isAITurn) return;

    try {
        const livingAllies = gameState.enemyTeam.filter((m, idx) => !m.isDead && idx < 3);

        // 1. Cambihil Energy Burst check
        const cambihil = livingAllies.find(m => m.id.includes('cell01') && !m.id.includes('cell011') && !m.specialUsed);
        if (cambihil && cambihil.pellicle <= 1) {
            cambihil.pellicle = Math.min(cambihil.max, cambihil.pellicle + 2);
            cambihil.specialUsed = true;
            Renderer.showGameMessage(`AI: ${cambihil.name} used Energy Burst!`, "green");
            Renderer.triggerVisualEffect(gameState.enemyTeam.indexOf(cambihil), false, 'ability-activation');
        }

        // 2. Lydrosome Osmotic Flow check
        const lydro = livingAllies.find(m => m.id.includes('cell02') && !m.specialUsed);
        const vanguard = gameState.enemyTeam[0];
        if (lydro && !vanguard.isDead && vanguard.pellicle < 2 && lydro.pellicle > 1) {
            lydro.pellicle--;
            vanguard.pellicle++;
            lydro.specialUsed = true;
            Renderer.showGameMessage(`AI: ${lydro.name} transferred energy!`, "blue");
            Renderer.triggerVisualEffect(gameState.enemyTeam.indexOf(lydro), false, 'ability-activation');
            Renderer.triggerVisualEffect(0, false, 'ability-activation');
        }

        Renderer.renderEnemyFormation();
        setTimeout(callback, 1000);
    } catch (e) {
        console.error("AI Action Phase Error:", e);
        callback();
    }
}

export function runAIAttackPhase(endTurnCallback) {
    try {
        Combat.resetReflectFlags();

        if (gameState.turnNumber === 1) {
            setTimeout(endTurnCallback, 1000);
            return;
        }

        const candidates = gameState.enemyTeam
            .map((m, idx) => ({ monster: m, index: idx }))
            .filter(item => !item.monster.isDead && item.monster.pellicle > 0 && item.index < 3)
            .sort((a, b) => b.monster.pellicle - a.monster.pellicle);

        if (candidates.length === 0) {
            setTimeout(endTurnCallback, 1000);
            return;
        }

        let selectedAttacker = null;
        let actionCost = 0;

        for (const cand of candidates) {
            const m = cand.monster;
            let cost = 1;
            if (m.id.includes('cell02')) cost = 2;

            if (m.pellicle >= cost) {
                selectedAttacker = cand;
                actionCost = cost;
                break;
            }
        }

        if (!selectedAttacker) {
            setTimeout(endTurnCallback, 1000);
            return;
        }

        const attacker = selectedAttacker.monster;
        const attackerIdx = selectedAttacker.index;

        const livingPlayer = gameState.playerTeam.filter((m, idx) => !m.isDead && idx < 3);
        if (livingPlayer.length === 0) {
            setTimeout(endTurnCallback, 1000);
            return;
        }

        let victimIdx = 0;
        let useAbility = false;

        // 1. Canobolus Volley 
        if (attacker.id.includes('cell011') && attacker.pellicle >= 3) {
            if (!gameState.playerTeam[0].isDead) victimIdx = 0;
            else {
                const wings = gameState.playerTeam.filter((m, idx) => !m.isDead && idx < 3);
                if (wings.length > 0) {
                    const target = wings[Math.floor(Math.random() * wings.length)];
                    victimIdx = gameState.playerTeam.indexOf(target);
                }
            }

            const count = attacker.pellicle;
            Renderer.showGameMessage(`AI: BALLISTIC VOLLEY!`, "red");

            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    if (attacker.isDead || attacker.pellicle <= 0) return;
                    attacker.pellicle -= 1;
                    Renderer.renderEnemyFormation();

                    Animations.triggerProjectile(attackerIdx, victimIdx, false, () => {
                        Combat.resolveHit(gameState.playerTeam[victimIdx], victimIdx, gameState.playerTeam, attacker, attackerIdx, gameState.enemyTeam);
                        setTimeout(() => {
                            Renderer.renderFormation();
                            Renderer.renderEnemyFormation();
                        }, 600);
                    }, 100);
                }, i * 80);
            }
            setTimeout(endTurnCallback, count * 80 + 1000);
            return;
        }

        // 2. Lydrosome Shot
        if (attacker.id.includes('cell02') && attacker.pellicle >= 2) {
            if (gameState.playerTeam[0].pellicle >= 3 && livingPlayer.length > 1) {
                const wings = livingPlayer.filter(m => gameState.playerTeam.indexOf(m) !== 0);
                victimIdx = gameState.playerTeam.indexOf(wings[Math.floor(Math.random() * wings.length)]);
                useAbility = true;
            } else if (gameState.playerTeam[0].isDead && livingPlayer.length > 0) {
                const wings = livingPlayer.map(m => gameState.playerTeam.indexOf(m));
                victimIdx = wings[Math.floor(Math.random() * wings.length)];
                useAbility = true;
            }

            if (useAbility || attacker.pellicle >= 2) {
                attacker.pellicle -= 2;
                Renderer.renderEnemyFormation();
                Animations.triggerProjectile(attackerIdx, victimIdx, false, () => {
                    Renderer.showGameMessage(`AI: HYDRO SHOT!`, "blue");
                    Combat.resolveHit(gameState.playerTeam[victimIdx], victimIdx, gameState.playerTeam, attacker, attackerIdx, gameState.enemyTeam);

                    setTimeout(() => {
                        Renderer.renderFormation();
                        Renderer.renderEnemyFormation();
                    }, 600);
                    setTimeout(endTurnCallback, 1200);
                }, 375, 'hydro');
                return;
            }
        }

        // 3. Standard Attack
        if (gameState.playerTeam[0].isDead) {
            const wings = livingPlayer.map(m => gameState.playerTeam.indexOf(m));
            if (wings.length > 0) victimIdx = wings[Math.floor(Math.random() * wings.length)];
        }

        attacker.pellicle -= actionCost;
        Renderer.renderEnemyFormation();

        const visualType = attacker.id.includes('cell03') ? 'nitro' : (attacker.id.includes('cell02') ? 'hydro' : 'standard');

        // PHAGOBURST AI: Triple Pop
        if (attacker.id.includes('cell04') && attacker.pellicle + actionCost >= 2) {
            attacker.pellicle = (attacker.pellicle + actionCost) - 2;
            Renderer.renderEnemyFormation();
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    if (attacker.isDead || gameState.playerTeam[victimIdx].isDead) return;
                    Animations.triggerProjectile(attackerIdx, victimIdx, false, () => {
                        Combat.resolveHit(gameState.playerTeam[victimIdx], victimIdx, gameState.playerTeam, attacker, attackerIdx, gameState.enemyTeam, 'light');
                        setTimeout(() => { Renderer.renderFormation(); Renderer.renderEnemyFormation(); }, 600);
                    }, 100);
                }, i * 200);
            }
            setTimeout(endTurnCallback, 1500);
            return;
        }

        Animations.triggerProjectile(attackerIdx, victimIdx, false, () => {
            Combat.resolveHit(gameState.playerTeam[victimIdx], victimIdx, gameState.playerTeam, attacker, attackerIdx, gameState.enemyTeam, 'heavy', null, () => {
                // MITONEGY AI: Auto-Repair
                if (attacker.id.includes('cell07')) {
                    const allies = gameState.enemyTeam.filter((m, i) => !m.isDead && i < 3);
                    if (allies.length > 0) {
                        let lowestP = Math.min(...allies.map(m => m.pellicle));
                        let candidates = allies.filter(m => m.pellicle === lowestP);
                        let target = candidates[Math.floor(Math.random() * candidates.length)];
                        target.pellicle = Math.min(target.max, target.pellicle + 1);
                        Renderer.showGameMessage(`AI Auto-Repair: ${target.name}!`, "green");
                        Renderer.triggerVisualEffect(gameState.enemyTeam.indexOf(target), false, 'power-up');
                    }
                }

                // CHLAROB AI: Quick Rob
                if (attacker.id.includes('cell08')) {
                    attacker.pellicle = Math.min(attacker.max, attacker.pellicle + 1);
                    Renderer.showGameMessage(`AI: Quick Rob!`, "green");
                    Renderer.triggerVisualEffect(attackerIdx, false, 'power-up');
                }
            });

            setTimeout(() => {
                Renderer.renderFormation();
                Renderer.renderEnemyFormation();
            }, 600);
            setTimeout(endTurnCallback, 1200);
        }, 375, visualType);

    } catch (e) {
        console.error("AI Action Error:", e);
        if (endTurnCallback) endTurnCallback();
    }
}

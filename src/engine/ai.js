import { gameState, CONSTANTS } from './state.js';
import * as Renderer from '../ui/renderer.js';
import * as Animations from '../ui/animations.js';
import * as Combat from './combat.js';

export function runAIReinforce(endReinforceCallback) {
    if (!gameState.isAITurn) return;

    let availablePP = CONSTANTS.REINFORCE_AMOUNT;
    Renderer.updateBattleLog("AI Phase: Reinforcing...");

    // Delay for dramatic effect
    setTimeout(() => {
        for (let i = 0; i < availablePP; i++) {
            const livingEnemies = gameState.enemyTeam.filter((m, idx) => !m.isDead && idx < 3);
            if (livingEnemies.length === 0) break;

            // AI PRIORITY: Vanguard (0) < 3, else Random
            let targetIdx = 0;
            if (gameState.enemyTeam[0].pellicle >= 3 || gameState.enemyTeam[0].isDead) {
                const candidates = livingEnemies.map(m => gameState.enemyTeam.indexOf(m));
                targetIdx = candidates[Math.floor(Math.random() * candidates.length)];
            }

            const monster = gameState.enemyTeam[targetIdx];
            if (monster.pellicle + 1 >= 6) {
                Combat.triggerExplosion(gameState.enemyTeam, targetIdx);
            } else {
                monster.pellicle += 1;
                Renderer.triggerVisualEffect(targetIdx, false, 'power-up');
            }
        }
        Renderer.renderEnemyFormation();
        Renderer.updatePhaseUI();
        if (endReinforceCallback) setTimeout(endReinforceCallback, 1000);
    }, 1000);
}

export function runAIAction(endTurnCallback) {
    Combat.resetReflectFlags();

    // Pick an attacker (Only Active squad can attack)
    const livingAI = gameState.enemyTeam.filter((m, idx) => !m.isDead && m.pellicle > 0 && idx < 3);
    if (livingAI.length === 0) {
        setTimeout(endTurnCallback, 1000);
        return;
    }

    const attacker = livingAI.sort((a, b) => b.pellicle - a.pellicle)[0];
    const attackerIdx = gameState.enemyTeam.indexOf(attacker);

    // Pick a victim (AI only targets Active squad 0-2)
    const livingPlayer = gameState.playerTeam.filter((m, idx) => !m.isDead && idx < 3);
    if (livingPlayer.length === 0) {
        setTimeout(endTurnCallback, 1000);
        return;
    }

    let victimIdx = 0;
    let useAbility = false;

    // AI Logic for specific monsters (Cano, Lydro, Nitro)
    if (attacker.id.includes('cano') && attacker.pellicle >= 3) {
        // Canobolus Volley
        if (!gameState.playerTeam[0].isDead) victimIdx = 0;
        else {
            const wings = livingPlayer.map(m => gameState.playerTeam.indexOf(m));
            victimIdx = wings[Math.floor(Math.random() * wings.length)];
        }

        const count = attacker.pellicle;
        Renderer.updateBattleLog(`AI: ${attacker.name} FIRES BALLISTIC VOLLEY (${count} SHOTS)`);

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (attacker.isDead || attacker.pellicle <= 0) return;
                attacker.pellicle -= 1;
                Renderer.renderEnemyFormation();

                Animations.triggerProjectile(attackerIdx, victimIdx, false, () => {
                    Combat.resolveHit(gameState.playerTeam[victimIdx], victimIdx, gameState.playerTeam, attacker, attackerIdx, gameState.enemyTeam);
                    Renderer.renderFormation();
                    Renderer.renderEnemyFormation();
                }, 100);
            }, i * 80);
        }
        setTimeout(endTurnCallback, count * 80 + 1000);
        return;
    }

    // Lydrosome Shot
    if (attacker.id.includes('lydro') && attacker.pellicle >= 2) {
        if (gameState.playerTeam[0].pellicle >= 3 && livingPlayer.length > 1) {
            const wings = livingPlayer.filter(m => gameState.playerTeam.indexOf(m) !== 0);
            victimIdx = gameState.playerTeam.indexOf(wings[Math.floor(Math.random() * wings.length)]);
            useAbility = true;
        } else if (gameState.playerTeam[0].isDead) {
            const wings = livingPlayer.map(m => gameState.playerTeam.indexOf(m));
            victimIdx = wings[Math.floor(Math.random() * wings.length)];
            useAbility = true;
        }

        if (useAbility || attacker.pellicle >= 2) {
            attacker.pellicle -= 2;
            Renderer.renderEnemyFormation();
            Animations.triggerProjectile(attackerIdx, victimIdx, false, () => {
                Renderer.updateBattleLog(`AI: ${attacker.name} USES HYDRO SHOT!`);
                Combat.resolveHit(gameState.playerTeam[victimIdx], victimIdx, gameState.playerTeam, attacker, attackerIdx, gameState.enemyTeam);
                Renderer.renderFormation();
                Renderer.renderEnemyFormation();
                setTimeout(endTurnCallback, 1000);
            }, 200, 'hydro');
            return;
        }
    }

    // Fallback: Standard Attack
    const cost = (attacker.id.includes('nitro') || attacker.id.includes('lydro')) ? 2 : 1;
    if (attacker.pellicle >= cost) {
        if (gameState.playerTeam[0].isDead) {
            const wings = livingPlayer.map(m => gameState.playerTeam.indexOf(m));
            victimIdx = wings[Math.floor(Math.random() * wings.length)];
        }

        attacker.pellicle -= cost;
        Renderer.renderEnemyFormation();

        Animations.triggerProjectile(attackerIdx, victimIdx, false, () => {
            Renderer.updateBattleLog(`AI: ${attacker.name} attacks ${gameState.playerTeam[victimIdx].name}!`);
            Combat.resolveHit(gameState.playerTeam[victimIdx], victimIdx, gameState.playerTeam, attacker, attackerIdx, gameState.enemyTeam);
            Renderer.renderFormation();
            Renderer.renderEnemyFormation();
            setTimeout(endTurnCallback, 1000);
        }, 200);
    } else {
        setTimeout(endTurnCallback, 1000);
    }
}

export function resetReflectFlags() {
    gameState.playerTeam.forEach(m => m.hasReflectedThisAction = false);
    gameState.enemyTeam.forEach(m => m.hasReflectedThisAction = false);
}

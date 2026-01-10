import { gameState } from './state.js';
import * as Renderer from '../ui/renderer.js';
import * as Animations from '../ui/animations.js';

export function getNeighbors(index) {
    if (index === 0) return [1, 2];
    if (index === 1) return [0, 2, 3];
    if (index === 2) return [0, 1, 4];
    if (index === 3) return [1, 4];
    if (index === 4) return [2, 3];
    return [];
}

export function getBestSplashTarget(neighborIndices, team) {
    let candidates = neighborIndices.map(idx => ({ index: idx, monster: team[idx] }))
        .filter(c => !c.monster.isDead && c.index < 3);

    if (candidates.length === 0) return null;
    const maxPP = Math.max(...candidates.map(c => c.monster.pellicle));
    const topContenders = candidates.filter(c => c.monster.pellicle === maxPP);
    const choice = topContenders[Math.floor(Math.random() * topContenders.length)];
    return choice.index;
}

export function resolveHit(victim, victimIndex, team, attacker = null, attackerIndex = -1, attackerTeam = null, hitType = 'heavy', visualEffectOverride = null) {
    if (victim.isDead) return;

    const effectName = visualEffectOverride || 'hit-flash';
    Renderer.triggerVisualEffect(victimIndex, (team === gameState.playerTeam), effectName);

    if (!visualEffectOverride) Animations.triggerScreenShake();

    // Nitrophil Passive: Reactive Membrane
    let reflectDamage = false;
    const isVictimPlayer = (team === gameState.playerTeam);
    if (victim.id.includes('nitro') && victim.pellicle > 0 && attacker && attackerTeam && !victim.hasReflectedThisAction && victimIndex < 3) {
        reflectDamage = true;
        victim.hasReflectedThisAction = true;
    }

    if (victim.pellicle > 0) {
        victim.pellicle -= 1;
    } else {
        victim.isDead = true;
        victim.deathTime = Date.now();
        victim.pellicle = 0;
        Renderer.showGameMessage(`${victim.name} is OUT!`, "gray");
    }

    if (reflectDamage) {
        Animations.triggerBurstEffect(victimIndex, isVictimPlayer, 'reflect-burst');
        const attackerSlot = Renderer.getSlotElement(attackerIndex, !isVictimPlayer);
        const victimSlot = Renderer.getSlotElement(victimIndex, isVictimPlayer);

        Animations.triggerReflectVisual(victimSlot, attackerSlot, () => {
            resolveHit(attacker, attackerIndex, attackerTeam, null, -1, null, 'light', 'hit-flash');
            Renderer.renderFormation();
            Renderer.renderEnemyFormation();
        });
    }
}

export function triggerExplosion(team, index) {
    const isPlayer = (team === gameState.playerTeam);
    Animations.triggerExplosionVisual(team, index, isPlayer, () => {
        const monster = team[index];
        monster.isDead = true;
        monster.pellicle = 0;
        Animations.triggerScreenShake();

        let neighbors = getNeighbors(index);
        neighbors.forEach(nIdx => {
            const neighbor = team[nIdx];
            if (neighbor && !neighbor.isDead && nIdx < 3) {
                Renderer.triggerVisualEffect(nIdx, isPlayer, 'hit-flash');
                if (neighbor.pellicle > 0) {
                    neighbor.pellicle -= 1;
                } else {
                    neighbor.isDead = true;
                    neighbor.deathTime = Date.now();
                    neighbor.pellicle = 0;
                    Renderer.showGameMessage(`${neighbor.name} is OUT!`, "gray");
                }
            }
        });

        Renderer.renderFormation();
        Renderer.renderEnemyFormation();
        checkGameOver();
    });
}

export function checkVanguardHealth() {
    const vanguard = gameState.playerTeam[0];
    const wings = [gameState.playerTeam[1], gameState.playerTeam[2]].filter(m => !m.isDead);

    if (vanguard.isDead && wings.length > 0) {
        Renderer.showGameMessage("VANGUARD FALLEN! Promote a Wing!", "red");
        // We could force a UI state here if needed
    }
}

export function checkGameOver() {
    const playerAlive = gameState.playerTeam.filter(m => !m.isDead && gameState.playerTeam.indexOf(m) < 3);
    const enemyAlive = gameState.enemyTeam.filter(m => !m.isDead && gameState.enemyTeam.indexOf(m) < 3);

    if (enemyAlive.length === 0) {
        gameState.isGameOver = true;
        Renderer.showGameMessage("VICTORY! Strain Eliminated.", "blue");
        Renderer.updateBattleLog("GAME OVER: PLAYER VICTORIOUS");
    } else if (playerAlive.length === 0) {
        gameState.isGameOver = true;
        Renderer.showGameMessage("DEFEAT... System Failure.", "red");
        Renderer.updateBattleLog("GAME OVER: PLAYER DEFEATED");
    }
}

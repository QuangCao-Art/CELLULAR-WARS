import { gameState } from './state.js';
import * as Renderer from '../ui/renderer.js';
import * as Animations from '../ui/animations.js';

export function getNeighbors(index) {
    if (index === 0) return [1, 2];
    if (index === 1) return [0, 2];
    if (index === 2) return [0, 1];
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

export function resolveHit(victim, victimIndex, team, attacker = null, attackerIndex = -1, attackerTeam = null, hitType = 'heavy', visualEffectOverride = null, onComplete = null) {
    if (victim.isDead) {
        if (onComplete) onComplete();
        return;
    }

    const effectName = visualEffectOverride || 'hit-flash';
    Renderer.triggerVisualEffect(victimIndex, (team === gameState.playerTeam), effectName);

    Animations.triggerScreenShake();

    // Nitrophil Passive: Reactive Membrane
    let reflectDamage = false;
    const isVictimPlayer = (team === gameState.playerTeam);
    if (victim.id.includes('cell03') && victim.pellicle > 0 && attacker && attackerTeam && !victim.hasReflectedThisAction && victimIndex < 3) {
        reflectDamage = true;
        victim.hasReflectedThisAction = true;
    }

    if (victim.pellicle > 0) {
        victim.pellicle -= 1;
    } else {
        handleMonsterDeath(victim, victimIndex, team, isVictimPlayer);
        // Trigger Death Animation before showing message and ending
        Animations.triggerDeathVisual(team, victimIndex, isVictimPlayer, () => {
            Renderer.showGameMessage(`${victim.name} is OUT!`, "gray");
            checkGameOver(); // <-- ADDED THIS: Important to check for Game Over after death
            if (onComplete) onComplete();
        });
        return; // Stop here, wait for animation callback
    }

    if (reflectDamage) {
        Animations.triggerBurstEffect(victimIndex, isVictimPlayer, 'reflect-burst');
        const attackerSlot = Renderer.getSlotElement(attackerIndex, !isVictimPlayer);
        const victimSlot = Renderer.getSlotElement(victimIndex, isVictimPlayer);

        Animations.triggerReflectVisual(victimSlot, attackerSlot, () => {
            resolveHit(attacker, attackerIndex, attackerTeam, null, -1, null, 'light', 'hit-flash', onComplete);

            setTimeout(() => {
                Renderer.renderFormation();
                Renderer.renderEnemyFormation();
            }, 600);
        });
    } else {
        if (onComplete) onComplete();
    }
}

export function triggerExplosion(team, index) {
    const isPlayer = (team === gameState.playerTeam);
    Animations.triggerExplosionVisual(team, index, isPlayer, () => {
        const monster = team[index];
        handleMonsterDeath(monster, index, team, isPlayer);
        Animations.triggerScreenShake();

        let neighbors = getNeighbors(index);
        neighbors.forEach(nIdx => {
            const neighbor = team[nIdx];
            if (neighbor && !neighbor.isDead && nIdx < 3) {
                Renderer.triggerVisualEffect(nIdx, isPlayer, 'hit-flash');
                if (neighbor.pellicle > 0) {
                    neighbor.pellicle -= 1;
                } else {
                    handleMonsterDeath(neighbor, nIdx, team, isPlayer);
                    Renderer.showGameMessage(`${neighbor.name} is OUT!`, "gray");
                }
            }
        });

        // Delay render to let Neighbor Shake animations play
        setTimeout(() => {
            Renderer.renderFormation();
            Renderer.renderEnemyFormation();
            checkGameOver();
        }, 600);
    });
}

export function triggerSplashDamage(team, index, onComplete = null) {
    const isPlayer = (team === gameState.playerTeam);
    const neighborIdx = getBestSplashTarget(getNeighbors(index), team);

    if (neighborIdx !== null) {
        Renderer.updateBattleLog(`SPLASH: ${team[neighborIdx].name} hit by Nitro residue!`);
        Animations.triggerScreenShake();
        resolveHit(team[neighborIdx], neighborIdx, team, null, -1, null, 'light', 'splash-impact', onComplete);
    } else {
        if (onComplete) onComplete();
    }
}

export function checkVanguardHealth() {
    const vanguard = gameState.playerTeam[0];
    const wings = [gameState.playerTeam[1], gameState.playerTeam[2]].filter(m => !m.isDead);

    if (vanguard.isDead && wings.length > 0) {
        Renderer.showGameMessage("VANGUARD FALLEN!", "red");
        // Promotion (swapping) is no longer possible in battle.
    }
}

export function handleMonsterDeath(monster, index, team, isPlayer) {
    monster.isDead = true;
    monster.deathTime = Date.now();
    monster.pellicle = 0;

    const enemyTeam = isPlayer ? gameState.enemyTeam : gameState.playerTeam;
    const allies = team.filter((m, idx) => !m.isDead && idx < 3);

    // Chlarob (cell08): Grant +1 to lowest P ally
    if (monster.id.includes('cell08') && allies.length > 0) {
        let lowestP = Math.min(...allies.map(m => m.pellicle));
        let candidates = allies.filter(m => m.pellicle === lowestP);
        let target = candidates[Math.floor(Math.random() * candidates.length)];
        target.pellicle = Math.min(target.max, target.pellicle + 1);
        Renderer.showGameMessage(`${monster.name} Gift: +1 Pellicle to ${target.name}`, "green");
    }

    // Dip-Alpha (cell09): Destroy 1 enemy Vanguard Pellicle
    if (monster.id.includes('cell09')) {
        const v = enemyTeam[0];
        if (v && !v.isDead && v.pellicle > 0) {
            v.pellicle -= 1;
            Renderer.showGameMessage(`Legacy Crash: ${v.name} lost 1 Pellicle!`, "red");
            Renderer.triggerVisualEffect(0, !isPlayer, 'hit-flash');
        }
    }

    // Dip-Beta (cell010): Destroy 1 Pellicle from highest P enemy Wing
    if (monster.id.includes('cell010')) {
        const wings = [enemyTeam[1], enemyTeam[2]].filter(m => m && !m.isDead && m.pellicle > 0);
        if (wings.length > 0) {
            let maxP = Math.max(...wings.map(m => m.pellicle));
            let candidates = wings.filter(m => m.pellicle === maxP);
            let target = candidates[Math.floor(Math.random() * candidates.length)];
            target.pellicle -= 1;
            const tIdx = (target === enemyTeam[1] ? 1 : 2);
            Renderer.showGameMessage(`Energy Leak: ${target.name} lost 1 Pellicle!`, "red");
            Renderer.triggerVisualEffect(tIdx, !isPlayer, 'hit-flash');
        }
    }
}

export function checkGameOver() {
    const playerAlive = gameState.playerTeam.filter(m => !m.isDead && gameState.playerTeam.indexOf(m) < 3);
    const enemyAlive = gameState.enemyTeam.filter(m => !m.isDead && gameState.enemyTeam.indexOf(m) < 3);

    if (enemyAlive.length === 0) {
        gameState.isGameOver = true;
        Renderer.showGameMessage("VICTORY! Strain Eliminated.", "blue");
        Renderer.updateBattleLog("GAME OVER: PLAYER VICTORIOUS");
        if (window.triggerGameOver) setTimeout(() => window.triggerGameOver(true), 1500);
    } else if (playerAlive.length === 0) {
        gameState.isGameOver = true;
        Renderer.showGameMessage("DEFEAT... System Failure.", "red");
        Renderer.updateBattleLog("GAME OVER: PLAYER DEFEATED");
        if (window.triggerGameOver) setTimeout(() => window.triggerGameOver(false), 1500);
    }
}

export function resetReflectFlags() {
    gameState.playerTeam.forEach(m => m.hasReflectedThisAction = false);
    gameState.enemyTeam.forEach(m => m.hasReflectedThisAction = false);
}

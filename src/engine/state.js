import { MONSTER_DATABASE } from '../data/monsters.js';

export const gameState = {
    playerTeam: [],
    enemyTeam: [],
    currentPhase: 'REINFORCE',
    lastAnnouncedPhase: '',
    pelliclePool: 0,
    turnNumber: 1,
    isAITurn: false,
    actionTaken: false,
    isGameOver: false,
    draggedIndex: null,
    isDraggingPlayerFlag: false,
    isDraggingPellicleFlag: true, // Internal flag for drag state
    selectedAbilitySourceIndex: null,
    specialUsedThisTurn: false,
    attackUsedThisTurn: false,
    savedSquadConfig: ['cell03', 'cell02', 'cell01']
};

export const CONSTANTS = {
    ACTIVE_SLOTS: 3,
    TOTAL_SLOTS: 3,
    REINFORCE_AMOUNT: 2
};

export function createMonsterInstance(dbId, isPlayer) {
    const template = MONSTER_DATABASE[dbId];
    if (!template) return null;
    return {
        ...template,
        id: (isPlayer ? '' : 'e_') + dbId,
        pellicle: 1,
        max: (dbId === 'cell011') ? 7 : 5,
        isDead: false,
        hasReflectedThisAction: false,
        attackCount: 0,
        hasSwapped: false,
        isLocked: false,
        specialUsed: false,
        deathTime: null
    };
}

export function resetGameState() {
    console.log("RESETTING GAME STATE (3-MONSTER SQUAD)...");
    gameState.pelliclePool = 0;
    gameState.turnNumber = 1;
    gameState.actionTaken = false;
    gameState.isGameOver = false;
    gameState.isAITurn = false;
    gameState.currentPhase = 'REINFORCE';
    gameState.lastAnnouncedPhase = '';

    gameState.playerTeam = gameState.savedSquadConfig.map(id => createMonsterInstance(id, true));
    gameState.enemyTeam = gameState.savedSquadConfig.map(id => createMonsterInstance(id, false));

    // Apply Passives
    [gameState.playerTeam, gameState.enemyTeam].forEach((team, tIdx) => {
        team.forEach((m, idx) => {
            if (!m) return;
            // Kerashell Start Bonus
            if (m.id.includes('cell06') && idx === 0) {
                m.pellicle = 2;
            }
            // Mitonegy Start Bonus (Global)
            const hasMitonegy = team.some(mon => mon && mon.id.includes('cell07'));
            if (hasMitonegy) m.pellicle += 1;
        });
    });
}

export function getReinforceAmount(isAI) {
    const team = isAI ? gameState.enemyTeam : gameState.playerTeam;
    const livingCount = team.filter((m, idx) => !m.isDead && idx < 3).length;
    return (livingCount === 1) ? 3 : CONSTANTS.REINFORCE_AMOUNT;
}

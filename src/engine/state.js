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
    savedSquadConfig: ['nitro', 'lydro', 'cano', 'nitro', 'lydro']
};

export const CONSTANTS = {
    ACTIVE_SLOTS: 3,
    TOTAL_SLOTS: 5,
    REINFORCE_AMOUNT: 2
};

export function createMonsterInstance(dbId, isPlayer) {
    const template = MONSTER_DATABASE[dbId];
    if (!template) return null;
    return {
        ...template,
        id: (isPlayer ? '' : 'e_') + dbId,
        pellicle: 1,
        max: 5,
        isDead: false,
        hasReflectedThisAction: false,
        attackCount: 0,
        hasSwapped: false,
        deathTime: null
    };
}

export function resetGameState() {
    console.log("RESETTING GAME STATE (5-MONSTER SQUAD)...");
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
            if (m.id.includes('kerashell') && idx === 0) {
                m.pellicle = 2;
            }
            // Mitonegy Start Bonus (Global)
            const hasMitonegy = team.some(mon => mon && mon.id.includes('mitonegy'));
            if (hasMitonegy) m.pellicle += 1;
        });
    });
}

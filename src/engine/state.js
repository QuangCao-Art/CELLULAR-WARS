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
    selectedAbilitySourceIndex: null,
    specialUsedThisTurn: false,
    attackUsedThisTurn: false,
    savedSquadConfig: ['cell03', 'cell02', 'cell01'],
    enemyDifficulty: 'EASY',
    playerHand: [],
    cardsUnlocked: false,
    selectedCards: ['card_ethanol', 'card_penicillin']
};

export const AI_PRESETS = {
    'BEGINNER': [
        ['cell01', 'cell00', 'cell00'], // Cambihil Vanguard + 2 Stemmy
        ['cell02', 'cell00', 'cell00'], // Lydrosome Vanguard + 2 Stemmy
        ['cell03', 'cell00', 'cell00']  // Nitrophil Vanguard + 2 Stemmy
    ],
    'EASY': [
        ['cell01', 'cell00', 'cell02'],
        ['cell03', 'cell02', 'cell00'],
        ['cell00', 'cell03', 'cell01']
    ],
    'MEDIUM': [
        ['cell06', 'cell00', 'cell05'],
        ['cell03', 'cell07', 'cell02'],
        ['cell04', 'cell01', 'cell06'],
        ['cell01', 'cell02', 'cell03'], // Classic Trio: Cambihil Lead
        ['cell02', 'cell01', 'cell03'], // Classic Trio: Lydrosome Lead
        ['cell03', 'cell01', 'cell02']  // Classic Trio: Nitrophil Lead
    ],
    'HARD': [
        ['cell11', 'cell09', 'cell10'],
        ['cell08', 'cell04', 'cell11'],
        ['cell10', 'cell11', 'cell08']
    ]
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
        specialUsed: false,
        deathTime: null,
        deathAnimPlayed: false
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
    gameState.playerHand = [];
    gameState.cardsUnlocked = false;

    gameState.playerTeam = gameState.savedSquadConfig.map(id => createMonsterInstance(id, true));

    // Select Random AI Squad based on difficulty
    const presets = AI_PRESETS[gameState.enemyDifficulty] || AI_PRESETS['EASY'];
    const randomPreset = presets[Math.floor(Math.random() * presets.length)];
    console.log(`Setting AI Squad for ${gameState.enemyDifficulty}:`, randomPreset);
    gameState.enemyTeam = randomPreset.map(id => createMonsterInstance(id, false));

    // Apply Passives
    [gameState.playerTeam, gameState.enemyTeam].forEach((team, tIdx) => {
        // Apply Team-Wide Passives first
        const hasMitonegy = team.some(mon => mon && mon.id.includes('cell07'));

        team.forEach((m, idx) => {
            if (!m) return;
            // Kerashell Start Bonus (Vanguard)
            if (m.id.includes('cell06') && idx === 0) {
                m.pellicle = 2;
            }
            // Fibron Start Bonus (Individual) - Reinforce Presence
            if (m.id.includes('cell05')) {
                m.pellicle += 1;
            }
            // Mitonegy Team Bonus (+1 to all colleagues)
            if (hasMitonegy) {
                m.pellicle += 1;
            }
        });
    });
}

export function getReinforceAmount(isAI) {
    const countLiving = (team) => team.filter((m, idx) => m && !m.isDead && idx < 3).length;

    const playerLiving = countLiving(gameState.playerTeam);
    const enemyLiving = countLiving(gameState.enemyTeam);

    console.log(`REINFORCE CHECK: PlayerLiving=${playerLiving}, EnemyLiving=${enemyLiving}`);

    // Rule: If EITHER side has only 1 Cell left, the ambient energy increases to 3P.
    if (playerLiving === 1 || enemyLiving === 1) {
        return 3;
    }

    return CONSTANTS.REINFORCE_AMOUNT;
}

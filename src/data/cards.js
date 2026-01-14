export const CARDS_DATABASE = {
    'card_ethanol': {
        id: 'card_ethanol',
        name: 'ETHANOL',
        type: 'global', // Affects all enemies, no specific target needed (drag to field)
        desc: 'Destroy 1 Pellicle of ALL enemy Cells.',
        offensiveTrail: "Global Purge: Destroy 1 Pellicle of ALL enemies.",
        pellicleTrail: "Chemical Reaction: Bypasses individual defenses.",
        info: "Ethanol: A powerful solvent that dissolves cell membranes on contact. Highly effective for crowd control, though less effective against deep-seated infections.",
        icon: 'Images/CARDS_Ethanol.png',
        color: '#a85bff' // Vibrant Purple
    },
    'card_penicillin': {
        id: 'card_penicillin',
        name: 'PENICILLIN',
        type: 'target', // Must drag to specific enemy
        desc: 'MARK target Cell. Marked Cells take x2 Damage next turn.',
        offensiveTrail: "Targeted Disruption: Mark a cell for double damage.",
        pellicleTrail: "Bio-Amplifier: Increases susceptibility to attacks.",
        info: "Penicillin: The first true antibiotic. It interferes with cell wall synthesis, leaving targets vulnerable to devastating follow-up strikes.",
        icon: 'Images/CARDS_Penicillin.png',
        color: '#d1a3ff' // Light Purple
    }
};

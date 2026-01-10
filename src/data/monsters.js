export const MONSTER_DATABASE = {
    // Team A: The Cell Trio (Standard)
    'nitro': {
        id: 'nitro', name: 'Nitrophil', faction: 'A',
        ability: {
            attack: "Nitro Blast (2P): 1 dmg + splash to neighbors.",
            passive: "Reactive: Reflect 1 damage when hit."
        }
    },
    'lydro': {
        id: 'lydro', name: 'Lydrosome', faction: 'A',
        ability: {
            attack: "Hydro Shot (2P): Bypass Vanguard.",
            passive: "Osmotic: Transfer Pellicles to allies."
        }
    },
    'cano': {
        id: 'cano', name: 'Canobolus', faction: 'A',
        ability: {
            attack: "Volley (XP): Fire all P as rapid shots.",
            passive: "Root: Get +1 bonus P when reinforced."
        }
    },
    // Team B: The Scavenger Strain (New)
    'kerashell': {
        id: 'kerashell', name: 'Kerashell', faction: 'B',
        ability: {
            attack: "Light Strike (1P): Destroy 1 Pellicle.",
            passive: "Vanguard: Starts with 2 Pellicles in front."
        }
    },
    'mitonegy': {
        id: 'mitonegy', name: 'Mitonegy', faction: 'B',
        ability: {
            attack: "Auto-Repair (2P): 1 dmg + heal ally.",
            passive: "Free Gift: All allies start with +1 Pellicle."
        }
    },
    'chlarob': {
        id: 'chlarob', name: 'Chlarob', faction: 'B',
        ability: {
            attack: "Quick Rob (2P): 1 dmg + STEAL 1P.",
            passive: "Loot: Gives +1P to ally upon death."
        }
    }
};

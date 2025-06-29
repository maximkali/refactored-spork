// Single source of truth for game setups
export interface SetupOption {
  players: number;
  bottles: number;
  rounds: number;
  bottlesPerRound: number;
  bottleEqPerPerson: number;
  ozPerPersonPerBottle: number;
}

export const WINEY_SETUPS: SetupOption[] = [
  { players: 22, bottles: 20, rounds: 5, bottlesPerRound: 4, bottleEqPerPerson: 0.91, ozPerPersonPerBottle: 1.15 },
  { players: 20, bottles: 20, rounds: 5, bottlesPerRound: 4, bottleEqPerPerson: 1.00, ozPerPersonPerBottle: 1.27 },
  { players: 20, bottles: 16, rounds: 4, bottlesPerRound: 4, bottleEqPerPerson: 0.80, ozPerPersonPerBottle: 1.27 },
  { players: 20, bottles: 15, rounds: 5, bottlesPerRound: 3, bottleEqPerPerson: 0.75, ozPerPersonPerBottle: 1.27 },
  { players: 20, bottles: 12, rounds: 4, bottlesPerRound: 3, bottleEqPerPerson: 0.60, ozPerPersonPerBottle: 1.27 },
  { players: 20, bottles: 12, rounds: 3, bottlesPerRound: 4, bottleEqPerPerson: 0.60, ozPerPersonPerBottle: 1.27 },
  { players: 20, bottles: 9, rounds: 3, bottlesPerRound: 3, bottleEqPerPerson: 0.45, ozPerPersonPerBottle: 1.27 },
  { players: 18, bottles: 16, rounds: 4, bottlesPerRound: 4, bottleEqPerPerson: 0.89, ozPerPersonPerBottle: 1.41 },
  { players: 16, bottles: 16, rounds: 4, bottlesPerRound: 4, bottleEqPerPerson: 1.00, ozPerPersonPerBottle: 1.58 },
  { players: 16, bottles: 15, rounds: 5, bottlesPerRound: 3, bottleEqPerPerson: 0.94, ozPerPersonPerBottle: 1.58 },
  { players: 16, bottles: 12, rounds: 4, bottlesPerRound: 3, bottleEqPerPerson: 0.75, ozPerPersonPerBottle: 1.58 },
  { players: 16, bottles: 12, rounds: 3, bottlesPerRound: 4, bottleEqPerPerson: 0.75, ozPerPersonPerBottle: 1.58 },
  { players: 16, bottles: 9, rounds: 3, bottlesPerRound: 3, bottleEqPerPerson: 0.56, ozPerPersonPerBottle: 1.58 },
  { players: 14, bottles: 12, rounds: 4, bottlesPerRound: 3, bottleEqPerPerson: 0.86, ozPerPersonPerBottle: 1.81 },
  { players: 14, bottles: 12, rounds: 3, bottlesPerRound: 4, bottleEqPerPerson: 0.86, ozPerPersonPerBottle: 1.81 },
  { players: 12, bottles: 12, rounds: 3, bottlesPerRound: 4, bottleEqPerPerson: 1.00, ozPerPersonPerBottle: 2.11 },
  { players: 12, bottles: 12, rounds: 4, bottlesPerRound: 3, bottleEqPerPerson: 1.00, ozPerPersonPerBottle: 2.11 },
  { players: 12, bottles: 9, rounds: 3, bottlesPerRound: 3, bottleEqPerPerson: 0.75, ozPerPersonPerBottle: 2.11 },
  { players: 10, bottles: 9, rounds: 3, bottlesPerRound: 3, bottleEqPerPerson: 0.90, ozPerPersonPerBottle: 2.54 },
];

export function getUniquePlayerCounts(): number[] {
  const playerCounts = new Set<number>();
  WINEY_SETUPS.forEach(setup => playerCounts.add(setup.players));
  return Array.from(playerCounts).sort((a, b) => b - a); // Sort in descending order
}

export function getBottleOptionsForPlayers(playerCount: number): SetupOption[] {
  // First get all options for the player count
  const allOptions = WINEY_SETUPS.filter(setup => setup.players === playerCount);
  
  // Create a map to store unique bottle counts with their configurations
  const uniqueBottles = new Map<number, SetupOption>();
  
  // For each option, only keep the one with the most rounds (most tastings)
  allOptions.forEach(option => {
    const bottles = option.bottles;
    const existing = uniqueBottles.get(bottles);
    
    // If we haven't seen this bottle count yet, or if this one has more rounds
    if (!existing || option.rounds > existing.rounds) {
      uniqueBottles.set(bottles, option);
    }
  });
  
  // Convert back to array and sort by bottle count in descending order
  return Array.from(uniqueBottles.values())
    .sort((a, b) => b.bottles - a.bottles);
}

export function getRoundOptions(playerCount: number, bottleCount: number): SetupOption[] {
  const options = WINEY_SETUPS
    .filter(setup => setup.players === playerCount && setup.bottles === bottleCount && setup.rounds > 0);
  return options.sort((a, b) => b.rounds - a.rounds);
}

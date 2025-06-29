// setupOptions.ts
// Defines valid game configurations based on player count, bottles, and rounds
// Format: [players, rounds, totalBottles, bottlesPerRound, perPersonLoad]
export type GameSetup = {
  players: number;
  rounds: number;
  totalBottles: number;
  bottlesPerRound: number;
  perPersonLoad: number;
};

// Pre-calculated valid game setups
export const WINEY_SETUPS: GameSetup[] = [
  { players: 22, rounds: 5, totalBottles: 20, bottlesPerRound: 4, perPersonLoad: 0.91 },
  { players: 20, rounds: 5, totalBottles: 20, bottlesPerRound: 4, perPersonLoad: 1.00 },
  { players: 20, rounds: 4, totalBottles: 16, bottlesPerRound: 4, perPersonLoad: 0.80 },
  { players: 20, rounds: 5, totalBottles: 15, bottlesPerRound: 3, perPersonLoad: 0.75 },
  { players: 20, rounds: 4, totalBottles: 12, bottlesPerRound: 3, perPersonLoad: 0.60 },
  { players: 20, rounds: 3, totalBottles: 12, bottlesPerRound: 4, perPersonLoad: 0.60 },
  { players: 20, rounds: 3, totalBottles: 9, bottlesPerRound: 3, perPersonLoad: 0.45 },
  { players: 18, rounds: 4, totalBottles: 16, bottlesPerRound: 4, perPersonLoad: 0.89 },
  { players: 16, rounds: 4, totalBottles: 16, bottlesPerRound: 4, perPersonLoad: 1.00 },
  { players: 16, rounds: 5, totalBottles: 15, bottlesPerRound: 3, perPersonLoad: 0.94 },
  { players: 16, rounds: 4, totalBottles: 12, bottlesPerRound: 3, perPersonLoad: 0.75 },
  { players: 16, rounds: 3, totalBottles: 12, bottlesPerRound: 4, perPersonLoad: 0.75 },
  { players: 16, rounds: 3, totalBottles: 9, bottlesPerRound: 3, perPersonLoad: 0.56 },
  { players: 14, rounds: 4, totalBottles: 12, bottlesPerRound: 3, perPersonLoad: 0.86 },
  { players: 14, rounds: 3, totalBottles: 12, bottlesPerRound: 4, perPersonLoad: 0.86 },
  { players: 12, rounds: 3, totalBottles: 12, bottlesPerRound: 4, perPersonLoad: 1.00 },
  { players: 12, rounds: 4, totalBottles: 12, bottlesPerRound: 3, perPersonLoad: 1.00 },
  { players: 12, rounds: 3, totalBottles: 9, bottlesPerRound: 3, perPersonLoad: 0.75 },
  { players: 10, rounds: 3, totalBottles: 9, bottlesPerRound: 3, perPersonLoad: 0.90 }
];

// Get unique player counts for the player dropdown
export const getPlayerOptions = (): number[] => {
  const playerCounts = WINEY_SETUPS.map(setup => setup.players);
  return Array.from(new Set(playerCounts)).sort((a, b) => a - b);
};

// Get valid bottle options for a given player count
export const getBottleOptions = (players: number): number[] => {
  const bottleCounts = WINEY_SETUPS
    .filter(setup => setup.players === players)
    .map(setup => setup.totalBottles);
    
  return Array.from(new Set(bottleCounts)).sort((a, b) => a - b);
};

// Get round options for a given player and bottle count
export const getRoundOptions = (players: number, totalBottles: number): Array<{
  rounds: number;
  bottlesPerRound: number;
  perPersonLoad: number;
}> => {
  return WINEY_SETUPS
    .filter(setup => setup.players === players && setup.totalBottles === totalBottles)
    .map(({ rounds, bottlesPerRound, perPersonLoad }) => ({
      rounds,
      bottlesPerRound,
      perPersonLoad
    }))
    .sort((a, b) => a.rounds - b.rounds);
};

// Get full setup details
export const getSetupDetails = (
  players: number,
  totalBottles: number,
  rounds: number
): GameSetup | undefined => {
  return WINEY_SETUPS.find(
    setup =>
      setup.players === players &&
      setup.totalBottles === totalBottles &&
      setup.rounds === rounds
  );
};

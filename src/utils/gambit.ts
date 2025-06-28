import { Game, Gambit } from '../types';

export function calculateGambitPoints(game: Game): void {
  const bottlePrices = new Map<string, number>();
  
  // Create price map
  game.bottles.forEach(bottle => {
    bottlePrices.set(bottle.id, bottle.price);
  });

  // Sort bottles by price
  const sortedBottles = [...game.bottles].sort((a, b) => a.price - b.price);
  const cheapestBottle = sortedBottles[0].id;
  const mostExpensiveBottle = sortedBottles[sortedBottles.length - 1].id;

  // Update gambit points
  game.gambits.forEach(gambit => {
    let points = 0;
    
    // Check most expensive guess
    if (gambit.mostExpensive === mostExpensiveBottle) {
      points += 2;
    }

    // Check least expensive guess
    if (gambit.leastExpensive === cheapestBottle) {
      points += 2;
    }

    gambit.points = points;

    // Update player score
    const player = game.players.find(p => p.id === gambit.id);
    if (player) {
      player.score += points;
    }
  });
}

export function validateGambit(gambit: Gambit, game: Game): string[] {
  const errors: string[] = [];

  // Check if bottle IDs exist
  const bottleIds = game.bottles.map(b => b.id);
  
  if (!bottleIds.includes(gambit.mostExpensive)) {
    errors.push('Most expensive bottle ID is invalid');
  }

  if (!bottleIds.includes(gambit.leastExpensive)) {
    errors.push('Least expensive bottle ID is invalid');
  }

  if (gambit.mostExpensive === gambit.leastExpensive) {
    errors.push('Most expensive and least expensive cannot be the same bottle');
  }

  if (!bottleIds.includes(gambit.favorite)) {
    errors.push('Favorite bottle ID is invalid');
  }

  return errors;
}

export function createGambit(
  playerId: string,
  mostExpensive: string,
  leastExpensive: string,
  favorite: string
): Gambit {
  return {
    id: playerId,
    mostExpensive,
    leastExpensive,
    favorite,
    points: 0
  };
}

import { Game, Bottle, Round } from '../types';
import seedrandom from 'seedrandom';
import { v4 as uuidv4 } from 'uuid';

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function assignBottlesToRounds(game: Game): Game {
  const updatedGame = { ...game };
  
  // Create a seeded random number generator
  const rng = seedrandom(game.id);
  
  // Shuffle bottles using the seeded RNG
  const shuffledBottles = [...game.bottles];
  for (let i = shuffledBottles.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffledBottles[i], shuffledBottles[j]] = [shuffledBottles[j], shuffledBottles[i]];
  }
  
  // Assign bottles to rounds
  shuffledBottles.forEach((bottle, index) => {
    bottle.roundIndex = Math.floor(index / 4);
    const roundIndex = bottle.roundIndex;
    
    // Update the round's bottleIds
    if (updatedGame.rounds[roundIndex]) {
      updatedGame.rounds[roundIndex].bottleIds.push(bottle.id);
    }
  });
  
  // Update timestamps
  updatedGame.updatedAt = new Date();
  return updatedGame;
}

export function generateNewGameWithRandomBottles(numBottles: number): Game {
  // Create a new game with default values
  const game: Partial<Game> = {
    id: uuidv4(),
    players: [],
    bottles: [],
    rounds: [],
    gambits: [],
    status: 'lobby',
    createdAt: new Date(),
    updatedAt: new Date(),
    currentRound: 1,
    hostId: '',
    pin: Math.random().toString(36).substring(2, 8).toUpperCase(),
    auditLog: []
  };
  
  // Generate random bottles
  const bottles: Bottle[] = Array(numBottles).fill(null).map((_, i) => ({
    id: uuidv4(),
    labelName: `Bottle ${i + 1}`,
    price: Math.floor(Math.random() * 1000) + 100, // Random price between 100-1100
    roundIndex: 0,
    funName: `Fun Bottle ${i + 1}`
  }));
  
  // Create rounds based on number of bottles (4 bottles per round)
  const numRounds = Math.ceil(numBottles / 4);
  const rounds: Round[] = Array(numRounds).fill(null).map((_, i) => ({
    index: i,
    bottleIds: [],
    submissions: [],
    revealed: false
  }));
  
  // Assign bottles to rounds
  bottles.forEach((bottle, index) => {
    const roundIndex = Math.floor(index / 4);
    if (rounds[roundIndex]) {
      rounds[roundIndex].bottleIds.push(bottle.id);
      bottle.roundIndex = roundIndex;
    }
  });
  
  // Create the final game object
  const finalGame: Game = {
    ...game as Required<Omit<Game, 'bottles' | 'rounds' | 'gambits'>>,
    bottles,
    rounds,
    gambits: []
  };
  
  return finalGame;
}

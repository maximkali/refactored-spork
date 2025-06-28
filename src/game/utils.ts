import { Game, Bottle, Round, Player, Status, PlayerStatus } from '../types';
import { GameValidation } from './validations';
import { v4 as uuidv4 } from 'uuid';

export function createInitialGame(hostName: string): Game {
  // Create initial game with exactly 20 players
  const players: Player[] = Array(20).fill(null).map((_, i) => ({
    id: uuidv4(),
    displayName: hostName === '' ? `Player ${i + 1}` : hostName,
    score: 0,
    isHost: i === 0,
    status: 'active' as PlayerStatus,
    token: uuidv4(),
    lastActive: new Date(),
    createdAt: new Date()
  }));

  // Create empty rounds (5 total)
  const rounds: Round[] = Array(5).fill(null).map((_, i) => ({
    index: i,
    bottleIds: [],
    submissions: [],
    revealed: false
  }));

  return {
    id: uuidv4(),
    status: 'setup' as Status,
    currentRound: 1,
    bottles: [],
    rounds,
    players,
    gambits: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    pin: Math.floor(1000 + Math.random() * 9000).toString(),
    auditLog: [],
    hostId: players[0].id
  };
}

export function addBottle(game: Game, labelName: string, funName: string, price: number): Game {
  const newBottle: Bottle = {
    id: uuidv4(),
    labelName,
    funName,
    price,
    roundIndex: 0
  };

  // Validate that we haven't exceeded 20 bottles
  if (game.bottles.length >= 20) {
    throw new Error('Maximum of 20 bottles allowed');
  }

  // Validate that label name is unique
  if (game.bottles.some(bottle => bottle.labelName === labelName)) {
    throw new Error('Label name must be unique');
  }

  return {
    ...game,
    bottles: [...game.bottles, newBottle],
    updatedAt: new Date()
  };
}

export function finalizeSetup(game: Game): Game {
  // Validate that we have exactly 20 bottles
  if (game.bottles.length !== 20) {
    throw new Error('Must have exactly 20 bottles to finalize setup');
  }

  // Assign bottles to rounds (4 per round)
  const shuffledBottles = [...game.bottles];
  for (let i = 0; i < shuffledBottles.length; i++) {
    shuffledBottles[i].roundIndex = Math.floor(i / 4);
  }

  // Assign bottles to rounds
  const rounds = game.rounds.map((round, roundIndex) => {
    const start = roundIndex * 4;
    const end = start + 4;
    return {
      ...round,
      bottleIds: shuffledBottles.slice(start, end).map(b => b.id)
    };
  });

  return {
    ...game,
    status: 'lobby' as Status,
    bottles: shuffledBottles,
    rounds,
    updatedAt: new Date()
  };
}

export function isGameValid(game: Game): boolean {
  const errors = GameValidation.validateGame(game);
  return errors.length === 0;
}

export function getActivePlayerCount(game: Game): number {
  return game.players.filter(p => p.status === 'active').length;
}

export function isRoundComplete(game: Game): boolean {
  const currentRound = game.currentRound - 1;
  const round = game.rounds[currentRound];
  const activePlayers = game.players.filter(p => p.status === 'active').length;
  return round.submissions.length === activePlayers;
}

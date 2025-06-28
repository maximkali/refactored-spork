import { Game, Status, PlayerStatus } from '../types';
import { gameReducer, GameState, GameAction as StateGameAction } from './state';

export interface TimelineState {
  game: Game;
  currentStep: number;
  steps: TimelineStep[];
}

interface TimelineStep {
  id: string;
  type: 'setup' | 'lobby' | 'round' | 'countdown' | 'reveal' | 'gambit' | 'final';
  timestamp: Date;
  data?: {
    roundIndex?: number;
    bottleIds?: string[];
    scores?: Record<string, number>;
  };
}

export function createTimeline(game: Game): TimelineState {
  return {
    game,
    currentStep: 0,
    steps: [
      {
        id: game.id,
        type: 'setup',
        timestamp: game.createdAt,
        data: {
          bottleIds: game.bottles.map(b => b.id)
        }
      }
    ]
  };
}

export function advanceTimeline(state: TimelineState, action: StateGameAction): TimelineState {
  // Create a proper GameState object to pass to the reducer
  const gameState: GameState = {
    game: state.game,
    activePlayers: state.game.players.filter(p => p.status === 'active').length,
    isHost: state.game.players.some(p => p.isHost && p.status === 'active'),
    currentView: 'setup', // This will be updated by the reducer
    isLoading: false
  };

  const newState = gameReducer(gameState, action);
  
  const newStep: TimelineStep = {
    id: `${state.game.id}-${new Date().toISOString()}`,
    type: newState.currentView,
    timestamp: new Date(),
    data: getStepData(newState.game, action)
  };

  return {
    ...state,
    game: newState.game,
    currentStep: state.currentStep + 1,
    steps: [...state.steps, newStep]
  };
}

function getStepData(game: Game, action: StateGameAction): TimelineStep['data'] {
  const data: TimelineStep['data'] = {};

  switch (action.type) {
    case 'ADVANCE_ROUND':
      data.roundIndex = game.currentRound;
      data.bottleIds = game.rounds[game.currentRound - 1].bottleIds;
      break;

    case 'REVEAL_ROUND':
      data.roundIndex = game.currentRound;
      data.scores = game.players.reduce((acc, player) => {
        acc[player.id] = player.score;
        return acc;
      }, {} as Record<string, number>);
      break;

    case 'SUBMIT_GAMBIT':
      data.scores = game.players.reduce((acc, player) => {
        acc[player.id] = player.score;
        return acc;
      }, {} as Record<string, number>);
      break;

    default:
      break;
  }

  return data;
}

export function getCurrentView(state: TimelineState): GameState['currentView'] {
  const currentStep = state.steps[state.currentStep];
  return currentStep.type;
}

export function getRoundInfo(state: TimelineState): {
  currentRound: number;
  bottleIds: string[];
  revealed: boolean;
} | null {
  const currentStep = state.steps[state.currentStep];
  if (currentStep.type === 'round') {
    const roundIndex = currentStep.data?.roundIndex;
    if (roundIndex !== undefined) {
      const round = state.game.rounds[roundIndex - 1];
      return {
        currentRound: roundIndex,
        bottleIds: round.bottleIds,
        revealed: round.revealed
      };
    }
  }
  return null;
}

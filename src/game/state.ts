import { Game, Status, PlayerStatus, createGame, TastingNotes } from '../types';

export interface GameState {
  game: Game;
  activePlayers: number;
  isHost: boolean;
  currentView: 'setup' | 'lobby' | 'round' | 'countdown' | 'reveal' | 'gambit' | 'final';
  error?: string;
  isLoading: boolean;
}

export const initialState: GameState = {
  game: createGame(),
  activePlayers: 0,
  isHost: false,
  currentView: 'setup',
  isLoading: false
};

export type GameAction =
  | { type: 'SET_GAME'; game: Game }
  | { type: 'SET_HOST'; isHost: boolean }
  | { type: 'SET_ACTIVE_PLAYERS'; count: number }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'ADVANCE_ROUND' }
  | { type: 'CLOSE_ROUND' }
  | { type: 'REVEAL_ROUND' }
  | { type: 'START_COUNTDOWN' }
  | { type: 'CANCEL_COUNTDOWN' }
  | { type: 'SUBMIT_GAMBIT' };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_GAME':
      return { ...state, game: action.game };

    case 'SET_HOST':
      return { ...state, isHost: action.isHost };

    case 'SET_ACTIVE_PLAYERS':
      return { ...state, activePlayers: action.count };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.error || undefined
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };

    case 'ADVANCE_ROUND': {
      const game = { ...state.game };
      if (game.currentRound < 5) {
        game.currentRound += 1;
        game.updatedAt = new Date();
      }
      return { ...state, game, currentView: 'round' };
    }

    case 'CLOSE_ROUND': {
      const game = { ...state.game };
      game.status = 'countdown' as Status;
      game.updatedAt = new Date();
      return { ...state, game, currentView: 'countdown' };
    }

    case 'REVEAL_ROUND': {
      const game = { ...state.game };
      game.status = 'reveal' as Status;
      game.rounds[game.currentRound - 1].revealed = true;
      game.updatedAt = new Date();
      return { ...state, game, currentView: 'reveal' };
    }

    case 'START_COUNTDOWN': {
      const game = { ...state.game };
      game.status = 'countdown' as Status;
      game.updatedAt = new Date();
      return { ...state, game, currentView: 'countdown' };
    }

    case 'CANCEL_COUNTDOWN': {
      const game = { ...state.game };
      game.status = 'in_round' as Status;
      game.updatedAt = new Date();
      return { ...state, game, currentView: 'round' };
    }

    case 'SUBMIT_GAMBIT': {
      const game = { ...state.game };
      game.status = 'final' as Status;
      game.updatedAt = new Date();
      return { ...state, game, currentView: 'final' };
    }

    default:
      return state;
  }
}

// Validation functions
export function validateSubmission(submission: any): boolean {
  // Validate tasting notes structure
  const hasValidTastingNotes = Array.isArray(submission.tastingNotes) && 
    submission.tastingNotes.every((note: TastingNotes) => 
      note &&
      typeof note === 'object' && 
      'bottleId' in note && 
      typeof note.bottleId === 'string' &&
      'note' in note &&
      typeof note.note === 'string'
    );

  // Validate ranking
  const hasValidRanking = 
    Array.isArray(submission.ranking) &&
    submission.ranking.length === 4 &&
    new Set(submission.ranking).size === 4; // Check for duplicates

  return hasValidTastingNotes && hasValidRanking;
}

// Helper functions for state transitions
export function canAdvanceRound(game: Game): boolean {
  const currentRound = game.currentRound - 1;
  const round = game.rounds[currentRound];
  return round.submissions.length === game.players.filter(p => p.status === 'active').length;
}

export function canRevealRound(game: Game): boolean {
  return game.status === 'countdown';
}

export function canSubmitGambit(game: Game): boolean {
  return game.status === 'gambit';
}

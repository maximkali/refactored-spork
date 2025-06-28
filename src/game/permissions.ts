import { Game, PlayerStatus, Status } from '../types';

export enum GameAction {
  ENTER_BOTTLES = 'ENTER_BOTTLES',
  START_GAME = 'START_GAME',
  SUBMIT_TASTING = 'SUBMIT_TASTING',
  VIEW_LEADERBOARD = 'VIEW_LEADERBOARD',
  CLOSE_ROUND = 'CLOSE_ROUND',
  UNDO_ROUND = 'UNDO_ROUND',
  REOPEN_ROUND = 'REOPEN_ROUND',
  ADVANCE_ROUND = 'ADVANCE_ROUND',
  KICK_PLAYER = 'KICK_PLAYER',
  RENAME_PLAYER = 'RENAME_PLAYER',
  END_GAME = 'END_GAME',
  DOWNLOAD_RESULTS = 'DOWNLOAD_RESULTS'
}

export interface Permission {
  host: boolean;
  player: boolean;
  spectator: boolean;
}

export const permissions: Record<GameAction, Permission> = {
  [GameAction.ENTER_BOTTLES]: { host: true, player: false, spectator: false },
  [GameAction.START_GAME]: { host: true, player: false, spectator: false },
  [GameAction.SUBMIT_TASTING]: { host: true, player: true, spectator: false },
  [GameAction.VIEW_LEADERBOARD]: { host: true, player: true, spectator: true },
  [GameAction.CLOSE_ROUND]: { host: true, player: false, spectator: false },
  [GameAction.UNDO_ROUND]: { host: true, player: false, spectator: false },
  [GameAction.REOPEN_ROUND]: { host: true, player: false, spectator: false },
  [GameAction.ADVANCE_ROUND]: { host: true, player: false, spectator: false },
  [GameAction.KICK_PLAYER]: { host: true, player: false, spectator: false },
  [GameAction.RENAME_PLAYER]: { host: true, player: false, spectator: false },
  [GameAction.END_GAME]: { host: true, player: false, spectator: false },
  [GameAction.DOWNLOAD_RESULTS]: { host: true, player: true, spectator: true }
};

export function canPerformAction(
  action: GameAction,
  playerStatus: PlayerStatus,
  isHost: boolean
): boolean {
  if (isHost) return permissions[action].host;
  if (playerStatus === 'active') return permissions[action].player;
  return permissions[action].spectator;
}

export function validateAction(
  action: GameAction,
  playerStatus: PlayerStatus,
  isHost: boolean,
  game?: Game
): string | null {
  if (!canPerformAction(action, playerStatus, isHost)) {
    return `User cannot perform action: ${action}`;
  }

  // Additional game state validations for specific actions
  switch (action) {
    case GameAction.SUBMIT_TASTING:
      if (game?.status === 'reveal' || game?.status === 'gambit') {
        return 'Cannot submit tasting notes during reveal or gambit phases';
      }
      break;

    case GameAction.START_GAME:
      if (game?.status !== 'lobby') {
        return 'Can only start game from lobby phase';
      }
      break;

    case GameAction.CLOSE_ROUND:
      if (game?.status !== 'in_round') {
        return 'Can only close round during in_round phase';
      }
      break;

    case GameAction.END_GAME:
      if (game?.status === 'setup' || game?.status === 'lobby') {
        return 'Cannot end game during setup or lobby phases';
      }
      break;

    default:
      break;
  }

  return null;
}

export function getAvailableActions(
  playerStatus: PlayerStatus,
  isHost: boolean,
  game?: Game
): GameAction[] {
  return Object.values(GameAction).filter(action => {
    const basePermission = canPerformAction(action, playerStatus, isHost);
    const validationError = validateAction(action, playerStatus, isHost, game);
    return basePermission && !validationError;
  });
}

export function canKickPlayer(game: Game, targetPlayerId: string, isHost: boolean): boolean {
  if (!isHost) return false;

  const targetPlayer = game.players.find(p => p.id === targetPlayerId);
  if (!targetPlayer) return false;

  // Host cannot kick themselves
  if (targetPlayer.isHost) return false;

  // Cannot kick players who have already submitted in the current round
  const currentRound = game.currentRound - 1;
  const round = game.rounds[currentRound];
  const hasSubmitted = round.submissions.some(sub => sub.playerId === targetPlayerId);
  return !hasSubmitted;
}

export function canRenamePlayer(game: Game, targetPlayerId: string, isHost: boolean): boolean {
  if (!isHost) return false;

  const targetPlayer = game.players.find(p => p.id === targetPlayerId);
  if (!targetPlayer) return false;

  // Host cannot rename themselves
  if (targetPlayer.isHost) return false;

  // Cannot rename players who have already submitted in the current round
  const currentRound = game.currentRound - 1;
  const round = game.rounds[currentRound];
  const hasSubmitted = round.submissions.some(sub => sub.playerId === targetPlayerId);
  return !hasSubmitted;
}

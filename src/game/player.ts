import { Game, PlayerStatus, Status } from '../types';
import { GameAction, validateAction } from './permissions';

export function joinGame(game: Game, playerName: string): Game {
  // Find first available player slot
  const availablePlayer = game.players.find(p => p.status === 'active' && !p.displayName);
  if (!availablePlayer) {
    throw new Error('No available player slots');
  }

  const players = game.players.map(player => {
    if (player.id === availablePlayer.id) {
      return {
        ...player,
        displayName: playerName
      };
    }
    return player;
  });

  return {
    ...game,
    players,
    updatedAt: new Date()
  };
}

export function kickPlayer(game: Game, playerId: string, isHost: boolean): Game {
  const error = validateAction(GameAction.KICK_PLAYER, 'active', isHost, game);
  if (error) throw new Error(error);

  if (!game.players.some(p => p.id === playerId)) {
    throw new Error('Player not found');
  }

  const players = game.players.map(player => {
    if (player.id === playerId) {
      return {
        ...player,
        status: 'kicked' as PlayerStatus,
        displayName: player.displayName + ' (kicked)'
      };
    }
    return player;
  });

  return {
    ...game,
    players,
    updatedAt: new Date()
  };
}

export function renamePlayer(game: Game, playerId: string, newName: string, isHost: boolean): Game {
  const error = validateAction(GameAction.RENAME_PLAYER, 'active', isHost, game);
  if (error) throw new Error(error);

  const player = game.players.find(p => p.id === playerId);
  if (!player) {
    throw new Error('Player not found');
  }

  // Host cannot be renamed
  if (player.isHost) {
    throw new Error('Cannot rename host player');
  }

  const players = game.players.map(p => {
    if (p.id === playerId) {
      return {
        ...p,
        displayName: newName
      };
    }
    return p;
  });

  return {
    ...game,
    players,
    updatedAt: new Date()
  };
}

export function endGame(game: Game, isHost: boolean): Game {
  const error = validateAction(GameAction.END_GAME, 'active', isHost, game);
  if (error) throw new Error(error);

  return {
    ...game,
    status: 'final' as Status,
    updatedAt: new Date()
  };
}

export function getLeaderboard(game: Game): { displayName: string; score: number }[] {
  return game.players
    .filter(p => p.status === 'active')
    .map(p => ({
      displayName: p.displayName,
      score: p.score
    }))
    .sort((a, b) => b.score - a.score);
}

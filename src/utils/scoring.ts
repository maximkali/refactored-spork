import { Game, Round, Player, Submission } from '../types';

export function scoreRound(correctOrder: string[], playerRank: string[]): number {
  let points = 0;
  for (let i = 0; i < 4; i++) {
    if (correctOrder[i] === playerRank[i]) {
      points++;
    }
  }
  return points;
}

export function applyRoundScores(game: Game): Game {
  const updatedGame = { ...game };
  
  // Process each round
  game.rounds.forEach((round: Round, roundIndex: number) => {
    if (round.revealed && round.bottleIds.length === 4) {
      const correctOrder = round.bottleIds;
      
      // Update scores for valid players
      round.submissions.forEach((submission: Submission) => {
        const player: Player | undefined = game.players.find((p: Player) => p.id === submission.playerId);
        if (player?.status === 'active') {
          const points: number = scoreRound(correctOrder, submission.ranking);
          submission.points = points;
          
          // Update player's score
          const playerIndex: number = game.players.findIndex((p: Player) => p.id === player.id);
          if (playerIndex !== -1) {
            updatedGame.players[playerIndex].score += points;
          }
        }
      });
    }
  });
  
  // Update game timestamp
  updatedGame.updatedAt = new Date();
  return updatedGame;
}

export function applyGambitBonus(game: Game, gambitBonus: number): Game {
  const updatedGame = { ...game };
  
  // Apply gambit bonus to active players
  game.players.forEach((player: Player) => {
    if (player.status === 'active') {
      const playerIndex: number = game.players.findIndex((p: Player) => p.id === player.id);
      if (playerIndex !== -1) {
        updatedGame.players[playerIndex].score += gambitBonus;
      }
    }
  });
  
  updatedGame.updatedAt = new Date();
  return updatedGame;
}

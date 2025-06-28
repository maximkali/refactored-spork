import { Game, Bottle, Round, Player, Status, PlayerStatus, Submission, TastingNotes } from '../types';

export class GameValidation {
  static validateGame(game: Game): string[] {
    const errors: string[] = [];

    // Validate player count
    if (game.players.length !== 20) {
      errors.push(`Game must have exactly 20 players, found ${game.players.length}`);
    }

    // Validate bottle count
    if (game.bottles.length !== 20) {
      errors.push(`Game must have exactly 20 bottles, found ${game.bottles.length}`);
    }

    // Validate round count
    if (game.rounds.length !== 5) {
      errors.push(`Game must have exactly 5 rounds, found ${game.rounds.length}`);
    }

    // Validate current round
    if (game.currentRound < 1 || game.currentRound > 5) {
      errors.push(`Current round must be between 1 and 5, found ${game.currentRound}`);
    }

    // Validate bottle uniqueness
    const bottleIds = game.bottles.map(b => b.id);
    if (new Set(bottleIds).size !== bottleIds.length) {
      errors.push('Bottles must have unique IDs');
    }

    // Validate label names uniqueness
    const labelNames = game.bottles.map(b => b.labelName);
    if (new Set(labelNames).size !== labelNames.length) {
      errors.push('Bottles must have unique label names');
    }

    // Validate round bottle assignments
    const allBottleIds = new Set<string>();
    game.rounds.forEach(round => {
      if (round.bottleIds.length !== 4) {
        errors.push(`Round ${round.index} must have exactly 4 bottles`);
      }
      round.bottleIds.forEach(id => allBottleIds.add(id));
    });

    // Validate all bottles are assigned
    if (allBottleIds.size !== 20) {
      errors.push('All 20 bottles must be assigned to rounds');
    }

    return errors;
  }

  static validatePlayer(player: Player): string[] {
    const errors: string[] = [];
    
    if (!player.displayName || player.displayName.trim().length < 2) {
      errors.push('Player name must be at least 2 characters long');
    }

    if (player.score < 0) {
      errors.push('Player score cannot be negative');
    }

    if (player.status !== 'active' && player.status !== 'kicked' && player.status !== 'spectator') {
      errors.push(`Invalid player status: ${player.status}`);
    }

    return errors;
  }

  static validateBottle(bottle: Bottle): string[] {
    const errors: string[] = [];

    if (!bottle.labelName) {
      errors.push('Bottle must have a label name');
    }

    if (bottle.price < 0) {
      errors.push('Bottle price must be non-negative');
    }

    if (bottle.roundIndex < 0 || bottle.roundIndex > 4) {
      errors.push(`Bottle round index must be between 0 and 4, found ${bottle.roundIndex}`);
    }

    return errors;
  }

  static validateSubmission(submission: TastingNotes[] | Submission, round: Round): string[] | boolean {
    const errors: string[] = [];

    // Handle TastingNotes[] case (simpler validation)
    if (Array.isArray(submission)) {
      return submission.length === 4 && 
             submission.every((note: TastingNotes) => 
               note && 
               note.bottleId && 
               note.note && 
               note.note.length >= 10
             );
    }

    // Handle Submission case (more complex validation)
    if (!Array.isArray(submission.tastingNotes) || submission.tastingNotes.length !== 4) {
      errors.push('Submission must have exactly 4 tasting notes');
    } else {
      const shortNotes = submission.tastingNotes.filter((note: TastingNotes) => 
        note.bottleId.length < 10 || (note.note && note.note.length < 10)
      );
      if (shortNotes.length > 0) {
        errors.push('All tasting notes must be at least 10 characters long');
      }
    }

    // Validate ranking if it exists (for Submission type)
    if ('ranking' in submission) {
      if (!Array.isArray(submission.ranking) || submission.ranking.length !== 4) {
        errors.push('Submission ranking must have exactly 4 bottles');
      } else if (new Set(submission.ranking).size !== 4) {
        errors.push('Submission ranking must not have duplicate bottles');
      } else {
        // Check if all ranked bottles are in the current round
        const invalidBottles = submission.ranking.filter((bottleId: string) => 
          !round.bottleIds.includes(bottleId)
        );
        if (invalidBottles.length > 0) {
          errors.push('Submission ranking contains bottles not in current round');
        }
      }
    }

    return errors.length > 0 ? errors : true;
  }
}

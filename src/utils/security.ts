import { Game, Player, AuditLogEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class SecurityManager {
  private static instance: SecurityManager;
  private auditLog: AuditLogEntry[] = [];

  private constructor() {}

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  generateGamePin(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  validateGamePin(game: Game, pin: string): boolean {
    return game.pin === pin;
  }

  generatePlayerToken(playerId: string): string {
    return uuidv4();
  }

  validatePlayerToken(player: Player, token: string): boolean {
    return player.token === token;
  }

  generateJoinUrl(gameId: string, pin: string): string {
    return `/join/${gameId}#${pin}`;
  }

  parseJoinUrl(url: string): { gameId: string; pin: string } | null {
    const match = url.match(/\/join\/([^#]+)#(\d{4})$/);
    if (!match) return null;
    return {
      gameId: match[1],
      pin: match[2],
    };
  }

  logAuditEvent(game: Game, action: string, details: Record<string, any> = {}): void {
    const entry: AuditLogEntry = {
      timestamp: new Date(),
      action,
      details,
    };
    this.auditLog.push(entry);
    game.auditLog.push(entry);
  }

  checkHostReassignment(game: Game): string | null {
    const activePlayers = game.players.filter(
      p => p.status === 'active' && p.id !== game.hostId
    );
    if (activePlayers.length === 0) return null;

    // Sort by join time (earliest first)
    activePlayers.sort((a: Player, b: Player) => a.createdAt.getTime() - b.createdAt.getTime());
    return activePlayers[0].id;
  }

  validateUniquePrices(bottles: { price: number }[]): boolean {
    const prices = new Set<number>();
    for (const bottle of bottles) {
      if (prices.has(bottle.price)) return false;
      prices.add(bottle.price);
    }
    return true;
  }

  validateLabelUniqueness(bottles: { labelName: string }[]): boolean {
    const labels = new Set<string>();
    for (const bottle of bottles) {
      const lowerCaseLabel = bottle.labelName.toLowerCase();
      if (labels.has(lowerCaseLabel)) return false;
      labels.add(lowerCaseLabel);
    }
    return true;
  }
}

export const security = SecurityManager.getInstance();

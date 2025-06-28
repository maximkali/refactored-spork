import { Game, Player, AnalyticsEvent, AuditLogEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class Analytics {
  private static instance: Analytics;
  private events: AnalyticsEvent[] = [];

  private constructor() {}

  public static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  trackEvent(
    type: AnalyticsEvent['type'],
    gameId: string,
    playerId: string,
    metadata: Record<string, any> = {}
  ): void {
    const event: AnalyticsEvent = {
      type,
      timestamp: new Date(),
      gameId,
      playerId,
      metadata,
    };
    this.events.push(event);
    this.sendEventToServer(event);
  }

  private sendEventToServer(event: AnalyticsEvent): void {
    // TODO: Implement server-side analytics collection
    console.log('Analytics event:', event);
  }

  getMetrics(gameId: string): Record<string, any> {
    const gameEvents = this.events.filter(e => e.gameId === gameId);
    return {
      avgSubmissionTime: this.calculateAvgSubmissionTime(gameEvents),
      avgNoteLength: this.calculateAvgNoteLength(gameEvents),
      scoreDistribution: this.calculateScoreDistribution(gameEvents),
    };
  }

  private calculateAvgSubmissionTime(events: AnalyticsEvent[]): number {
    const submitEvents = events.filter(e => e.type === 'submit_round');
    if (submitEvents.length === 0) return 0;
    const totalDuration = submitEvents.reduce((sum, e) => {
      const { metadata } = e;
      return sum + (metadata.duration || 0);
    }, 0);
    return totalDuration / submitEvents.length;
  }

  private calculateAvgNoteLength(events: AnalyticsEvent[]): number {
    const submitEvents = events.filter(e => e.type === 'submit_round');
    if (submitEvents.length === 0) return 0;
    const totalLength = submitEvents.reduce((sum, e) => {
      const { metadata } = e;
      return sum + (metadata.noteLength || 0);
    }, 0);
    return totalLength / submitEvents.length;
  }

  private calculateScoreDistribution(events: AnalyticsEvent[]): Record<number, number> {
    const scores: Record<number, number> = {};
    const revealEvents = events.filter(e => e.type === 'round_reveal');
    revealEvents.forEach(e => {
      const { metadata } = e;
      const score = metadata.score as number;
      scores[score] = (scores[score] || 0) + 1;
    });
    return scores;
  }
}

export const analytics = Analytics.getInstance();

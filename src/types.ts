import { v4 as uuidv4 } from 'uuid';

// Define array types
export type BottleArray = Array<Bottle>;
export type RoundArray = Array<Round>;
export type PlayerArray = Array<Player>;

export type Status = 'setup' | 'lobby' | 'in_round' | 'countdown' | 'reveal' | 'gambit' | 'final';
export type PlayerStatus = 'active' | 'kicked' | 'spectator';

export type GameAction = 
  | 'KICK_PLAYER' 
  | 'RENAME_PLAYER' 
  | 'END_GAME'
  | 'UPDATE_GAME'
  | 'SUBMIT_GAMBIT'
  | 'ADVANCE_ROUND'
  | 'UNDO_ROUND'
  | 'REOPEN_ROUND'
  | 'CLOSE_ROUND'
  | 'SUBMIT_TASTING';

export type Permission = GameAction;

export interface GameActionPayload {
  playerId?: string;
  newName?: string;
  game?: Partial<Game>;
  roundIndex?: number;
  tastingNotes?: TastingNotes[];
  [key: string]: any;
}

export interface Bottle {
  id: string;
  labelName: string;
  funName?: string;
  price: number;
  roundIndex: number;
}

export interface Round {
  index: number;
  bottleIds: string[];
  submissions: Submission[];
  revealed: boolean;
}

export interface Player {
  id: string;
  displayName: string;
  score: number;
  isHost: boolean;
  status: PlayerStatus;
  token: string;
  lastActive: Date;
  createdAt: Date;
}

export interface TastingNotes {
  bottleId: string;
  note: string;
}

export interface Submission {
  playerId: string;
  roundIndex: number;
  tastingNotes: TastingNotes[];
  ranking: string[];
  locked: boolean;
  points: number;
  submittedAt?: string;
}

export interface Gambit {
  id: string;
  mostExpensive: string;
  leastExpensive: string;
  favorite: string;
  points: number;
}

export interface TimelineStep {
  timestamp: Date;
  action: string;
  data: any;
}

export interface TimelineState {
  currentStep: number;
  steps: TimelineStep[];
}

export interface AuditLogEntry {
  timestamp: Date;
  action: string;
  details: Record<string, any>;
}

export interface AnalyticsEvent {
  type: 'game_start' | 'submit_round' | 'round_reveal' | 'gambit_start' | 'final_download';
  timestamp: Date;
  gameId: string;
  playerId: string;
  metadata: Record<string, any>;
}

export interface Game {
  id: string;
  status: Status;
  currentRound: 1 | 2 | 3 | 4 | 5;
  bottles: BottleArray;
  rounds: RoundArray;
  players: PlayerArray;
  gambits: Gambit[];
  createdAt: Date;
  updatedAt: Date;
  pin: string; // 4-digit PIN for join URL
  auditLog: AuditLogEntry[];
  hostId: string;
}

// Helper functions
export function createBottle(labelName: string, price: number, funName?: string): Bottle {
  return {
    id: uuidv4(),
    labelName,
    funName,
    price,
    roundIndex: 0
  };
}

export function createPlayer(displayName: string, isHost: boolean): Player {
  const now = new Date();
  return {
    id: uuidv4(),
    displayName,
    score: 0,
    isHost,
    status: 'active' as PlayerStatus,
    token: uuidv4(),
    lastActive: now,
    createdAt: now
  };
}

export function createRound(index: number): Round {
  return {
    index,
    bottleIds: [],
    submissions: [],
    revealed: false
  };
}

export function createGame(): Game {
  return {
    id: uuidv4(),
    status: 'setup' as Status,
    currentRound: 1,
    bottles: [],
    rounds: Array(5).fill(null).map((_, i) => createRound(i)),
    players: [],
    gambits: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    pin: Math.floor(1000 + Math.random() * 9000).toString(),
    auditLog: [],
    hostId: uuidv4()
  };
}

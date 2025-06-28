import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  Game, 
  Player, 
  PlayerStatus, 
  Status, 
  TimelineState, 
  GameAction, 
  GameActionPayload,
  Permission,
  Submission
} from '../types';

interface AdminContextType {
  state: {
    game: Game;
    timeline: TimelineState;
  };
  player: Player | null;
  onAction: <T extends GameAction>(
    action: T, 
    data: GameActionPayload
  ) => void;
  hasPermission: (permission: Permission) => boolean;
  availableActions: Permission[];
}

export const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [state, setState] = useState<Omit<AdminContextType['state'], 'player'>>({
    game: {
      id: '',
      status: 'setup' as const,
      currentRound: 1,
      bottles: [],
      rounds: [],
      players: [],
      gambits: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      pin: '',
      auditLog: [],
      hostId: ''
    },
    timeline: {
      currentStep: 0,
      steps: []
    }
  });

  const availableActions: Permission[] = [
    'KICK_PLAYER',
    'RENAME_PLAYER',
    'END_GAME',
    'UPDATE_GAME',
    'SUBMIT_GAMBIT',
    'ADVANCE_ROUND',
    'UNDO_ROUND',
    'REOPEN_ROUND',
    'CLOSE_ROUND',
    'SUBMIT_TASTING'
  ];

  const hasPermission = useCallback((permission: Permission): boolean => {
    return availableActions.includes(permission);
  }, []);

  const onAction = useCallback(<T extends GameAction>(
    action: T, 
    data: GameActionPayload
  ) => {
    // Ensure displayName is always a string
    if (action === 'RENAME_PLAYER' && data.newName !== undefined) {
      data.newName = String(data.newName);
    }
    setState((prev: AdminContextType['state']) => {
      const newState = { ...prev };
      
      switch (action) {
        case 'KICK_PLAYER':
          newState.game.players = newState.game.players.filter(
            (p: Player) => p.id !== data.playerId
          );
          break;
          
        case 'RENAME_PLAYER':
          if (data.playerId && data.newName) {
            newState.game.players = newState.game.players.map((p: Player) => 
              p.id === data.playerId ? { 
                ...p, 
                displayName: String(data.newName) // Ensure displayName is always a string
              } : p
            );
          }
          break;
          
        case 'END_GAME':
          newState.game.status = 'final';
          break;
          
        case 'UPDATE_GAME':
          newState.game = { ...newState.game, ...data.game };
          break;
          
        case 'SUBMIT_TASTING':
          if (data.roundIndex !== undefined && data.playerId && data.tastingNotes) {
            const roundIndex = newState.game.rounds.findIndex(r => r.index === data.roundIndex);
            if (roundIndex !== -1) {
              const submissionIndex = newState.game.rounds[roundIndex].submissions.findIndex(
                s => s.playerId === data.playerId
              );
              
              if (submissionIndex !== -1) {
                const submission = newState.game.rounds[roundIndex].submissions[submissionIndex];
                newState.game.rounds[roundIndex].submissions[submissionIndex] = {
                  ...submission,
                  tastingNotes: data.tastingNotes || submission.tastingNotes,
                  ranking: data.ranking || submission.ranking,
                  locked: data.locked !== undefined ? data.locked : submission.locked,
                  points: data.points !== undefined ? data.points : submission.points,
                  submittedAt: new Date().toISOString()
                };
              } else {
                const newSubmission: Submission = {
                  playerId: data.playerId!,
                  roundIndex: data.roundIndex!,
                  tastingNotes: data.tastingNotes || [],
                  ranking: [],
                  locked: false,
                  points: 0,
                  submittedAt: new Date().toISOString()
                };
                newState.game.rounds[roundIndex].submissions.push(newSubmission);
              }
            }
          }
          break;
      }
      
      newState.timeline.steps.push({
        timestamp: new Date(),
        action,
        data
      });
      
      newState.game.updatedAt = new Date();
      newState.timeline.currentStep++;
      
      return newState;
    });
  }, []);

  return (
    <AdminContext.Provider value={{
      state,
      player,
      onAction,
      hasPermission,
      availableActions: []
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = React.useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

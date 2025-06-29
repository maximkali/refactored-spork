import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Game, createGame, Player, createPlayer, Bottle } from '../types';

interface GameContextType {
  game: Game;
  currentPlayer: Player | null;
  setCurrentPlayer: (player: Player) => void;
  updateGame: (updates: Partial<Game>) => void;
  addBottle: (bottle: Omit<Bottle, 'id'>) => void;
  updateBottle: (id: string, updates: Partial<Bottle>) => void;
  deleteBottle: (id: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [game, setGame] = useState<Game>(() => {
    const samplePlayer: Player = {
      id: 'sample-player',
      displayName: 'Sample Player',
      score: 0,
      isHost: true,
      status: 'active' as const,
      token: 'sample-token',
      lastActive: new Date(),
      createdAt: new Date()
    };

    const sampleGame: Game = {
      id: 'sample-game',
      pin: '1234',
      status: 'setup' as const,
      players: [samplePlayer],
      bottles: [],
      rounds: [],
      currentRound: 1,
      gambits: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      auditLog: [],
      hostId: 'sample-player'
    };

    return sampleGame;
  });
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

  const updateGame = useCallback((updates: Partial<Game>) => {
    setGame(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date()
    }));
  }, []);

  const addBottle = useCallback((bottle: Omit<Bottle, 'id'>) => {
    const newBottle: Bottle = {
      ...bottle,
      id: Math.random().toString(36).substr(2, 9)
    };
    setGame(prev => ({
      ...prev,
      bottles: [...prev.bottles, newBottle],
      updatedAt: new Date()
    }));
  }, []);

  const updateBottle = useCallback((id: string, updates: Partial<Bottle>) => {
    setGame(prev => ({
      ...prev,
      bottles: prev.bottles.map(bottle => 
        bottle.id === id ? { ...bottle, ...updates } : bottle
      ),
      updatedAt: new Date()
    }));
  }, []);

  const deleteBottle = useCallback((id: string) => {
    setGame(prev => ({
      ...prev,
      bottles: prev.bottles.filter(bottle => bottle.id !== id),
      updatedAt: new Date()
    }));
  }, []);

  useEffect(() => {
    const samplePlayer = createPlayer('Player 1', true);
    setCurrentPlayer(samplePlayer);
    
    const sampleGame = createGame();
    sampleGame.players = [samplePlayer];
    updateGame(sampleGame);
  }, []);

  return (
    <GameContext.Provider 
      value={{ 
        game, 
        currentPlayer, 
        setCurrentPlayer, 
        updateGame,
        addBottle,
        updateBottle,
        deleteBottle
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

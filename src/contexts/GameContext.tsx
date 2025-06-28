import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Game, createGame, Player, createPlayer } from '../types';

interface GameContextType {
  game: Game;
  currentPlayer: Player | null;
  setCurrentPlayer: (player: Player) => void;
  updateGame: (updates: Partial<Game>) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [game, setGame] = useState<Game>(createGame());
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

  const updateGame = (updates: Partial<Game>) => {
    setGame(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date()
    }));
  };

  // Initialize with a sample game state for development
  useEffect(() => {
    const samplePlayer = createPlayer('Player 1', true);
    setCurrentPlayer(samplePlayer);
    
    const sampleGame = createGame();
    sampleGame.players = [samplePlayer];
    updateGame(sampleGame);
  }, []);

  return (
    <GameContext.Provider value={{ game, currentPlayer, setCurrentPlayer, updateGame }}>
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

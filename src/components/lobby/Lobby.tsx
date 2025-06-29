import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext';
import { useAdmin } from '../../contexts/AdminContext';
import { v4 as uuidv4 } from 'uuid';
import { BottleManager } from '../admin/BottleManager';
import { GameSetupWizard } from '../setup/GameSetupWizard';
import { Bottle, Game } from '../../types';
import './Lobby.css';
import '../admin/BottleManager.css';

export const Lobby: React.FC = () => {
  const { game, currentPlayer, updateGame } = useGame();
  const { onAction } = useAdmin();
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [setupComplete, setSetupComplete] = useState(false);
  const navigate = useNavigate();
  
  const isHost = currentPlayer?.isHost || false;
  const activePlayers = game.players.filter(p => p.status === 'active');
  const spectatorCount = game.players.length - activePlayers.length;
  const hasBottles = game.bottles.length > 0;

  // Redirect to round if game is in progress (status is 'in_round')
  useEffect(() => {
    if (currentPlayer && game.status === 'in_round') {
      navigate('/round/1');
    }
  }, [currentPlayer, game.status, navigate]);

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    const now = new Date();
    const newPlayer = {
      id: uuidv4(),
      displayName: playerName.trim(),
      score: 0,
      isHost: game.players.length === 0,
      status: 'active' as const,
      token: uuidv4(),
      lastActive: now,
      createdAt: now
    };

    updateGame({
      players: [...game.players, newPlayer]
    });
  };

  const startGame = () => {
    // Allow starting with just the admin (first player)
    if (game.players.length < 1) {
      setError('No players in the game');
      return;
    }
    
    // First update the game status to 'in_round'
    updateGame({ status: 'in_round' });
    
    // Then advance to the first round
    onAction('ADVANCE_ROUND', { roundNumber: 1 });
  };

  // Handle bottle updates from the BottleManager
  const handleBottlesUpdate = useCallback((updatedBottles: Bottle[]) => {
    updateGame({ bottles: updatedBottles });
    
    // Clear any previous errors when bottles are updated
    if (updatedBottles.length > 0) {
      setError('');
    }
  }, [updateGame]);

  // Mark setup as complete and generate game code
  const completeSetup = useCallback(() => {
    if (game.bottles.length === 0) {
      setError('Please add at least one bottle before completing setup');
      return;
    }
    
    // Validate all bottles have required fields
    const invalidBottles = game.bottles.filter(
      bottle => !bottle.labelName || !bottle.funName || typeof bottle.price === 'undefined' || typeof bottle.roundIndex === 'undefined'
    );
    
    if (invalidBottles.length > 0) {
      setError('Please fill in all fields for all bottles before completing setup');
      return;
    }
    
    // Generate a simple 4-digit game code if not already set
    const updates: Partial<Game> = { 
      status: 'lobby',
      // Ensure we have at least one round
      currentRound: 1
    };
    
    if (!game.pin) {
      updates.pin = Math.floor(1000 + Math.random() * 9000).toString();
    }
    
    // Initialize rounds based on the bottles
    const maxRound = Math.max(0, ...game.bottles.map(b => b.roundIndex)) + 1;
    updates.rounds = Array.from({ length: Math.max(1, maxRound) }, (_, i) => ({
      index: i,
      bottleIds: game.bottles
        .filter(bottle => bottle.roundIndex === i)
        .map(bottle => bottle.id),
      submissions: [],
      revealed: false
    }));
    
    // Ensure we have at least one round with bottles
    if (updates.rounds.every(round => round.bottleIds.length === 0)) {
      // If no bottles are assigned to any round, assign all to round 0
      updates.rounds = [{
        index: 0,
        bottleIds: game.bottles.map(b => b.id),
        submissions: [],
        revealed: false
      }];
    }
    
    updateGame(updates);
    setSetupComplete(true);
    setError('');
  }, [game.bottles, game.pin, updateGame]);

  // Render the setup screen for the host
  if (isHost && game.status === 'setup') {
    return (
      <div className="setup-screen">
        <div className="setup-header">
          <div className="whine-emoji" role="img" aria-label="Wine glass">🍷</div>
          <h1>Winey</h1>
          <p className="setup-instructions">
            Let's set up your tasting adventure! Complete the basic settings below to get started. 
            Then, add each wine's details - we'll need the label name, a fun nickname, price, and which 
            round it should be served. Don't worry, you can tweak everything later if needed.
          </p>
        </div>
        
        <div className="space-y-8">
          <div className="setup-wizard-container">
            <GameSetupWizard 
              onSetupComplete={(setup) => {
                // Initialize bottles based on the setup
                const initialBottles = Array(setup.bottles).fill(null).map((_, index) => ({
                  id: uuidv4(),
                  labelName: '',
                  funName: `Bottle ${index + 1}`,
                  price: 0,
                  roundIndex: Math.floor(index / setup.bottlesPerRound)
                }));
                updateGame({ bottles: initialBottles });
              }}
            />
          </div>
          
          {game.bottles.length > 0 && (
            <div className="bottle-manager-container">
              <BottleManager 
                bottles={game.bottles}
                onUpdateBottles={handleBottlesUpdate}
                showHeading={true}
              />
              
              {error && (
                <div className="error-message mt-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 inline mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {error}
                </div>
              )}
              
              <div className="setup-actions mt-6">
                <button 
                  onClick={completeSetup}
                  className="btn btn-primary btn-lg"
                >
                  Complete Setup & Generate Game Code
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  {game.bottles.length} bottle{game.bottles.length !== 1 ? 's' : ''} added
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="lobby">
      <div className="text-center max-w-3xl mx-auto">
        <div className="whine-emoji mb-4" role="img" aria-label="Wine glass">🍷</div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Winey
        </h1>
        <p className="text-xl text-secondary mb-8">The Ultimate Bottle Tasting Game</p>
        
        {game.pin && (
          <div className="game-code">
            <h2 className="text-2xl font-semibold mb-4">Game Code</h2>
            <div className="code-display">{game.pin}</div>
            <p className="code-instructions">Share this code with other players to join</p>
          </div>
        )}
        
        {!currentPlayer ? (
          <div className="join-form">
            <h2>Join Game</h2>
            <div className="join-form-content">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                className="join-input"
              />
              <button 
                onClick={handleJoinGame}
                className="btn btn-primary btn-lg w-full"
                disabled={!playerName.trim()}
              >
                Join Game
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>
        ) : (
          <div className="lobby-content">
            <h2 className="text-2xl font-semibold mb-6">Waiting for Host to Start</h2>
            
            <div className="player-list">
              <h3 className="text-lg font-medium mb-4">Players ({activePlayers.length})</h3>
              <ul className="player-grid">
                {activePlayers.map(player => (
                  <li key={player.id} className="player-item">
                    <span className={`player-name ${player.isHost ? 'host' : ''}`}>
                      {player.displayName}
                      {player.isHost && <span className="host-badge">Host</span>}
                    </span>
                  </li>
                ))}
              </ul>
              
              {spectatorCount > 0 && (
                <p className="spectator-count">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  {spectatorCount} spectator{spectatorCount !== 1 ? 's' : ''} watching
                </p>
              )}
            </div>
            
            {isHost && (
              <div className="game-controls mt-8">
                <button 
                  onClick={startGame}
                  disabled={game.bottles.length === 0}
                  className={`btn btn-primary btn-lg ${game.bottles.length === 0 ? 'disabled' : ''}`}
                  title={game.bottles.length === 0 ? 'Please add at least one bottle before starting' : 'Start the game with the current players'}
                >
                  Start Game
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {game.bottles.length === 0 && (
                  <p className="text-sm text-amber-600 mt-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Add at least one bottle to start the game
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


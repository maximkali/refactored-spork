import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext';
import { useAdmin } from '../../contexts/AdminContext';
import { v4 as uuidv4 } from 'uuid';
import './Lobby.css';

export const Lobby: React.FC = () => {
  const { game, currentPlayer, updateGame } = useGame();
  const { onAction } = useAdmin();
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const isHost = currentPlayer?.isHost || false;
  const activePlayers = game.players.filter(p => p.status === 'active');
  const spectatorCount = game.players.length - activePlayers.length;

  useEffect(() => {
    if (currentPlayer) {
      navigate('/round/1');
    }
  }, [currentPlayer, navigate]);

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
    onAction('ADVANCE_ROUND', { roundNumber: 1 });
  };

  return (
    <div className="lobby">
      <h1>Welcome to Bottle Tasting Game</h1>
      
      {!currentPlayer ? (
        <div className="join-form">
          <h2>Join Game</h2>
          <div className="name-input">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
            />
            <button onClick={handleJoinGame}>Join</button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>
      ) : (
        <div className="game-lobby">
          <h2>Game Lobby</h2>
          <div className="players-list">
            <h3>Players ({activePlayers.length})</h3>
            {activePlayers.map((player) => (
              <div key={player.id} className="player-item">
                <span>
                  {player.displayName}
                  {player.isHost && <span className="host-badge">Host</span>}
                </span>
              </div>
            ))}
          </div>
          
          {spectatorCount > 0 && (
            <div className="spectator-count">
              {spectatorCount} spectator{spectatorCount !== 1 ? 's' : ''} watching
            </div>
          )}
          
          {isHost && (
            <div className="host-controls">
              <h3>Host Controls</h3>
              <button 
                onClick={startGame}
                disabled={activePlayers.length < 2}
              >
                Start Game
              </button>
              {activePlayers.length < 2 && (
                <div className="error-message">
                  Need at least 2 players to start
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Lobby;

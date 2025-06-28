import React, { useState } from 'react';
import { Game, Status, PlayerStatus } from '../../types';
import { GameAction, getAvailableActions } from '../../game/permissions';
import { kickPlayer, renamePlayer, endGame } from '../../game/player';
import { TimelineState } from '../../game/timeline';

interface AdminDashboardProps {
  game: Game;
  isHost: boolean;
  timeline: TimelineState;
  onAction: (action: GameAction, data?: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  game,
  isHost,
  timeline,
  onAction
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'players' | 'controls'>('status');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const availableActions = getAvailableActions('active', isHost, game);

  const filteredPlayers = game.players.filter(player => {
    return player.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           player.id.includes(searchQuery.toLowerCase());
  });

  const handleRenamePlayer = (playerId: string) => {
    if (newName.trim()) {
      onAction(GameAction.RENAME_PLAYER, { playerId, newName });
      setNewName('');
      setSelectedPlayerId(null);
    }
  };

  const handleKickPlayer = (playerId: string) => {
    onAction(GameAction.KICK_PLAYER, { playerId });
  };

  const handleEndGame = () => {
    onAction(GameAction.END_GAME);
  };

  return (
    <div className="admin-dashboard">
      {/* Floating gear icon */}
      <button
        className="admin-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle admin dashboard"
      >
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 3.1-3 5.5 0 .65.13 1.3.35 1.91l2.35 3.07c.2.27.46.53.75.75.32.22.69.33 1.07.33.36 0 .72-.11 1.05-.33.29-.22.53-.48.75-.75L15.65 15c.22-.61.35-1.26.35-1.91 0-2.41-3-3.5-3-5.5 0-2.21 1.79-4 4-4z" />
        </svg>
      </button>

      {/* Dashboard panel */}
      {isOpen && (
        <div className="admin-panel">
          <div className="admin-header">
            <h2>Admin Dashboard</h2>
            <button onClick={() => setIsOpen(false)}>Close</button>
          </div>

          <div className="admin-tabs">
            <button
              className={activeTab === 'status' ? 'active' : ''}
              onClick={() => setActiveTab('status')}
            >
              Status
            </button>
            <button
              className={activeTab === 'players' ? 'active' : ''}
              onClick={() => setActiveTab('players')}
            >
              Players
            </button>
            <button
              className={activeTab === 'controls' ? 'active' : ''}
              onClick={() => setActiveTab('controls')}
            >
              Controls
            </button>
          </div>

          {activeTab === 'status' && (
            <div className="status-section">
              <div className="round-status">
                <h3>Round Status</h3>
                <p>Current Round: {game.currentRound}</p>
                <p>Status: {game.status}</p>
              </div>
              <div className="countdown">
                <h3>Countdown Timer</h3>
                <p>{game.status === 'countdown' ? '10s' : 'Not active'}</p>
              </div>
              <div className="submission-progress">
                <h3>Submission Progress</h3>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `$${game.rounds[game.currentRound - 1].submissions.length / 
                        game.players.filter(p => p.status === 'active').length * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'players' && (
            <div className="players-section">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="players-list">
                {filteredPlayers.map((player) => (
                  <div key={player.id} className="player-item">
                    <div className="player-info">
                      <span className="player-name">{player.displayName}</span>
                      <span className="player-score">Score: {player.score}</span>
                    </div>
                    <div className="player-actions">
                      <button
                        onClick={() => setSelectedPlayerId(player.id)}
                        disabled={selectedPlayerId === player.id}
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => handleKickPlayer(player.id)}
                        disabled={player.isHost}
                      >
                        Kick
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="controls-section">
              <div className="control-group">
                <button
                  onClick={() => onAction(GameAction.CLOSE_ROUND)}
                  disabled={!availableActions.includes(GameAction.CLOSE_ROUND)}
                >
                  Close Round
                </button>
                <button
                  onClick={() => onAction(GameAction.UNDO_ROUND)}
                  disabled={!availableActions.includes(GameAction.UNDO_ROUND)}
                >
                  Undo Round
                </button>
              </div>
              <div className="control-group">
                <button
                  onClick={() => onAction(GameAction.REOPEN_ROUND, { playerId: selectedPlayerId })}
                  disabled={!availableActions.includes(GameAction.REOPEN_ROUND) || !selectedPlayerId}
                >
                  Reopen Round
                </button>
              </div>
              <div className="control-group">
                <button
                  onClick={() => onAction(GameAction.ADVANCE_ROUND)}
                  disabled={!availableActions.includes(GameAction.ADVANCE_ROUND)}
                >
                  Advance
                </button>
                <button
                  onClick={handleEndGame}
                  disabled={!availableActions.includes(GameAction.END_GAME)}
                >
                  End Game Early
                </button>
              </div>
            </div>
          )}

          <div className="audit-log">
            <h3>Audit Log</h3>
            <div className="log-entries">
              {timeline.steps.map((step) => (
                <div key={step.id} className="log-entry">
                  <span className="timestamp">{new Date(step.timestamp).toLocaleString()}</span>
                  <span className="action">{step.type}</span>
                  {step.data && (
                    <span className="details">
                      {step.data.roundIndex && `Round: ${step.data.roundIndex}`}
                      {step.data.scores && `Scores updated`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add styles
const styles = `:global {
  .admin-dashboard {
    position: relative;
  }

  .admin-toggle {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid #333;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
  }

  .admin-toggle:hover {
    transform: scale(1.1);
  }

  .admin-panel {
    position: fixed;
    top: 0;
    right: 0;
    width: 350px;
    height: 100vh;
    background: #fff;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    padding: 20px;
    overflow-y: auto;
  }

  .admin-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .admin-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  .admin-tabs button {
    padding: 8px 16px;
    border: none;
    background: #f0f0f0;
    border-radius: 4px;
    cursor: pointer;
  }

  .admin-tabs button.active {
    background: #333;
    color: #fff;
  }

  .status-section, .players-section, .controls-section {
    margin-bottom: 20px;
  }

  .progress-bar {
    width: 100%;
    height: 10px;
    background: #f0f0f0;
    border-radius: 5px;
    margin-top: 10px;
  }

  .progress-fill {
    height: 100%;
    background: #333;
    border-radius: 5px;
    transition: width 0.3s;
  }

  .players-list {
    margin-top: 10px;
  }

  .player-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #eee;
  }

  .player-info {
    display: flex;
    flex-direction: column;
  }

  .player-name {
    font-weight: bold;
  }

  .player-score {
    font-size: 0.9em;
    color: #666;
  }

  .control-group {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }

  .audit-log {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #eee;
  }

  .log-entries {
    margin-top: 10px;
  }

  .log-entry {
    display: flex;
    align-items: center;
    padding: 5px 0;
    border-bottom: 1px solid #eee;
  }

  .timestamp {
    color: #666;
    margin-right: 10px;
  }

  button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    background: #333;
    color: #fff;
  }

  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  input {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    width: 100%;
  }
}
`;

export default styles;

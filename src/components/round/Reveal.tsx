import React, { useState, useEffect } from 'react';
import { Game, Status } from '../../types';
import { useAdmin } from '../../contexts/AdminContext';

interface RevealProps {
  game: Game;
  currentRound: number;
  onNextRound: () => void;
}

export const Reveal: React.FC<RevealProps> = ({ game, currentRound, onNextRound }) => {
  const [showPoints, setShowPoints] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { onAction } = useAdmin();

  const currentRoundBottles = game.rounds[currentRound - 1].bottleIds;
  const bottleFunNames = currentRoundBottles.map(id => {
    const bottle = game.bottles.find(b => b.id === id);
    return bottle?.funName || `Bottle ${currentRoundBottles.indexOf(id) + 1}`;
  });

  // Animate the reveal
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPoints(true);
    }, 1000);

    const timer2 = setTimeout(() => {
      setShowLeaderboard(true);
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, []);

  const handleNextRound = () => {
    if (game.status === 'gambit') {
      onAction('SUBMIT_GAMBIT', {}); // Add empty payload
    } else {
      onAction('ADVANCE_ROUND', { roundIndex: currentRound - 1 }); // Add round index
    }
    onNextRound();
  };

  const getRoundPoints = (playerId: string): number => {
    const round = game.rounds[currentRound - 1];
    const submission = round.submissions.find(s => s.playerId === playerId);
    return submission ? submission.points : 0;
  };

  const getLeaderboard = () => {
    return game.players
      .filter(p => p.status === 'active')
      .sort((a, b) => b.score - a.score)
      .map((player, index) => ({
        rank: index + 1,
        name: player.displayName,
        score: player.score,
        roundPoints: getRoundPoints(player.id)
      }));
  };

  return (
    <div className="reveal">
      <div className="reveal-content">
        <h2>Round {currentRound} Results</h2>

        {/* Bottle Order */}
        <div className="bottle-order">
          <h3>Correct Order</h3>
          <div className="bottles-list">
            {bottleFunNames.map((name, index) => (
              <div key={index} className="bottle-item">
                <div className="bottle-rank">${'$'.repeat(4 - index)}</div>
                <div className="bottle-name">{name}</div>
                {index === 0 && (
                  <div className="crown">👑</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Player Points */}
        {showPoints && (
          <div className="player-points">
            <h3>Round Points</h3>
            <div className="points-grid">
              {game.players
                .filter(p => p.status === 'active')
                .map((player) => (
                  <div key={player.id} className="player-row">
                    <div className="player-name">{player.displayName}</div>
                    <div className="player-points">{getRoundPoints(player.id)}</div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {showLeaderboard && (
          <div className="leaderboard">
            <h3>Leaderboard</h3>
            <div className="leaderboard-grid">
              {getLeaderboard().map((entry) => (
                <div key={entry.rank} className="leader-row">
                  <div className="rank">{entry.rank}</div>
                  <div className="name">{entry.name}</div>
                  <div className="score">{entry.score}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Round Button */}
        <div className="next-round">
          <button onClick={handleNextRound} disabled={!showLeaderboard}>
            {game.status === 'gambit' ? 'Submit Gambit' : 'Next Round'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Add styles
const styles = `:global {
  .reveal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .reveal-content {
    background: #fff;
    padding: 20px;
    border-radius: 4px;
    max-width: 800px;
    width: 90%;
    text-align: center;
  }

  .bottle-order {
    margin-bottom: 20px;
  }

  .bottles-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
  }

  .bottle-item {
    display: flex;
    align-items: center;
    padding: 10px;
    background: #f8f8f8;
    border-radius: 4px;
  }

  .bottle-rank {
    min-width: 50px;
    font-weight: bold;
  }

  .crown {
    margin-left: 10px;
    font-size: 1.5em;
    color: gold;
  }

  .player-points {
    margin: 20px 0;
  }

  .points-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 10px;
  }

  .player-row {
    display: flex;
    justify-content: space-between;
    padding: 8px;
    background: #f8f8f8;
    border-radius: 4px;
  }

  .leaderboard {
    margin-top: 20px;
  }

  .leaderboard-grid {
    display: grid;
    grid-template-columns: 50px 1fr 1fr;
    gap: 10px;
    margin-top: 10px;
  }

  .leader-row {
    display: flex;
    align-items: center;
    padding: 8px;
    background: #f8f8f8;
    border-radius: 4px;
  }

  .next-round {
    margin-top: 20px;
  }

  button {
    padding: 10px 20px;
    background: #333;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
  }

  button:hover {
    background: #555;
  }

  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
}
`;

export default styles;

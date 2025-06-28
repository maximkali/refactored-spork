import React, { useState } from 'react';
import { Game, Player, Gambit } from '../../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useAdmin } from '../../contexts/AdminContext';

interface FinalSummaryProps {
  game: Game;
  player: Player;
  onExportComplete: () => void;
}

export const FinalSummary: React.FC<FinalSummaryProps> = ({ game, player, onExportComplete }) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const { onAction } = useAdmin();

  // Sort players by score
  const sortedPlayers = [...game.players]
    .filter(p => p.status === 'active')
    .sort((a, b) => b.score - a.score);

  // Get player's gambit
  const playerGambit = game.gambits.find(g => g.id === player.id);

  // Sort bottles by price (descending)
  const sortedBottles = [...game.bottles].sort((a, b) => b.price - a.price);

  // Generate PDF
  const generatePDF = async () => {
    const doc = new jsPDF();
    
    // Add winner section
    doc.setFontSize(24);
    doc.text(`Winner: ${sortedPlayers[0].displayName}`, 10, 20);
    
    // Add leaderboard
    doc.setFontSize(12);
    doc.text('Final Leaderboard:', 10, 40);
    sortedPlayers.forEach((player, index) => {
      doc.text(`${index + 1}. ${player.displayName} - ${player.score} points`, 10, 50 + (index * 10));
    });

    // Add player's gambit
    if (playerGambit) {
      doc.setFontSize(16);
      doc.text('Your Gambit:', 10, 100);
      
      const gambitBottles = {
        mostExpensive: game.bottles.find(b => b.id === playerGambit.mostExpensive),
        leastExpensive: game.bottles.find(b => b.id === playerGambit.leastExpensive),
        favorite: game.bottles.find(b => b.id === playerGambit.favorite)
      };

      doc.setFontSize(12);
      doc.text(`Most Expensive Guess: ${gambitBottles.mostExpensive?.funName || 'Not selected'}`, 10, 120);
      doc.text(`Least Expensive Guess: ${gambitBottles.leastExpensive?.funName || 'Not selected'}`, 10, 130);
      doc.text(`Favorite: ${gambitBottles.favorite?.funName || 'Not selected'}`, 10, 140);
      doc.text(`Points: ${playerGambit.points}`, 10, 150);
    }

    // Add bottle table
    doc.setFontSize(16);
    doc.text('Master Bottle Table:', 10, 170);
    
    // Add table header
    doc.setFontSize(12);
    doc.text('Rank', 10, 190);
    doc.text('Fun Name', 40, 190);
    doc.text('Label Name', 100, 190);
    doc.text('Price', 160, 190);

    // Add table rows
    sortedBottles.forEach((bottle, index) => {
      const y = 200 + (index * 15);
      doc.text(`${index + 1}.`, 10, y);
      doc.text(bottle.funName || '', 40, y);
      doc.text(bottle.labelName, 100, y);
      doc.text(`$${bottle.price}`, 160, y);
    });

    // Save PDF
    doc.save(`winey_game_${game.id}.pdf`);
    onExportComplete();
  };

  // Copy shareable link
  const copyShareLink = async () => {
    const shareLink = `${window.location.origin}/share/${game.id}`;
    await navigator.clipboard.writeText(shareLink);
    alert('Shareable link copied to clipboard!');
  };

  return (
    <div className="final-summary">
      {/* Winner Banner */}
      <div className="winner-banner">
        <h1>Game Complete!</h1>
        <div className="winner-info">
          <div className="winner-name">Winner: {sortedPlayers[0].displayName}</div>
          <div className="winner-score">{sortedPlayers[0].score} points</div>
        </div>
      </div>

      {/* Final Leaderboard */}
      <div className="leaderboard">
        <h2>Final Leaderboard</h2>
        <div className="leaderboard-grid">
          {sortedPlayers.map((player, index) => (
            <div key={player.id} className="player-row">
              <div className="rank">{index + 1}</div>
              <div className="name">{player.displayName}</div>
              <div className="score">{player.score}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Personal Gambit Card */}
      {playerGambit && (
        <div className="gambit-card">
          <h2>Your Gambit Results</h2>
          <div className="gambit-grid">
            <div className="gambit-item">
              <div className="label">Most Expensive Guess:</div>
              <div className="value">{game.bottles.find(b => b.id === playerGambit.mostExpensive)?.funName}</div>
              <div className="result">{playerGambit.points >= 2 ? 'Correct!' : 'Incorrect'}</div>
            </div>
            <div className="gambit-item">
              <div className="label">Least Expensive Guess:</div>
              <div className="value">{game.bottles.find(b => b.id === playerGambit.leastExpensive)?.funName}</div>
              <div className="result">{playerGambit.points >= 4 ? 'Correct!' : 'Incorrect'}</div>
            </div>
            <div className="gambit-item">
              <div className="label">Favorite:</div>
              <div className="value">{game.bottles.find(b => b.id === playerGambit.favorite)?.funName}</div>
            </div>
            <div className="gambit-item">
              <div className="label">Total Gambit Points:</div>
              <div className="value">{playerGambit.points}</div>
            </div>
          </div>
        </div>
      )}

      {/* Master Bottle Table */}
      <div className="bottle-table">
        <h2>Master Bottle Table</h2>
        <div className="table-grid">
          <div className="header-row">
            <div className="cell">Rank</div>
            <div className="cell">Fun Name</div>
            <div className="cell">Label Name</div>
            <div className="cell">Price</div>
          </div>
          {sortedBottles.map((bottle, index) => (
            <div key={bottle.id} className="row">
              <div className="cell">{index + 1}</div>
              <div className="cell">{bottle.funName}</div>
              <div className="cell">{bottle.labelName}</div>
              <div className="cell">${bottle.price}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Controls */}
      <div className="export-controls">
        <button onClick={generatePDF}>
          Download PDF
        </button>
        <button onClick={copyShareLink}>
          Copy Share Link
        </button>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="export-modal">
          <div className="modal-content">
            <h3>Export Complete</h3>
            <p>Your PDF has been generated and downloaded.</p>
            <button onClick={() => setShowExportModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Add styles
const styles = `:global {
  .final-summary {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .winner-banner {
    background: #ffd700;
    padding: 20px;
    text-align: center;
    margin-bottom: 20px;
    border-radius: 4px;
  }

  .winner-info {
    margin-top: 10px;
  }

  .leaderboard {
    margin-bottom: 20px;
  }

  .leaderboard-grid {
    display: grid;
    grid-template-columns: 50px 1fr 1fr;
    gap: 10px;
    margin-top: 10px;
  }

  .player-row {
    display: flex;
    align-items: center;
    padding: 8px;
    background: #f8f8f8;
    border-radius: 4px;
  }

  .rank {
    min-width: 50px;
    font-weight: bold;
  }

  .gambit-card {
    background: #fff;
    padding: 20px;
    border-radius: 4px;
    margin-bottom: 20px;
  }

  .gambit-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-top: 10px;
  }

  .gambit-item {
    padding: 10px;
    background: #f8f8f8;
    border-radius: 4px;
  }

  .label {
    font-weight: bold;
  }

  .result {
    margin-top: 5px;
    color: ${(props: { theme: string }) => props.theme === 'dark' ? '#4CAF50' : '#4CAF50'};
  }

  .bottle-table {
    margin-bottom: 20px;
  }

  .table-grid {
    display: grid;
    gap: 0;
    margin-top: 10px;
    overflow-x: auto;
  }

  .header-row {
    display: grid;
    grid-template-columns: 50px 1fr 1fr 100px;
    background: #333;
    color: #fff;
    padding: 10px;
  }

  .row {
    display: grid;
    grid-template-columns: 50px 1fr 1fr 100px;
    padding: 10px;
    border-bottom: 1px solid #ddd;
  }

  .cell {
    padding: 5px;
  }

  .export-controls {
    display: flex;
    gap: 10px;
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

  .export-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .modal-content {
    background: #fff;
    padding: 20px;
    border-radius: 4px;
    text-align: center;
  }
}
`;

export default styles;

import React, { useState, useEffect } from 'react';
import type { Gambit } from '../../types';
import { Game, Player } from '../../types';
import { useAdmin } from '../../contexts/AdminContext';
import { validateGambit, createGambit } from '../../utils/gambit';

interface GambitProps {
  game: Game;
  player: Player;
  onGambitComplete: () => void;
}

export const GambitComponent: React.FC<GambitProps> = ({ game, player, onGambitComplete }) => {
  const [mostExpensive, setMostExpensive] = useState<string>('');
  const [leastExpensive, setLeastExpensive] = useState<string>('');
  const [favorite, setFavorite] = useState<string>('');
  const [showSubmit, setShowSubmit] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const { onAction } = useAdmin();

  const bottleOptions = game.bottles.map(bottle => ({
    value: bottle.id,
    label: bottle.funName || `Bottle ${game.bottles.indexOf(bottle) + 1}`
  }));

  const handleMostExpensiveChange = (value: string) => {
    setMostExpensive(value);
    if (value === leastExpensive) {
      setLeastExpensive('');
    }
    setShowSubmit(!!value && !!leastExpensive && !!favorite);
  };

  const handleLeastExpensiveChange = (value: string) => {
    setLeastExpensive(value);
    if (value === mostExpensive) {
      setMostExpensive('');
    }
    setShowSubmit(!!value && !!mostExpensive && !!favorite);
  };

  const handleFavoriteChange = (value: string) => {
    setFavorite(value);
    setShowSubmit(!!value && !!leastExpensive && !!mostExpensive);
  };

  const handleSubmit = () => {
    const gambit = createGambit(player.id, mostExpensive, leastExpensive, favorite);
    const validationErrors = validateGambit(gambit, game);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setShowConfirmation(true);
  };

  const confirmSubmit = () => {
    const gambit = createGambit(player.id, mostExpensive, leastExpensive, favorite);
    onAction('SUBMIT_GAMBIT', { gambit });
    onGambitComplete();
  };

  useEffect(() => {
    if (showSubmit) {
      setErrors([]);
    }
  }, [showSubmit]);

  return (
    <div className="gambit">
      <h2>Sommelier's Gambit</h2>
      
      {/* Error display */}
      {errors.length > 0 && (
        <div className="errors">
          {errors.map((error, index) => (
            <div key={index} className="error-message">{error}</div>
          ))}
        </div>
      )}

      {/* Most Expensive Selection */}
      <div className="gambit-selection">
        <h3>Most Expensive Bottle</h3>
        <select
          value={mostExpensive}
          onChange={(e) => handleMostExpensiveChange(e.target.value)}
          disabled={showSubmit}
        >
          <option value="">Select a bottle...</option>
          {bottleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Least Expensive Selection */}
      <div className="gambit-selection">
        <h3>Least Expensive Bottle</h3>
        <select
          value={leastExpensive}
          onChange={(e) => handleLeastExpensiveChange(e.target.value)}
          disabled={showSubmit}
        >
          <option value="">Select a bottle...</option>
          {bottleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Favorite Selection */}
      <div className="gambit-selection">
        <h3>Your Favorite Bottle</h3>
        <select
          value={favorite}
          onChange={(e) => handleFavoriteChange(e.target.value)}
          disabled={showSubmit}
        >
          <option value="">Select a bottle...</option>
          {bottleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Submit Controls */}
      <div className="gambit-controls">
        {showSubmit && (
          <button onClick={handleSubmit}>Submit Gambit</button>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="confirmation-modal">
          <div className="modal-content">
            <h3>Confirm Gambit</h3>
            <p>You cannot change your gambit after submitting.</p>
            <div className="modal-buttons">
              <button onClick={() => setShowConfirmation(false)}>Cancel</button>
              <button onClick={confirmSubmit}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add styles
const styles = `:global {
  .gambit {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }

  .gambit-selection {
    margin-bottom: 20px;
  }

  select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-top: 5px;
  }

  .errors {
    margin: 10px 0;
    padding: 10px;
    background: #fee;
    border: 1px solid #f00;
    border-radius: 4px;
  }

  .error-message {
    color: #f00;
    margin: 5px 0;
  }

  .gambit-controls {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }

  .confirmation-modal {
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

  .modal-buttons {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }

  button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    background: #333;
    color: #fff;
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

// Export the component as default
export default GambitComponent;

// Export styles as a named export
export { styles };

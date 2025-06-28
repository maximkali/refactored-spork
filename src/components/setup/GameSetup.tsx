import React, { useState, useEffect } from 'react';
import { Game, Status } from '../../types';
import { createInitialGame, addBottle, finalizeSetup } from '../../game/utils';
import { v4 as uuidv4 } from 'uuid';

interface GameSetupProps {
  onGameCreated: (game: Game) => void;
}

interface BottleFormData {
  label: string;
  funName: string;
  price: number;
}

export const GameSetup: React.FC<GameSetupProps> = ({ onGameCreated }) => {
  const [hostName, setHostName] = useState('');
  const [bottles, setBottles] = useState<BottleFormData[]>(
    Array(20).fill({ label: '', funName: '', price: 1 })
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);

  const validateBottle = (bottle: BottleFormData, index: number): string[] => {
    const errors: string[] = [];

    // Label validation
    if (!bottle.label.trim()) {
      errors.push(`Label is required for bottle ${index + 1}`);
    } else if (bottle.label.length < 3 || bottle.label.length > 20) {
      errors.push(`Label must be between 3 and 20 characters for bottle ${index + 1}`);
    }

    // Price validation
    if (bottle.price < 1) {
      errors.push(`Price must be at least 1 for bottle ${index + 1}`);
    }

    return errors;
  };

  const validateAllBottles = () => {
    const allErrors = bottles.flatMap((bottle, index) => validateBottle(bottle, index));
    setErrors(allErrors);
    return allErrors.length === 0;
  };

  const handleBottleChange = (index: number, field: keyof BottleFormData, value: string | number) => {
    const newBottles = [...bottles];
    newBottles[index] = {
      ...newBottles[index],
      [field]: typeof value === 'string' ? value.trim() : value
    };
    setBottles(newBottles);
  };

  const createAndRandomizeGame = async () => {
    if (!validateAllBottles()) return;

    // Create initial game with host
    const game = createInitialGame(hostName.trim());

    // Add all bottles
    bottles.forEach((bottle, index) => {
      addBottle(game, bottle.label, bottle.funName, bottle.price);
    });

    // Finalize setup (randomizes bottles)
    const finalGame = finalizeSetup(game);

    // Copy join link to clipboard
    const joinLink = `${window.location.origin}/join/${finalGame.id}`;
    await navigator.clipboard.writeText(joinLink);
    
    // Show preview
    setPreviewVisible(true);
  };

  const generatePreview = () => {
    if (!previewVisible) return null;

    const rounds = Array(5).fill(null).map((_, roundIndex) => {
      const startIndex = roundIndex * 4;
      const endIndex = startIndex + 4;
      return bottles.slice(startIndex, endIndex);
    });

    return (
      <div className="preview-grid">
        <h3>Round Preview</h3>
        {rounds.map((roundBottles, roundIndex) => (
          <div key={roundIndex} className="round-row">
            <div className="round-label">Round {roundIndex + 1}</div>
            <div className="bottles-row">
              {roundBottles.map((bottle, bottleIndex) => (
                <div key={bottleIndex} className="bottle-cell">
                  {bottle.funName || `Bottle ${roundIndex * 4 + bottleIndex + 1}`}
                </div>
              ))}
            </div>
          </div>
        ))}
        <button onClick={() => {
          // Create a new game with the current bottles
          let newGame = createInitialGame('');
          
          // Add all bottles to the game
          bottles.forEach(bottle => {
            newGame = addBottle(newGame, bottle.label, bottle.funName, bottle.price);
          });
          
          // Finalize the setup and pass it to the parent
          onGameCreated(finalizeSetup(newGame));
        }}>Start Game</button>
      </div>
    );
  };

  return (
    <div className="game-setup">
      <h2>Create New Game</h2>
      
      {/* Host name input */}
      <div className="host-input">
        <label>Host Name:</label>
        <input
          type="text"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
          placeholder="Enter your display name"
        />
      </div>

      {/* Bottles form */}
      <div className="bottles-form">
        <h3>Bottle Information</h3>
        {bottles.map((bottle, index) => (
          <div key={index} className="bottle-row">
            <div className="bottle-label">
              <label>Label:</label>
              <input
                type="text"
                value={bottle.label}
                onChange={(e) => handleBottleChange(index, 'label', e.target.value)}
                placeholder="Label Name (3-20 chars)"
              />
            </div>
            <div className="bottle-fun-name">
              <label>Fun Name:</label>
              <input
                type="text"
                value={bottle.funName}
                onChange={(e) => handleBottleChange(index, 'funName', e.target.value)}
                placeholder="Fun Name (optional)"
              />
            </div>
            <div className="bottle-price">
              <label>Price:</label>
              <input
                type="number"
                value={bottle.price}
                onChange={(e) => handleBottleChange(index, 'price', Number(e.target.value) || 1)}
                min="1"
                placeholder="Price (≥1)"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Error display */}
      {errors.length > 0 && (
        <div className="errors">
          {errors.map((error, index) => (
            <div key={index} className="error-message">{error}</div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="setup-actions">
        <button onClick={createAndRandomizeGame} disabled={errors.length > 0}>
          Create & Randomize Game
        </button>
      </div>

      {/* Preview grid */}
      {generatePreview()}
    </div>
  );
};

// Add styles
const styles = `:global {
  .game-setup {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  .host-input {
    margin-bottom: 20px;
  }

  .bottles-form {
    margin-bottom: 20px;
  }

  .bottle-row {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    gap: 10px;
    margin-bottom: 10px;
    padding: 10px;
    background: #f8f8f8;
    border-radius: 4px;
  }

  .bottle-label,
  .bottle-fun-name,
  .bottle-price {
    display: flex;
    flex-direction: column;
  }

  input {
    margin-top: 5px;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
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

  .setup-actions {
    margin-top: 20px;
  }

  .preview-grid {
    margin-top: 20px;
    padding: 20px;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .round-row {
    display: grid;
    grid-template-columns: 100px 1fr;
    margin-bottom: 10px;
  }

  .round-label {
    font-weight: bold;
  }

  .bottles-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }

  .bottle-cell {
    padding: 10px;
    background: #f8f8f8;
    border-radius: 4px;
    text-align: center;
  }

  button {
    padding: 10px 20px;
    background: #333;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
}
`;

export default styles;

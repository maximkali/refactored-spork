import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Game, Status, Bottle } from '../../types';
import { createInitialGame, addBottle, finalizeSetup } from '../../game/utils';
import { v4 as uuidv4 } from 'uuid';
import GameSetupWizard from './GameSetupWizard';
import { getBottleOptionsForPlayers } from '../../utils/gameSetups';
import './GameSetup.css';
import './GameSetupWizard.css';

interface GameSetupProps {
  onGameCreated: (game: Game) => void;
}

interface BottleFormData {
  labelName: string;
  funName: string;
  price: number;
}

interface SetupOption {
  players: number;
  bottles: number;
  rounds: number;
  bottlesPerRound: number;
  bottleEqPerPerson: number;
  ozPerPersonPerBottle: number;
}

export const GameSetup: React.FC<GameSetupProps> = ({ onGameCreated }) => {
  const navigate = useNavigate();
  const [hostName, setHostName] = useState('');
  const [bottles, setBottles] = useState<BottleFormData[]>([]);
  const [gameSetup, setGameSetup] = useState<SetupOption | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  // Initialize bottles when setup is complete
  useEffect(() => {
    if (gameSetup) {
      setBottles(Array(gameSetup.bottles).fill(null).map(() => ({
        labelName: '',
        funName: '',
        price: 0
      })));
    }
  }, [gameSetup]);

  const validateBottle = (bottle: BottleFormData, index: number): string[] => {
    const errors: string[] = [];

    if (!bottle.labelName.trim()) {
      errors.push(`Label is required for bottle ${index + 1}`);
    } else if (bottle.labelName.length < 3 || bottle.labelName.length > 20) {
      errors.push(`Label must be between 3 and 20 characters for bottle ${index + 1}`);
    }

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
    newBottles[index] = { ...newBottles[index], [field]: value };
    setBottles(newBottles);
  };

  const handlePreview = () => {
    const isValid = validateAllBottles();
    if (isValid) {
      setPreviewVisible(true);
    }
  };

  const saveGame = () => {
    if (!gameSetup) return;
    
    // Validate all bottles have required fields
    const validationErrors: string[] = [];
    bottles.forEach((bottle, index) => {
      const errors = validateBottle(bottle, index);
      if (errors.length > 0) {
        validationErrors.push(...errors);
      }
    });
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Create initial game with the host name
    const game = createInitialGame(hostName || 'Host');
    
    // Add bottles to the game
    bottles.forEach((bottle, index) => {
      const roundIndex = Math.floor(index / gameSetup.bottlesPerRound);
      const bottleToAdd = {
        labelName: bottle.labelName,
        funName: bottle.funName || `Bottle ${index + 1}`,
        price: bottle.price,
        roundIndex
      };
      
      // Add bottle to the game with the correct parameters
      addBottle(
        game,
        bottleToAdd.labelName,
        bottleToAdd.funName,
        bottleToAdd.price
      );
      
      // Update the round index separately since it's not in the addBottle signature
      const addedBottle = game.bottles[game.bottles.length - 1];
      if (addedBottle) {
        addedBottle.roundIndex = bottleToAdd.roundIndex;
      }
    });
    
    // Finalize setup with the game instance
    finalizeSetup(game);
    
    // Notify parent component
    onGameCreated(game);
    
    // Mark setup as complete
    setSetupComplete(true);
    
    // Navigate to game lobby
    navigate(`/lobby/${game.id}`);
  };

  const handleStartGame = () => {
    if (!hostName.trim()) {
      setErrors(['Please enter your name as the host']);
      return;
    }

    saveGame();
  };

  const generatePreview = () => {
    if (!previewVisible) return null;

    const rounds = Array(5).fill(null).map((_, roundIndex) => {
      const startIndex = roundIndex * 4;
      const endIndex = startIndex + 4;
      return bottles.slice(startIndex, endIndex);
    });

    return (
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginTop: 0 }}>Round Preview</h3>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {rounds.map((roundBottles, roundIndex) => (
            <div key={roundIndex} style={{ 
              display: 'grid',
              gridTemplateColumns: '100px 1fr',
              alignItems: 'start',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: 'var(--background)',
              borderRadius: '8px'
            }}>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Round {roundIndex + 1}</div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '0.75rem'
              }}>
                {roundBottles.map((bottle, bottleIndex) => (
                  <div key={bottleIndex} style={{
                    padding: '0.75rem',
                    backgroundColor: 'var(--surface)',
                    borderRadius: '6px',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    {bottle.funName || `Bottle ${roundIndex * 4 + bottleIndex + 1}`}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleSetupComplete = (setup: {
    players: number;
    bottles: number;
    rounds: number;
    bottlesPerRound: number;
  }) => {
    const gameSetup: SetupOption = {
      players: setup.players,
      bottles: setup.bottles,
      rounds: setup.rounds,
      bottlesPerRound: setup.bottlesPerRound,
      bottleEqPerPerson: 0, // This will be calculated
      ozPerPersonPerBottle: 0 // This will be calculated
    };
    
    // Find the matching setup with all details
    const matchingSetup = getMatchingSetup(setup);
    if (matchingSetup) {
      setGameSetup(matchingSetup);
    } else {
      console.warn('No matching setup found, using partial setup');
      setGameSetup(gameSetup);
    }
  };
  
  // Helper function to find a matching setup with all details
  const getMatchingSetup = (setup: {
    players: number;
    bottles: number;
    rounds: number;
    bottlesPerRound: number;
  }): SetupOption | undefined => {
    // Import the wineySetups array
    const { wineySetups } = require('../../utils/gameSetups');
    
    return wineySetups.find((s: SetupOption) => 
      s.players === setup.players &&
      s.bottles === setup.bottles &&
      s.rounds === setup.rounds &&
      s.bottlesPerRound === setup.bottlesPerRound
    );
  };

  if (!setupComplete) {
    return (
      <div className="game-setup">
        <GameSetupWizard onSetupComplete={handleSetupComplete} />
      </div>
    );
  }

  return (
    <div className="game-setup">
      <div className="setup-header">
        <h2>Add Your Bottles</h2>
        {gameSetup && (
          <div className="setup-details">
            <div>{gameSetup.players} Players</div>
            <div>{gameSetup.rounds} Rounds</div>
            <div>{gameSetup.bottlesPerRound} Bottles per Round</div>
            <div>~{gameSetup.bottleEqPerPerson.toFixed(2)} Bottles per Person</div>
          </div>
        )}
      </div>
      
      <form>
        <div className="bottle-list">
          {bottles.map((bottle, index) => (
            <div key={index} className="bottle-row">
              <div className="form-group">
                <label>Label Name</label>
                <input
                  type="text"
                  value={bottle.labelName}
                  onChange={(e) => handleBottleChange(index, 'labelName', e.target.value)}
                  placeholder="e.g., Château Margaux"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Fun Name (Optional)</label>
                <input
                  type="text"
                  value={bottle.funName}
                  onChange={(e) => handleBottleChange(index, 'funName', e.target.value)}
                  placeholder="e.g., The Fancy One"
                />
              </div>
              
              <div className="form-group">
                <label>Price ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={bottle.price}
                  onChange={(e) => handleBottleChange(index, 'price', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="actions">
          <button 
            type="button" 
            className="submit-btn"
            onClick={handleStartGame}
          >
            Start Game
          </button>
        </div>
      </form>

      {errors.length > 0 && (
        <div className="card" style={{ marginTop: '2rem', borderColor: 'var(--error)', backgroundColor: 'rgba(229, 62, 62, 0.05)' }}>
          <h4 style={{ color: 'var(--error)', marginTop: 0 }}>Please fix the following errors:</h4>
          <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
            {errors.map((error, i) => (
              <li key={i} style={{ color: 'var(--error)', marginBottom: '0.25rem' }}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {previewVisible && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Game Preview</h3>
            <button 
              className="btn btn-secondary" 
              onClick={() => setPreviewVisible(false)}
              style={{ padding: '0.5rem 1rem' }}
            >
              Close
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Host</div>
              <div style={{ fontWeight: 500 }}>{hostName || '—'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Number of Bottles</div>
              <div style={{ fontWeight: 500 }}>{bottles.filter(b => b.labelName.trim() !== '').length}</div>
            </div>
          </div>
          {generatePreview()}
        </div>
      )}
    </div>
  );
};

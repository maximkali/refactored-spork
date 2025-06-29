import './GameSetupWizard.css';
import React, { useState, useEffect } from 'react';
import { 
  getUniquePlayerCounts, 
  getBottleOptionsForPlayers,
  getRoundOptions,
} from '../../utils/gameSetups';

interface GameSetupWizardProps {
  onSetupComplete: (setup: {
    players: number;
    bottles: number;
    rounds: number;
    bottlesPerRound: number;
  }) => void;
  initialPlayers?: number;
}

interface SetupOption {
  players: number;
  bottles: number;
  rounds: number;
  bottlesPerRound: number;
  bottleEqPerPerson: number;
  ozPerPersonPerBottle: number;
}

export const GameSetupWizard: React.FC<GameSetupWizardProps> = ({ 
  onSetupComplete,
  initialPlayers
}) => {
  const [players, setPlayers] = useState<number>(0);
  const [bottles, setBottles] = useState<number>(0);
  const [rounds, setRounds] = useState<number>(0);
  const [selectedSetup, setSelectedSetup] = useState<SetupOption | null>(null);
  
  // Reset form when component mounts
  useEffect(() => {
    setPlayers(0);
    setBottles(0);
    setRounds(0);
    setSelectedSetup(null);
  }, []);

  const [availablePlayers] = useState<number[]>(getUniquePlayerCounts());
  const [bottleOptions, setBottleOptions] = useState<SetupOption[]>([]);
  const [roundOptions, setRoundOptions] = useState<SetupOption[]>([]);

  // Update available bottles when players change
  useEffect(() => {
    if (players > 0) {
      const options = getBottleOptionsForPlayers(players);
      setBottleOptions(options);
      
      // Auto-select first bottle option if available
      if (options.length > 0) {
        handleBottleSelect(options[0].bottles);
      } else {
        setBottles(0);
        setRoundOptions([]);
        setRounds(0);
        setSelectedSetup(null);
      }
    } else {
      setBottleOptions([]);
      setBottles(0);
      setRoundOptions([]);
      setRounds(0);
      setSelectedSetup(null);
    }
  }, [players]);
  
  const handleBottleSelect = (bottleCount: number) => {
    setBottles(bottleCount);
    const options = getRoundOptions(players, bottleCount);
    
    if (options.length === 0) {
      setRoundOptions([]);
      setRounds(0);
      setSelectedSetup(null);
      return;
    }
    
    // Create a map of round counts to their configurations
    const roundOptionsMap = new Map<number, SetupOption>();
    
    options.forEach(option => {
      const roundCount = option.rounds;
      if (!roundOptionsMap.has(roundCount)) {
        roundOptionsMap.set(roundCount, option);
      }
    });
    
    // Convert map values to array and sort by round count
    const roundOptions = Array.from(roundOptionsMap.values())
      .sort((a, b) => a.rounds - b.rounds);
    
    setRoundOptions(roundOptions);
    
    // Reset rounds selection when bottles change
    setRounds(0);
    setSelectedSetup(null);
  };
  
  const handleRoundSelect = (roundCount: number) => {
    const selectedOption = roundOptions.find(opt => opt.rounds === roundCount);
    if (selectedOption) {
      setRounds(roundCount);
      setSelectedSetup(selectedOption);
    }
  };
  
  // Get the wine per person as a percentage of a bottle
  const getWinePerPersonPercentage = (setup: SetupOption): string => {
    return (setup.bottleEqPerPerson * 100).toFixed(0);
  };

  const getTastingsPerRoundText = (setup: SetupOption): string => {
    return `${setup.bottlesPerRound} wines per round`;
  };

  const getRoundsText = (setup: SetupOption): string => {
    return `${setup.rounds} rounds`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSetup) {
      onSetupComplete({
        players: selectedSetup.players,
        bottles: selectedSetup.bottles,
        rounds: selectedSetup.rounds,
        bottlesPerRound: selectedSetup.bottlesPerRound
      });
      // Navigate to bottle management page
    }
  };

  return (
    <div className="game-setup-wizard">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="playerCount">Number of Players:</label>
          <select
            id="playerCount"
            className="form-control"
            value={players}
            onChange={(e) => setPlayers(Number(e.target.value))}
          >
            <option value="">Select players</option>
            {availablePlayers.map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? 'Player' : 'Players'}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="bottleCount">Number of Bottles:</label>
          <select
            id="bottleCount"
            className="form-control"
            value={bottles}
            onChange={(e) => handleBottleSelect(Number(e.target.value))}
            disabled={!players}
          >
            <option value="">Select bottles</option>
            {bottleOptions.map((option) => (
              <option key={option.bottles} value={option.bottles}>
                {option.bottles} {option.bottles === 1 ? 'Bottle' : 'Bottles'}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="rounds">Number of Rounds:</label>
          <select
            id="rounds"
            className="form-control"
            value={rounds}
            onChange={(e) => handleRoundSelect(Number(e.target.value))}
            disabled={!bottles}
          >
            <option value="">Select rounds</option>
            {roundOptions.map((option) => (
              <option key={option.rounds} value={option.rounds}>
                {option.rounds} {option.rounds === 1 ? 'Round' : 'Rounds'}
              </option>
            ))}
          </select>
        </div>

        {selectedSetup && (
          <>
            <div className="tasting-details">
              <h3 className="details-title">Tasting Details</h3>
              <div className="details-grid">
                <div className="details-item">
                  <span className="details-label">Tastings per Round: </span>
                  <span className="details-value">{getTastingsPerRoundText(selectedSetup)}</span>
                </div>
                <div className="details-item">
                  <span className="details-label">Pour per Tasting: </span>
                  <span className="details-value">{selectedSetup.ozPerPersonPerBottle.toFixed(2)} oz</span>
                </div>
                <div className="details-item">
                  <span className="details-label">Total Wine per Person: </span>
                  <span className="details-value">
                    {(selectedSetup.bottleEqPerPerson * 25.4).toFixed(2)} oz ({getWinePerPersonPercentage(selectedSetup)}% of 750ml bottle)
                  </span>
                </div>
              </div>

              <div className="tasting-instructions" style={{ marginTop: '2rem', marginBottom: '3rem' }}>
                <p className="instructions-text">
                  In this tasting, you'll sample {getTastingsPerRoundText(selectedSetup)} in each of {getRoundsText(selectedSetup)}. For each wine, pour yourself {selectedSetup.ozPerPersonPerBottle.toFixed(2)} oz. Over the course of the game, you'll taste a total of {selectedSetup.bottles} different wines, with each participant receiving approximately {(selectedSetup.bottleEqPerPerson * 25.4).toFixed(2)} oz total (about {getWinePerPersonPercentage(selectedSetup)}% of a standard 750ml bottle). Take notes on each wine's aroma, flavor, and finish to compare and discuss with other participants.
                </p>
              </div>
            </div>
          </>
        )}

        <div className="button-container" style={{ marginTop: '4rem' }}>
          <button 
            type="submit" 
            className="btn btn-primary btn-lg"
            disabled={!selectedSetup}
          >
            Start Game Setup
          </button>
        </div>
      </form>
    </div>
  );
};

export default GameSetupWizard;

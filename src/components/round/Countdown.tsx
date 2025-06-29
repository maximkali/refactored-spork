import React, { useState, useEffect } from 'react';
import { Game, Status } from '../../types';
import { useAdmin } from '../../contexts/AdminContext';

interface CountdownProps {
  game: Game;
  currentRound: number;
  onCountdownComplete: () => void;
}

export const Countdown: React.FC<CountdownProps> = ({ game, currentRound, onCountdownComplete }) => {
  const [seconds, setSeconds] = useState(10);
  const [showUndo, setShowUndo] = useState(true);
  const { onAction } = useAdmin();

  useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => {
        setSeconds(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Automatically complete countdown
      onCountdownComplete();
    }
  }, [seconds, onCountdownComplete]);

  const handleUndo = () => {
    if (showUndo) {
      onAction('UNDO_ROUND', {
        roundIndex: currentRound - 1 // Add the current round index to the payload
      });
    }
  };

  useEffect(() => {
    // Hide undo option after 3 seconds
    const timer = setTimeout(() => {
      setShowUndo(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="countdown">
      <div className="countdown-display">
        <h2>Round {currentRound} Closing</h2>
        <div className="timer">{seconds}s</div>
        {showUndo && (
          <button onClick={handleUndo} className="undo-button">
            Undo Close
          </button>
        )}
      </div>
    </div>
  );
};

// Add styles
const styles = `:global {
  .countdown {
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

  .countdown-display {
    text-align: center;
    color: #fff;
  }

  h2 {
    font-size: var(--text-xl);
    font-weight: 600;
    margin: 0 0 1.25rem 0;
    color: #fff;
    font-family: var(--font-sans);
  }

  .timer {
    font-size: 6rem; /* Using a larger size for countdown, but now in rem */
    font-weight: 700;
    margin-bottom: 1.25rem;
    line-height: 1;
    font-family: var(--font-sans);
  }

  .undo-button {
    padding: 0.625rem 1.25rem;
    background: var(--error);
    color: #fff;
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--text-base);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: var(--font-sans);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .undo-button:hover {
    background: #d00;
  }

  .undo-button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
}
`;

export default styles;

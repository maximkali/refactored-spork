import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import type { Game, Player, TastingNotes, Submission } from '../../types';
import { GameValidation } from '../../game/validations';

// Extend the Window interface to include our drag element
declare global {
  interface Window {
    dragSrcEl: HTMLElement | null;
  }
}

// Rename the interface to avoid conflict with the imported Round type
interface RoundComponentProps {
  game: Game;
  currentRound: number;
  player: Player;
  onRoundComplete: () => void;
}

export const Round: React.FC<RoundComponentProps> = ({ 
  game, 
  currentRound, 
  player, 
  onRoundComplete 
}: RoundComponentProps) => {
  const currentRoundData = game.rounds[currentRound - 1];
  const currentRoundBottles = currentRoundData.bottleIds;
  
  // Initialize tasting notes with proper bottle IDs
  const [tastingNotes, setTastingNotes] = useState<TastingNotes[]>(() => 
    currentRoundBottles.map(bottleId => ({
      bottleId,
      note: ''
    }))
  );
  
  const [ranking, setRanking] = useState<string[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const { onAction } = useAdmin();

  // Get bottle fun names for display
  const getBottleFunName = useCallback((bottleId: string): string => {
    const bottle = game.bottles.find((b: { id: string }) => b.id === bottleId);
    return bottle?.funName || `Bottle ${currentRoundBottles.indexOf(bottleId) + 1}`;
  }, [game.bottles, currentRoundBottles]);

  // Initialize ranking with bottle IDs in random order
  useEffect(() => {
    if (currentRoundBottles.length > 0 && ranking.length === 0) {
      setRanking([...currentRoundBottles].sort(() => Math.random() - 0.5));
    }
  }, [currentRoundBottles, ranking.length]);

  const handleTastingNoteChange = useCallback((bottleId: string, value: string) => {
    setTastingNotes((prev: TastingNotes[]) => 
      prev.map((note: TastingNotes) => 
        note.bottleId === bottleId ? { ...note, note: value } : note
      )
    );
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, targetBottleId: string) => {
    e.preventDefault();
    const sourceBottleId = e.dataTransfer?.getData('text/plain');
    if (!sourceBottleId || sourceBottleId === targetBottleId) return;
    
    setRanking(prevRanking => {
      const newRanking = [...prevRanking];
      const sourceIndex = newRanking.indexOf(sourceBottleId);
      const targetIndex = newRanking.indexOf(targetBottleId);
      
      if (sourceIndex === -1 || targetIndex === -1) return prevRanking;
      
      // Remove source item and insert at target position
      const [movedItem] = newRanking.splice(sourceIndex, 1);
      newRanking.splice(targetIndex, 0, movedItem);
      return newRanking;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    // Validate all notes are filled
    const hasEmptyNote = tastingNotes.some(note => !note.note.trim());
    if (hasEmptyNote) {
      alert('Please fill in all tasting notes before submitting.');
      return;
    }
    
    // Validate ranking is complete
    if (ranking.length !== currentRoundBottles.length) {
      alert('Please rank all bottles before submitting.');
      return;
    }
    
    setShowConfirmation(true);
  }, [tastingNotes, ranking, currentRoundBottles.length]);
  
  const confirmSubmit = useCallback(() => {
    setIsSubmitting(true);
    
    const submission: Submission = {
      playerId: player.id,
      roundIndex: currentRound - 1,
      tastingNotes: tastingNotes.filter(note => note.note.trim().length > 0),
      ranking,
      locked: true,
      points: 0,
      submittedAt: new Date().toISOString()
    };
    
    onAction('SUBMIT_TASTING', { 
      roundIndex: currentRound,
      playerId: player.id,
      tastingNotes: submission.tastingNotes,
      ranking: submission.ranking,
      locked: submission.locked,
      points: submission.points
    });
    
    setIsLocked(true);
    setShowConfirmation(false);
    setIsSubmitting(false);
  }, [tastingNotes, ranking, currentRound, player.id, onAction]);

  const getProgress = useCallback(() => {
    const activePlayers = game.players.filter(p => p.status === 'active').length;
    const submissions = currentRoundData.submissions.length;
    return `${submissions}/${activePlayers}`;
  }, [game.players, currentRoundData.submissions]);

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, bottleId: string) => {
    const dt = e.dataTransfer as DataTransfer & { effectAllowed?: string };
    if (dt) {
      dt.effectAllowed = 'move';
      dt.setData('text/plain', bottleId);
      const target = e.currentTarget as HTMLElement;
      target.classList.add('dragging');
      window.dragSrcEl = target;
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Use type assertion to access the dropEffect property
    const dt = e.dataTransfer as DataTransfer & { dropEffect?: string };
    if (dt) {
      dt.dropEffect = 'move';
    }
  }, []);

  if (isLocked) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Round {currentRound} Complete!</h2>
        <p>Waiting for other players to finish...</p>
        <div style={styles.progress}>
          Submissions: {getProgress()}
        </div>
        <button 
          style={{
            ...styles.button,
            marginTop: '1rem',
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem'
          }}
          onClick={onRoundComplete}
        >
          View Leaderboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <h2>Round {currentRound}</h2>
      <div style={styles.progress}>
        Submissions: {getProgress()}
      </div>
      
      <div style={styles.roundContent}>
        <div style={styles.tastingNotes}>
          <h3>Tasting Notes</h3>
          {tastingNotes.map((note, index) => (
            <div key={note.bottleId} style={styles.noteCard}>
              <div style={styles.bottleName}>
                {getBottleFunName(note.bottleId) || `Bottle ${index + 1}`}
              </div>
              <textarea
                style={{
                  ...styles.textarea,
                  backgroundColor: isLocked ? '#f9f9f9' : 'white',
                  cursor: isLocked ? 'not-allowed' : 'text'
                }}
                value={note.note}
                onChange={(e) => handleTastingNoteChange(note.bottleId, e.target.value)}
                placeholder="Enter your tasting notes..."
                disabled={isLocked}
              />
            </div>
          ))}
        </div>
        
        <div style={styles.ranking}>
          <h3>Rank the Bottles</h3>
          <p>Drag to reorder (1 = best, {currentRoundBottles.length} = worst)</p>
          
          <div style={styles.rankList}>
            {ranking.map((bottleId, index) => (
              <div 
                key={bottleId}
                style={{
                  ...styles.rankItem,
                  cursor: isLocked ? 'default' : 'move',
                  backgroundColor: isLocked ? '#f5f5f5' : '#f8f8f8',
                  ...(isLocked ? {} : { '&:hover': { backgroundColor: '#e0e0e0' } })
                } as React.CSSProperties}
                draggable={!isLocked}
                onDragStart={(e) => handleDragStart(e, bottleId)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, bottleId)}
              >
                {index + 1}. {getBottleFunName(bottleId) || `Bottle ${currentRoundBottles.indexOf(bottleId) + 1}`}
              </div>
            ))}
          </div>
          
          <div style={styles.submitControls}>
            <button 
              style={{
                ...styles.button,
                backgroundColor: isSubmitting || isLocked ? '#cccccc' : '#4CAF50',
                color: 'white',
                cursor: isSubmitting || isLocked ? 'not-allowed' : 'pointer',
                opacity: isSubmitting || isLocked ? 0.7 : 1
              }}
              onClick={handleSubmit}
              disabled={isSubmitting || isLocked}
            >
              {isSubmitting ? 'Submitting...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Define styles with proper TypeScript types
// Define styles with proper TypeScript types
// Define a more specific type for our styles that includes pseudo-classes
type Styles = {
  [key: string]: React.CSSProperties & {
    '&:hover'?: React.CSSProperties;
    '&:active'?: React.CSSProperties;
  };
};

const styles: Styles = {
  progress: {
    marginTop: '10px',
    padding: '10px',
    background: '#f8f8f8',
    borderRadius: '4px'
  },
  roundContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginTop: '20px'
  },
  tastingNotes: {
    padding: '15px',
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  noteCard: {
    marginBottom: '15px',
    padding: '15px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px'
  },
  bottleName: {
    fontWeight: 'bold',
    marginBottom: '8px'
  },
  textarea: {
    width: '100%',
    minHeight: '100px',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    resize: 'vertical',
    fontFamily: 'inherit',
    fontSize: '14px'
  } as React.CSSProperties,
  ranking: {
    padding: '15px',
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  rankList: {
    margin: '15px 0',
    padding: 0,
    listStyle: 'none'
  },
  rankItem: {
    padding: '12px 15px',
    marginBottom: '8px',
    background: '#f8f8f8',
    borderRadius: '4px',
    borderLeft: '4px solid #4CAF50',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.2s'
  },
  submitControls: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'flex-end'
  },
  button: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'background-color 0.2s, transform 0.1s'
  },
  confirmationModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    background: 'white',
    padding: '25px',
    borderRadius: '8px',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px'
  },
  noteError: {
    color: '#d32f2f',
    fontSize: '12px',
    marginTop: '5px'
  }
};

export default styles;

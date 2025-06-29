import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import { GameProvider, useGame } from './contexts/GameContext';
import { Lobby } from './components/lobby/Lobby';
import { Round } from './components/round/Round';
import { Reveal } from './components/round/Reveal';
import { BottleManager } from './components/admin/BottleManager';
import { Bottle } from './types';
import { Game } from './types';

// Wrapper component for Round that gets the round number from URL
function RoundWrapper() {
  const { roundNumber } = useParams<{ roundNumber: string }>();
  const { game, currentPlayer, updateGame } = useGame();
  const { player: adminPlayer, onAction } = useAdmin();
  
  // Use player from useAdmin or fall back to currentPlayer from useGame
  const currentPlayerObj = adminPlayer || currentPlayer;
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Set loading to false once we have all required data or determine we need to redirect
    if (roundNumber && (game || currentPlayerObj)) {
      setIsLoading(false);
    }
  }, [roundNumber, game, currentPlayerObj]);
  
  // Show loading state while initializing
  if (isLoading) {
    return <div>Loading game data...</div>;
  }
  
  // Only redirect if we're certain the user shouldn't be here
  if (!roundNumber || !game) {
    return <Navigate to="/" replace />;
  }
  
  // Convert round number to a proper number, defaulting to 1 if invalid
  const roundNum = typeof roundNumber === 'string' && !isNaN(parseInt(roundNumber)) 
    ? parseInt(roundNumber, 10)
    : 1;
  
  const handleRoundComplete = (roundNum: number) => {
    if (roundNum < game.rounds.length) {
      onAction('ADVANCE_ROUND', { roundNumber: roundNum + 1 });
    } else {
      updateGame({ status: 'completed' as const });
    }
  };

  if (!currentPlayerObj || !game) {
    return <Navigate to="" replace />;
  }

  if (game.status !== 'in_round') {
    return <Navigate to="" replace />;
  }

  return (
    <Round 
      game={game} 
      currentRound={roundNum} 
      player={currentPlayerObj}
      onRoundComplete={() => handleRoundComplete(roundNum)}
    />
  );
}

// Wrapper component for Reveal that gets the round number from URL
function RevealWrapper() {
  const { roundNumber } = useParams<{ roundNumber: string }>();
  const { game, currentPlayer } = useGame();
  const { player: adminPlayer } = useAdmin();
  
  // Use player from useAdmin or fall back to currentPlayer from useGame
  const currentPlayerObj = adminPlayer || currentPlayer;
  
  if (!roundNumber || !game || !currentPlayerObj) {
    return <Navigate to="/" replace />;
  }
  
  const roundNum = parseInt(roundNumber, 10);
  
  return (
    <Reveal 
      game={game} 
      currentRound={roundNum} 
      onNextRound={() => {
        // Handle moving to the next round
      }} 
    />
  );
}

// Main app component with routing
function AppRoutes() {
  const { game, updateGame } = useGame();
  
  return (
    <Routes>
      <Route path="/" element={<Lobby />} />
      <Route path="/admin/bottles" element={
        <BottleManager 
          bottles={game.bottles} 
          onUpdateBottles={(updatedBottles: Bottle[]) => {
            updateGame({ bottles: updatedBottles });
          }} 
        />
      } />
      <Route path="/round/:roundNumber" element={<RoundWrapper />} />
      <Route path="/reveal/:roundNumber" element={<RevealWrapper />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Main App component with providers
function App() {
  return (
    <div className="app-container">
      <Router>
        <GameProvider>
          <AdminProvider>
            <AppRoutes />
          </AdminProvider>
        </GameProvider>
      </Router>
    </div>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import { GameProvider, useGame } from './contexts/GameContext';
import Lobby from './components/lobby/Lobby';
import { Round } from './components/round/Round';
import { Reveal } from './components/round/Reveal';

// Wrapper component for Round that gets the round number from URL
function RoundWrapper() {
  const { roundNumber } = useParams<{ roundNumber: string }>();
  const { game } = useGame();
  const { player } = useAdmin();
  
  if (!roundNumber || !game || !player) {
    return <Navigate to="/" replace />;
  }

  const roundNum = parseInt(roundNumber, 10);
  
  const handleRoundComplete = () => {
    // Handle round completion logic here
    console.log(`Round ${roundNum} completed`);
  };

  return (
    <Round 
      game={game} 
      currentRound={roundNum} 
      player={player} 
      onRoundComplete={handleRoundComplete} 
    />
  );
}

// Wrapper component for Reveal that gets the round number from URL
function RevealWrapper() {
  const { roundNumber } = useParams<{ roundNumber: string }>();
  const { game } = useGame();
  
  if (!roundNumber || !game) {
    return <Navigate to="/" replace />;
  }

  const roundNum = parseInt(roundNumber, 10);
  
  const handleNextRound = () => {
    // Handle next round logic here
    console.log('Moving to next round');
  };

  return (
    <Reveal 
      game={game} 
      currentRound={roundNum} 
      onNextRound={handleNextRound} 
    />
  );
}

// Main app component with routing
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Lobby />} />
      <Route path="/round/:roundNumber" element={<RoundWrapper />} />
      <Route path="/reveal/:roundNumber" element={<RevealWrapper />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Main App component with providers
function App() {
  return (
    <AdminProvider>
      <GameProvider>
        <Router>
          <div className="app">
            <AppRoutes />
          </div>
        </Router>
      </GameProvider>
    </AdminProvider>
  );
}

export default App;

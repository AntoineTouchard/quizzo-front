import React, { useEffect, useCallback } from "react";
import { initialPropositions } from "./types";
import { useGameState } from "./hooks/useGameState";
import { useGamePersistence } from "./hooks/useGamePersistence";
import { useSocket } from "./hooks/useSocket";
import { GameHeader } from "./components/GameHeader";
import { PlayerGrid } from "./components/PlayerGrid";

function App() {
  const ITEMS_PER_GRID = 6;
  const MIN_PLAYERS = 0;
  const MAX_PLAYERS = 100;
  const params = new URLSearchParams(window.location.search);
  const showAllButtons = params.get("showAllButtons");

  const persistence = useGamePersistence([], []);
  const { saveGame, downloadGame, loadLastGame, loadGameFromFile } = persistence;

  // Auto-save function
  const handleAutoSave = async () => {
    try {
      const gameStateData = {
        players: playerStates.map((playerState) => ({
          id: playerState.id, // Inclure l'ID dans la sauvegarde
          name: playerState.name,
          grid: playerState.grid,
          validatedItems: Array.from(playerState.validatedItems.entries()),
        })),
        propositions,
      };
      await saveGame(gameStateData);
      setIsChanged(false); // Marquer comme sauvegardé après la sauvegarde automatique
      setIsLoadedGame(false); // Après sauvegarde automatique, ce n'est plus une partie chargée
      setHasUnsavedChanges(false); // Plus de changements non sauvegardés
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  };

  const gameState = useGameState(
    initialPropositions, 
    ITEMS_PER_GRID, 
    MIN_PLAYERS, 
    MAX_PLAYERS,
    handleAutoSave
  );
  
  const {
    propositions,
    playerStates,
    isChanged,
    isLoadedGame,
    hasUnsavedChanges,
    setIsChanged,
    setIsLoadedGame,
    setHasUnsavedChanges,
    generateNewGrids,
    addPlayer,
    removePlayer,
    updatePlayerName,
    validateItem,
    removeValidation,
    addProposition,
    removeProposition,
    loadGameState,
    confirmUnsavedChanges,
  } = gameState;

  // Stabiliser la fonction handleNewChanges avec useCallback
  const handleNewChanges = useCallback((data: any) => {
    loadGameState(data, false, true); // Marquer comme chargé pour les changements réseau
  }, [loadGameState]);

  const { playerOnline } = useSocket(handleNewChanges);

  const handleSaveGame = async () => {
    try {
      const gameStateData = {
        players: playerStates.map((playerState) => ({
          id: playerState.id, // Inclure l'ID dans la sauvegarde
          name: playerState.name,
          grid: playerState.grid,
          validatedItems: Array.from(playerState.validatedItems.entries()),
        })),
        propositions,
      };
      await saveGame(gameStateData);
      setIsChanged(false);
      setIsLoadedGame(false); // Après sauvegarde manuelle, ce n'est plus une partie chargée
      setHasUnsavedChanges(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erreur lors de la sauvegarde");
    }
  };

  const handleDownloadGame = async () => {
    try {
      const gameStateData = {
        players: playerStates.map((playerState) => ({
          id: playerState.id, // Inclure l'ID dans la sauvegarde
          name: playerState.name,
          grid: playerState.grid,
          validatedItems: Array.from(playerState.validatedItems.entries()),
        })),
        propositions,
      };
      await downloadGame(gameStateData);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erreur lors du téléchargement");
    }
  };

  const handleLoadGame = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const gameStateData = await loadGameFromFile(file);
        if (gameStateData) {
          loadGameState(gameStateData, true, true); // Marquer comme chargé pour les fichiers
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : "Erreur lors du chargement du fichier");
      }
    }
  };

  const handleLoadLastGame = async () => {
    try {
      const lastGameState = await loadLastGame();
      if (lastGameState) {
        // Au démarrage, ne pas marquer comme "partie chargée"
        loadGameState(lastGameState, false, false);
      } else {
        generateNewGrids();
      }
    } catch (error) {
      console.error("Erreur lors du chargement :", error);
      generateNewGrids();
    }
  };

  const handleCancelChanges = () => {
    if (confirmUnsavedChanges()) {
      handleLoadLastGame();
    }
  };

  // Fonction pour charger une partie depuis l'historique
  const handleLoadGameFromHistory = (gameStateData: any) => {
    // Marquer explicitement comme "partie chargée" pour afficher le bouton sauvegarder
    loadGameState(gameStateData, true, true);
  };

  useEffect(() => {
    handleLoadLastGame();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        <GameHeader
          playerCount={playerStates.length}
          maxPlayers={MAX_PLAYERS}
          isChanged={isChanged}
          isLoadedGame={isLoadedGame}
          hasUnsavedChanges={hasUnsavedChanges}
          playerOnline={playerOnline}
          showAllButtons={!!showAllButtons}
          propositions={propositions}
          onAddPlayer={addPlayer}
          onGenerateNewGrids={() => generateNewGrids()}
          onSaveGame={handleSaveGame}
          onDownloadGame={handleDownloadGame}
          onLoadGame={handleLoadGame}
          onLoadThisGame={handleLoadGameFromHistory}
          onAddProposition={addProposition}
          onRemoveProposition={removeProposition}
          onCancelChanges={handleCancelChanges}
        />

        {/* Espacement ajouté entre le header et les cartes */}
        <div className="mt-8">
          <PlayerGrid
            playerStates={playerStates}
            propositions={propositions}
            minPlayers={MIN_PLAYERS}
            hasUnsavedChanges={hasUnsavedChanges}
            onUpdatePlayerName={updatePlayerName}
            onRemovePlayer={removePlayer}
            onValidateItem={validateItem}
            onRemoveValidation={removeValidation}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
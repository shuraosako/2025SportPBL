"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import Navigation from "@/components/layout/Navigation";
import FilterSection from "./components/FilterSection";
import IndividualAnalysis from "./components/IndividualAnalysis";
import ComparisonGraph from "./components/ComparisonGraph";
import Whole from "./components/Whole";
import { Player, PlayerData } from "./types";
import { mapRawDataToPlayerData } from "./utils/dataHelpers";
import "./analysis.css";

export default function AnalysisPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showAllPeriod, setShowAllPeriod] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [allPlayerData, setAllPlayerData] = useState<PlayerData[]>([]);
  const [filteredPlayerData, setFilteredPlayerData] = useState<PlayerData[]>([]);
  const [currentTab, setCurrentTab] = useState<"individual" | "comparison" | "whole">("whole");

  // Fetch players
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const playersCollection = collection(db, "players");
        const playersSnapshot = await getDocs(playersCollection);
        const playersList = playersSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        })) as Player[];
        setPlayers(playersList);
      } catch (error) {
        console.error("Error fetching players:", error);
      }
    };
    fetchPlayers();
  }, []);

  // Fetch all player data
  useEffect(() => {
    const fetchPlayerData = async () => {
      if (players.length === 0) return;

      try {
        const allData: PlayerData[] = [];
        for (const player of players) {
          const playerRef = collection(db, "players", player.id, "csvData");
          const playerSnapshot = await getDocs(playerRef);
          const playerDocs = playerSnapshot.docs.map((doc) => ({
            ...mapRawDataToPlayerData(doc.data()),
            id: player.id,
            documentId: doc.id,
          }));
          allData.push(...playerDocs);
        }
        setAllPlayerData(allData);
      } catch (error) {
        console.error("Error fetching player data:", error);
      }
    };

    fetchPlayerData();
  }, [players]);

  // Filter data based on date range and selected players
  useEffect(() => {
    let filtered = allPlayerData;

    // Filter by date range
    if (!showAllPeriod && startDate && endDate) {
      filtered = filtered.filter((data) => {
        const dataDate = new Date(data.date);
        return dataDate >= startDate && dataDate <= endDate;
      });
    }

    // Filter by selected player(s) based on current tab
    if (currentTab === "individual" && selectedPlayer) {
      filtered = filtered.filter((data) => data.id === selectedPlayer);
    } else if (currentTab === "comparison" && selectedPlayers.length > 0) {
      filtered = filtered.filter((data) => selectedPlayers.includes(data.id));
    }

    setFilteredPlayerData(filtered);
  }, [allPlayerData, startDate, endDate, showAllPeriod, selectedPlayer, selectedPlayers, currentTab]);

  const handlePlayerSelect = (playerId: string) => {
    setSelectedPlayer(playerId);
    setSelectedPlayers([]);
  };

  const handlePlayersSelect = (playerIds: string[]) => {
    setSelectedPlayers(playerIds.slice(0, 5)); // Max 5 players
    setSelectedPlayer(null);
  };

  const handleTabChange = (tab: "individual" | "comparison" | "whole") => {
    setCurrentTab(tab);
    if (tab === "individual") {
      setSelectedPlayers([]);
    } else {
      setSelectedPlayer(null);
    }
  };

 return (
  <>
    <Navigation showProfile={true} showHamburger={true} />

    <div className="main-content">
      <div className="RightContent">
        <div className="analysis-container">
          {/* Tab Navigation */}
          <div className="tab-section">
            <div className="tab-buttons">
              <button
                className={`tab-button ${currentTab === "whole" ? "active" : ""}`}
                onClick={() => handleTabChange("whole")}
              >
                {t("analysis.tabs.whole")}
              </button>
              <button
                className={`tab-button ${currentTab === "individual" ? "active" : ""}`}
                onClick={() => handleTabChange("individual")}
              >
                {t("analysis.tabs.individual")}
              </button>
              <button
                className={`tab-button ${currentTab === "comparison" ? "active" : ""}`}
                onClick={() => handleTabChange("comparison")}
              >
                {t("analysis.tabs.comparison")}
              </button>
            </div>
          </div>

          {/* Filter Section */}
          <FilterSection
            startDate={startDate}
            endDate={endDate}
            showAllPeriod={showAllPeriod}
            players={players}
            selectedPlayer={selectedPlayer}
            selectedPlayers={selectedPlayers}
            currentTab={currentTab}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onShowAllPeriodChange={setShowAllPeriod}
            onPlayerSelect={handlePlayerSelect}
            onPlayersSelect={handlePlayersSelect}
          />

          {/* Graph Display */}
          <div className="graphs-container">
            {currentTab === "whole" && (
              <Whole
                players={players}
                playerData={filteredPlayerData}
              />
            )}

            {currentTab === "individual" && (
              <IndividualAnalysis
                selectedPlayer={selectedPlayer}
                players={players}
                playerData={filteredPlayerData}
              />
            )}

            {currentTab === "comparison" && (
              <ComparisonGraph
                players={players}
                playerData={filteredPlayerData}
                selectedPlayers={selectedPlayers}
              />
            )}

            
          </div>
        </div>
      </div>
    </div>
  </>
);
}
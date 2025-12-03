"use client";

import { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import { useLanguage } from "@/contexts/LanguageContext";
import { Player } from "../types";
import "./FilterSection.css";

interface FilterSectionProps {
  startDate: Date | null;
  endDate: Date | null;
  showAllPeriod: boolean;
  players: Player[];
  selectedPlayer: string | null;
  selectedPlayers: string[];
  currentTab: "individual" | "comparison" | "whole";
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onShowAllPeriodChange: (show: boolean) => void;
  onPlayerSelect: (playerId: string) => void;
  onPlayersSelect: (playerIds: string[]) => void;
}

export default function FilterSection({
  startDate,
  endDate,
  showAllPeriod,
  players,
  selectedPlayer,
  selectedPlayers,
  currentTab,
  onStartDateChange,
  onEndDateChange,
  onShowAllPeriodChange,
  onPlayerSelect,
  onPlayersSelect,
}: FilterSectionProps) {
  const { t } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePlayerCheckboxChange = (playerId: string) => {
    if (currentTab === "individual") {
      onPlayerSelect(playerId);
      setIsDropdownOpen(false);
    } else {
      if (selectedPlayers.includes(playerId)) {
        onPlayersSelect(selectedPlayers.filter((id) => id !== playerId));
      } else {
        if (selectedPlayers.length < 5) {
          onPlayersSelect([...selectedPlayers, playerId]);
        }
      }
    }
  };

  const getSelectedPlayerNames = () => {
    if (currentTab === "individual") {
      if (!selectedPlayer) {
        return t("analysis.selectPlayer");
      }
      const player = players.find((p) => p.id === selectedPlayer);
      return player?.name || t("analysis.selectPlayer");
    } else {
      if (selectedPlayers.length === 0) {
        return t("analysis.selectPlayers");
      }
      const names = selectedPlayers
        .map((id) => players.find((p) => p.id === id)?.name)
        .filter(Boolean);
      return names.join(", ");
    }
  };

  return (
    <div className="filter-section">
      {/* Date Filter - Show for Individual and Comparison tabs only */}
      {(currentTab === "individual" || currentTab === "comparison") && (
        <div className="date-filter">
          <DatePicker
            selected={startDate}
            onChange={onStartDateChange}
            selectsStart
            startDate={startDate || undefined}
            endDate={endDate || undefined}
            placeholderText={t("analysis.startDate")}
            dateFormat="yyyy/MM/dd"
            className="date-picker"
            disabled={showAllPeriod}
          />
          <DatePicker
            selected={endDate}
            onChange={onEndDateChange}
            selectsEnd
            startDate={startDate || undefined}
            endDate={endDate || undefined}
            minDate={startDate || undefined}
            placeholderText={t("analysis.endDate")}
            dateFormat="yyyy/MM/dd"
            className="date-picker"
            disabled={showAllPeriod}
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showAllPeriod}
              onChange={(e) => onShowAllPeriodChange(e.target.checked)}
            />
            <span>{t("analysis.allPeriod")}</span>
          </label>
        </div>
      )}

      {/* Player Selection - Show for Individual and Comparison tabs only */}
      {(currentTab === "individual" || currentTab === "comparison") && (
        <div className="player-selection" ref={dropdownRef}>
          <label>
            {currentTab === "individual"
              ? t("analysis.selectPlayer")
              : t("analysis.selectPlayers")}:
          </label>
          <div className="multi-select-dropdown">
            <button
              type="button"
              className="multi-select-button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="selected-text">{getSelectedPlayerNames()}</span>
              <span className="selected-count">
                {currentTab === "individual"
                  ? ""
                  : selectedPlayers.length > 0 && `(${selectedPlayers.length}/5)`}
              </span>
              <span className={`dropdown-arrow ${isDropdownOpen ? "open" : ""}`}>▼</span>
            </button>

            {isDropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <span>
                    {currentTab === "individual"
                      ? t("analysis.selectPlayer")
                      : `${t("analysis.selectPlayers")} (最大5人)`}
                  </span>
                  {currentTab !== "individual" && selectedPlayers.length > 0 && (
                    <button
                      type="button"
                      className="clear-button"
                      onClick={() => onPlayersSelect([])}
                    >
                      クリア
                    </button>
                  )}
                </div>
                <div className="dropdown-list">
                  {players.map((player) => {
                    const isSelected = currentTab === "individual"
                      ? selectedPlayer === player.id
                      : selectedPlayers.includes(player.id);
                    const isDisabled = currentTab !== "individual"
                      && !selectedPlayers.includes(player.id)
                      && selectedPlayers.length >= 5;

                    return (
                      <label
                        key={player.id}
                        className={`dropdown-item ${
                          isSelected ? "selected" : ""
                        } ${
                          isDisabled ? "disabled" : ""
                        }`}
                      >
                        <input
                          type={currentTab === "individual" ? "radio" : "checkbox"}
                          name={currentTab === "individual" ? "player-select" : undefined}
                          checked={isSelected}
                          onChange={() => handlePlayerCheckboxChange(player.id)}
                          disabled={isDisabled}
                        />
                        <span>{player.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import "./home.css";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";
import Navigation from "@/components/layout/Navigation";
import { Player } from "@/types";
import { formatFirebaseDate } from "@/utils";
import { useLanguage } from "@/contexts/LanguageContext";

// Playerタイプを拡張（得意球種と利き手、球速データを追加）
interface ExtendedPlayer extends Player {
  throwingHand?: string;
  favoritePitch?: string;
  maxSpeed?: number;
  recentSpeed?: number;
}

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [players, setPlayers] = useState<ExtendedPlayer[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<ExtendedPlayer[]>([]);
  const [names, setNames] = useState<string[]>([]);
  const [grades, setGrades] = useState<string[]>([]);
  const [searchName, setSearchName] = useState("");
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [searchGrade, setSearchGrade] = useState("");
const normalizeGrade = (grade: string) => {
  if (!grade) return "";
 
  const numericGrade = grade.replace(/[^\d]/g, '');
  
  if (!numericGrade) return grade;
  return numericGrade; 
};

  // コンディションオプション
  const conditionOptions = [
    { value: "healthy", labelKey: "home.healthy", color: "#4CAF50", icon: "✓" },
    { value: "injured", labelKey: "home.injured", color: "#F44336", icon: "⚠" },
    { value: "sick", labelKey: "home.sick", color: "#FF9800", icon: "⚠" }
  ];

  // Helper function to find field value with multiple possible key names
  const findFieldValue = (record: any, ...possibleKeys: string[]): any => {
    for (const key of possibleKeys) {
      if (record[key] !== undefined && record[key] !== null && record[key] !== "") {
        return record[key];
      }
    }
    return null;
  };

  // Fetch players from Firestore
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const playerCollection = collection(db, "players");
        const playerSnapshot = await getDocs(playerCollection);
        const playerList = await Promise.all(
          playerSnapshot.docs.map(async (playerDoc) => {
            const playerData = {
              id: playerDoc.id,
              ...playerDoc.data(),
            } as ExtendedPlayer;

            // Fetch CSV data for this player to get speed statistics
            try {
              const csvDataRef = collection(db, "players", playerDoc.id, "csvData");
              const csvSnapshot = await getDocs(csvDataRef);

              if (!csvSnapshot.empty) {
                const records = csvSnapshot.docs.map(doc => doc.data());

                // Extract speeds from records
                const speeds = records.map(r => {
                  const value = findFieldValue(
                    r,
                    "速度(kph)",
                    "速度",
                    "releaseSpeed",
                    "Release Speed",
                    "speed",
                    "Speed",
                    "リリース速度",
                    "球速",
                    "RELEASE_SPEED",
                    "release_speed"
                  );
                  const numValue = value ? parseFloat(String(value).replace(/[^\d.-]/g, '')) : 0;
                  return isNaN(numValue) ? 0 : numValue;
                }).filter(s => s > 0);

                if (speeds.length > 0) {
                  playerData.maxSpeed = Math.max(...speeds);
                  playerData.recentSpeed = speeds[speeds.length - 1]; // Last recorded speed
                }
              }
            } catch (error) {
              console.error(`Error fetching CSV data for player ${playerDoc.id}:`, error);
            }

            return playerData;
          })
        );

        const uniqueNames = Array.from(new Set(playerList.map((player) => player.name)));
        const uniqueGrades = Array.from(new Set(playerList.map((player) => player.grade)));

        setPlayers(playerList);
        setFilteredPlayers(playerList);
        setNames(uniqueNames);
        setGrades(uniqueGrades);
      } catch (error) {
        console.error("Error fetching players:", error);
      }
    };

    fetchPlayers();
  }, []);

  const handleFilter = () => {
    let filtered = players;

    if (searchName) {
      filtered = filtered.filter((player) => player.name.toLowerCase().includes(searchName.toLowerCase()));
    }

    if (searchGrade) {
      filtered = filtered.filter((player) => player.grade === searchGrade);
    }

    if (selectedDate) {
      const selectedDateString = selectedDate.toLocaleDateString("en-GB");
      filtered = filtered.filter((player) => {
        if (player.creationDate) {
          if (typeof player.creationDate === 'string') {
            const creationDate = new Date(player.creationDate).toLocaleDateString("en-GB");
            return creationDate === selectedDateString;
          } else if (typeof player.creationDate === 'object' && 'seconds' in player.creationDate) {
            const creationDate = new Date(player.creationDate.seconds * 1000).toLocaleDateString("en-GB");
            return creationDate === selectedDateString;
          }
        }
        return false;
      });
    }

    setFilteredPlayers(filtered);
  };

  const handleNameInputChange = (input: string) => {
    setSearchName(input);

    if (input) {
      const suggestions = names.filter((name) =>
        name.toLowerCase().includes(input.toLowerCase())
      );
      setNameSuggestions(suggestions);
    } else {
      setNameSuggestions([]);
    }
  };

  const handleNameSelect = (name: string) => {
    setSearchName(name);
    setNameSuggestions([]);
  };

  const handleAddNewPlayer = () => {
    router.push("/create_player");
  };

  const handlePlayerClick = (playerId: string) => {
    router.push(`/player/${playerId}`);
  };

  const handleConditionChange = async (playerId: string, condition: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();

    try {
      // Update Firestore
      const playerRef = doc(db, "players", playerId);
      await updateDoc(playerRef, {
        condition: condition as 'healthy' | 'injured' | 'sick'
      });

      // Update local state
      setPlayers(prevPlayers =>
        prevPlayers.map(p =>
          p.id === playerId ? { ...p, condition: condition as 'healthy' | 'injured' | 'sick' } : p
        )
      );
      setFilteredPlayers(prevPlayers =>
        prevPlayers.map(p =>
          p.id === playerId ? { ...p, condition: condition as 'healthy' | 'injured' | 'sick' } : p
        )
      );
    } catch (error) {
      console.error("Error updating condition:", error);
    }
  };

  const getCondition = (player: ExtendedPlayer) => {
    return player.condition || "healthy";
  };

  const getConditionInfo = (condition: string) => {
    return conditionOptions.find(opt => opt.value === condition) || conditionOptions[0];
  };

  // 利き手の翻訳を取得
  const getThrowingHandLabel = (hand: string) => {
    if (hand === "right") return t("createPlayer.rightHanded");
    if (hand === "left") return t("createPlayer.leftHanded");
    return hand;
  };

  // 得意球種の翻訳を取得
  const getFavoritePitchLabel = (pitch: string) => {
    const pitchMap: { [key: string]: string } = {
      fastball: t("createPlayer.fastball"),
      curveball: t("createPlayer.curveball"),
      slider: t("createPlayer.slider"),
      changeup: t("createPlayer.changeup"),
      splitter: t("createPlayer.splitter"),
      forkball: t("createPlayer.forkball"),
      cutter: t("createPlayer.cutter"),
    };
    return pitchMap[pitch] || pitch;
  };

  return (
    <>
      <Navigation showProfile={true} showHamburger={true} />

      <div className="main-content">
        <div className="RightContenthome">
          {/* Filters */}
          <div className="dropdown-container">
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText={t("home.selectDate")}
              className="dropdown-item"
            />

            <div className="name-autocomplete">
              <input
                type="text"
                value={searchName}
                onChange={(e) => handleNameInputChange(e.target.value)}
                placeholder={t("home.searchByName")}
                className="dropdown-item"
              />
              {nameSuggestions.length > 0 && (
                <ul className="suggestions">
                  {nameSuggestions.map((suggestion, index) => (
                    <li key={index} onClick={() => handleNameSelect(suggestion)}>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <select
              value={searchGrade}
              onChange={(e) => setSearchGrade(e.target.value)}
              className="dropdown-item"
            >
              <option value="">{t("home.allGrades")}</option>
              {grades.map((grade, index) => (
              <option key={index} value={grade}>
              {normalizeGrade(grade)}
             </option>
                 ))}
            </select>

            <div className="filter_button">
              <button onClick={handleFilter}>{t("home.filter")}</button>
            </div>
            <div className="new_player">
              <button onClick={handleAddNewPlayer}>{t("home.newPlayer")}</button>
            </div>
          </div>

          {/* Player Cards */}
          <div className="player-cards-container">
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map((player) => {
                const currentCondition = getCondition(player);
                const conditionInfo = getConditionInfo(currentCondition);

                return (
                  <div
                    key={player.id}
                    className="player-card"
                    onClick={() => handlePlayerClick(player.id)}
                  >
                    <div className="player-card-header">
                      <span className="grade-badge">{normalizeGrade(player.grade)}{t("home1.grade")}</span>
                    </div>
                    <div className="player-card-body">
                      {player.imageURL && (
                        <Image
                          src={player.imageURL}
                          alt={`${player.name}'s profile`}
                          className="player-photo-circle"
                          width={60}
                          height={60}
                        />
                      )}
                      <h3 className="player-name">{player.name}</h3>
                      <p className="player-stats">
                        {t("home.height")}: {player.height}{t("common.cm")} {t("home.weight")}: {player.weight}{t("common.kg")}
                      </p>
                      <div className="player-details">
                        <p>
                          {t("home.maxSpeed")}: {player.maxSpeed ? `${player.maxSpeed.toFixed(1)}` : "-"}/
                          {player.recentSpeed ? `${player.recentSpeed.toFixed(1)}` : "-"}[km/h]
                        </p>

                        {/* コンディション ドロップダウン */}
                        <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {t("home.condition")}:
                          <select
                            value={currentCondition}
                            onChange={(e) => handleConditionChange(player.id, e.target.value, e)}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: `2px solid ${conditionInfo.color}`,
                              backgroundColor: 'white',
                              color: conditionInfo.color,
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          >
                            {conditionOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.icon} {t(option.labelKey)}
                              </option>
                            ))}
                          </select>
                          <span style={{
                            color: conditionInfo.color,
                            fontWeight: 'bold',
                            fontSize: '16px'
                          }}>
                            {conditionInfo.icon}
                          </span>
                        </p>
                      </div>
                      <div className="player-tags">
                        {player.favoritePitch && (
                          <span className="tag tag-blue">
                            {getFavoritePitchLabel(player.favoritePitch)}
                          </span>
                        )}
                        {player.throwingHand && (
                          <span className="tag tag-blue">
                            {getThrowingHandLabel(player.throwingHand)}
                          </span>
                        )}
                        <span className="tag tag-blue">{t("home.straight")}</span>
                        <span className="tag" style={{ backgroundColor: conditionInfo.color }}>
                          {t(conditionInfo.labelKey)}
                        </span>
                      </div>
                    </div>
                    <div className="player-card-footer">
                      {t("home.lastUpdate")}: {formatFirebaseDate(player.creationDate)}
                    </div>
                  </div>
                );
                
              })
            ) : (
              <p>{t("home.noPlayers")}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
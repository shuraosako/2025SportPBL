"use client";

import { useState, useEffect } from "react";
import "./home.css";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";
import Navigation from "@/components/layout/Navigation";
import { Player } from "@/types";
import { formatFirebaseDate } from "@/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [names, setNames] = useState<string[]>([]);
  const [grades, setGrades] = useState<string[]>([]);
  const [searchName, setSearchName] = useState("");
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [searchGrade, setSearchGrade] = useState("");
 
  // Fetch players from Firestore
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const playerCollection = collection(db, "players");
        const playerSnapshot = await getDocs(playerCollection);
        const playerList = playerSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Player[];
 
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
          const creationDate = new Date(player.creationDate.seconds * 1000).toLocaleDateString("en-GB");
          return creationDate === selectedDateString;
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
                  {grade}
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
              filteredPlayers.map((player) => (
                
                <div
  key={player.id}
  className="player-card"
  onClick={() => handlePlayerClick(player.id)}
>
  <div className="player-card-header">
    <span className="grade-badge">{player.grade}</span>
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
    <p className="player-stats">{t("home.height")}: {player.height}{t("common.cm")} {t("home.weight")}: {player.weight}{t("common.kg")}</p>
    <div className="player-bar">
      <div className="player-bar-fill" style={{width: '70%'}}></div>
    </div>
    <div className="player-details">
      <p>{t("home.maxSpeed")}: 130/120[km/h]</p>
      <p>{t("home.condition")}: <span className="condition-check">✓</span> 出場可能</p>
    </div>
    <div className="player-tags">
      <span className="tag tag-blue">{t("home.fastball")}</span>
      <span className="tag tag-blue">{t("home.leftHanded")}</span>
      <span className="tag tag-blue">{t("home.straight")}</span>
      <span className="tag tag-green">{t("home.healthy")}</span>
    </div>
  </div>
  <div className="player-card-footer">
    {t("home.lastUpdate")}: {formatFirebaseDate(player.creationDate)}
  </div>
</div>
              ))
            ) : (
              <p>{t("home.noPlayers")}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
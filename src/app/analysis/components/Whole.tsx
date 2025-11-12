"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import "./Whole.css";

interface Player {
  id: string;
  name: string;
}

interface PlayerData {
  id: string;
  date: string;
  speed: number;
  spin: number;
  trueSpin?: number;
  spinEff?: number;
  spinDirect?: number;
  verticalBreak?: number;
  horizontalBreak?: number;
  rating?: string;
}

interface WholeProps {
  players: Player[];
  playerData: PlayerData[];
  onSaveData?: (data: any[]) => void;
}

interface InputRow {
  id: string;
  playerId: string;
  playerName: string;
  date: string;
  speed: string;
  spinRate: string;
  trueSpin: string;
  spinEff: string;
  spinDirect: string;
  verticalBreak: string;
  horizontalBreak: string;
  rating: string;
  isNew: boolean;
  isExisting: boolean;
}

export default function Whole({
  players = [],
  playerData = [],
  onSaveData,
}: WholeProps) {
  const { t } = useLanguage();
  const [rows, setRows] = useState<InputRow[]>([]);
  const [searchName, setSearchName] = useState<string>("");

  // 既存データを初期表示用に変換
  useEffect(() => {
    const existingRows: InputRow[] = playerData.map((data, index) => {
      const player = players.find(p => p.id === data.id);
      return {
        id: `existing-data-${index}`,
        playerId: data.id,
        playerName: player?.name || t("player.notFound"),
        date: data.date,
        speed: data.speed.toString(),
        spinRate: data.spin.toString(),
        trueSpin: data.trueSpin?.toString() || "",
        spinEff: data.spinEff?.toString() || "",
        spinDirect: data.spinDirect?.toString() || "",
        verticalBreak: data.verticalBreak?.toString() || "",
        horizontalBreak: data.horizontalBreak?.toString() || "",
        rating: data.rating || "",
        isNew: false,
        isExisting: true,
      };
    });
    setRows(existingRows);
  }, [playerData, players, t]);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const addNewRow = () => {
    const newRow: InputRow = {
      id: `new-${Date.now()}`,
      playerId: "",
      playerName: "",
      date: getTodayDate(),
      speed: "",
      spinRate: "",
      trueSpin: "",
      spinEff: "",
      spinDirect: "",
      verticalBreak: "",
      horizontalBreak: "",
      rating: "",
      isNew: true,
      isExisting: false,
    };
    setRows([newRow, ...rows]);
  };

  const addExistingPlayerRow = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const newRow: InputRow = {
      id: `existing-${Date.now()}`,
      playerId: player.id,
      playerName: player.name,
      date: getTodayDate(),
      speed: "",
      spinRate: "",
      trueSpin: "",
      spinEff: "",
      spinDirect: "",
      verticalBreak: "",
      horizontalBreak: "",
      rating: "",
      isNew: false,
      isExisting: false,
    };
    setRows([newRow, ...rows]);
  };

  const removeRow = (id: string) => {
    setRows(rows.filter(row => row.id !== id));
  };

  const updateRow = (id: string, field: keyof InputRow, value: string) => {
    setRows(rows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const handleSave = () => {
    if (onSaveData) {
      onSaveData(rows);
    }
    console.log("保存データ:", rows);
  };

  // 名前で検索してフィルタリング
  const filteredRows = searchName.trim() === ""
    ? rows
    : rows.filter(row => 
        row.playerName.toLowerCase().includes(searchName.toLowerCase())
      );

  // 検索結果を新規・既存で分けてソート
  const displayRows = [
    ...filteredRows.filter(r => !r.isExisting),
    ...filteredRows.filter(r => r.isExisting)
  ];

  return (
    <div className="whole-container">
      <div className="whole-controls">
        <input
          type="text"
          placeholder={t("home.searchByName")}
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="whole-search-input"
        />

        <button
          onClick={addNewRow}
          className="whole-btn whole-btn-primary"
        >
          {t("home.newPlayer")}
        </button>

        <select
          onChange={(e) => {
            if (e.target.value) {
              addExistingPlayerRow(e.target.value);
              e.target.value = "";
            }
          }}
          className="whole-select"
        >
          <option value="">{t("analysis.selectPlayer")}</option>
          {players.map(player => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>

        {rows.length > 0 && (
          <button
            onClick={handleSave}
            className="whole-btn whole-btn-success"
          >
            {t("common.save")}
          </button>
        )}

        {searchName && (
          <span className="whole-search-result">
            {t("dataTable.loading")}: {displayRows.length}件
          </span>
        )}
      </div>

      {displayRows.length === 0 ? (
        <p className="whole-no-data">
          {searchName ? t("home.noPlayers") : t("dataTable.noData")}
        </p>
      ) : (
        <div className="whole-table-wrapper">
          <table className="whole-table">
            <thead>
              <tr>
                <th>{t("analysis.playerName")}</th>
                <th>{t("analysis.date")}</th>
                <th>{t("analysis.speed")}</th>
                <th>{t("analysis.spin")}</th>
                <th>{t("analysis.trueSpin")}</th>
                <th>{t("analysis.spinEff")}</th>
                <th>SPIN DIRECT</th>
                <th>{t("analysis.verticalMovement")}</th>
                <th>{t("analysis.horizontalMovement")}</th>
                <th>評価</th>
                <th>{t("common.delete")}</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, index) => (
                <tr 
                  key={row.id}
                  className={index % 2 === 0 ? 'whole-row-even' : 'whole-row-odd'}
                >
                  <td>
                    {row.isNew ? (
                      <input
                        type="text"
                        value={row.playerName}
                        onChange={(e) => updateRow(row.id, 'playerName', e.target.value)}
                        placeholder={t("createPlayer.name")}
                        className="whole-input"
                      />
                    ) : (
                      <span className={row.isExisting ? 'whole-existing-name' : ''}>
                        {row.playerName}
                      </span>
                    )}
                  </td>
                  <td>
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateRow(row.id, 'date', e.target.value)}
                      className={`whole-input ${row.isExisting ? 'whole-input-disabled' : ''}`}
                      disabled={row.isExisting}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.speed}
                      onChange={(e) => updateRow(row.id, 'speed', e.target.value)}
                      className={`whole-input ${row.isExisting ? 'whole-input-disabled' : ''}`}
                      disabled={row.isExisting}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.spinRate}
                      onChange={(e) => updateRow(row.id, 'spinRate', e.target.value)}
                      className={`whole-input ${row.isExisting ? 'whole-input-disabled' : ''}`}
                      disabled={row.isExisting}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.trueSpin}
                      onChange={(e) => updateRow(row.id, 'trueSpin', e.target.value)}
                      className={`whole-input ${row.isExisting ? 'whole-input-disabled' : ''}`}
                      disabled={row.isExisting}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.spinEff}
                      onChange={(e) => updateRow(row.id, 'spinEff', e.target.value)}
                      className={`whole-input ${row.isExisting ? 'whole-input-disabled' : ''}`}
                      disabled={row.isExisting}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.spinDirect}
                      onChange={(e) => updateRow(row.id, 'spinDirect', e.target.value)}
                      className={`whole-input ${row.isExisting ? 'whole-input-disabled' : ''}`}
                      disabled={row.isExisting}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.verticalBreak}
                      onChange={(e) => updateRow(row.id, 'verticalBreak', e.target.value)}
                      className={`whole-input ${row.isExisting ? 'whole-input-disabled' : ''}`}
                      disabled={row.isExisting}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.horizontalBreak}
                      onChange={(e) => updateRow(row.id, 'horizontalBreak', e.target.value)}
                      className={`whole-input ${row.isExisting ? 'whole-input-disabled' : ''}`}
                      disabled={row.isExisting}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.rating}
                      onChange={(e) => updateRow(row.id, 'rating', e.target.value)}
                      className={`whole-input ${row.isExisting ? 'whole-input-disabled' : ''}`}
                      disabled={row.isExisting}
                    />
                  </td>
                  <td>
                    <button
                      onClick={() => removeRow(row.id)}
                      className="whole-btn whole-btn-danger"
                    >
                      {t("common.delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
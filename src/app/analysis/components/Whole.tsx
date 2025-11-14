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
  const [searchName, setSearchName] = useState<string>("");

  // 既存データを表示用に変換
  const rows: InputRow[] = playerData.map((data, index) => {
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

  // 名前で検索してフィルタリング
  const filteredRows = searchName.trim() === ""
    ? rows
    : rows.filter(row => 
        row.playerName.toLowerCase().includes(searchName.toLowerCase())
      );

  // 各項目のトップ5を計算
  const calculateTop5 = () => {
    const allRows = filteredRows.filter(row => 
      row.speed || row.spinRate || row.trueSpin || row.spinEff || 
      row.spinDirect || row.verticalBreak || row.horizontalBreak
    );

    const getTop5 = (field: keyof InputRow, isNumeric: boolean = true) => {
      return allRows
        .filter(row => row[field] && row[field] !== "")
        .map(row => ({
          playerName: row.playerName,
          date: row.date,
          value: isNumeric ? parseFloat(row[field] as string) : row[field]
        }))
        .sort((a, b) => {
          if (isNumeric) {
            return (b.value as number) - (a.value as number);
          }
          return 0;
        })
        .slice(0, 5);
    };

    return {
      speed: getTop5('speed'),
      spinRate: getTop5('spinRate'),
      trueSpin: getTop5('trueSpin'),
      spinEff: getTop5('spinEff'),
      spinDirect: getTop5('spinDirect'),
      verticalBreak: getTop5('verticalBreak'),
      horizontalBreak: getTop5('horizontalBreak'),
    };
  };

  const top5Data = calculateTop5();

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

        {searchName && (
          <span className="whole-search-result">
            {t("dataTable.loading")}: {filteredRows.length}件
          </span>
        )}
      </div>

      {filteredRows.length === 0 ? (
        <p className="whole-no-data">
          {searchName ? t("home.noPlayers") : t("dataTable.noData")}
        </p>
      ) : (
        <div className="whole-separate-tables">
          {/* 球速 トップ5 */}
          <div className="whole-individual-table">
            <h3 className="whole-individual-title">🔥 {t("analysis.speed")} トップ5</h3>
            <div className="whole-top5-table-wrapper">
              <table className="whole-top5-table">
                <thead>
                  <tr>
                    <th>順位</th>
                    <th>選手名</th>
                    <th>記録</th>
                    <th>日付</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3, 4].map((index) => (
                    <tr key={index}>
                      <td className="whole-top5-rank-cell">
                        <span className={`whole-top5-rank whole-top5-rank-${index + 1}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td>{top5Data.speed[index]?.playerName || '-'}</td>
                      <td className="whole-record-value">
                        {top5Data.speed[index] ? `${top5Data.speed[index].value} km/h` : '-'}
                      </td>
                      <td className="whole-date-cell">{top5Data.speed[index]?.date || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 回転数 トップ5 */}
          <div className="whole-individual-table">
            <h3 className="whole-individual-title">🌀 {t("analysis.spin")} トップ5</h3>
            <div className="whole-top5-table-wrapper">
              <table className="whole-top5-table">
                <thead>
                  <tr>
                    <th>順位</th>
                    <th>選手名</th>
                    <th>記録</th>
                    <th>日付</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3, 4].map((index) => (
                    <tr key={index}>
                      <td className="whole-top5-rank-cell">
                        <span className={`whole-top5-rank whole-top5-rank-${index + 1}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td>{top5Data.spinRate[index]?.playerName || '-'}</td>
                      <td className="whole-record-value">
                        {top5Data.spinRate[index] ? `${top5Data.spinRate[index].value} rpm` : '-'}
                      </td>
                      <td className="whole-date-cell">{top5Data.spinRate[index]?.date || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TRUE SPIN トップ5 */}
          <div className="whole-individual-table">
            <h3 className="whole-individual-title">⚡ {t("analysis.trueSpin")} トップ5</h3>
            <div className="whole-top5-table-wrapper">
              <table className="whole-top5-table">
                <thead>
                  <tr>
                    <th>順位</th>
                    <th>選手名</th>
                    <th>記録</th>
                    <th>日付</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3, 4].map((index) => (
                    <tr key={index}>
                      <td className="whole-top5-rank-cell">
                        <span className={`whole-top5-rank whole-top5-rank-${index + 1}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td>{top5Data.trueSpin[index]?.playerName || '-'}</td>
                      <td className="whole-record-value">
                        {top5Data.trueSpin[index] ? `${top5Data.trueSpin[index].value} rpm` : '-'}
                      </td>
                      <td className="whole-date-cell">{top5Data.trueSpin[index]?.date || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SPIN EFF トップ5 */}
          <div className="whole-individual-table">
            <h3 className="whole-individual-title">📈 {t("analysis.spinEff")} トップ5</h3>
            <div className="whole-top5-table-wrapper">
              <table className="whole-top5-table">
                <thead>
                  <tr>
                    <th>順位</th>
                    <th>選手名</th>
                    <th>記録</th>
                    <th>日付</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3, 4].map((index) => (
                    <tr key={index}>
                      <td className="whole-top5-rank-cell">
                        <span className={`whole-top5-rank whole-top5-rank-${index + 1}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td>{top5Data.spinEff[index]?.playerName || '-'}</td>
                      <td className="whole-record-value">
                        {top5Data.spinEff[index] ? `${top5Data.spinEff[index].value}%` : '-'}
                      </td>
                      <td className="whole-date-cell">{top5Data.spinEff[index]?.date || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SPIN DIRECT トップ5 */}
          <div className="whole-individual-table">
            <h3 className="whole-individual-title">🎯 SPIN DIRECT トップ5</h3>
            <div className="whole-top5-table-wrapper">
              <table className="whole-top5-table">
                <thead>
                  <tr>
                    <th>順位</th>
                    <th>選手名</th>
                    <th>記録</th>
                    <th>日付</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3, 4].map((index) => (
                    <tr key={index}>
                      <td className="whole-top5-rank-cell">
                        <span className={`whole-top5-rank whole-top5-rank-${index + 1}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td>{top5Data.spinDirect[index]?.playerName || '-'}</td>
                      <td className="whole-record-value">
                        {top5Data.spinDirect[index] ? `${top5Data.spinDirect[index].value}°` : '-'}
                      </td>
                      <td className="whole-date-cell">{top5Data.spinDirect[index]?.date || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 縦変化 トップ5 */}
          <div className="whole-individual-table">
            <h3 className="whole-individual-title">⬆️ {t("analysis.verticalMovement")} トップ5</h3>
            <div className="whole-top5-table-wrapper">
              <table className="whole-top5-table">
                <thead>
                  <tr>
                    <th>順位</th>
                    <th>選手名</th>
                    <th>記録</th>
                    <th>日付</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3, 4].map((index) => (
                    <tr key={index}>
                      <td className="whole-top5-rank-cell">
                        <span className={`whole-top5-rank whole-top5-rank-${index + 1}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td>{top5Data.verticalBreak[index]?.playerName || '-'}</td>
                      <td className="whole-record-value">
                        {top5Data.verticalBreak[index] ? `${top5Data.verticalBreak[index].value} cm` : '-'}
                      </td>
                      <td className="whole-date-cell">{top5Data.verticalBreak[index]?.date || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 横変化 トップ5 */}
          <div className="whole-individual-table">
            <h3 className="whole-individual-title">↔️ {t("analysis.horizontalMovement")} トップ5</h3>
            <div className="whole-top5-table-wrapper">
              <table className="whole-top5-table">
                <thead>
                  <tr>
                    <th>順位</th>
                    <th>選手名</th>
                    <th>記録</th>
                    <th>日付</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3, 4].map((index) => (
                    <tr key={index}>
                      <td className="whole-top5-rank-cell">
                        <span className={`whole-top5-rank whole-top5-rank-${index + 1}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td>{top5Data.horizontalBreak[index]?.playerName || '-'}</td>
                      <td className="whole-record-value">
                        {top5Data.horizontalBreak[index] ? `${top5Data.horizontalBreak[index].value} cm` : '-'}
                      </td>
                      <td className="whole-date-cell">{top5Data.horizontalBreak[index]?.date || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

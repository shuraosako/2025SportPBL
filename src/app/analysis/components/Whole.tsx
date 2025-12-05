"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Player, PlayerData } from "@/types";
import "./Whole.css";

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
  const { t, language } = useLanguage(); // languageを追加
  const [searchName, setSearchName] = useState<string>("");

  // 既存データを表示用に変換
  const rows: InputRow[] = useMemo(() => 
    playerData.map((data, index) => {
      const player = players.find(p => p.id === data.id);
      // 言語に応じて名前を選択
      const displayName = language === 'en' && player?.nameEn 
        ? player.nameEn 
        : player?.name || t("player.notFound");
      
      return {
        id: `existing-data-${index}`,
        playerId: data.id,
        playerName: displayName,
        date: data.date,
        speed: data.speed.toString(),
        spinRate: data.spin.toString(),
        trueSpin: data.trueSpin?.toString() || "",
        spinEff: data.spinEff?.toString() || "",
        spinDirect: data.spinDirection?.toString() || "",
        verticalBreak: data.verticalMovement?.toString() || "",
        horizontalBreak: data.horizontalMovement?.toString() || "",
        rating: data.rating || "",
        isNew: false,
        isExisting: true,
      };
    }), [playerData, players, t, language]
  );

  // 名前で検索してフィルタリング
  const filteredRows = useMemo(() => 
    searchName.trim() === ""
      ? rows
      : rows.filter(row => 
          row.playerName.toLowerCase().includes(searchName.toLowerCase())
        ),
    [rows, searchName]
  );

  // 各項目のトップ5を計算
  const top5Data = useMemo(() => {
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
  }, [filteredRows]);

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
            {filteredRows.length} {t("ranking.resultsFound")}
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
            <h3 className="whole-individual-title">🔥 {t("analysis.speed")} Top5</h3>
            <div className="whole-top5-table-wrapper">
              <table className="whole-top5-table">
                <thead>
                  <tr>
                    <th>{t("ranking.rank")}</th>
                    <th>{t("ranking.playerName")}</th>
                    <th>{t("ranking.record")}</th>
                    <th>{t("ranking.date")}</th>
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
            <h3 className="whole-individual-title">🌀 {t("analysis.spin")} Top5</h3>
            <div className="whole-top5-table-wrapper">
              <table className="whole-top5-table">
                <thead>
                  <tr>
                    <th>{t("ranking.rank")}</th>
                    <th>{t("ranking.playerName")}</th>
                    <th>{t("ranking.record")}</th>
                    <th>{t("ranking.date")}</th>
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
            <h3 className="whole-individual-title">⚡ {t("analysis.trueSpin")} Top5</h3>
            <div className="whole-top5-table-wrapper">
              <table className="whole-top5-table">
                <thead>
                  <tr>
                    <th>{t("ranking.rank")}</th>
                    <th>{t("ranking.playerName")}</th>
                    <th>{t("ranking.record")}</th>
                    <th>{t("ranking.date")}</th>
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
            <h3 className="whole-individual-title">📈 {t("analysis.spinEff")} Top5</h3>
            <div className="whole-top5-table-wrapper">
              <table className="whole-top5-table">
                <thead>
                  <tr>
                    <th>{t("ranking.rank")}</th>
                    <th>{t("ranking.playerName")}</th>
                    <th>{t("ranking.record")}</th>
                    <th>{t("ranking.date")}</th>
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
            <h3 className="whole-individual-title">🎯 {t("analysis.spinDirect")} Top5</h3>
            <div className="whole-top5-table-wrapper">
              <table className="whole-top5-table">
                <thead>
                  <tr>
                    <th>{t("ranking.rank")}</th>
                    <th>{t("ranking.playerName")}</th>
                    <th>{t("ranking.record")}</th>
                    <th>{t("ranking.date")}</th>
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
            <h3 className="whole-individual-title">⬆️ {t("analysis.verticalMovement")} Top5</h3>
            <div className="whole-top5-table-wrapper">
              <table className="whole-top5-table">
                <thead>
                  <tr>
                    <th>{t("ranking.rank")}</th>
                    <th>{t("ranking.playerName")}</th>
                    <th>{t("ranking.record")}</th>
                    <th>{t("ranking.date")}</th>
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
            <h3 className="whole-individual-title">↔️ {t("analysis.horizontalMovement")} Top5</h3>
            <div className="whole-top5-table-wrapper">
              <table className="whole-top5-table">
                <thead>
                  <tr>
                    <th>{t("ranking.rank")}</th>
                    <th>{t("ranking.playerName")}</th>
                    <th>{t("ranking.record")}</th>
                    <th>{t("ranking.date")}</th>
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
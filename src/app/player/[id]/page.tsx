"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  doc,
  getDoc,
  collection,
  writeBatch,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import Navigation from "@/components/layout/Navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import styles from "./PlayerPage.module.css";

type Player = {
  id: string;
  name: string;
  grade: string;
  height: number;
  weight: number;
  imageURL?: string;
};

type FileRow = {
  [key: string]: string | number | null;
};

type PlayerStats = {
  maxSpeed: number;
  avgSpeed: number;
  maxSpin: number;
  avgSpin: number;
  totalRecords: number;
  lastRecordDate: string;
};

type RecentRecord = {
  date: string;
  releaseSpeed?: number;
  spinRate?: number;
};

type RankingData = {
  speedRank: number;
  spinRank: number;
  totalPlayers: number;
};

export default function PlayerPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileData, setFileData] = useState<FileRow[]>([]);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [recentRecords, setRecentRecords] = useState<RecentRecord[]>([]);
  const [ranking, setRanking] = useState<RankingData | null>(null);
  const [showUploadSection, setShowUploadSection] = useState(false);

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!id) return;

      try {
        // Fetch player info
        const playerDoc = await getDoc(doc(db, "players", id as string));
        if (playerDoc.exists()) {
          const playerData = playerDoc.data() as Omit<Player, "id">;
          setPlayer({ id: id as string, ...playerData });

          // Fetch player's CSV data for statistics
          const csvDataRef = collection(db, "players", id as string, "csvData");
          const csvSnapshot = await getDocs(csvDataRef);

          if (!csvSnapshot.empty) {
            const records = csvSnapshot.docs.map(doc => doc.data());


            // Helper function to find field value with multiple possible key names
            const findFieldValue = (record: any, ...possibleKeys: string[]): any => {
              for (const key of possibleKeys) {
                if (record[key] !== undefined && record[key] !== null && record[key] !== "") {
                  return record[key];
                }
              }
              return null;
            };

            // Calculate statistics - try multiple possible field names
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

            const spins = records.map(r => {
              const value = findFieldValue(
                r,
                "SPIN",
                "Spin",
                "spinRate",
                "Spin Rate",
                "spin",
                "回転数",
                "スピンレート",
                "SPIN_RATE",
                "spin_rate"
              );
              const numValue = value ? parseFloat(String(value).replace(/[^\d.-]/g, '')) : 0;
              return isNaN(numValue) ? 0 : numValue;
            }).filter(s => s > 0);

            // Get dates - try multiple possible field names
            const dates = records.map(r => {
              const dateValue = findFieldValue(r, "日付", "date", "Date", "DATE", "測定日");
              return dateValue ? String(dateValue) : null;
            }).filter(d => d !== null);

            const statsData: PlayerStats = {
              maxSpeed: speeds.length > 0 ? Math.max(...speeds) : 0,
              avgSpeed: speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0,
              maxSpin: spins.length > 0 ? Math.max(...spins) : 0,
              avgSpin: spins.length > 0 ? spins.reduce((a, b) => a + b, 0) / spins.length : 0,
              totalRecords: records.length,
              lastRecordDate: dates.length > 0 ? dates[dates.length - 1]! : "-"
            };
            setStats(statsData);

            // Get recent 5 records (last 5 entries)
            const recentWithIndex = records.slice(-5).reverse().map((r, idx) => {
              const dateValue = findFieldValue(r, "日付", "date", "Date", "DATE", "測定日");
              const speedValue = findFieldValue(
                r,
                "速度(kph)",
                "速度",
                "releaseSpeed",
                "Release Speed",
                "speed",
                "Speed",
                "リリース速度",
                "球速"
              );
              const spinValue = findFieldValue(
                r,
                "SPIN",
                "Spin",
                "spinRate",
                "Spin Rate",
                "spin",
                "回転数",
                "スピンレート"
              );

              const speed = speedValue ? parseFloat(String(speedValue).replace(/[^\d.-]/g, '')) : 0;
              const spin = spinValue ? parseFloat(String(spinValue).replace(/[^\d.-]/g, '')) : 0;

              return {
                index: idx,
                date: dateValue ? String(dateValue) : "-",
                releaseSpeed: isNaN(speed) ? 0 : speed,
                spinRate: isNaN(spin) ? 0 : spin
              };
            });

            setRecentRecords(recentWithIndex);
          }

          // Calculate ranking
          await calculateRanking(id as string);
        } else {
          console.error("Player not found");
        }
      } catch (error) {
        console.error("Error fetching player:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [id]);

  const calculateRanking = async (playerId: string) => {
    try {
      const playersSnapshot = await getDocs(collection(db, "players"));
      const allPlayersStats: { id: string; maxSpeed: number; maxSpin: number }[] = [];

      // Helper function to find field value
      const findFieldValue = (record: any, ...possibleKeys: string[]): any => {
        for (const key of possibleKeys) {
          if (record[key] !== undefined && record[key] !== null && record[key] !== "") {
            return record[key];
          }
        }
        return null;
      };

      for (const playerDoc of playersSnapshot.docs) {
        const csvDataRef = collection(db, "players", playerDoc.id, "csvData");
        const csvSnapshot = await getDocs(csvDataRef);

        if (!csvSnapshot.empty) {
          const records = csvSnapshot.docs.map(doc => doc.data());

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
              "球速"
            );
            const numValue = value ? parseFloat(String(value).replace(/[^\d.-]/g, '')) : 0;
            return isNaN(numValue) ? 0 : numValue;
          }).filter(s => s > 0);

          const spins = records.map(r => {
            const value = findFieldValue(
              r,
              "SPIN",
              "Spin",
              "spinRate",
              "Spin Rate",
              "spin",
              "回転数",
              "スピンレート"
            );
            const numValue = value ? parseFloat(String(value).replace(/[^\d.-]/g, '')) : 0;
            return isNaN(numValue) ? 0 : numValue;
          }).filter(s => s > 0);

          allPlayersStats.push({
            id: playerDoc.id,
            maxSpeed: speeds.length > 0 ? Math.max(...speeds) : 0,
            maxSpin: spins.length > 0 ? Math.max(...spins) : 0
          });
        }
      }

      // Sort by speed and find rank
      const sortedBySpeed = [...allPlayersStats].sort((a, b) => b.maxSpeed - a.maxSpeed);
      const speedRank = sortedBySpeed.findIndex(p => p.id === playerId) + 1;

      // Sort by spin and find rank
      const sortedBySpin = [...allPlayersStats].sort((a, b) => b.maxSpin - a.maxSpin);
      const spinRank = sortedBySpin.findIndex(p => p.id === playerId) + 1;

      setRanking({
        speedRank,
        spinRank,
        totalPlayers: allPlayersStats.length
      });
    } catch (error) {
      console.error("Error calculating ranking:", error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        if (file.type === "text/csv") {
          Papa.parse(data as string, {
            header: true,
            encoding: "UTF-8",
            complete: (result) => {
              setFileData(result.data as FileRow[]);
            },
            skipEmptyLines: true,
          });
        } else if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          setFileData(jsonData as FileRow[]);
        }
      };
      reader.readAsText(file, "UTF-8");
    }
  };

  const handleDataUpload = async () => {
    if (!fileData.length || !player) {
      alert("No data to upload or player not found.");
      return;
    }

    try {
      const playerRef = doc(db, "players", player.id);
      const subcollectionRef = collection(playerRef, "csvData");

      const existingDocsSnapshot = await getDocs(subcollectionRef);
      const batch = writeBatch(db);
      existingDocsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      fileData.forEach((row) => {
        const docData = {
          ...row,
          uploadedAt: serverTimestamp(),
        };
        const docRef = doc(subcollectionRef);
        batch.set(docRef, docData);
      });

      await batch.commit();

      alert("CSV data replaced successfully!");
      setFileData([]);
    } catch (error) {
      console.error("Error replacing data:", error);
      alert("Failed to replace data. Check the console for more details.");
    }
  };

  const handleRedirect = () => {
    if (!player?.id) {
      alert("Player ID is missing");
      return;
    }
    router.push(`/data-table?playerId=${player.id}`);
  };

  if (loading) {
    return <div>{t("player.loading")}</div>;
  }

  if (!player) {
    return <div>{t("player.notFound")}</div>;
  }

  return (
    <>
      <Navigation showProfile={true} showHamburger={true} />

      <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.header}>
          <div className={styles.profileSection}>
            {player.imageURL && (
              <Image
                src={player.imageURL}
                alt={`${player.name}'s profile`}
                className={styles.profilePicture}
                width={150}
                height={150}
              />
            )}
            <div className={styles.playerInfo}>
              <h1 className={styles.playerName}>{player.name}</h1>
              <div className={styles.basicInfo}>
                <span className={styles.infoItem}>
                  {t("home.grade")}: <strong>{player.grade}</strong>
                </span>
                <span className={styles.infoItem}>
                  {t("home.height")}: <strong>{player.height} {t("common.cm")}</strong>
                </span>
                <span className={styles.infoItem}>
                  {t("home.weight")}: <strong>{player.weight} {t("common.kg")}</strong>
                </span>
              </div>
            </div>
          </div>
          <button onClick={() => router.push("/home")} className={styles.backButton}>
            ← {t("player.backToHome")}
          </button>
        </div>

        {/* Statistics Section */}
        <div className={styles.statsSection}>
          <h2 className={styles.sectionTitle}>{t("player.statistics")}</h2>
          {stats ? (
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>{t("player.maxSpeed")}</div>
                <div className={styles.statValue}>{stats.maxSpeed.toFixed(1)} <span className={styles.unit}>{t("common.kph")}</span></div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>{t("player.avgSpeed")}</div>
                <div className={styles.statValue}>{stats.avgSpeed.toFixed(1)} <span className={styles.unit}>{t("common.kph")}</span></div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>{t("player.maxSpin")}</div>
                <div className={styles.statValue}>{stats.maxSpin.toFixed(0)} <span className={styles.unit}>{t("common.rpm")}</span></div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>{t("player.avgSpin")}</div>
                <div className={styles.statValue}>{stats.avgSpin.toFixed(0)} <span className={styles.unit}>{t("common.rpm")}</span></div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>{t("player.totalRecords")}</div>
                <div className={styles.statValue}>{stats.totalRecords}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>{t("player.lastRecord")}</div>
                <div className={styles.statValue}>{stats.lastRecordDate}</div>
              </div>
            </div>
          ) : (
            <p className={styles.noData}>{t("player.noRecords")}</p>
          )}
        </div>

        {/* Ranking Section */}
        {ranking && (
          <div className={styles.rankingSection}>
            <h2 className={styles.sectionTitle}>{t("player.overallRanking")}</h2>
            <div className={styles.rankingGrid}>
              <div className={styles.rankCard}>
                <div className={styles.rankLabel}>{t("player.speedRank")}</div>
                <div className={styles.rankValue}>
                  {ranking.speedRank}{t("player.rank")}
                  <span className={styles.rankTotal}> / {ranking.totalPlayers}{t("player.outOf")}</span>
                </div>
              </div>
              <div className={styles.rankCard}>
                <div className={styles.rankLabel}>{t("player.spinRank")}</div>
                <div className={styles.rankValue}>
                  {ranking.spinRank}{t("player.rank")}
                  <span className={styles.rankTotal}> / {ranking.totalPlayers}{t("player.outOf")}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Records Section */}
        <div className={styles.recentSection}>
          <h2 className={styles.sectionTitle}>{t("player.recentRecords")}</h2>
          {recentRecords.length > 0 ? (
            <div className={styles.recordsTable}>
              <div className={styles.recordHeader}>
                <span>{t("analysis.date")}</span>
                <span>{t("analysis.speed")} ({t("common.kph")})</span>
                <span>{t("analysis.spin")} ({t("common.rpm")})</span>
              </div>
              {recentRecords.map((record, index) => (
                <div key={index} className={styles.recordRow}>
                  <span>{record.date}</span>
                  <span>{record.releaseSpeed ? record.releaseSpeed.toFixed(1) : "-"}</span>
                  <span>{record.spinRate ? record.spinRate.toFixed(0) : "-"}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noData}>{t("player.noRecords")}</p>
          )}
        </div>

        {/* Data Management Section */}
        <div className={styles.dataSection}>
          <h2 className={styles.sectionTitle}>{t("player.dataManagement")}</h2>
          <div className={styles.actionButtons}>
            <button onClick={handleRedirect} className={styles.primaryButton}>
              {t("player.viewAllData")}
            </button>
            <button
              onClick={() => setShowUploadSection(!showUploadSection)}
              className={styles.secondaryButton}
            >
              {showUploadSection ? "×" : "+"} {t("player.uploadNewData")}
            </button>
          </div>

          {showUploadSection && (
            <div className={styles.uploadSection}>
              <input
                type="file"
                accept=".csv, .xlsx"
                onChange={handleFileUpload}
                className={styles.fileInput}
              />
              {fileData.length > 0 && (
                <>
                  <div className={styles.previewInfo}>
                    <p>{fileData.length} rows loaded</p>
                  </div>
                  <button onClick={handleDataUpload} className={styles.uploadButton}>
                    {t("player.uploadCSV")}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
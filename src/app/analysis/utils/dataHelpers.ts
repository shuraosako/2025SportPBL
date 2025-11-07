import { PlayerData } from "../types";

export const convertSpinDirection = (direction: string): string => {
  const mapping: { [key: string]: string } = {
    "1:00": "1:00",
    "2:00": "2:00",
    "3:00": "3:00",
    "4:00": "4:00",
    "5:00": "5:00",
    "6:00": "6:00",
    "7:00": "7:00",
    "8:00": "8:00",
    "9:00": "9:00",
    "10:00": "10:00",
    "11:00": "11:00",
    "12:00": "12:00",
  };
  return mapping[direction] || direction;
};

export const mapRawDataToPlayerData = (rawData: any): PlayerData => {
  // Helper function to safely convert to string and trim
  const safeToString = (value: any): string => {
    if (value === null || value === undefined) return "";
    return String(value);
  };

  const parsedSpeed = parseFloat(safeToString(rawData["速度(kph)"]));
  const parsedSpin = parseInt(safeToString(rawData["SPIN"]), 10);

  if (isNaN(parsedSpeed)) {
    console.error('Invalid Speed Detected:', rawData["速度(kph)"]);
  }
  if (isNaN(parsedSpin)) {
    console.error('Invalid Spin Detected:', rawData["SPIN"]);
  }

  return {
    id: rawData.id || "unknown-id",
    documentId: rawData.documentId || undefined,
    date: rawData["日付"] || "unknown-date",
    speed: isNaN(parsedSpeed) ? 0 : parsedSpeed,
    spin: isNaN(parsedSpin) ? 0 : parsedSpin,
    trueSpin: parseInt(safeToString(rawData["TRUE SPIN"]), 10) || 0,
    spinEff: parseFloat(safeToString(rawData["SPIN EFF."]).replace("%", "")) || 0,
    spinDirection: convertSpinDirection(rawData["SPIN DIRECTION"]),
    verticalMovement: parseFloat(safeToString(rawData["線の変化量(cm)"])) || 0,
    horizontalMovement: parseFloat(safeToString(rawData["軸の変化量(cm)"])) || 0,
    strike: rawData["ストライク"] === "はい" ? 1 : 0,
    releasePoint: parseFloat(safeToString(rawData["リリースポイントの高さ(m)"])) || 0,
    absorption: rawData.absorption || "unknown",
  };
};

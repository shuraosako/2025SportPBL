"use client";

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from "@/contexts/LanguageContext";
import { PlayerData, Player } from "../types";
import './IndividualAnalysis.css';

interface IndividualAnalysisProps {
  selectedPlayer: string | null;
  players: Player[];
  playerData: PlayerData[];
}

export default function IndividualAnalysis({
  selectedPlayer,
  players,
  playerData,
}: IndividualAnalysisProps) {
  const { t, language } = useLanguage();
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  if (!selectedPlayer) {
    return (
      <div className="noDataContainer">
        <p>{t("analysis.noPlayerSelected")}</p>
      </div>
    );
  }

  const player = players.find(p => p.id === selectedPlayer);
  const filteredData = playerData
    .filter(data => data.id === selectedPlayer)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (filteredData.length === 0) {
    return (
      <div className="noDataWithTitle">
        <h3>{player?.name || t("analysis.selectPlayer")}</h3>
        <p>{t("analysis.noData")}</p>
      </div>
    );
  }

  // Calculate statistics
  const speeds = filteredData.map(d => d.speed);
  const spins = filteredData.map(d => d.spin);
  const strikes = filteredData.filter(d => d.strike === 1).length;
  
  const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const avgSpin = spins.reduce((a, b) => a + b, 0) / spins.length;
  const strikeRate = (strikes / filteredData.length) * 100;

  // 最新のデータの日付を取得
  const latestDate = filteredData[filteredData.length - 1].date;
  const dateObj = new Date(latestDate);
  
  // 日付のフォーマット（言語によって変更）
  const formattedDate = language === 'ja' 
    ? `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`
    : dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // 月ラベル
  const monthLabel = t("analysis.monthLabel");

  // グラフ用データ（横軸は数字のみ）
  const speedChartData = filteredData.map((data, index) => {
    const parts = data.date.split('/');
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    
    // 左隣（前のデータ）と同じ月なら空文字、違えば月を表示
    let displayMonth = `${month}`;
    if (index > 0) {
      const prevMonth = parseInt(filteredData[index - 1].date.split('/')[1], 10);
      if (month === prevMonth) {
        displayMonth = '';
      }
    }
    
    return {
      name: displayMonth,
      displayDate: `${month}/${day}`,
      value: data.speed
    };
  });

  const spinChartData = filteredData.map((data, index) => {
    const parts = data.date.split('/');
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    
    // 左隣（前のデータ）と同じ月なら空文字、違えば月を表示
    let displayMonth = `${month}`;
    if (index > 0) {
      const prevMonth = parseInt(filteredData[index - 1].date.split('/')[1], 10);
      if (month === prevMonth) {
        displayMonth = '';
      }
    }
    
    return {
      name: displayMonth,
      displayDate: `${month}/${day}`,
      value: data.spin
    };
  });

  // 散布図用データ
  const scatterData = filteredData.map(data => ({
    speed: data.speed,
    spin: data.spin,
    date: data.date,
    strike: data.strike
  }));

  // 散布図の範囲を自動計算
  const minSpeed = Math.min(...speeds);
  const maxSpeed = Math.max(...speeds);
  const minSpin = Math.min(...spins);
  const maxSpin = Math.max(...spins);

  // 軸の範囲に余白を追加
  const speedPadding = (maxSpeed - minSpeed) * 0.1 || 5;
  const spinPadding = (maxSpin - minSpin) * 0.1 || 100;
  const speedMin = minSpeed - speedPadding;
  const speedMax = maxSpeed + speedPadding;
  const spinMin = minSpin - spinPadding;
  const spinMax = maxSpin + spinPadding;

  // トレンドライン計算（線形回帰）- X軸が回転数、Y軸が球速
  const calculateTrendLine = () => {
    const n = scatterData.length;
    const sumX = spins.reduce((a, b) => a + b, 0);
    const sumY = speeds.reduce((a, b) => a + b, 0);
    const sumXY = scatterData.reduce((sum, d) => sum + d.spin * d.speed, 0);
    const sumX2 = spins.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  };

  const trendLine = calculateTrendLine();

  // トレンドラインの始点と終点
  const trendY1 = trendLine.slope * spinMin + trendLine.intercept;
  const trendY2 = trendLine.slope * spinMax + trendLine.intercept;

  // 座標変換関数（X軸=回転数、Y軸=球速）
  const getX = (spin: number) => ((spin - spinMin) / (spinMax - spinMin)) * 90 + 5;
  const getY = (speed: number) => 100 - ((speed - speedMin) / (speedMax - speedMin)) * 90 - 5;

  // グリッド線の位置計算（3分割）
  const gridPositions = [25, 50, 75];
  const getSpeedAtPosition = (pos: number) => speedMax - (speedMax - speedMin) * (pos / 100);
  const getSpinAtPosition = (pos: number) => spinMin + (spinMax - spinMin) * (pos / 100);

  // 色の計算（新しいデータほど濃く、ストライク/ボールで色分け）
  const getPointColor = (index: number, strike?: number) => {
    const ratio = index / (scatterData.length - 1);
    const baseColor = strike === 1 ? [66, 126, 234] : [231, 76, 60]; // 青 or 赤
    const alpha = 0.3 + ratio * 0.7; // 0.3から1.0
    return `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${alpha})`;
  };

  // 日付フォーマット関数
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return language === 'ja'
      ? `${date.getMonth() + 1}/${date.getDate()}`
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="container">
      <div className="mainLayout">
        {/* 上段: グラフ2つ */}
        <div className="graphRow">
          {/* 球速グラフ */}
          <div className="chartCard">
            <h3 className="chartTitle">
              {t("analysis.speed")}({t("common.kph")})
            </h3>
            
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={speedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  label={{ value: monthLabel, position: 'insideBottomRight', offset: 0, fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      return (
                        <div style={{ background: 'white', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
                          <p style={{ margin: 0 }}>{payload[0].payload.displayDate}</p>
                          <p style={{ margin: 0, color: '#e74c3c' }}>{t("analysis.speed")}: {payload[0].value}{t("common.kph")}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill="#e74c3c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 回転数グラフ */}
          <div className="chartCard">
            <h3 className="chartTitle">
              {t("analysis.spin")}
            </h3>
            
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={spinChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  label={{ value: monthLabel, position: 'insideBottomRight', offset: 0, fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      return (
                        <div style={{ background: 'white', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
                          <p style={{ margin: 0 }}>{payload[0].payload.displayDate}</p>
                          <p style={{ margin: 0, color: '#667eea' }}>{t("analysis.spin")}: {payload[0].value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill="#667eea" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 中段: カード3つ */}
        <div className="cardsRow">
          {/* 球速(平均) */}
          <div className="valueCard">
            <h3 className="valueTitle">{t("analysis.speedAverage")}</h3>
            <p className="dateText">{formattedDate}</p>
            <div className="speedValue">
              {avgSpeed.toFixed(0)}{t("common.kph")}
            </div>
          </div>

          {/* 回転数(平均) */}
          <div className="valueCard">
            <h3 className="valueTitle">{t("analysis.spinAverage")}</h3>
            <div className="spinValue">
              {Math.round(avgSpin)}
            </div>
          </div>

          {/* ストライク率 */}
          <div className="strikeCard">
            <h3 className="strikeTitle">
              {t("analysis.strikeRate")}
            </h3>
            
            <div className="circleContainer">
              <svg width="200" height="200" className="circleSvg">
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#f0f0f0"
                  strokeWidth="20"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#f1c40f"
                  strokeWidth="20"
                  strokeDasharray={`${2 * Math.PI * 80 * (strikeRate / 100)} ${2 * Math.PI * 80}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="strikeRateValue">
                {strikeRate.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* 下段: 散布図（3列目に配置） */}
        <div className="scatterRow">
          {/* 散布図 */}
          <div className="scatterCard">
            <div className="scatterPlot">
              {/* 軸ラベル */}
              <span className="scatterAxisLabel scatterAxisLabelLeft">
                {t("analysis.scatterAxisSpeed")}
              </span>
              <span className="scatterAxisLabel scatterAxisLabelBottom">
                {t("analysis.scatterAxisSpin")}
              </span>
              
              {/* グリッド線と目盛り */}
              {gridPositions.map((pos, idx) => (
                <div key={`grid-${idx}`}>
                  {/* 縦線 */}
                  <div 
                    className="scatterGridLine scatterGridLineVertical" 
                    style={{ left: `${pos}%` }}
                  />
                  <div 
                    className="scatterAxisTick scatterAxisTickX" 
                    style={{ left: `${pos}%` }}
                  >
                    {Math.round(getSpinAtPosition(pos))}
                  </div>
                  
                  {/* 横線 */}
                  <div 
                    className="scatterGridLine scatterGridLineHorizontal" 
                    style={{ top: `${pos}%` }}
                  />
                  <div 
                    className="scatterAxisTick scatterAxisTickY" 
                    style={{ top: `${pos}%` }}
                  >
                    {Math.round(getSpeedAtPosition(pos))}
                  </div>
                </div>
              ))}

              {/* トレンドライン */}
              <div
                className="scatterTrendLine"
                style={{
                  left: `${getX(spinMin)}%`,
                  top: `${getY(trendY1)}%`,
                  width: `${Math.sqrt(
                    Math.pow(getX(spinMax) - getX(spinMin), 2) +
                    Math.pow(getY(trendY2) - getY(trendY1), 2)
                  )}%`,
                  transform: `rotate(${Math.atan2(
                    getY(trendY2) - getY(trendY1),
                    getX(spinMax) - getX(spinMin)
                  )}rad)`,
                }}
              />
              
              {/* データポイント */}
              {scatterData.map((point, index) => {
                const x = getX(point.spin);
                const y = getY(point.speed);
                
                return (
                  <div key={index}>
                    <div
                      className="scatterDot"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        background: getPointColor(index, point.strike),
                      }}
                      onMouseEnter={() => setHoveredPoint(index)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    {hoveredPoint === index && (
                      <div
                        className="scatterTooltip"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                        }}
                      >
                        <div>{formatDate(point.date)}</div>
                        <div>{t("analysis.speed")}: {point.speed}{t("common.kph")}</div>
                        <div>{t("analysis.spin")}: {point.spin}</div>
                        <div>{point.strike === 1 ? 'Strike' : 'Ball'}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { useLanguage } from "@/contexts/LanguageContext";
import { PlayerData, Player } from "../types";
import "./ComparisonGraph.css";

const COLORS = ["#8095ffff", "#7cffc2ff", "#000000ff", "#ff5959ff", "#a47dffff"];

interface ComparisonGraphProps {
  players: Player[];
  playerData: PlayerData[];
  selectedPlayers: string[];
}

export default function ComparisonGraph({
  players,
  playerData,
  selectedPlayers,
}: ComparisonGraphProps) {
  const { t } = useLanguage();

  if (selectedPlayers.length === 0) {
    return (
      <div className="graph-section">
        <p className="no-data-message">{t("analysis.noPlayerSelected")}</p>
      </div>
    );
  }

  const prepareHorizontalBarData = () => {
    const metrics = [
      { key: 'avgSpeed', label: t("analysis.averageSpeed"), max: 200 },
      { key: 'maxSpeed', label: t("analysis.maxSpeed"), max: 200 },
      { key: 'avgSpin', label: t("analysis.averageSpin"), max: 3000 },
      { key: 'avgTrueSpin', label: t("analysis.averageTrueSpin"), max: 3000 },
      { key: 'avgSpinEff', label: t("analysis.averageSpinEff"), max: 100 },
      { key: 'strikeRate', label: t("analysis.strikeRate"), max: 100 }
    ];

    return metrics.map(metric => {
      const dataPoint: any = { metric: metric.label };

      selectedPlayers.slice(0, 5).forEach(playerId => {
        const stats = playerData.filter(data => data.id === playerId);
        if (stats.length > 0) {
          let value = 0;
          switch (metric.key) {
            case 'avgSpeed':
              value = stats.reduce((sum, item) => sum + item.speed, 0) / stats.length;
              break;
            case 'maxSpeed':
              value = Math.max(...stats.map(s => s.speed));
              break;
            case 'avgSpin':
              value = stats.reduce((sum, item) => sum + item.spin, 0) / stats.length;
              break;
            case 'avgTrueSpin':
              value = stats.reduce((sum, item) => sum + item.trueSpin, 0) / stats.length;
              break;
            case 'avgSpinEff':
              value = stats.reduce((sum, item) => sum + item.spinEff, 0) / stats.length;
              break;
            case 'strikeRate':
              value = (stats.filter(s => s.strike === 1).length / stats.length) * 100;
              break;
          }
          const normalizedValue = (value / metric.max) * 100;
          dataPoint[playerId] = parseFloat(normalizedValue.toFixed(1));
        }
      });

      return dataPoint;
    });
  };

  const prepareRadarData = () => {
    const allStats = playerData.filter(d => selectedPlayers.includes(d.id));
    const maxValues = {
      speed: Math.max(...allStats.map(d => d.speed), 1),
      spin: Math.max(...allStats.map(d => d.spin), 1),
      trueSpin: Math.max(...allStats.map(d => d.trueSpin), 1),
    };

    const metrics = [
      { key: 'avgSpeed', label: t("analysis.averageSpeed") },
      { key: 'avgSpin', label: t("analysis.averageSpin") },
      { key: 'avgTrueSpin', label: t("analysis.averageTrueSpin") },
      { key: 'avgSpinEff', label: t("analysis.averageSpinEff") },
      { key: 'strikeRate', label: t("analysis.strikeRate") }
    ];

    return metrics.map(metric => {
      const dataPoint: any = { subject: metric.label };
      
      selectedPlayers.slice(0, 5).forEach(playerId => {
        const stats = playerData.filter(data => data.id === playerId);
        if (stats.length > 0) {
          let value = 0;
          switch (metric.key) {
            case 'avgSpeed':
              value = Math.round((stats.reduce((sum, s) => sum + s.speed, 0) / stats.length) / maxValues.speed * 100);
              break;
            case 'avgSpin':
              value = Math.round((stats.reduce((sum, s) => sum + s.spin, 0) / stats.length) / maxValues.spin * 100);
              break;
            case 'avgTrueSpin':
              value = Math.round((stats.reduce((sum, s) => sum + s.trueSpin, 0) / stats.length) / maxValues.trueSpin * 100);
              break;
            case 'avgSpinEff':
              value = Math.round(stats.reduce((sum, s) => sum + s.spinEff, 0) / stats.length);
              break;
            case 'strikeRate':
              value = Math.round((stats.filter(s => s.strike === 1).length / stats.length) * 100);
              break;
          }
          dataPoint[playerId] = value;
        }
      });
      
      return dataPoint;
    });
  };

  return (
    <div className="graph-section">
      <h3 className="graph-title">{t("analysis.tabs.comparison")}</h3>

      <div className="comparison-container">
        {/* Player Avatars Section */}
        <div className="player-avatars-section">
          <h4 className="player-avatars-title">
            {t("analysis.players")}
          </h4>
          {selectedPlayers.slice(0, 5).map((playerId, index) => {
            const player = players.find(p => p.id === playerId);
            return (
              <div key={playerId} className="player-avatar-item">
                <div 
                  className="player-avatar-circle"
                  style={{ 
                    backgroundColor: COLORS[index], 
                    borderColor: COLORS[index]
                  }}
                >
                  {player?.name.charAt(0)}
                </div>
                <div className="player-avatar-name">
                  {player?.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Horizontal Bar Chart Comparison */}
        <div className="bar-chart-container">
          <ResponsiveContainer width="100%" height={500}>
            <BarChart 
              data={prepareHorizontalBarData()} 
              layout="vertical"
              margin={{ left: 150, right: 30, top: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                stroke="#666" 
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#ccc' }}
              />
              <YAxis 
                type="category" 
                dataKey="metric" 
                stroke="#666" 
                width={145} 
                tick={{ fontSize: 13, fill: '#333' }}
                axisLine={{ stroke: '#ccc' }}
                tickLine={{ stroke: '#ccc' }}
              />
              <Tooltip 
                contentStyle={{ fontSize: 12 }}
                formatter={(value: any) => [parseFloat(value).toFixed(1), '']}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              {selectedPlayers.map((playerId, index) => {
                const player = players.find(p => p.id === playerId);
                return (
                  <Bar
                    key={playerId}
                    dataKey={playerId}
                    fill={COLORS[index]}
                    name={player?.name || "Unknown"}
                    radius={[0, 4, 4, 0]}
                    barSize={30}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Integrated Radar Chart */}
      <div className="radar-chart-container">
        <h4 className="radar-chart-title">
          {t("analysis.radarComparison")}
        </h4>
        <ResponsiveContainer width="100%" height={500}>
          <RadarChart data={prepareRadarData()}>
            <PolarGrid stroke="#e0e0e0" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 13, fill: '#333' }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '10px',
                fontSize: 12
              }}
              formatter={(value: any, name: any) => {
                const player = players.find(p => p.id === name);
                return [`${value}`, player?.name || name];
              }}
            />
            {selectedPlayers.slice(0, 5).map((playerId, index) => {
              const player = players.find(p => p.id === playerId);
              return (
                <Radar
                  key={playerId}
                  name={player?.name || "Unknown"}
                  dataKey={playerId}
                  stroke={COLORS[index]}
                  fill={COLORS[index]}
                  fillOpacity={0.3}
                  strokeWidth={2}
                  dot={{ r: 4, fill: COLORS[index], strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              );
            })}
            <Legend wrapperStyle={{ fontSize: 13, paddingTop: 20 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Comparison Table */}
      <div className="comparison-table">
        <h4 className="chart-subtitle">{t("analysis.detailedComparison")}</h4>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("analysis.playerName")}</th>
              <th>{t("analysis.averageSpeed")}</th>
              <th>{t("analysis.maxSpeed")}</th>
              <th>{t("analysis.averageSpin")}</th>
              <th>{t("analysis.maxSpin")}</th>
              <th>{t("analysis.averageTrueSpin")}</th>
              <th>{t("analysis.averageSpinEff")}</th>
              <th>{t("analysis.strikeRate")}</th>
            </tr>
          </thead>
          <tbody>
            {selectedPlayers.map(playerId => {
              const player = players.find(p => p.id === playerId);
              const stats = playerData.filter(d => d.id === playerId);
              if (stats.length === 0) return null;

              const avgSpeed = stats.reduce((sum, s) => sum + s.speed, 0) / stats.length;
              const maxSpeed = Math.max(...stats.map(s => s.speed));
              const avgSpin = stats.reduce((sum, s) => sum + s.spin, 0) / stats.length;
              const maxSpin = Math.max(...stats.map(s => s.spin));
              const avgTrueSpin = stats.reduce((sum, s) => sum + s.trueSpin, 0) / stats.length;
              const avgSpinEff = stats.reduce((sum, s) => sum + s.spinEff, 0) / stats.length;
              const strikeRate = (stats.filter(s => s.strike === 1).length / stats.length) * 100;

              return (
                <tr key={playerId}>
                  <td>{player?.name || "Unknown"}</td>
                  <td>{avgSpeed.toFixed(1)} {t("common.kph")}</td>
                  <td>{maxSpeed.toFixed(1)} {t("common.kph")}</td>
                  <td>{Math.round(avgSpin)} {t("common.rpm")}</td>
                  <td>{Math.round(maxSpin)} {t("common.rpm")}</td>
                  <td>{Math.round(avgTrueSpin)} {t("common.rpm")}</td>
                  <td>{avgSpinEff.toFixed(1)}{t("common.percent")}</td>
                  <td>{strikeRate.toFixed(1)}{t("common.percent")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
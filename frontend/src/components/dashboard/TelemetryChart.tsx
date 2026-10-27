import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Radio, Eye } from 'lucide-react';

interface TelemetryPoint {
  time: string;
  authEvents: number;
  webEvents: number;
  systemTraps: number;
}

const SAMPLE_TIMELINE: TelemetryPoint[] = [
  { time: '06:00', authEvents: 12, webEvents: 4, systemTraps: 1 },
  { time: '06:05', authEvents: 18, webEvents: 6, systemTraps: 0 },
  { time: '06:10', authEvents: 24, webEvents: 10, systemTraps: 2 },
  { time: '06:15', authEvents: 148, webEvents: 35, systemTraps: 8 }, // Spike: brute force attempt
  { time: '06:20', authEvents: 210, webEvents: 92, systemTraps: 14 }, // Spike: path traversal + sudo denial
  { time: '06:25', authEvents: 85, webEvents: 40, systemTraps: 5 }, // Fail2ban blocks attacker
  { time: '06:30', authEvents: 32, webEvents: 18, systemTraps: 2 },
  { time: '06:35', authEvents: 22, webEvents: 12, systemTraps: 1 },
  { time: '06:40', authEvents: 15, webEvents: 8, systemTraps: 0 },
  { time: '06:45', authEvents: 19, webEvents: 11, systemTraps: 1 },
  { time: '06:50', authEvents: 25, webEvents: 14, systemTraps: 2 },
  { time: '06:55', authEvents: 20, webEvents: 9, systemTraps: 0 },
];

interface TelemetryChartProps {
  hasData: boolean;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({ hasData }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(4); // default inspect spike
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('1h');
  const [activeStream, setActiveStream] = useState<'all' | 'auth' | 'web' | 'system'>('all');

  const data = hasData ? SAMPLE_TIMELINE : [];

  // Dimensions for SVG
  const width = 800;
  const height = 220;
  const paddingX = 40;
  const paddingY = 25;

  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const maxVal = 240; // peak scale

  const getCoordinates = (index: number, val: number) => {
    const x = paddingX + (index / (data.length - 1)) * innerWidth;
    const y = height - paddingY - (val / maxVal) * innerHeight;
    return { x, y };
  };

  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const authPoints = data.map((d, i) => getCoordinates(i, d.authEvents));
  const webPoints = data.map((d, i) => getCoordinates(i, d.webEvents));
  const sysPoints = data.map((d, i) => getCoordinates(i, d.systemTraps * 8)); // scale for visibility

  const authLine = createSmoothPath(authPoints);
  const webLine = createSmoothPath(webPoints);
  const sysLine = createSmoothPath(sysPoints);

  const authArea = authPoints.length > 0
    ? `${authLine} L ${authPoints[authPoints.length - 1].x} ${height - paddingY} L ${authPoints[0].x} ${height - paddingY} Z`
    : '';

  const hoveredData = hoveredIdx !== null && data[hoveredIdx] ? data[hoveredIdx] : null;

  return (
    <div className="p-5 rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-slate-950/80 backdrop-blur-md relative overflow-hidden shadow-xl shadow-black/40">
      {/* Subtle top cyan line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>Multi-Stream Ingress Telemetry</span>
                <span className="text-[10px] font-mono font-normal text-cyan-400 bg-cyan-950/50 border border-cyan-800/40 px-2 py-0.5 rounded-full">
                  RFC-5424 Normalized
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time frequency of Linux daemon events, authentication handshakes, and access denials.
              </p>
            </div>
          </div>
        </div>

        {/* Stream selectors & time range */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center p-1 rounded-lg bg-slate-900/90 border border-slate-800">
            {(['all', 'auth', 'web', 'system'] as const).map((stream) => (
              <button
                key={stream}
                onClick={() => setActiveStream(stream)}
                className={`px-2.5 py-1 text-xs rounded-md capitalize transition-all ${
                  activeStream === stream
                    ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {stream === 'all' ? 'All Channels' : stream}
              </button>
            ))}
          </div>

          <div className="flex items-center p-1 rounded-lg bg-slate-900/90 border border-slate-800">
            {(['1h', '6h', '24h'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2 py-1 text-xs rounded-md transition-colors font-mono ${
                  timeRange === r
                    ? 'bg-cyan-500/10 text-cyan-300 font-semibold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {hasData ? (
        <div className="relative">
          {/* Legend and interactive readout banner */}
          <div className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-slate-950/60 border border-slate-800/70 mb-3">
            <div className="flex items-center gap-4 flex-wrap text-[11px]">
              <div
                onClick={() => setActiveStream(activeStream === 'auth' ? 'all' : 'auth')}
                className={`flex items-center gap-1.5 cursor-pointer transition-opacity ${
                  activeStream !== 'all' && activeStream !== 'auth' ? 'opacity-40' : 'opacity-100'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                <span className="text-slate-300 font-medium">Auth & SSH Stream</span>
              </div>

              <div
                onClick={() => setActiveStream(activeStream === 'web' ? 'all' : 'web')}
                className={`flex items-center gap-1.5 cursor-pointer transition-opacity ${
                  activeStream !== 'all' && activeStream !== 'web' ? 'opacity-40' : 'opacity-100'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
                <span className="text-slate-300 font-medium">Web & Ingress Filter</span>
              </div>

              <div
                onClick={() => setActiveStream(activeStream === 'system' ? 'all' : 'system')}
                className={`flex items-center gap-1.5 cursor-pointer transition-opacity ${
                  activeStream !== 'all' && activeStream !== 'system' ? 'opacity-40' : 'opacity-100'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                <span className="text-slate-300 font-medium">AppArmor & Syslog Traps</span>
              </div>
            </div>

            {/* Hovered point telemetry inspection */}
            {hoveredData ? (
              <div className="flex items-center gap-3 font-mono text-[11px] text-slate-300">
                <span className="text-cyan-400 font-semibold">{hoveredData.time} UTC</span>
                <span className="text-slate-500">|</span>
                <span>Auth: <strong className="text-cyan-300 font-bold">{hoveredData.authEvents}</strong></span>
                <span>Web: <strong className="text-teal-300 font-bold">{hoveredData.webEvents}</strong></span>
                <span>Traps: <strong className="text-rose-400 font-bold">{hoveredData.systemTraps}</strong></span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-500 font-mono">Hover chart to inspect event rates</span>
            )}
          </div>

          {/* SVG Visual Canvas */}
          <div className="w-full overflow-hidden select-none">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-48 md:h-56 overflow-visible"
            >
              <defs>
                {/* Cyan Gradient for Area */}
                <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.28" />
                  <stop offset="60%" stopColor="#06B6D4" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
                </linearGradient>

                {/* Subtle Grid Pattern */}
                <pattern id="chartGrid" width="40" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(30, 41, 67, 0.45)" strokeWidth="0.75" />
                </pattern>
              </defs>

              {/* Grid Background */}
              <rect x={paddingX} y={paddingY} width={innerWidth} height={innerHeight} fill="url(#chartGrid)" />

              {/* Horizontal Reference Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = height - paddingY - ratio * innerHeight;
                const valueLabel = Math.round(ratio * maxVal);
                return (
                  <g key={i}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={width - paddingX}
                      y2={y}
                      stroke="rgba(30, 41, 67, 0.6)"
                      strokeDasharray="2 3"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      textAnchor="end"
                      fill="#64748B"
                      fontSize="9"
                      fontFamily="JetBrains Mono"
                    >
                      {valueLabel}
                    </text>
                  </g>
                );
              })}

              {/* Area Fill for Auth Stream */}
              {(activeStream === 'all' || activeStream === 'auth') && (
                <motion.path
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  d={authArea}
                  fill="url(#cyanGradient)"
                />
              )}

              {/* Stream Lines with Smooth Drawing Reveal */}
              {(activeStream === 'all' || activeStream === 'web') && (
                <motion.path
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  d={webLine}
                  fill="none"
                  stroke="#2DD4BF"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}

              {(activeStream === 'all' || activeStream === 'system') && (
                <motion.path
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
                  d={sysLine}
                  fill="none"
                  stroke="#F43F5E"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                />
              )}

              {(activeStream === 'all' || activeStream === 'auth') && (
                <motion.path
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.1, ease: 'easeOut' }}
                  d={authLine}
                  fill="none"
                  stroke="#00F2FE"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Hover Cursor Vertical Bar and Data Dots */}
              {hoveredIdx !== null && (
                <g>
                  {/* Vertical hairline */}
                  <line
                    x1={getCoordinates(hoveredIdx, 0).x}
                    y1={paddingY}
                    x2={getCoordinates(hoveredIdx, 0).x}
                    y2={height - paddingY}
                    stroke="#00F2FE"
                    strokeWidth="1.2"
                    strokeDasharray="3 2"
                    opacity="0.75"
                  />

                  {/* Auth point */}
                  <circle
                    cx={authPoints[hoveredIdx].x}
                    cy={authPoints[hoveredIdx].y}
                    r="4.5"
                    fill="#00F2FE"
                    stroke="#080C14"
                    strokeWidth="2"
                  />

                  {/* Web point */}
                  <circle
                    cx={webPoints[hoveredIdx].x}
                    cy={webPoints[hoveredIdx].y}
                    r="3.5"
                    fill="#2DD4BF"
                    stroke="#080C14"
                    strokeWidth="1.5"
                  />

                  {/* System point */}
                  <circle
                    cx={sysPoints[hoveredIdx].x}
                    cy={sysPoints[hoveredIdx].y}
                    r="3.5"
                    fill="#F43F5E"
                    stroke="#080C14"
                    strokeWidth="1.5"
                  />
                </g>
              )}

              {/* Invisible interactive hover columns */}
              {data.map((_, i) => {
                const colWidth = innerWidth / (data.length - 1);
                const x = paddingX + i * colWidth - colWidth / 2;
                return (
                  <rect
                    key={i}
                    x={x}
                    y={paddingY}
                    width={colWidth}
                    height={innerHeight}
                    fill="transparent"
                    className="cursor-crosshair"
                    onMouseEnter={() => setHoveredIdx(i)}
                  />
                );
              })}

              {/* X-Axis Time Labels */}
              {data.map((d, i) => {
                const { x } = getCoordinates(i, 0);
                // show every alternate label to prevent clutter
                if (i % 2 !== 0 && i !== data.length - 1) return null;
                return (
                  <text
                    key={i}
                    x={x}
                    y={height - 6}
                    textAnchor="middle"
                    fill="#64748B"
                    fontSize="10"
                    fontFamily="JetBrains Mono"
                  >
                    {d.time}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
          <Radio className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="text-xs font-medium text-slate-300">Telemetry Stream Standby</p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
            Ingest raw Linux logs or toggle sample data to visualize multi-channel ingress event rates.
          </p>
        </div>
      )}
    </div>
  );
};

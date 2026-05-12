"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { toJpeg } from "html-to-image";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { SpeedRow } from "@/app/page";

const F_SYSTEM_LABELS: Record<string, string> = {
  "1": "Interstate",
  "2": "Freeways & Expressways",
  "3": "Other Principal Arterial",
  "4": "Minor Arterial",
  "5": "Major Collector",
  "6": "Minor Collector",
  "7": "Local",
};

const VEHICLE_TYPES = ["All", "Passenger", "Freight"] as const;
type VehicleType = (typeof VEHICLE_TYPES)[number];

const COLORS: Record<VehicleType, string> = {
  All: "#1e2a35",
  Passenger: "#2d5f8a",
  Freight: "#c0392b",
};

function formatMonth(key: string) {
  const [y, m] = key.split("-");
  const months = [
    "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[+m]} ${y}`;
}

export default function SpeedDashboard({ data }: { data: SpeedRow[] }) {
  const [fSystem, setFSystem] = useState("1");
  const [timePeriod, setTimePeriod] = useState("AM");
  const [area, setArea] = useState("Urban");
  const [vehicleType, setVehicleType] = useState<VehicleType>("All");
  const chartRef = useRef<HTMLDivElement>(null);

  // available f_system values
  const availableSystems = useMemo(() => {
    const s = new Set(data.map((r) => r.f_system));
    return Array.from(s)
      .sort((a, b) => +a - +b)
      .filter((v) => F_SYSTEM_LABELS[v]);
  }, [data]);

  // build nice Y-axis ticks: 0, 10, 20, ... up past max value
  const yTicks = useMemo(() => {
    const filtered = data.filter(
      (r) =>
        r.f_system === fSystem &&
        r.time_period === timePeriod &&
        r.area === area &&
        r.vehicle_type === vehicleType
    );
    const max = Math.max(...filtered.map((r) => parseFloat(r.median_speed) || 0));
    const top = Math.ceil(max / 10) * 10;
    const ticks: number[] = [];
    for (let i = 0; i <= top; i += 10) ticks.push(i);
    return ticks;
  }, [data, fSystem, timePeriod, area, vehicleType]);

  // filter and pivot
  const chartData = useMemo(() => {
    const filtered = data.filter(
      (r) =>
        r.f_system === fSystem &&
        r.time_period === timePeriod &&
        r.area === area &&
        r.vehicle_type === vehicleType
    );

    return filtered
      .map((r) => ({
        date: `${r.year}-${r.month.padStart(2, "0")}`,
        speed: parseFloat(r.median_speed),
      }))
      .filter((r) => !isNaN(r.speed))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data, fSystem, timePeriod, area, vehicleType]);

  const exportJpeg = useCallback(() => {
    if (!chartRef.current) return;
    toJpeg(chartRef.current, { backgroundColor: "#F5F0E8", quality: 0.95 }).then(
      (url) => {
        const a = document.createElement("a");
        a.href = url;
        a.download = `nhs-speed-${vehicleType}-${fSystem}-${area}-${timePeriod}.jpg`;
        a.click();
      }
    );
  }, [vehicleType, fSystem, area, timePeriod]);

  const exportCsv = useCallback(() => {
    const header = "Date,Median Speed (mph)";
    const rows = chartData.map((r) => `${r.date},${r.speed}`);
    const blob = new Blob([header + "\n" + rows.join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nhs-speed-${vehicleType}-${fSystem}-${area}-${timePeriod}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [chartData, vehicleType, fSystem, area, timePeriod]);

  return (
    <>
      <div className="filters">
        <div className="fg">
          <label>Road Classification</label>
          <select value={fSystem} onChange={(e) => setFSystem(e.target.value)}>
            {availableSystems.map((v) => (
              <option key={v} value={v}>
                {v} &mdash; {F_SYSTEM_LABELS[v]}
              </option>
            ))}
          </select>
        </div>
        <div className="fg">
          <label>Time of Day</label>
          <div style={{ display: "flex", gap: 4 }}>
            {["AM", "PM"].map((t) => (
              <button
                key={t}
                className={`toggle-btn ${timePeriod === t ? "active" : ""}`}
                onClick={() => setTimePeriod(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="fg">
          <label>Area</label>
          <div style={{ display: "flex", gap: 4 }}>
            {["Urban", "Rural"].map((a) => (
              <button
                key={a}
                className={`toggle-btn ${area === a ? "active" : ""}`}
                onClick={() => setArea(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <div className="fg">
          <label>Vehicle Type</label>
          <div style={{ display: "flex", gap: 4 }}>
            {VEHICLE_TYPES.map((v) => (
              <button
                key={v}
                className={`toggle-btn ${vehicleType === v ? "active" : ""}`}
                onClick={() => setVehicleType(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="panel" ref={chartRef}>
        <div className="panel-hdr">
          <span>Median Speed &mdash; {F_SYSTEM_LABELS[fSystem]}, {timePeriod} Hours, {area}, {vehicleType} Vehicles</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="export-btn" onClick={exportJpeg}>JPEG</button>
            <button className="export-btn" onClick={exportCsv}>CSV</button>
          </div>
        </div>
        <div className="panel-body">
          {chartData.length === 0 ? (
            <p style={{ color: "var(--steel)", fontSize: 13 }}>
              No data for selected filters.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 16, bottom: 4, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatMonth}
                  fontSize={10}
                  tick={{ fill: "var(--steel)" }}
                  interval={11}
                />
                <YAxis
                  fontSize={10}
                  tick={{ fill: "var(--steel)" }}
                  domain={[0, yTicks[yTicks.length - 1]]}
                  ticks={yTicks}
                  allowDecimals={false}
                  tickFormatter={(v: number) => `${v} mph`}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    fontFamily: "var(--sans)",
                    fontSize: 12,
                    borderRadius: 4,
                    border: "1px solid var(--border)",
                  }}
                  labelFormatter={(label) => formatMonth(String(label))}
                  formatter={(v) => [`${Number(v).toFixed(1)} mph`]}
                />
                <Line
                  type="monotone"
                  dataKey="speed"
                  stroke={COLORS[vehicleType]}
                  strokeWidth={2}
                  dot={false}
                  name={vehicleType}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </>
  );
}

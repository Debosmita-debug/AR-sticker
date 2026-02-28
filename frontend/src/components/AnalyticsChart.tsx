"use client";

import { useEffect, useRef } from "react";
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import type { DashboardSticker } from "@/lib/api";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface AnalyticsChartProps {
  stickers: DashboardSticker[];
}

export default function AnalyticsChart({ stickers }: AnalyticsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  // Build/update chart whenever data changes
  useEffect(() => {
    if (!canvasRef.current) return;

    const sorted = [...stickers]
      .sort((a, b) => b.scanCount - a.scanCount)
      .slice(0, 10);

    const labels = sorted.map((s) => {
      const caption = s.options?.caption;
      return caption ? caption.slice(0, 16) : `#${s.id.slice(0, 6)}`;
    });
    const data = sorted.map((s) => s.scanCount);

    // Destroy previous chart if exists
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    chartRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Scan Count",
            data,
            backgroundColor: data.map((_, i) =>
              `rgba(168, 85, 247, ${0.9 - i * 0.06})`
            ),
            borderColor: "rgba(168, 85, 247, 0.6)",
            borderWidth: 1,
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(24, 24, 27, 0.95)",
            titleColor: "#a855f7",
            bodyColor: "#fafafa",
            borderColor: "rgba(168, 85, 247, 0.3)",
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (ctx: any) => ` ${ctx.parsed.y} scans`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: "rgba(255,255,255,0.04)" },
            ticks: {
              color: "rgba(255,255,255,0.5)",
              font: { size: 11, family: "inherit" },
              maxRotation: 30,
            },
          },
          y: {
            beginAtZero: true,
            grid: { color: "rgba(255,255,255,0.04)" },
            ticks: {
              color: "rgba(255,255,255,0.5)",
              font: { size: 11, family: "inherit" },
              precision: 0,
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [stickers]);

  const totalScans = stickers.reduce((a, s) => a + s.scanCount, 0);
  const topSticker = stickers.reduce(
    (best, s) => (s.scanCount > (best?.scanCount ?? -1) ? s : best),
    null as DashboardSticker | null
  );

  return (
    <div className="space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Scans", value: totalScans.toLocaleString() },
            { label: "Total Stickers", value: stickers.length.toString() },
            {
              label: "Top Performer",
              value: topSticker
                ? (topSticker.options?.caption || `#${topSticker.id.slice(0, 6)}`).slice(0, 12)
                : "—",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-2xl p-6 text-center border border-white/5 hover:border-primary/20 transition-all"
            >
              <p className="text-3xl font-black gradient-text">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Bar Chart */}
        <div className="glass rounded-3xl p-6 border border-white/5">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6">
            Scan Activity – Top 10 Stickers
          </p>
          {stickers.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              No scan data yet
            </div>
          ) : (
            <div className="h-64">
              <canvas ref={canvasRef} />
            </div>
          )}
        </div>
    </div>
  );
}

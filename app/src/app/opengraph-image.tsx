// src/app/opengraph-image.tsx
// Default Open Graph image — 1200×630, rendered as a PNG via Next.js ImageResponse.
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PrancingPika — RIFT Combat Log Tracker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        {/* Glow accent */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(56,189,248,0.18) 0%, transparent 70%)",
            top: 80,
            left: 100,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, zIndex: 1 }}>
          <div
            style={{
              fontSize: 18,
              letterSpacing: "0.2em",
              color: "rgba(56,189,248,0.85)",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            RIFT Combat Log Parser
          </div>

          <div
            style={{
              fontSize: 88,
              fontWeight: 800,
              color: "#f1f5f9",
              lineHeight: 1,
              letterSpacing: "-2px",
            }}
          >
            PrancingPika
          </div>

          <div
            style={{
              fontSize: 24,
              color: "rgba(148,163,184,0.85)",
              marginTop: 8,
            }}
          >
            DPS · HPS · Leaderboards · Guilds
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

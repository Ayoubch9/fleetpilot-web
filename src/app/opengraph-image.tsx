import { ImageResponse } from "next/og";

export const alt = "MileVoxa — Trucking Profit, Expenses & Fleet Management";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#102238",
          color: "#ffffff",
          padding: "72px 80px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 14,
              background: "#16853B",
              fontSize: 26,
              fontWeight: 800,
            }}
          >
            M
          </div>
          MileVoxa
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              color: "#55B772",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Run your trucking business with clarity.
          </div>
          <div
            style={{
              maxWidth: 960,
              fontSize: 64,
              lineHeight: 1.03,
              fontWeight: 800,
              letterSpacing: "-0.045em",
            }}
          >
            Trucking profit, expenses & fleet management in one place.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 34,
            color: "#B5C3CF",
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          <span>Loads</span>
          <span>Expenses</span>
          <span>Fuel</span>
          <span>Maintenance</span>
          <span>Weekly Profit</span>
        </div>
      </div>
    ),
    size
  );
}

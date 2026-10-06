"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

const navy = "#102238";
const green = "#16853B";
const muted = "#667085";
const background = "#F5F7F9";

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();

  const tokenHash = (searchParams.get("token_hash") ?? "").trim();
  const type = (searchParams.get("type") ?? "").trim();

  const validRecovery = tokenHash.length > 0 && type === "recovery";

  const appUrl = useMemo(() => {
    if (!validRecovery) return "";

    const query = new URLSearchParams({
      token_hash: tokenHash,
      type: "recovery",
    });

    return `milevoxa://reset-password/?${query.toString()}`;
  }, [tokenHash, validRecovery]);

  function openMileVoxa() {
    if (!appUrl) return;
    window.location.href = appUrl;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background,
        padding: 24,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#FFFFFF",
          borderRadius: 24,
          border: "1px solid #E4E7EC",
          boxShadow: "0 18px 55px rgba(16, 34, 56, 0.10)",
          padding: 28,
        }}
      >
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 16,
            display: "grid",
            placeItems: "center",
            background: "#EAF6EC",
            color: green,
            fontSize: 24,
            fontWeight: 900,
            marginBottom: 18,
          }}
          aria-hidden="true"
        >
          M
        </div>

        <div
          style={{
            color: green,
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          MileVoxa
        </div>

        <h1
          style={{
            margin: 0,
            color: navy,
            fontSize: 30,
            lineHeight: 1.12,
            letterSpacing: "-0.03em",
          }}
        >
          Reset your password
        </h1>

        {validRecovery ? (
          <>
            <p
              style={{
                color: muted,
                lineHeight: 1.65,
                margin: "14px 0 22px",
              }}
            >
              Your recovery request is ready. Open MileVoxa to choose a new
              password securely.
            </p>

            <button
              type="button"
              onClick={openMileVoxa}
              style={{
                width: "100%",
                minHeight: 50,
                border: 0,
                borderRadius: 14,
                background: green,
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: 800,
                cursor: "pointer",
                padding: "14px 18px",
              }}
            >
              Open MileVoxa
            </button>

            <p
              style={{
                color: muted,
                fontSize: 13,
                lineHeight: 1.55,
                margin: "16px 0 0",
              }}
            >
              If the app does not open, make sure MileVoxa is installed on this
              device, then tap the button again.
            </p>
          </>
        ) : (
          <>
            <p
              style={{
                color: muted,
                lineHeight: 1.65,
                margin: "14px 0 0",
              }}
            >
              This reset link is incomplete or invalid. Return to MileVoxa and
              request a new password-reset email.
            </p>
          </>
        )}
      </section>
    </main>
  );
}

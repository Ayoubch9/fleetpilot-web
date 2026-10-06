import { Suspense } from "react";

import ResetPasswordClient from "./reset-password-client";

function LoadingState() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#F5F7F9",
        padding: 24,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <p style={{ color: "#667085", margin: 0 }}>Preparing your secure reset…</p>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ResetPasswordClient />
    </Suspense>
  );
}

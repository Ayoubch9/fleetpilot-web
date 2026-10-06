import { Suspense } from "react";

import ResetPasswordClient from "./reset-password-client";

function LoadingState() {
  return (
    <main className="min-h-screen bg-[#F5F7F9] px-6 py-12">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <p className="text-sm text-[#667085]">Preparing password recovery…</p>
      </div>
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

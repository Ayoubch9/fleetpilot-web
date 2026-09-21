"use client";

export default function LoadEmptyState() {
  function openAddLoad() {
    window.dispatchEvent(
      new CustomEvent("fleetpilot:open-add-load", {
        detail: { mode: "add" },
      })
    );
  }

  return (
    <div className="mv-load-empty-card" role="status">
      <div className="mv-load-empty-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M3 7h11v9H3z" />
          <path d="M14 10h4l3 3v3h-7z" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
        </svg>
      </div>
      <div>
        <strong>No loads found</strong>
        <p>
          Add your first load to start tracking revenue, miles, costs, and profit.
        </p>
      </div>
      <button type="button" onClick={openAddLoad}>
        Add your first load
      </button>
    </div>
  );
}

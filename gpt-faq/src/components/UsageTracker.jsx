import React from "react";

export default function UsageTracker({ usage, onClear }) {
  if (!usage) return null;
  const { questions_asked, limit, session_id } = usage;
  const danger = questions_asked >= limit;

  return (
    <div className="d-flex align-items-center gap-2 mb-3">
      <span className={`badge ${danger ? "bg-danger" : "bg-secondary"}`}>
        {questions_asked}/{limit} used
      </span>
      <small className="text-muted">Session: {session_id}</small>
      <button className="btn btn-outline-secondary btn-sm" onClick={onClear}>
        Clear Session
      </button>
    </div>
  );
}

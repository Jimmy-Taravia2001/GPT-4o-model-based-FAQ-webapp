import React, { useState } from "react";

const MAX = 500;

export default function QuestionInput({ onSubmit, loading }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = text.trim();
    if (!q || q.length > MAX || loading) return;
    onSubmit(q);
    setText("");
  };

  const charsLeft = MAX - text.length;
  const over = charsLeft < 0;

  return (
    <form onSubmit={handleSubmit} className="mb-3">
      <label htmlFor="question" className="form-label">Ask a question</label>
      <textarea
        id="question"
        className="form-control"
        rows="3"
        value={text}
        placeholder="Type your FAQ question…"
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
      />
      <div className={`form-text ${over ? "text-danger" : ""}`}>
        {charsLeft} characters left
      </div>
      <button
        type="submit"
        className="btn btn-primary mt-2"
        disabled={loading || over || !text.trim()}
      >
        {loading ? "Asking…" : "Ask"}
      </button>
    </form>
  );
}

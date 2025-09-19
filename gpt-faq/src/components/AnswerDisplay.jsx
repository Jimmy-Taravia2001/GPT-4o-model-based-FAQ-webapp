import React from "react";

export default function AnswerDisplay({ history }) {
  if (!history.length) return null;

  return (
    <div className="mb-3">
      {history.map((item, idx) => (
        <div key={idx} className="card mb-2">
          <div className="card-body">
            <div className="fw-bold mb-1">You</div>
            <div className="mb-2">{item.question}</div>
            <div className="fw-bold mb-1">AI</div>
            <div className="answer-text">{item.answer}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

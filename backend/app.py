import os
import time
import re
import uuid
from datetime import timedelta

from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_session import Session
from dotenv import load_dotenv
import bleach

from openai import OpenAI

load_dotenv()

app = Flask(__name__)

# --- Config ---
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "dev-secret")
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_FILE_DIR"] = os.path.join(os.path.dirname(__file__), "instance", "flask_session")
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(
    minutes=int(os.getenv("SESSION_IDLE_MINUTES", "60"))
)
Session(app)

CORS(
    app,
    supports_credentials=True,
    origins=[r"http://localhost:\d+"],   # dev
    allow_headers=["Content-Type"],
    methods=["GET", "POST"],
)

# --- OpenAI client ---
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")  # “cheapest available” by default
MAX_TOKENS = int(os.getenv("OPENAI_MAX_TOKENS", "150"))
TEMPERATURE = float(os.getenv("OPENAI_TEMPERATURE", "0.7"))
SESSION_REQUEST_LIMIT = int(os.getenv("SESSION_REQUEST_LIMIT", "20"))

# --- Helpers ---
TAG_RE = re.compile(r"<[^>]+>")

def sanitize_question(q: str) -> str:
    # remove tags and script-y stuff; then bleach for any leftover HTML entities
    q = TAG_RE.sub("", q or "")
    q = bleach.clean(q, strip=True, tags=[], attributes={}, protocols=[])
    return q.strip()

def ensure_session():
    if "session_id" not in session:
        session["session_id"] = str(uuid.uuid4())
        session["questions_asked"] = 0
        session["created_at"] = int(time.time())
    session.permanent = True

def within_rate_limit() -> bool:
    return int(session.get("questions_asked", 0)) < SESSION_REQUEST_LIMIT

# --- Routes ---

@app.route("/api/ask", methods=["POST"])
def ask():
    try:
        ensure_session()

        if not within_rate_limit():
            return jsonify({
                "error": "Session limit reached. Please clear your session to continue.",
                "success": False,
                "error_type": "rate_limit"
            }), 429

        payload = request.get_json(silent=True) or {}
        question = sanitize_question(payload.get("question", ""))
        if not question:
            return jsonify({
                "error": "Question cannot be empty.",
                "success": False,
                "error_type": "validation_error"
            }), 400
        if len(question) > 500:
            return jsonify({
                "error": "Question too long (max 500 characters).",
                "success": False,
                "error_type": "validation_error"
            }), 400

        # Call OpenAI
        try:
            completion = client.chat.completions.create(
                model=MODEL,
                temperature=TEMPERATURE,
                max_tokens=MAX_TOKENS,
                messages=[
                    {"role": "system", "content": "You are a helpful FAQ assistant. Be concise and clear."},
                    {"role": "user", "content": question}
                ],
            )
            answer = completion.choices[0].message.content.strip()
        except Exception as e:
            return jsonify({
                "error": "There was a problem contacting the AI service.",
                "success": False,
                "error_type": "api_error"
            }), 502

        # Update usage
        session["questions_asked"] = int(session.get("questions_asked", 0)) + 1

        return jsonify({
            "answer": answer,
            "session_id": session["session_id"],
            "questions_asked": session["questions_asked"],
            "success": True
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Unexpected server error.",
            "success": False,
            "error_type": "server_error"
        }), 500


@app.route("/api/usage", methods=["GET"])
def usage():
    ensure_session()
    return jsonify({
        "session_id": session["session_id"],
        "questions_asked": int(session.get("questions_asked", 0)),
        "limit": SESSION_REQUEST_LIMIT,
        "success": True
    }), 200


@app.route("/api/clear-session", methods=["POST"])
def clear_session():
    session.clear()
    return jsonify({"success": True}), 200


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"ok": True}), 200


if __name__ == "__main__":
    os.makedirs(app.config["SESSION_FILE_DIR"], exist_ok=True)
    app.run(host="127.0.0.1", port=5000, debug=True)

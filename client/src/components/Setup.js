// src/components/Setup.js
import React from "react";

function generateRoomId() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export default function Setup({ setRole, roomId, setRoomId }) {
  const handleHostStart = () => {
    let r = roomId.trim();
    if (!r) {
      r = generateRoomId();
      setRoomId(r);
    }
    setRole("host");
  };

  const handleControllerStart = () => {
    const r = roomId.trim();
    if (!r) {
      alert("Enter Room ID from host");
      return;
    }
    setRole("controller");
  };

  return (
    <div className="setup">
      <h2>Remote Control</h2>
      <p className="subtitle">Choose Host (shares screen) or Controller.</p>

      <div className="cards">
        <div className="card">
          <h3>Host</h3>
          <p>Device whose screen you want to share.</p>

          <label>Room ID (auto 6 letters if empty)</label>
          <input
            value={roomId}
            placeholder="Leave empty to auto-generate"
            onChange={(e) => setRoomId(e.target.value)}
          />

          <button onClick={handleHostStart}>
            Start as Host
          </button>
        </div>

        <div className="card">
          <h3>Controller</h3>
          <p>Device that will control the host.</p>

          <label>Room ID (get this from host)</label>
          <input
            value={roomId}
            placeholder="Paste 6-letter room id"
            onChange={(e) => setRoomId(e.target.value)}
          />

          <button onClick={handleControllerStart}>
            Start as Controller
          </button>
        </div>
      </div>
    </div>
  );
}

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
    <div style={styles.container}>
      <h2 style={styles.h2}>Remote Control</h2>
      <p style={styles.subtitle}>Choose Host (shares screen) or Controller.</p>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h3>Host</h3>
          <p style={styles.p}>Device whose screen you want to share.</p>

          <label style={styles.label}>Room ID (auto 6 letters if empty)</label>
          <input
            style={styles.input}
            value={roomId}
            placeholder="Leave empty to auto-generate"
            onChange={(e) => setRoomId(e.target.value)}
          />

          <button style={styles.buttonPrimary} onClick={handleHostStart}>
            Start as Host
          </button>
        </div>

        <div style={styles.card}>
          <h3>Controller</h3>
          <p style={styles.p}>Device that will control the host.</p>

          <label style={styles.label}>Room ID (get this from host)</label>
          <input
            style={styles.input}
            value={roomId}
            placeholder="Paste 6-letter room id"
            onChange={(e) => setRoomId(e.target.value)}
          />

          <button style={styles.buttonSecondary} onClick={handleControllerStart}>
            Start as Controller
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 900, margin: "24px auto", padding: 16 },
  h2: { margin: 0 },
  subtitle: { color: "#9ca3af" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 16, marginTop: 16 },
  card: { background: "rgba(15,23,42,0.9)", borderRadius: 12, padding: 16, border: "1px solid rgba(55,65,81,0.8)" },
  label: { display: "block", marginTop: 8, color: "#9ca3af" },
  input: { width: "100%", marginTop: 4, padding: 8, borderRadius: 8, border: "1px solid rgba(75,85,99,1)", background: "rgba(15,23,42,0.9)", color: "#e5e7eb" },
  buttonPrimary: { marginTop: 12, padding: "8px 14px", borderRadius: 999, border: "none", background: "#3b82f6", color: "#fff", cursor: "pointer" },
  buttonSecondary: { marginTop: 12, padding: "8px 14px", borderRadius: 999, border: "none", background: "#0ea5e9", color: "#fff", cursor: "pointer" },
  p: { marginTop: 6, marginBottom: 8 }
};

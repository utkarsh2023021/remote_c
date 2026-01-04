import { useState } from "react";
import HostView from "./HostView";
import ControllerView from "./ControllerView";

export default function Setup() {
  const [room, setRoom] = useState("");
  const [role, setRole] = useState("");

  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #1a1a1a 0%, #000000 100%)",
      fontFamily: "'Inter', sans-serif",
      color: "#e0e0e0",
      padding: "20px",
    },
    card: {
      background: "rgba(30, 30, 30, 0.8)",
      padding: "40px",
      borderRadius: "16px",
      boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.8), inset 0 0 1px 1px rgba(255,255,255,0.1)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      width: "100%",
      maxWidth: "400px",
      textAlign: "center",
    },
    input: {
      width: "100%",
      padding: "12px",
      marginBottom: "20px",
      borderRadius: "8px",
      border: "1px solid #444",
      background: "#121212",
      color: "white",
      fontSize: "16px",
      outline: "none",
      boxSizing: "border-box",
    },
    buttonGroup: {
      display: "flex",
      gap: "10px",
      justifyContent: "center",
    },
    btn: {
      flex: 1,
      padding: "12px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      fontWeight: "600",
      transition: "all 0.3s ease",
      textTransform: "uppercase",
      letterSpacing: "1px",
    },
    hostBtn: {
      background: "linear-gradient(180deg, #444, #222)",
      color: "#fff",
      boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
    },
    controlBtn: {
      background: "linear-gradient(180deg, #eee, #999)",
      color: "#000",
    }
  };

  if (!role) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={{ marginBottom: "30px", fontWeight: "300" }}>REMOTE <span style={{ fontWeight: "800", color: "#fff" }}>CONTROL</span></h2>
          <input
            placeholder="Enter Room ID"
            value={room}
            style={styles.input}
            onChange={(e) => setRoom(e.target.value)}
          />
          <div style={styles.buttonGroup}>
            <button 
              style={{ ...styles.btn, ...styles.hostBtn }} 
              onClick={() => setRole("host")}
            >
              Host
            </button>
            <button 
              style={{ ...styles.btn, ...styles.controlBtn }} 
              onClick={() => setRole("controller")}
            >
              Control
            </button>
          </div>
        </div>
      </div>
    );
  }

  return role === "host" ? (
    <HostView roomId={room} />
  ) : (
    <ControllerView roomId={room} />
  );
}
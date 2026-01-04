// src/App.js
import React, { useState } from "react";
import Setup from "./components/Setup";
import HostView from "./components/HostView";
import ControllerView from "./components/ControllerView";

function App() {
  const [role, setRole] = useState(null);      // "host" or "controller"
  const [roomId, setRoomId] = useState("");    // 6-letter ID

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>Room: <strong>{roomId || "-"}</strong></div>
        <div>Role: <strong>{role || "-"}</strong></div>
      </div>

      {!role ? (
        <Setup setRole={setRole} roomId={roomId} setRoomId={setRoomId} />
      ) : role === "host" ? (
        <HostView roomId={roomId} />
      ) : (
        <ControllerView roomId={roomId} />
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#050816", color: "#e5e7eb", fontFamily: "system-ui, sans-serif" },
  topBar: { display: "flex", justifyContent: "space-between", padding: 10, background: "rgba(15,23,42,0.95)", fontSize: 13 }
};

export default App;

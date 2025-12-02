// src/App.js
import React, { useState } from "react";
import Setup from "./components/Setup";
import HostView from "./components/HostView";
import ControllerView from "./components/ControllerView";
import "./index.css";

function App() {
  const [role, setRole] = useState(null);      // "host" or "controller"
  const [roomId, setRoomId] = useState("");    // 6-letter ID

  return (
    <div className="page">
      {/* Top bar always visible */}
      <div className="top-bar">
        <div>Room: <strong>{roomId || "-"}</strong></div>
        <div>Role: <strong>{role || "-"}</strong></div>
      </div>

      {/* Main content */}
      {!role ? (
        <Setup
          setRole={setRole}
          roomId={roomId}
          setRoomId={setRoomId}
        />
      ) : role === "host" ? (
        <HostView roomId={roomId} />
      ) : (
        <ControllerView roomId={roomId} />
      )}
    </div>
  );
}

export default App;

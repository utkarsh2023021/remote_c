import { useState } from "react";
import HostView from "./HostView";
import ControllerView from "./ControllerView";

export default function Setup() {
  const [room, setRoom] = useState("");
  const [role, setRole] = useState("");

  if (!role) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Remote Control</h2>
        <input
          placeholder="Room ID"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <br /><br />
        <button onClick={() => setRole("host")}>Host</button>
        <button onClick={() => setRole("controller")}>Controller</button>
      </div>
    );
  }

  return role === "host" ? (
    <HostView roomId={room} />
  ) : (
    <ControllerView roomId={room} />
  );
}

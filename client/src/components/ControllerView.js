// src/components/ControllerView.js
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const SIGNAL = "http://localhost:4000";

export default function ControllerView({ roomId }) {
  const [socket] = useState(() =>
    io(SIGNAL, { transports: ["websocket"] })
  );
  const pcRef = useRef(null);
  const remoteVideo = useRef(null);

  useEffect(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    socket.emit("join-room", { roomId, role: "controller" });

    pc.ontrack = (e) => {
      remoteVideo.current.srcObject = e.streams[0];
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", { roomId, candidate: e.candidate });
      }
    };

    // Create offer
    (async () => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { roomId, offer });
    })();

    socket.on("answer", async ({ answer }) => {
      await pc.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", ({ candidate }) => {
      pc.addIceCandidate(candidate);
    });

    // Receive control events on host (already in server), so here we only send
    return () => {
      pc.close();
      socket.disconnect();
    };
  }, [roomId, socket]);

  const sendControl = (payload) => {
    socket.emit("control-event", { roomId, payload });
  };

  return (
    <div className="video-area">
      <h3>Remote Screen (Room: {roomId})</h3>
      <video
        ref={remoteVideo}
        autoPlay
        playsInline
        onMouseMove={(e) =>
          sendControl({ type: "mouse", action: "move", x: e.clientX, y: e.clientY })
        }
        onClick={() => sendControl({ type: "mouse", action: "click" })}
      />
    </div>
  );
}

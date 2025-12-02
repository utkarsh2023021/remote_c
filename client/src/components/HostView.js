// src/components/HostView.js
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const SIGNAL = "http://localhost:4000";

export default function HostView({ roomId }) {
  const [socket] = useState(() =>
    io(SIGNAL, { transports: ["websocket"] })
  );
  const [sharing, setSharing] = useState(false);

  const pcRef = useRef(null);
  const localVideo = useRef(null);

  useEffect(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    // Join room as host
    socket.emit("join-room", { roomId, role: "host" });

    // Receive offer from controller
    socket.on("offer", async ({ offer }) => {
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { roomId, answer });
    });

    // Receive ICE candidates from controller
    socket.on("ice-candidate", ({ candidate }) => {
      pc.addIceCandidate(candidate);
    });

    // Send ICE candidates to controller
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", { roomId, candidate: e.candidate });
      }
    };

    return () => {
      pc.close();
      socket.disconnect();
    };
  }, [roomId, socket]);

  const startSharing = async () => {
    if (sharing) return; // don't open picker again
    setSharing(true);

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });

      if (localVideo.current) {
        localVideo.current.srcObject = stream;
      }

      const pc = pcRef.current;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      // If user stops sharing from browser UI, reset state
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        setSharing(false);
      });
    } catch (err) {
      console.error(err);
      alert("Failed to capture screen: " + err.message);
      setSharing(false);
    }
  };

  return (
    <div className="video-area">
      <div className="video-header">
        <h3>Host Screen (Room: {roomId})</h3>
        <button onClick={startSharing} disabled={sharing}>
          {sharing ? "Sharing..." : "Start Screen Sharing"}
        </button>
      </div>
      <video ref={localVideo} autoPlay playsInline muted />
    </div>
  );
}

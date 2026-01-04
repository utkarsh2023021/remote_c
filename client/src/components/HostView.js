// src/components/HostView.js
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const SIGNAL = "http://localhost:4000";

export default function HostView({ roomId }) {
  const [socket] = useState(() => io(SIGNAL, { transports: ["websocket"] }));
  const [sharing, setSharing] = useState(false);
  const pcRef = useRef(null);
  const localVideo = useRef(null);
  const queuedOfferRef = useRef(null);

  useEffect(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    socket.emit("join-room", { roomId, role: "host" });

    socket.on("offer", async ({ offer }) => {
      // If host already sharing, answer immediately
      if (sharing) {
        try {
          await pc.setRemoteDescription(offer);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("answer", { roomId, answer });
        } catch (err) {
          console.error("Error answering offer:", err);
        }
      } else {
        // queue the offer; will answer after user starts sharing
        queuedOfferRef.current = offer;
        // optionally notify user to press "Start Screen Sharing"
        console.log("Received offer but not sharing yet — will answer when you start sharing.");
      }
    });

    socket.on("ice-candidate", ({ candidate }) => {
      try {
        pc.addIceCandidate(candidate);
      } catch (e) {
        console.warn("Add candidate error", e);
      }
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", { roomId, candidate: e.candidate });
      }
    };

    return () => {
      pc.close();
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, sharing]);

  const startSharing = async () => {
    if (sharing) return;
    setSharing(true);

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });

      if (localVideo.current) {
        localVideo.current.srcObject = stream;
        localVideo.current.onloadedmetadata = () => localVideo.current.play().catch(() => {});
      }

      const pc = pcRef.current;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      // If we received an offer earlier and queued it, handle it now
      if (queuedOfferRef.current) {
        try {
          await pc.setRemoteDescription(queuedOfferRef.current);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("answer", { roomId, answer });
          queuedOfferRef.current = null;
        } catch (err) {
          console.error("Error processing queued offer:", err);
        }
      }

      // handle user stop action from browser (click "stop sharing")
      const track = stream.getVideoTracks()[0];
      if (track) {
        track.addEventListener("ended", () => {
          setSharing(false);
        });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to capture screen: " + err.message);
      setSharing(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={{ margin: 0 }}>Host Screen (Room: {roomId})</h3>
        <button style={styles.btn} onClick={startSharing} disabled={sharing}>
          {sharing ? "Sharing..." : "Start Screen Sharing"}
        </button>
      </div>
      <video ref={localVideo} style={styles.video} autoPlay playsInline muted />
    </div>
  );
}

const styles = {
  container: { padding: 16 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  btn: { padding: "8px 12px", borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", cursor: "pointer" },
  video: { width: "100%", height: "70vh", background: "#000", borderRadius: 10, objectFit: "contain" },
};

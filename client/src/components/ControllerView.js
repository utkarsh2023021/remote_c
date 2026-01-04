// src/components/ControllerView.js
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const SIGNAL = "http://localhost:4000";

export default function ControllerView({ roomId }) {
  const [socket] = useState(() => io(SIGNAL, { transports: ["websocket"] }));
  const pcRef = useRef(null);
  const remoteVideo = useRef(null);
  const createdOfferRef = useRef(false);

  useEffect(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    socket.emit("join-room", { roomId, role: "controller" });

    pc.ontrack = (e) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = e.streams[0];
        remoteVideo.current.onloadedmetadata = () => remoteVideo.current.play().catch(() => {});
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", { roomId, candidate: e.candidate });
      }
    };

    socket.on("room-info", ({ participants }) => {
      // participants is array of { socketId, role }
      const hasHost = participants.some((p) => p.role === "host");
      if (hasHost && !createdOfferRef.current) {
        createOffer();
      }
    });

    socket.on("peer-joined", ({ role }) => {
      if (role === "host" && !createdOfferRef.current) {
        createOffer();
      }
    });

    socket.on("answer", async ({ answer }) => {
      try {
        await pc.setRemoteDescription(answer);
      } catch (err) {
        console.error("Error setting remote description (answer):", err);
      }
    });

    socket.on("ice-candidate", ({ candidate }) => {
      try {
        pc.addIceCandidate(candidate);
      } catch (e) {
        console.warn("Add candidate error", e);
      }
    });

    return () => {
      pc.close();
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const createOffer = async () => {
    if (!pcRef.current) return;
    if (createdOfferRef.current) return;
    createdOfferRef.current = true;

    try {
      // Ensure SDP expects a video from host
      pcRef.current.addTransceiver("video", { direction: "recvonly" });

      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      socket.emit("offer", { roomId, offer });
    } catch (err) {
      console.error("Error creating offer:", err);
    }
  };

  const sendControl = (payload) => {
    socket.emit("control-event", { roomId, payload });
  };

  return (
    <div style={styles.container}>
      <h3 style={{ marginTop: 0 }}>Remote Screen (Room: {roomId})</h3>
      <video
        ref={remoteVideo}
        style={styles.video}
        autoPlay
        playsInline
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const xRel = (e.clientX - rect.left) / rect.width;
          const yRel = (e.clientY - rect.top) / rect.height;
          sendControl({ type: "mouse", action: "move", x: xRel, y: yRel });
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const xRel = (e.clientX - rect.left) / rect.width;
          const yRel = (e.clientY - rect.top) / rect.height;
          sendControl({ type: "mouse", action: "click", x: xRel, y: yRel, button: e.button });
        }}
      />
    </div>
  );
}

const styles = {
  container: { padding: 16 },
  video: { width: "100%", height: "70vh", background: "#000", borderRadius: 10, objectFit: "contain" },
};

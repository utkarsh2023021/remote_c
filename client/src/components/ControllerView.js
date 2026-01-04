import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SIGNAL = "https://remote-c.onrender.com";

export default function ControllerView({ roomId }) {
  const socket = useRef();
  const pc = useRef();
  const video = useRef();
  const remoteSet = useRef(false);
  const iceQueue = useRef([]);

  useEffect(() => {
    socket.current = io(SIGNAL);
    socket.current.emit("join-controller", roomId);

    pc.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.current.ontrack = (e) => {
      if (video.current) {
        video.current.srcObject = e.streams[0];
      }
    };

    pc.current.onicecandidate = (e) => {
      if (e.candidate)
        socket.current.emit("ice", { room: roomId, candidate: e.candidate });
    };

    socket.current.on("offer", async (offer) => {
      if (remoteSet.current) return;
      await pc.current.setRemoteDescription(offer);
      remoteSet.current = true;
      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);
      socket.current.emit("answer", { room: roomId, answer });
      iceQueue.current.forEach((c) => pc.current.addIceCandidate(c));
      iceQueue.current = [];
    });

    socket.current.on("ice", (candidate) => {
      if (remoteSet.current) pc.current.addIceCandidate(candidate);
      else iceQueue.current.push(candidate);
    });
  }, [roomId]);

  const send = (payload) =>
    socket.current.emit("control", { room: roomId, payload });

  // Handle both Mouse and Touch coordinate mapping
  const handleMove = (clientX, clientY, target) => {
    const r = target.getBoundingClientRect();
    send({
      type: "move",
      x: (clientX - r.left) / r.width,
      y: (clientY - r.top) / r.height,
    });
  };

  return (
    <div style={{ background: "#000", width: "100vw", height: "100vh", overflow: "hidden" }}>
      <video
        ref={video}
        autoPlay
        muted
        playsInline // CRITICAL FOR MOBILE
        onMouseMove={(e) => handleMove(e.clientX, e.clientY, e.currentTarget)}
        onMouseDown={() => send({ type: "click" })}
        onTouchStart={(e) => {
          // Send click on tap
          send({ type: "click" });
        }}
        onTouchMove={(e) => {
          // Handle mobile movement
          const touch = e.touches[0];
          handleMove(touch.clientX, touch.clientY, e.currentTarget);
        }}
        onWheel={(e) => {
          e.preventDefault();
          send({
            type: "scroll",
            amount: Math.sign(e.deltaY) * 120,
          });
        }}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain", // Ensures full screen share is visible
          cursor: "crosshair",
        }}
      />
      {/* Mobile Scroll Helper */}
      <div style={{
          position: "fixed", right: 20, top: "50%", transform: "translateY(-50%)",
          display: "flex", flexDirection: "column", gap: "20px"
      }}>
          <button style={btnStyle} onClick={() => send({type: "scroll", amount: -120})}>↑</button>
          <button style={btnStyle} onClick={() => send({type: "scroll", amount: 120})}>↓</button>
      </div>
    </div>
  );
}

const btnStyle = {
    width: "50px", height: "50px", borderRadius: "25px", border: "1px solid #555",
    background: "rgba(255,255,255,0.1)", color: "white", fontSize: "20px",
    backdropFilter: "blur(5px)"
};
import { useRef, useState } from "react";
import { io } from "socket.io-client";

const SIGNAL = "https://remote-c.onrender.com";

export default function HostView({ roomId }) {
  const socket = useRef();
  const pc = useRef();
  const video = useRef();
  const [active, setActive] = useState(false);
  const remoteSet = useRef(false);
  const iceQueue = useRef([]);

  const start = async () => {
    setActive(true);
    socket.current = io(SIGNAL);
    socket.current.emit("join-host", roomId);

    pc.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.current.onicecandidate = (e) => {
      if (e.candidate)
        socket.current.emit("ice", { room: roomId, candidate: e.candidate });
    };

    socket.current.on("answer", async (answer) => {
      if (remoteSet.current) return;
      await pc.current.setRemoteDescription(answer);
      remoteSet.current = true;
      iceQueue.current.forEach((c) => pc.current.addIceCandidate(c));
      iceQueue.current = [];
    });

    socket.current.on("ice", (candidate) => {
      if (remoteSet.current) pc.current.addIceCandidate(candidate);
      else iceQueue.current.push(candidate);
    });

    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    video.current.srcObject = stream;
    stream.getTracks().forEach((t) => pc.current.addTrack(t, stream));

    const offer = await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);
    socket.current.emit("offer", { room: roomId, offer });
  };

  const styles = {
    container: {
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "20px",
    },
    header: {
      width: "100%",
      maxWidth: "900px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
      borderBottom: "1px solid #333",
      paddingBottom: "10px"
    },
    videoWrapper: {
      width: "100%",
      maxWidth: "900px",
      background: "#000",
      borderRadius: "12px",
      border: "4px solid #222",
      boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
      overflow: "hidden"
    },
    startBtn: {
      padding: "10px 24px",
      borderRadius: "6px",
      border: "none",
      background: active ? "#333" : "linear-gradient(180deg, #fff, #bbb)",
      color: active ? "#888" : "#000",
      fontWeight: "bold",
      cursor: active ? "default" : "pointer",
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{fontSize: "14px", color: "#888"}}>ROOM ID: <b style={{color: "#fff"}}>{roomId}</b></div>
        <button style={styles.startBtn} onClick={start} disabled={active}>
          {active ? "STREAMING..." : "START BROADCAST"}
        </button>
      </div>
      
      <div style={styles.videoWrapper}>
        <video
          ref={video}
          autoPlay
          muted
          playsInline
          style={{ width: "100%", display: "block" }}
        />
      </div>
      {!active && <p style={{marginTop: "20px", color: "#555"}}>Ready to broadcast your screen</p>}
    </div>
  );
}
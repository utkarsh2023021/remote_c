import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SIGNAL = "http://localhost:4000";

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
      video.current.srcObject = e.streams[0];
    };

    pc.current.onicecandidate = (e) => {
      if (e.candidate)
        socket.current.emit("ice", {
          room: roomId,
          candidate: e.candidate,
        });
    };

    socket.current.on("offer", async (offer) => {
      if (remoteSet.current) return;

      await pc.current.setRemoteDescription(offer);
      remoteSet.current = true;

      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);

      socket.current.emit("answer", {
        room: roomId,
        answer,
      });

      iceQueue.current.forEach((c) =>
        pc.current.addIceCandidate(c)
      );
      iceQueue.current = [];
    });

    socket.current.on("ice", (candidate) => {
      if (remoteSet.current) {
        pc.current.addIceCandidate(candidate);
      } else {
        iceQueue.current.push(candidate);
      }
    });
  }, [roomId]);

  const send = (payload) =>
    socket.current.emit("control", {
      room: roomId,
      payload,
    });

  return (
    <video
      ref={video}
      autoPlay
      playsInline
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        send({
          type: "move",
          x: (e.clientX - r.left) / r.width,
          y: (e.clientY - r.top) / r.height,
        });
      }}
      onClick={() => send({ type: "click" })}
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}

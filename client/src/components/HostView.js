import { useRef } from "react";
import { io } from "socket.io-client";

const SIGNAL = "http://localhost:4000";

export default function HostView({ roomId }) {
  const socket = useRef();
  const pc = useRef();
  const video = useRef();

  const remoteSet = useRef(false);
  const iceQueue = useRef([]);

  const start = async () => {
    socket.current = io(SIGNAL);
    socket.current.emit("join-host", roomId);

    pc.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.current.onicecandidate = (e) => {
      if (e.candidate)
        socket.current.emit("ice", {
          room: roomId,
          candidate: e.candidate,
        });
    };

    socket.current.on("answer", async (answer) => {
      if (remoteSet.current) return;

      await pc.current.setRemoteDescription(answer);
      remoteSet.current = true;

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

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });

    video.current.srcObject = stream;
    stream.getTracks().forEach((t) =>
      pc.current.addTrack(t, stream)
    );

    const offer = await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);

    socket.current.emit("offer", { room: roomId, offer });
  };

  return (
    <div>
      <button onClick={start}>Start Screen Sharing</button>
      <video
        ref={video}
        autoPlay
        muted
        playsInline
        style={{ width: "100%", height: "70vh" }}
      />
    </div>
  );
}

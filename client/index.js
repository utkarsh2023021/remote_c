// ===== CONFIGURE YOUR SIGNAL SERVER URL HERE =====
const SIGNAL_SERVER = 'https://remote-signal.onrender.com';

// socket.io to remote server
const socket = io(SIGNAL_SERVER);

const videoGrid = document.getElementById('videoDiv');
const myVideo = document.createElement('video');
myVideo.muted = true;

// ===== URL params: room + role =====
const params = new URLSearchParams(window.location.search);

let roomID = params.get('room');
if (!roomID) {
  if (window.crypto && crypto.randomUUID) {
    roomID = crypto.randomUUID();
  } else {
    roomID = Math.random().toString(36).slice(2);
  }
  const url = new URL(window.location.href);
  url.searchParams.set('room', roomID);
  history.replaceState(null, '', url.toString());
}

const role = params.get('role') || 'controller';
const isHost = role === 'host';

document.getElementById('roomSpan').innerText = roomID;
document.getElementById('roleSpan').innerText = role;

// ===== PeerJS config for remote server =====
// If using HTTPS (Render/Netlify/etc), use port 443 and secure: true
const peer = new Peer(undefined, {
  host: 'remote-signal.onrender.com'.replace(/^https?:\/\//, ''),
  port: 443,
  path: '/peerjs',
  secure: true
});

let myVideoStream;
let myId;
const peerConnections = {};

if (isHost) {
  navigator.mediaDevices.getDisplayMedia({
    video: { cursor: 'always' },
    audio: false
  }).then((stream) => {
    myVideoStream = stream;
    addVideo(myVideo, stream);

    peer.on('call', call => {
      call.answer(stream);

      const vid = document.createElement('video');
      call.on('stream', userStream => {
        addVideo(vid, userStream);
      });

      call.on('error', err => {
        console.error(err);
        alert(err);
      });

      call.on('close', () => {
        vid.remove();
      });

      peerConnections[call.peer] = call;
    });
  }).catch(err => {
    console.error(err);
    alert(err.message);
  });
} else {
  peer.on('call', call => {
    call.answer(); // receive-only

    const vid = document.createElement('video');
    call.on('stream', userStream => {
      addVideo(vid, userStream, true);
    });

    call.on('error', err => {
      console.error(err);
      alert(err);
    });

    call.on('close', () => {
      vid.remove();
    });

    peerConnections[call.peer] = call;
  });
}

peer.on('open', (id) => {
  myId = id;
  socket.emit('newUser', id, roomID);
});

peer.on('error', (err) => {
  console.error(err);
  alert(err.type || err.message);
});

socket.on('userJoined', id => {
  if (isHost && myVideoStream) {
    const call = peer.call(id, myVideoStream);
    const vid = document.createElement('video');

    call.on('error', (err) => {
      console.error(err);
      alert(err);
    });

    call.on('stream', userStream => {
      addVideo(vid, userStream);
    });

    call.on('close', () => {
      vid.remove();
    });

    peerConnections[id] = call;
  }
});

socket.on('userDisconnect', id => {
  if (peerConnections[id]) {
    peerConnections[id].close();
    delete peerConnections[id];
  }
});

// ===== Video + control =====
function addVideo(video, stream, isRemoteScreen = false) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);

  if (isRemoteScreen && !isHost) {
    attachControlListeners(video);
  }
}

function attachControlListeners(videoEl) {
  videoEl.addEventListener('mousedown', (e) => {
    emitMouseEvent('down', e, videoEl);
  });
  videoEl.addEventListener('mouseup', (e) => {
    emitMouseEvent('up', e, videoEl);
  });
  videoEl.addEventListener('mousemove', (e) => {
    emitMouseEvent('move', e, videoEl);
  });
  videoEl.addEventListener('wheel', (e) => {
    emitWheelEvent(e, videoEl);
  });

  window.addEventListener('keydown', (e) => {
    emitKeyEvent('down', e);
  });
  window.addEventListener('keyup', (e) => {
    emitKeyEvent('up', e);
  });
}

function emitMouseEvent(action, e, videoEl) {
  const rect = videoEl.getBoundingClientRect();
  const xRel = (e.clientX - rect.left) / rect.width;
  const yRel = (e.clientY - rect.top) / rect.height;

  const payload = {
    type: 'mouse',
    action,
    x: xRel,
    y: yRel,
    button: e.button
  };

  socket.emit('control-event', roomID, payload);
}

function emitWheelEvent(e, videoEl) {
  const rect = videoEl.getBoundingClientRect();
  const xRel = (e.clientX - rect.left) / rect.width;
  const yRel = (e.clientY - rect.top) / rect.height;

  const payload = {
    type: 'wheel',
    deltaX: e.deltaX,
    deltaY: e.deltaY,
    x: xRel,
    y: yRel
  };

  socket.emit('control-event', roomID, payload);
}

function emitKeyEvent(action, e) {
  const payload = {
    type: 'keyboard',
    action,
    key: e.key,
    code: e.code,
    ctrl: e.ctrlKey,
    alt: e.altKey,
    shift: e.shiftKey,
    meta: e.metaKey
  };

  socket.emit('control-event', roomID, payload);
}

// Host receives control events (forward to native agent later)
socket.on('control-event', (payload) => {
  if (!isHost) return;
  console.log('CONTROL EVENT:', payload);
  // TODO: push this to your OS-level host agent.
});

// ===== CHANGE THIS TO YOUR SIGNALING SERVER URL =====
const SIGNAL_SERVER = 'https://remote-c.onrender.com';

// socket.io to remote server
const socket = io(SIGNAL_SERVER);

const videoGrid = document.getElementById('videoDiv');
const myVideo = document.createElement('video');
myVideo.muted = true;

// UI elements
const roomSpan = document.getElementById('roomSpan');
const roleSpan = document.getElementById('roleSpan');
const setupContainer = document.getElementById('setupContainer');
const videoSection = document.getElementById('videoSection');

const hostRoomInput = document.getElementById('hostRoomId');
const hostStartBtn = document.getElementById('hostStartBtn');
const hostShareSection = document.getElementById('hostShareSection');
const hostShareUrlInput = document.getElementById('hostShareUrl');
const copyUrlBtn = document.getElementById('copyUrlBtn');

const controllerRoomInput = document.getElementById('controllerRoomId');
const controllerStartBtn = document.getElementById('controllerStartBtn');

let roomID = null;
let role = null;
let isHost = false;
let started = false;

// PeerJS (will be created when we start)
let peer = null;
let myVideoStream = null;
let myId = null;
const peerConnections = {};

// ===== Utility: generate room ID =====
function generateRoomId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

// ===== Host button click =====
hostStartBtn.addEventListener('click', async () => {
  if (started) return;

  roomID = hostRoomInput.value.trim() || generateRoomId();
  hostRoomInput.value = roomID;

  const url = new URL(window.location.href);
  url.searchParams.set('room', roomID);
  url.searchParams.set('role', 'controller'); // for controller convenience
  hostShareUrlInput.value = url.toString();
  hostShareSection.classList.remove('hidden');

  await startSession('host', roomID);
});

// Copy URL
copyUrlBtn.addEventListener('click', async () => {
  if (!hostShareUrlInput.value) return;
  try {
    await navigator.clipboard.writeText(hostShareUrlInput.value);
    copyUrlBtn.textContent = 'Copied!';
    setTimeout(() => (copyUrlBtn.textContent = 'Copy'), 1200);
  } catch (e) {
    console.error(e);
  }
});

// ===== Controller button click =====
controllerStartBtn.addEventListener('click', async () => {
  if (started) return;

  let input = controllerRoomInput.value.trim();
  if (!input) {
    alert('Please enter a Room ID or URL.');
    return;
  }

  // If they pasted a full URL, extract the room param if present
  if (input.includes('http://') || input.includes('https://')) {
    try {
      const u = new URL(input);
      const fromUrl = u.searchParams.get('room');
      if (fromUrl) input = fromUrl;
    } catch (e) {
      console.error(e);
    }
  }

  roomID = input;
  await startSession('controller', roomID);
});

// ===== Start session (both host & controller) =====
async function startSession(chosenRole, room) {
  if (started) return;
  started = true;

  role = chosenRole;
  isHost = role === 'host';
  roomID = room;

  roomSpan.textContent = roomID;
  roleSpan.textContent = role;

  setupContainer.classList.add('hidden');
  videoSection.classList.remove('hidden');

  // Initialize PeerJS
  peer = new Peer(undefined, {
    host: SIGNAL_SERVER.replace(/^https?:\/\//, ''),
    port: 443,
    path: '/peerjs',
    secure: true
  });

  if (isHost) {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      });
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
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to capture screen');
      return;
    }
  } else {
    // Controller: receive-only
    peer.on('call', call => {
      call.answer(); // no local stream

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

  // Peer events common
  peer.on('open', id => {
    myId = id;
    socket.emit('newUser', id, roomID);
  });

  peer.on('error', err => {
    console.error(err);
    alert(err.type || err.message);
  });

  socket.on('userJoined', id => {
    if (isHost && myVideoStream) {
      const call = peer.call(id, myVideoStream);
      const vid = document.createElement('video');

      call.on('error', err => {
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

  // Controller → Host control events
  socket.on('control-event', payload => {
    if (!isHost) return;
    console.log('CONTROL EVENT:', payload);
    // TODO: forward to your native host agent to actually move mouse / keyboard
  });
}

// ===== Video + control helpers =====
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
  videoEl.addEventListener('mousedown', e => {
    emitMouseEvent('down', e, videoEl);
  });
  videoEl.addEventListener('mouseup', e => {
    emitMouseEvent('up', e, videoEl);
  });
  videoEl.addEventListener('mousemove', e => {
    emitMouseEvent('move', e, videoEl);
  });
  videoEl.addEventListener('wheel', e => {
    emitWheelEvent(e, videoEl);
  });

  window.addEventListener('keydown', e => {
    emitKeyEvent('down', e);
  });
  window.addEventListener('keyup', e => {
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

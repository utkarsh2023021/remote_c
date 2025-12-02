// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();

app.get('/', (req, res) => {
  res.send('Remote Desktop WebSocket server is running');
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const hosts = new Map();       // code -> host socket
const controllers = new Map(); // code -> controller socket

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
}

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch (e) {
      console.log('Invalid JSON:', data.toString());
      return;
    }

    // 1) Host registers and gets a code
    if (msg.type === 'register_host') {
      const code = generateCode();
      ws.role = 'host';
      ws.code = code;

      hosts.set(code, ws);
      console.log('Host registered with code:', code);

      ws.send(JSON.stringify({
        type: 'code',
        code
      }));
    }

    // 2) Controller connects using code
    else if (msg.type === 'connect_controller') {
      const code = msg.code;
      const host = hosts.get(code);

      if (!host) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid code or host not online'
        }));
        return;
      }

      ws.role = 'controller';
      ws.code = code;
      controllers.set(code, ws);

      console.log('Controller connected to code:', code);

      host.send(JSON.stringify({ type: 'controller_connected' }));
      ws.send(JSON.stringify({ type: 'connected', code }));
    }

    // 3) Screen frames: host -> controller
    else if (msg.type === 'screen_frame') {
      const code = ws.code;
      if (!code || ws.role !== 'host') return;
      const ctrl = controllers.get(code);
      if (ctrl && ctrl.readyState === WebSocket.OPEN) {
        ctrl.send(JSON.stringify({
          type: 'screen_frame',
          frame: msg.frame,   // base64 jpeg
          width: msg.width,
          height: msg.height
        }));
      }
    }

    // 4) Input events: controller -> host
    else if (msg.type === 'input_event') {
      const code = ws.code;
      if (!code || ws.role !== 'controller') return;
      const host = hosts.get(code);
      if (host && host.readyState === WebSocket.OPEN) {
        host.send(JSON.stringify({
          type: 'input_event',
          event: msg.event
        }));
      }
    }

    // 5) Optional relay for debugging chat
    else if (msg.type === 'relay') {
      const code = ws.code;
      if (!code) return;
      if (ws.role === 'host') {
        const ctrl = controllers.get(code);
        if (ctrl && ctrl.readyState === WebSocket.OPEN) {
          ctrl.send(JSON.stringify({
            type: 'relay',
            from: 'host',
            payload: msg.payload
          }));
        }
      } else if (ws.role === 'controller') {
        const host = hosts.get(code);
        if (host && host.readyState === WebSocket.OPEN) {
          host.send(JSON.stringify({
            type: 'relay',
            from: 'controller',
            payload: msg.payload
          }));
        }
      }
    }
  });

  ws.on('close', () => {
    const code = ws.code;
    if (!code) return;

    if (ws.role === 'host') {
      console.log('Host disconnected:', code);
      hosts.delete(code);
      const ctrl = controllers.get(code);
      if (ctrl) {
        ctrl.send(JSON.stringify({ type: 'host_disconnected' }));
        controllers.delete(code);
      }
    } else if (ws.role === 'controller') {
      console.log('Controller disconnected:', code);
      controllers.delete(code);
      const host = hosts.get(code);
      if (host) {
        host.send(JSON.stringify({ type: 'controller_disconnected' }));
      }
    }
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log('Server listening on port', PORT);
});

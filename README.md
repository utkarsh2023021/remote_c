📡 Computer Networks Project: Remote Desktop Control System

WebRTC, WebSockets, Node.js, React, and a native Python host agent were used in the development of this browser-based remote desktop and control system.
Through the network, the system enables one device (Host) to share its screen and be remotely controlled by another device (Controller).


This project illustrates useful ideas of:

- Communication in real time

- The architecture of client-server

- WebRTC streaming of media

- Signaling via WebSocket

- Remote control via a network

🚀 Features

   🌐 Browser-based screen sharing (WebRTC)

   📱 Cross-device control (mobile / desktop)

   🖱️ Real OS mouse control (via native agent)

   🖱️ Scroll, click, move support

   🔁 Real-time communication using Socket.IO

   🧠 Clean separation of signaling, media, and control channels





🧩 Architecture Overview
     Controller Browser
             ↓
         WebSocket
             ↓
 Signaling Server (Node.js + Socket.IO)
             ↓
Host Browser (Screen Share)
             ↓
Python Host Agent (OS Control)
             ↓
Operating System (Mouse / Scroll)


⚠️ Important:
      Browsers alone cannot control OS input.
      A native host agent is required (used in this project).




🌍 Live Application URL

 👉 https://remotec.netlify.app

 ▶️ How to Run the Project (Step-by-Step)


🔹 Step 1: Open the Host Device

Go to:
https://remotec.netlify.app

Enter a Room ID (any string).

Click Host.

Keep this tab open.

🔹 Step 2: Open the Controller Device

On another device (mobile / laptop), go to:
https://remotec.netlify.app

Enter the same Room ID.

Click Control.

🔹 Step 3: Run the Host Agent (Required for Control)

On the Host device:

Download the host_agent.exe from (https://drive.google.com/file/d/1OKu0yHl-7cCUakg08espfu5Sjq_EqpFH/view?usp=drive_link),

Run the host_agent.exe

Run it as Administrator (important for OS control).

This agent enables:

Real mouse movement

Clicks

Scroll control



🔹 Step 4: Start Screen Sharing

On the Host browser:

Click Start Screen Sharing

Select the screen/window to share

🎉 You can now control the host device remotely from the controller.
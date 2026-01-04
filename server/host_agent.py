import socketio
import pyautogui
import time

pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0.01  # human-like delay

sio = socketio.Client()

@sio.event
def connect():
    print("Python agent connected")
    sio.emit("join-agent")

@sio.on("control")
def on_control(p):
    screen_w, screen_h = pyautogui.size()

    if p["type"] == "move":
        x = int(p["x"] * screen_w)
        y = int(p["y"] * screen_h)

        pyautogui.moveTo(x, y, duration=0.02)

    elif p["type"] == "click":
        time.sleep(0.03)
        pyautogui.mouseDown()
        time.sleep(0.05)
        pyautogui.mouseUp()

sio.connect("http://localhost:4000")
sio.wait()

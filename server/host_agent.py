import socketio
import pyautogui
import time


SERVER_URL = "https://remote-c.onrender.com"

# Safety & smoothness
pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0.001  # small human-like delay



sio = socketio.Client()


@sio.event
def connect():
    print("✅ Python host agent connected")
    sio.emit("join-agent")  # auto attach to active host room


@sio.event
def disconnect():
    print("❌ Python host agent disconnected")


@sio.on("control")
def on_control(p):
    try:
        screen_w, screen_h = pyautogui.size()

        # -------- MOUSE MOVE --------
        if p["type"] == "move":
            x = int(p["x"] * screen_w)
            y = int(p["y"] * screen_h)

            pyautogui.moveTo(x, y, duration=0.02)

        # -------- LEFT CLICK --------
        elif p["type"] == "click":
            time.sleep(0.02)
            pyautogui.mouseDown()
            time.sleep(0.05)
            pyautogui.mouseUp()

        # -------- RIGHT CLICK --------
        elif p["type"] == "right_click":
            pyautogui.rightClick()

        # -------- SCROLL --------
        elif p["type"] == "scroll":
            #  OS-scaled (±120 typical)
            pyautogui.scroll(int(p["amount"]))

        # -------- KEY PRESS --------
        elif p["type"] == "key":
            pyautogui.press(p["key"])

    except Exception as e:
        print("⚠️ Control error:", e)



sio.connect(SERVER_URL)

# Keepping this alive
sio.wait()

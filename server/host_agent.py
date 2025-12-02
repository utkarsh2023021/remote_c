import asyncio
import json
import base64
import io
import websockets
import pyautogui
import mss
from PIL import Image

SERVER_URL = "wss://remote-c.onrender.com"  # your Render WebSocket URL

# Stop pyautogui from triggering failsafe when mouse hits screen corner
pyautogui.FAILSAFE = False

async def stream_screen(ws):
    """Continuously capture the screen and send frames."""
    fps = 3
    delay = 1 / fps
    with mss.mss() as sct:
        monitor = sct.monitors[1]  # primary monitor
        while True:
            try:
                # capture screen
                img = sct.grab(monitor)
                # convert to PIL Image
                img_pil = Image.frombytes("RGB", img.size, img.rgb)
                # compress to JPEG in memory
                buf = io.BytesIO()
                img_pil.save(buf, format="JPEG", quality=50)
                frame_bytes = buf.getvalue()
                frame_b64 = base64.b64encode(frame_bytes).decode("ascii")

                payload = {
                    "type": "screen_frame",
                    "frame": frame_b64,
                    "width": img.width,
                    "height": img.height,
                }
                await ws.send(json.dumps(payload))
            except Exception as e:
                print("Screen capture error:", e)

            await asyncio.sleep(delay)

def handle_input(event):
    """Apply remote mouse/keyboard events using pyautogui."""
    if not event or "type" not in event:
        return

    etype = event["type"]

    if etype == "mouse_move":
        x = event.get("x", 0)
        y = event.get("y", 0)
        pyautogui.moveTo(x, y)

    elif etype == "mouse_click":
        button = event.get("button", "left")
        pyautogui.click(button=button)

    elif etype == "key_tap":
        key = event.get("key", "")
        if key:
            pyautogui.press(key)

async def host_main():
    async with websockets.connect(SERVER_URL) as ws:
        # Register as host
        await ws.send(json.dumps({"type": "register_host"}))
        print("Connected to server, registering as host...")

        stream_task = None

        async for message in ws:
            try:
                msg = json.loads(message)
            except json.JSONDecodeError:
                continue

            mtype = msg.get("type")

            if mtype == "code":
                code = msg.get("code")
                print("Share this code with the controller:", code)
                # start screen streaming after we have a code
                if stream_task is None:
                    stream_task = asyncio.create_task(stream_screen(ws))

            elif mtype == "controller_connected":
                print("Controller connected.")

            elif mtype == "input_event":
                handle_input(msg.get("event"))

            elif mtype == "relay":
                print("[From controller]", msg.get("payload"))

            elif mtype == "controller_disconnected":
                print("Controller disconnected.")

async def main():
    while True:
        try:
            await host_main()
        except Exception as e:
            print("Connection error, retrying in 3 seconds:", e)
            await asyncio.sleep(3)

if __name__ == "__main__":
    asyncio.run(main())

import paho.mqtt.client as mqtt
import json
import time
import random
import sys
import urllib.request
import urllib.parse
import os

BROKER = "127.0.0.1"
PORT = 1883
API_URL = os.getenv("API_URL", "http://localhost:3002/api")

# ── Đăng nhập lấy token ──
def get_token():
    data = json.dumps({"email": "superadmin@sfm.vn", "password": "SuperAdmin@123"}).encode()
    req = urllib.request.Request(
        f"{API_URL}/auth/login",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as res:
        body = json.loads(res.read())
        return body["data"]["token"]

# ── Lấy TOÀN BỘ danh sách thiết bị ──
def get_devices(token):
    all_devices = []
    page = 1
    limit = 200
    while True:
        req = urllib.request.Request(
            f"{API_URL}/devices?limit={limit}&page={page}",
            headers={"Authorization": f"Bearer {token}"}
        )
        with urllib.request.urlopen(req) as res:
            body = json.loads(res.read())
            items = body["data"]["items"]
            all_devices.extend(items)
            total = body["data"]["total"]
            if len(all_devices) >= total:
                break
            page += 1
    return all_devices

# ── Tạo payload theo format thật ──
def make_payload(thing_id: str, is_danger: bool) -> dict:
    now = int(time.time())

    if is_danger:
        smoke = round(random.uniform(210, 350), 1)
        temp  = round(random.uniform(65, 90), 1)
        state = 1
    else:
        smoke = round(random.uniform(20, 80), 1)
        temp  = round(random.uniform(22, 35), 1)
        state = 2 if smoke > 150 else 0

    return {
        "thingId": thing_id,
        "status": {
            "updated_at": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
            "sensors": [
                { "n": "7",  "v": smoke,                              "t": now },
                { "n": "8",  "v": temp,                               "t": now },
                { "n": "9",  "v": random.randint(60, 100),            "t": now },
                { "n": "6",  "v": random.randint(5, 10),              "t": now },
                { "n": "10", "v": round(random.uniform(18, 22), 1),   "t": now },
                { "n": "11", "v": state,                              "t": now },
            ]
        }
    }

# ── MQTT ──
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ Connected to EMQX")
    else:
        print(f"❌ MQTT failed: {rc}")

client = mqtt.Client()
client.on_connect = on_connect
client.connect(BROKER, PORT, 60)
client.loop_start()
time.sleep(1)

ALERT_CHANCE = 0
DEVICE_REFRESH_INTERVAL = 60  # Refresh danh sách thiết bị mỗi 60 giây

print("🔑 Đăng nhập...")
token = get_token()
print("✅ Token OK")

print("📋 Lấy danh sách thiết bị...")
devices = get_devices(token)
print(f"✅ {len(devices)} thiết bị")

print(f"\n🚀 Simulator started | alert chance: {ALERT_CHANCE*100}% | interval: 5s")
print("Press Ctrl+C to stop\n")

try:
    cycle = 0
    last_refresh = time.time()

    while True:
        cycle += 1

        # Refresh danh sách thiết bị định kỳ để tự động nhận thiết bị mới
        if time.time() - last_refresh > DEVICE_REFRESH_INTERVAL:
            try:
                devices = get_devices(token)
                print(f"🔄 Refreshed: {len(devices)} thiết bị")
                last_refresh = time.time()
            except Exception as e:
                print(f"⚠️ Refresh failed: {e}")

        print(f"── Cycle {cycle} ({len(devices)} devices) ──────────────")

        for device in devices:
            thing_id = device.get("thingId")
            name = device.get("name", "Unknown")

            # Lấy thingId từ DB thông qua API
            # Device API trả về id (uuid internal) chứ không trả thingId
            # Cần thêm thingId vào response — xem phần fix bên dưới
            if not thing_id:
                continue

            is_danger = random.random() < ALERT_CHANCE
            payload = make_payload(thing_id, is_danger)

            state = next(s["v"] for s in payload["status"]["sensors"] if s["n"] == "11")
            smoke = next(s["v"] for s in payload["status"]["sensors"] if s["n"] == "7")
            tag = "🚨 ALERT " if state == 1 else "⚠️  WARN  " if state == 2 else "✅ normal"

            topic = f"devices/{thing_id}"
            client.publish(topic, json.dumps(payload))
            print(f"  {tag} | {name:35s} | smoke: {smoke:6.1f} | state: {state}")

        time.sleep(10800)

except KeyboardInterrupt:
    print("\n🛑 Simulator stopped")
    client.loop_stop()
    client.disconnect()
    sys.exit(0)
#!/usr/bin/env python3
"""Pont série <-> MQTT entre l'Arduino du plan à LEDs et le serveur de jeu (Raspberry Pi).

Topics écoutés :
  campus/plan/room/<nom>/state   payload : off | ok | warn | alert | solved
  campus/plan/all                payload : un état, appliqué à toutes les salles
  campus/plan/brightness         payload : 0-255
Topics publiés :
  campus/plan/button/<n>         payload : 1 (appuyé) / 0 (relâché)
  campus/plan/ldr                payload : 0-1023
  campus/plan/status             payload : online / offline (retenu)

Dépendances : pip install pyserial "paho-mqtt>=2.0"
"""
import logging
import os
import threading
import time

import paho.mqtt.client as mqtt
import serial

# Même ordre que ROOMS[] dans plan_led.ino
ROOMS = ["accueil", "cdi", "info1", "info2", "cafet", "amphi", "admin"]
STATES = {"off", "ok", "warn", "alert", "solved"}

SERIAL_PORT = os.getenv("SERIAL_PORT", "/dev/ttyACM0")   # /dev/ttyUSB0 pour certains Nano
MQTT_HOST = os.getenv("MQTT_HOST", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_USER = os.getenv("MQTT_USER")
MQTT_PASS = os.getenv("MQTT_PASS")
MQTT_TLS_CA = os.getenv("MQTT_TLS_CA")                   # chemin du CA -> active TLS (port 8883)
BASE = "campus/plan"

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("bridge")

ser = None
ser_lock = threading.Lock()
room_cache = {name: "off" for name in ROOMS}   # dernier état connu, renvoyé après reconnexion
brightness = 80


def send(line: str) -> None:
    global ser
    with ser_lock:
        if ser is None:
            return
        try:
            ser.write((line + "\n").encode())
        except serial.SerialException as e:
            log.warning("Écriture série impossible : %s", e)
            ser = None


def resync() -> None:
    """Renvoie tout l'état du plan (après démarrage ou reconnexion de l'Arduino)."""
    send(f"BRIGHT {brightness}")
    for i, name in enumerate(ROOMS):
        send(f"ROOM {i} {room_cache[name].upper()}")
        time.sleep(0.01)


def on_connect(client, userdata, flags, reason_code, properties):
    log.info("MQTT connecté (%s)", reason_code)
    client.subscribe(f"{BASE}/room/+/state")
    client.subscribe(f"{BASE}/all")
    client.subscribe(f"{BASE}/brightness")
    client.publish(f"{BASE}/status", "online", retain=True)


def on_message(client, userdata, msg):
    global brightness
    payload = msg.payload.decode(errors="ignore").strip().lower()
    parts = msg.topic.split("/")
    if msg.topic == f"{BASE}/all" and payload in STATES:
        for name in ROOMS:
            room_cache[name] = payload
        send(f"ALL {payload.upper()}")
    elif msg.topic == f"{BASE}/brightness" and payload.isdigit():
        brightness = max(0, min(255, int(payload)))
        send(f"BRIGHT {brightness}")
    elif len(parts) == 5 and parts[2] == "room" and parts[3] in ROOMS and payload in STATES:
        room_cache[parts[3]] = payload
        send(f"ROOM {ROOMS.index(parts[3])} {payload.upper()}")
    else:
        log.warning("Message ignoré : %s = %s", msg.topic, payload)


def handle_serial_line(client, line: str) -> None:
    parts = line.split()
    if not parts:
        return
    if parts[0] == "READY":
        log.info("Arduino prêt, resynchronisation")
        threading.Thread(target=resync, daemon=True).start()
    elif parts[0] == "BTN" and len(parts) == 3:
        client.publish(f"{BASE}/button/{parts[1]}", parts[2])
    elif parts[0] == "LDR" and len(parts) == 2:
        client.publish(f"{BASE}/ldr", parts[1])
    elif parts[0] == "ERR":
        log.warning("Arduino : %s", line)


def ping_loop() -> None:
    while True:
        send("PING")          # garde la liaison vivante (sinon le plan passe en bleu)
        time.sleep(2)


def main() -> None:
    global ser
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="plan-led-bridge")
    if MQTT_USER:
        client.username_pw_set(MQTT_USER, MQTT_PASS)
    if MQTT_TLS_CA:
        client.tls_set(ca_certs=MQTT_TLS_CA)
    client.will_set(f"{BASE}/status", "offline", retain=True)
    client.on_connect = on_connect
    client.on_message = on_message
    client.reconnect_delay_set(1, 10)
    client.connect_async(MQTT_HOST, MQTT_PORT)
    client.loop_start()

    threading.Thread(target=ping_loop, daemon=True).start()

    while True:
        if ser is None:
            try:
                new = serial.serial_for_url(SERIAL_PORT, 115200, timeout=1)
                with ser_lock:
                    ser = new
                log.info("Port série ouvert : %s", SERIAL_PORT)
            except serial.SerialException as e:
                log.warning("Arduino introuvable (%s), nouvel essai dans 2 s", e)
                time.sleep(2)
                continue
        try:
            raw = ser.readline()
        except (serial.SerialException, AttributeError, TypeError) as e:
            log.warning("Liaison série perdue : %s", e)
            with ser_lock:
                ser = None
            continue
        if raw:
            handle_serial_line(client, raw.decode(errors="ignore").strip())


if __name__ == "__main__":
    main()

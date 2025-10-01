# manage_message.py

from fastapi import WebSocket
from datetime import datetime
from typing import List
from asyncio import create_task as task_asyn

connected_clients: List[WebSocket] = []
Notif: List[dict] = []

async def register_ws(ws: WebSocket):
    await ws.accept()
    connected_clients.append(ws)
    print("👥 Nouveau client WebSocket connecté.")
    await ws.send_json({"history": Notif})

def unregister_ws(ws: WebSocket):
    if ws in connected_clients:
        connected_clients.remove(ws)
        print("Client WebSocket déconnecté.")

async def send_to_all(msg: dict):
    Notif.append(msg)
    for ws in connected_clients:
        try:
            await ws.send_json(msg)
        except Exception as e:
            print("Erreur en broadcast WS:", e)

async def send_ws_message(content: dict):
    content.setdefault("time", datetime.now().strftime("%H:%M:%S"))
    Notif.append(content)
    for ws in connected_clients:
        try:
            await ws.send_json(content)
        except Exception as e:
            print("Erreur WebSocket:", e)

#Bot info message et erreur (gauche)
async def notify_info(sender : str,text: str):
    await send_ws_message({
        "sender": sender,#c'est soit Bot soit Erreur
        "type": "info",
        "text": text
    })

#User action message (droite)
async def notify_user_action(
    entity_type: str,
    action: str,
    description: str,
    priority: int = None,
    estimated_minutes: int = None,
    start_time_indis: datetime = None,
    end_time_indis : datetime = None
):
    a_ajouter = {}
    if entity_type == "tâche":
        text = f"Action {action} de la {entity_type} '{description}'"
        if priority is not None:
            text += f" avec priorité {priority}"
        if estimated_minutes is not None:
            text += f", durée estimée : {estimated_minutes}"
        a_ajouter = {"priority": priority, "estimated_minutes": estimated_minutes, "text": text}

    else:
        text = f"Action {action} de l'{entity_type} '{description}'"
        if start_time_indis is not None and end_time_indis is not None:
            text += f" qui durera du {start_time_indis} au {end_time_indis}"
        a_ajouter = {"text": text}

    s_ws_m = {
        "sender": "Utilisateur",
        "action": action,
        "description": description,
        "entity_type": entity_type,
    }
    s_ws_m.update(a_ajouter)
    print(s_ws_m)
    await send_ws_message(s_ws_m)

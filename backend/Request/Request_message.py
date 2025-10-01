from fastapi import APIRouter, WebSocket
from ..manage_db.manage_message import register_ws, unregister_ws
#chose important faux installer la partie standard !!!!!!!

router = APIRouter(prefix="/ws/messages")

@router.websocket("/")
async def ws_messages(ws: WebSocket):
    await register_ws(ws)
    try:
        while True:
            await ws.receive_text()  # Ignore ce que le client envoie
    except Exception as e:
        print("WS déconnecté / erreur :", e)
    finally:
        unregister_ws(ws)


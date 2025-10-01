from fastapi import FastAPI, Request
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware

from .schematAPI import TempsDeplacementRequest
from .models import Task, TempsDeDeplacement, SessionLocal
from .agent import create_agent, run_agent  
from .Request.Request_indispo import router as indispo_router
from .Request.Request_task import router as task_router
from .Request.Request_message import router as message_router

app = FastAPI()
agent = create_agent()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(indispo_router)
app.include_router(task_router)
app.include_router(message_router)

#### Partie tasks
@app.post("/chat")#à modifier pour plus tard
async def chat_endpoint(request: Request):
    data = await request.json()
    user_input = data.get("text", "")
    if not user_input:
        return {"response": "Message vide reçu."}
    try:
        reponse = run_agent(agent, user_input)
        return {"response": reponse}
    except Exception as e:
        print("Erreur dans /chat:", e)
        return {"response": "Erreur côté serveur."}

@app.get("/suggestions")
def get_task_suggestions():
    with SessionLocal() as db:
        tasks = db.query(Task).all()
        suggestions = []

        for task in tasks:
            occurrences = task.occurrences
            total = len(occurrences)
            ratées = len([o for o in occurrences if not o.is_done])

            if total >= 3 and ratées >= 2:
                suggestions.append(f"- {task.description} ({ratées} fois ratée sur {total})")

        if not suggestions:
            return {"suggestions": ["Aucune suggestion pour le moment."]}

        return {"suggestions": suggestions}

@app.get("/deplacement")
def obtenir_temps_deplacement(depart: str, arrivee: str):
    with SessionLocal() as db:
        trajet = db.query(TempsDeDeplacement).filter_by(
            lieu_depart=depart.strip().lower(),
            lieu_arrivee=arrivee.strip().lower()
        ).first()

        if trajet:
            return {"temps": trajet.duree_minutes}
        return {"message": f"Pas de temps enregistré entre {depart} et {arrivee}"}
    
@app.post("/deplacement")
def ajouter_ou_mettre_a_jour_deplacement(data: TempsDeplacementRequest):
    with SessionLocal() as db:
        # Vérifie si un temps existe déjà entre ces lieux
        existing = db.query(TempsDeDeplacement).filter_by(
            lieu_depart=data.lieu_depart.strip().lower(),
            lieu_arrivee=data.lieu_arrivee.strip().lower()
        ).first()

        if existing:
            existing.duree_minutes = data.duree_minutes
            message = f"Temps de déplacement mis à jour : {data.duree_minutes} minutes entre {data.lieu_depart} et {data.lieu_arrivee}."
        else:
            nouveau = TempsDeDeplacement(
                lieu_depart=data.lieu_depart.strip().lower(),
                lieu_arrivee=data.lieu_arrivee.strip().lower(),
                duree_minutes=data.duree_minutes
            )
            db.add(nouveau)
            message = f"Nouveau temps de déplacement enregistré : {data.duree_minutes} minutes entre {data.lieu_depart} et {data.lieu_arrivee}."

        db.commit()
        return {"message": message}
    
async def test_message():
    from .manage_db.manage_message import notify_info
    print("📨 Appel de test-message")
    await notify_info("Bot", "Test message WebSocket")
    return {"status": "sent"}
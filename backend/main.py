from fastapi import FastAPI, Path, Body, Request,HTTPException  # ajout Request
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from .database import (
    Task, SessionLocal,
    ajouter_tache, marquer_tache_faite,compter_occurrences_ratees_par_tache,
    supprimer_tache_par_id, supprimer_tache
    )
from .agent import create_agent, run_agent  
from .fonctionnalite import get_next_due_date, afficher_temps_restant,refresh_tasks,make_aware

app = FastAPI()
agent = create_agent()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TaskCreateRequest(BaseModel):
    description: str
    estimated_minutes: int = Field(..., alias="estimatedMinutes", gt=0)
    periodicity: bool
    class Config:
        allow_population_by_field_name = True

@app.post("/tasks")
def create_task(task: TaskCreateRequest):
    # print(">> Données recues:",task.dict())
    try:
        message = ajouter_tache(
            task.description,
            task.periodicity,
            task.estimated_minutes  
        )
        return {"message": message}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

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
    
@app.get("/tasks")
def read_tasks():
    #met à jour les périodiques
    refresh_tasks()#en partant du princique que le back est tout le temps actif
    now = datetime.now(timezone.utc)
    with SessionLocal() as db:
        tasks = db.query(Task).all()
        results = []
        for task in tasks:
            task.periodicity = int(task.periodicity)
            next_due = get_next_due_date(task)#ajoute de la duré
            temps_restant = None
            missed_count = 0
            missed_message = None

            if task.periodicity:
                missed_count = compter_occurrences_ratees_par_tache(task.id)
                if missed_count > 0:
                    missed_message = f"Attention, tâche ratée {missed_count} fois"
                    temps_restant = "Tâche suivante"
                if task.status != "fait" and next_due:#ne sera pas le cas mais attendant
                    delta = next_due - now
                    temps_restant = afficher_temps_restant(delta)

            else:
                if task.status != "fait" and task.period_end:
                    period_end = make_aware(task.period_end)
                    if period_end > now:
                        delta = period_end - now
                        temps_restant = afficher_temps_restant(delta)
                    else:
                        missed_message = f"tâche ratée"
                        temps_restant = None 
        
            # print(f"TÂCHE: {task.description}, périodique={task.periodicity}, statut={task.status}, période_end={task.period_end}, now={now}, next_due={next_due}, missed={missed_count}")
            # print(f"Bool conversion:{task.periodicity} ET {int(task.periodicity) == 1 if task.periodicity is not None else False}")
            results.append({
                "id": task.id,
                "description": task.description,
                "status": task.status,
                "periodicity": bool(task.periodicity),
                "next_due_date": next_due.isoformat() if next_due else None,
                "temps_restant": temps_restant,
                "isDone": task.status in ["en_attente", "fait"],
                "missed_message": missed_message,
                "missed_count": missed_count,
                "period_end": task.period_end
            })

        return results
    

@app.put("/tasks/{task_id}/done")
async def update_task_done(task_id: int, payload: dict = Body(...)):
    # Récupérer l'argument 'done' du payload
    is_done = payload.get("done")
    
    # Vérifier si is_done est True ou False et appeler la fonction appropriée
    if is_done is not None:  # Si 'done' existe dans le payload
        return {"message": marquer_tache_faite(task_id, is_done)}
    else:
        return {"message": "Erreur: 'done' doit être spécifié dans le corps de la requête."}

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    return {"message": supprimer_tache_par_id(task_id)}

@app.delete("/tasks/delete")
async def delete_task_by_desc(request: Request):  # renommé pour éviter conflit
    payload = await request.json()
    desc = payload.get("description", "")
    result = supprimer_tache(desc)
    return {"message": result}

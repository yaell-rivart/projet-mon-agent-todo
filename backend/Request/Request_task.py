from fastapi import Body, Request,HTTPException, APIRouter  # ajout Request
from datetime import datetime, timezone,timedelta

from ..schematAPI import TaskCreateRequest
from ..models import Task, SessionLocal
from ..fonctionnalite import get_next_due_date, afficher_temps_restant,refresh_tasks,make_aware
from ..manage_db.manage_indispo import verifie_indisponibilite
from ..manage_db.manage_message import notify_user_action, notify_info
from ..manage_db.manage_task import(
    ajouter_tache, marquer_tache_faite,compter_occurrences_ratees_par_tache,
    supprimer_tache_par_id
) 

router = APIRouter(prefix="/tasks")

@router.get("/")
def read_tasks():
    #met à jour les périodiques
    refresh_tasks()#en partant du princique que le back est tout le temps actif
    now = datetime.now(timezone.utc)
    with SessionLocal() as db:
        tasks = db.query(Task).all()
        results = []

        for task in tasks:
            task.periodicity = int(task.periodicity)
            next_due = get_next_due_date(task)#ajoute de la duré pour les taches périodique
            temps_restant = None
            missed_count = 0
            missed_message = None
            non_actif  = verifie_indisponibilite(task.task_start, task.task_end)[0]

            if task.periodicity:
                missed_count = compter_occurrences_ratees_par_tache(task.id)
                if missed_count > 0:
                    missed_message = f"Attention, tâche ratée {missed_count} fois"
                    temps_restant = "Tâche suivante"
                if task.status != "fait" and next_due:#ne sera pas le cas mais attendant
                    delta = next_due - now
                    temps_restant = afficher_temps_restant(delta)

            else:
                if task.status != "fait" and task.task_end:
                    task_end = make_aware(task.task_end)
                    if task_end > now:
                        delta = task_end - now
                        temps_restant = afficher_temps_restant(delta)
                    else:
                        missed_message = f"tâche ratée"
                        temps_restant = None 

            results.append({
                "id": task.id,
                "description": task.description,
                "status": task.status,
                "priority": task.priority,
                "periodicity": bool(task.periodicity),
                "next_due_date": next_due.isoformat() if next_due else None,
                "temps_restant": temps_restant,
                "isDone": task.status in ["en_attente", "fait"],
                "missed_message": missed_message,
                "missed_count": missed_count,
                "period_start": task.task_start,
                "period_end": task.task_end,
                "location": task.location,
                "non_active": non_actif,
            })
        return results

@router.get("/indispos/current")
def si_actuellement_non_disponible():
    now = datetime.now(timezone.utc)
    is_currently_non_active = verifie_indisponibilite(actually=now)[0]
    return {"currently_non_active": is_currently_non_active}

@router.post("/")
async def create_task(task: TaskCreateRequest):
    now = datetime.now(timezone.utc)
    temp_restant = task.estimated_minutes
    next_due =now + timedelta(minutes=temp_restant)
    aff_temps = afficher_temps_restant(temp_restant * 60)# je corrige cela plus tard

    await notify_user_action("tâche", "d'ajout", task.description,priority = task.priority, estimated_minutes = aff_temps)
    si_indispo = verifie_indisponibilite(start=now, end=next_due)
    # si_indispo[0] pour true ou false et [1]pour la période...
    if si_indispo[0]:
        now = si_indispo[1]
        next_due =now + timedelta(minutes=temp_restant)
        await notify_info("Bot",f"La tâche '{task.description}' sera reporté le {now}.")
    print(si_indispo[0]) 
    print(f"le {now} au {next_due} next_due")
    try:
        message = ajouter_tache(task, now, next_due)
        await notify_info("Bot",
            f"Tâche '{task.description}' est ajoutée avec succès."
        )
        return {"message": message}
    except Exception:
        err_content = "Erreur serveur lors de la création de tâche"
        await notify_info("Erreur","Erreur serveur lors de la création de tâche.")
        raise HTTPException(status_code=500, detail=err_content)
    
@router.put("/{task_id}/done")
async def update_task_done(task_id: int, payload: dict = Body(...)):
    # Récupérer l'argument 'done' du payload
    is_done = payload.get("done")
    if is_done is not None:  # Si 'done' existe dans le payload
        return {"message": marquer_tache_faite(task_id, is_done)}
    else:
        return {"message": "Erreur: 'done' doit être spécifié dans le corps de la requête."}
    
@router.delete("/{task_id}")
async def delete_task(task_id: int):
    try:
        description = supprimer_tache_par_id(task_id)
        #Autant utiliser la description que si il y a pas de description pas de tache
        if description is None:
            await notify_info("Erreur","Tâche non trouvée.")
            return {"message": "Tâche non trouvée."}

        await notify_user_action("tâche","de supprimer", description)
        await notify_info("Bot",f"Tâche '{description}' supprimée avec succès.")
        return {"message": f"Tâche supprimée : {description}"}

    except Exception as e:
        await notify_info("Erreur","Erreur serveur lors de la suppression de la tâche.")
        raise HTTPException(status_code=500, detail=str(e))

    

#pour une prochaine fonctionnalité
# @router.delete("/delete")
# async def delete_task_by_desc(request: Request):  # renommé pour éviter conflit
#     payload = await request.json()
#     desc = payload.get("description", "")
#     result = supprimer_tache(desc)
#     return {"message": result}
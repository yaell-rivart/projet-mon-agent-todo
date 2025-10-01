#A voir si je ne vais pas changer le nom du module 
from datetime import datetime, timezone, timedelta
from .models import Task, SessionLocal, TaskOccurrence, make_aware
from typing import Union
   
def refresh_tasks():# je dois voir si il faut mettre ou non dans manage_task
    with SessionLocal() as db:
        now = datetime.now(timezone.utc)
        # print(f"REFRESH: now={now}")
        # Ne traiter que les tâches périodiques
        all_tasks = db.query(Task).all()
        for task in all_tasks:
            task.periodicity = int(task.periodicity)
            task_end = make_aware(task.task_end)
            #Et donc agit seulement si la date limite est dépassé
            if now >= task_end:
                if task.periodicity:
                # Enregistrer un nouveau occurrence
                    occurrence = TaskOccurrence(
                        task_id=task.id,
                        task_start=task.task_start,
                        task_end=task.task_end,
                        is_done=(task.status == "en_attente")
                    )
                    db.add(occurrence)
                    # Réinitialiser le Task
                    task.status = "a_faire"
                    task.done_at = None
                    duration = task.task_end - task.task_start
                    task.task_start = task.task_end
                    task.task_end = task.task_end + duration
                    print(f"{task.description} tache périodique passé {task.periodicity}")

                else:
                    if task.status == "en_attente" :
                        task.status = "fait"
                    # print(f"{task.description} tache non périodique passé {task.periodicity}")

            # print(f"[REFRESH] Tâche '{task.description}' prolongée jusqu'à {task.period_end}, périodie{task.periodicity}, statue {task.status}")
        db.commit()
        
def get_next_due_date(task: Task, now: datetime = None) -> datetime | None:
    if not task.periodicity:
        return None
    now = now or datetime.now(timezone.utc)
    #pour être sûre
    task_start = make_aware(task.task_start)
    task_end = make_aware(task.task_end)
    #ajout de la duré si la date limite est dépassée
    duration = task_end - task_start
    while task_end < now:
        task_end += duration

    return task_end

def afficher_temps_restant(total_seconds: Union[int, timedelta]) -> str:#pour plus de controle
    if type(total_seconds) ==  timedelta:
        total_seconds = int(total_seconds.total_seconds())
    if total_seconds <= 0:
        return "Échéance dépassée"
    minutes = (total_seconds // 60) % 60
    hours = (total_seconds // 3600) % 24
    days = (total_seconds // 86400) % 30
    months = total_seconds // (86400 * 30)
    parts = []
    if months:
        parts.append(f"{months} mois")
    if days:
        parts.append(f"{days} jours")
    if hours:
        parts.append(f"{hours} h")
    if minutes:
        parts.append(f"{minutes} min")
    if not parts:
        seconds = total_seconds % 60
        parts.append(f"{seconds} s")

    return "Temps restant : " + ", ".join(parts)


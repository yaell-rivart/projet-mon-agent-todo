from datetime import datetime, timezone, timedelta
from .database import Task, SessionLocal, TaskOccurrence

def make_aware(dt):
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)#évite les datetime naive(qui ne connaisse pas leur fuseau horaire)
    return dt
   
def refresh_tasks():
    with SessionLocal() as db:
        now = datetime.now(timezone.utc)
        # print(f"REFRESH: now={now}")
        # Ne traiter que les tâches périodiques
        all_tasks = db.query(Task).all()
        for task in all_tasks:
            task.periodicity = int(task.periodicity)
            period_end = make_aware(task.period_end)
            #Et donc agit seulement si la date limite est dépassé
            if now >= period_end:
                if task.periodicity:
                # Enregistrer un nouveau occurrence
                    occurrence = TaskOccurrence(
                        task_id=task.id,
                        period_start=task.period_start,
                        period_end=task.period_end,
                        is_done=(task.status == "en_attente")
                    )
                    db.add(occurrence)
                    # Réinitialiser le Task
                    task.status = "a_faire"
                    task.done_at = None
                    duration = task.period_end - task.period_start
                    task.period_start = task.period_end
                    task.period_end = task.period_end + duration
                    print(f"{task.description} tache périodique passé {task.periodicity}")

                else:
                    if task.status == "en_attente" :
                        task.status = "fait"
                    print(f"{task.description} tache non périodique passé {task.periodicity}")

            # print(f"[REFRESH] Tâche '{task.description}' prolongée jusqu'à {task.period_end}, périodie{task.periodicity}, statue {task.status}")
        db.commit()
        
def get_next_due_date(task: Task, now: datetime = None) -> datetime | None:
    if not task.periodicity:
        return None
    now = now or datetime.now(timezone.utc)
    #pour être sûre
    period_start = make_aware(task.period_start)
    period_end = make_aware(task.period_end)
    #ajout de la duré si la date limite est dépassée
    duration = period_end - period_start
    while period_end < now:
        period_end += duration

    return period_end

def afficher_temps_restant(delta: timedelta) -> str:
    total_seconds = int(delta.total_seconds())
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
from datetime import datetime, timezone, timedelta

from ..models import SessionLocal, Task, TaskOccurrence
from ..schematAPI import TaskCreateRequest
from asyncio import create_task as task_asyn
# from .manage_message import notify


def ajouter_tache(task: TaskCreateRequest, now, next_due):
    if not task.description or task.description.strip() == "":
        raise ValueError("La description ne peut pas être vide.")
    if task.estimated_minutes is None or task.estimated_minutes <= 0:
        raise ValueError("Le temps estimé doit être un entier strictement positif.")
    if task.priority < 1 or task.priority > 9:
        raise ValueError("La priorité doit être comprise entre 1 (urgent) et 9 (faible).")

    db = SessionLocal()
    new_task = Task(
        description=task.description,
        status="a_faire",
        created_at=now,
        updated_at=now,
        periodicity=task.periodicity,
        task_start=now,
        task_end=next_due,
        priority=task.priority,
        location=task.location
    )
    db.add(new_task)
    db.flush()

    occ = TaskOccurrence(
        task_id=new_task.id,
        task_start=now,
        task_end=next_due,
        is_done=False,
    )
    db.add(occ)
    db.commit()
    
    msg = f"Tâche '{new_task.description}' ajoutée avec priorité {new_task.priority}, deadline à {next_due.strftime('%Y-%m-%d %H:%M')}."
    # task_asyn(notify(msg, sender="Tâches", type="success"))
    return msg


def marquer_tache_faite(task_id: int, is_done: bool = True) -> str:
    with SessionLocal() as db:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return "Tâche non trouvée."

        task.status = "en_attente" if is_done else "a_faire"
        task.done_at = datetime.now(timezone.utc) if is_done else None
        if is_done:
            last_occurrence = (
                db.query(TaskOccurrence)
                .filter(TaskOccurrence.task_id == task_id)
                .order_by(TaskOccurrence.task_end.desc())
                .first()
            )
            if last_occurrence:
                last_occurrence.is_done = True

        db.commit()
        return f"Tâche {'marquée comme attente' if is_done else 'remise en à faire'}."

#pour une prochaine fonctionnalité lié à @router.delete("/delete") de Request_task
# def supprimer_tache(desc: str) -> str:
#     with SessionLocal() as db:
#         tasks = db.query(Task).filter(Task.description.ilike(f"%{desc}%")).all()
#         if tasks:
#             if len(tasks) == 1:
#                 t = tasks[0]
#                 db.delete(t)
#                 db.commit()
#                 return f"Tâche supprimée : {t.description}"
#             else:
#                 return f"Plusieurs tâches correspondent à la description '{desc}'. Veuillez préciser davantage."
#         return f"Aucune tâche trouvée pour : {desc}"
    
def supprimer_tache_par_id(task_id: int) -> str:
    with SessionLocal() as db:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return None
        description = task.description
        db.delete(task)
        db.commit()
        return description

def lister_taches() -> str:
    with SessionLocal() as db:
        tasks = db.query(Task).all()
        if not tasks:
            return "Aucune tâche enregistrée."
        task_list = "\n".join(
            f"{t.id}. [{'✔' if t.status == 'fait' else '✘'}] {t.description} (périodicité: {'oui' if t.periodicity else 'non'})"
            for t in tasks
        )
        return f"Tâches :\n{task_list}"

def get_task_by_id(task_id: int):# je le garde pour l'agent
    with SessionLocal() as db:
        return db.query(Task).filter(Task.id == task_id).first()

def get_task_by_description(desc: str):# je le garde pour l'agent
    with SessionLocal() as db:
        return db.query(Task).filter(Task.description.ilike(f"%{desc}%")).first()

def compter_absences_total() -> int:
    with SessionLocal() as db:
        return db.query(TaskOccurrence).filter(TaskOccurrence.is_done == False).count()

def compter_absences_recente() -> int:
    now = datetime.now(timezone.utc)
    past_week = now - timedelta(days=7)
    with SessionLocal() as db:
        return db.query(TaskOccurrence).filter(
            TaskOccurrence.is_done == False,
            TaskOccurrence.task_end >= past_week
        ).count()

def compter_occurrences_ratees_par_tache(task_id: int) -> int:
    with SessionLocal() as db:
        return db.query(TaskOccurrence).filter(
            TaskOccurrence.task_id == task_id,
            TaskOccurrence.is_done == False
        ).count()

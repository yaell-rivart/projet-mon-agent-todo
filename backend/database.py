from sqlalchemy import (
    create_engine, Column,
    Integer, String, DateTime, Boolean,
    ForeignKey, Interval)
from sqlalchemy.types import INTEGER
from sqlalchemy.orm import declarative_base, sessionmaker, Session,relationship
from contextlib import contextmanager
from datetime import datetime, timezone, timedelta
import enum

class PeriodicityEnum(enum.Enum):#clairement mieux qu'un dictio dans ce cas! et ne pas confrondre pour enum.Enum avec l'autre Enum
    none = "none"
    daily = "daily"
    weekly = "weekly"
    ten_days = "10days"
    monthly = "monthly"

Base = declarative_base()

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True)
    description = Column(String, nullable=False)
    status = Column(String, default="a_faire")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=datetime.utcnow)
    done_at = Column(DateTime(timezone=True), nullable=True)
    periodicity = Column(String, nullable=True)
    period_start = Column(DateTime(timezone=True), nullable=True)
    period_end = Column(DateTime(timezone=True), nullable=True)
    occurrences = relationship("TaskOccurrence", back_populates="task", cascade="all, delete-orphan")

class TaskOccurrence(Base):
    __tablename__ = "task_occurrences"
    id = Column(Integer, primary_key=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    is_done = Column(Boolean, default=False)
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    task = relationship("Task", back_populates="occurrences")

#indique l'emplacement de la base de donnée
DATABASE_URL = "sqlite:///./backend/tasks.db"
# moteur de connexion qui autorise à utiliser la connexion depuis plusieurs threads
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
#Créer une  session SQLAlchemy
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
#permet de créer des base de donnée par des models
Base.metadata.create_all(bind=engine)

#aide à gérer de facon sur les session
@contextmanager
def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def calc_next_due_date(periodicity: bool, from_date: datetime):#A voir....
    if periodicity:
        return from_date + timedelta(days=1)
    return None

def ajouter_tache(description, periodicity=False, estimated_minutes=None):
    if not description or description.strip() == "":
        raise ValueError("La description ne peut pas être vide.")
    if estimated_minutes is None or estimated_minutes <= 0:
        raise ValueError("Le temps estimé doit être un entier strictement positif.")
    
    db = SessionLocal()
    now = datetime.now(timezone.utc)
    next_due = now + timedelta(minutes=estimated_minutes)

    new_task = Task(
        description=description,
        status="a_faire",
        created_at=now,
        updated_at=now,
        periodicity=periodicity,
        period_start=now,
        period_end=next_due,
    )
    db.add(new_task)
    db.flush()

    occ = TaskOccurrence(
        task_id=new_task.id,
        period_start=now,
        period_end=next_due,
        is_done=False,
    )
    db.add(occ)
    db.commit()
    return f"Tâche '{description}' ajoutée avec deadline à {next_due.strftime('%Y-%m-%d %H:%M')}."

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
                .order_by(TaskOccurrence.period_end.desc())
                .first()
            )
            if last_occurrence:
                last_occurrence.is_done = True

        db.commit()
        return f"Tâche {'marquée comme attente' if is_done else 'remise en à faire'}."

def supprimer_tache(desc: str) -> str:
    with SessionLocal() as db:
        tasks = db.query(Task).filter(Task.description.ilike(f"%{desc}%")).all()
        if tasks:
            if len(tasks) == 1:
                t = tasks[0]
                db.delete(t)
                db.commit()
                return f"Tâche supprimée : {t.description}"
            else:
                return f"Plusieurs tâches correspondent à la description '{desc}'. Veuillez préciser davantage."
        return f"Aucune tâche trouvée pour : {desc}"
    
def supprimer_tache_par_id(task_id: int) -> str:
    with SessionLocal() as db:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return "Tâche non trouvée."
        db.delete(task)
        db.commit()
        return "Tâche supprimée avec succès."

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

def get_task_by_id(task_id: int):
    with SessionLocal() as db:
        return db.query(Task).filter(Task.id == task_id).first()

def get_task_by_description(desc: str):
    with SessionLocal() as db:
        return db.query(Task).filter(Task.description.ilike(f"%{desc}%")).first()

def compter_absences_total() -> int:
    with SessionLocal() as db:
        return db.query(TaskOccurrence).filter(TaskOccurrence.is_done == False).count()

def compter_absences_recente() -> int:
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    past_week = now - timedelta(days=7)
    with SessionLocal() as db:
        return db.query(TaskOccurrence).filter(
            TaskOccurrence.is_done == False,
            TaskOccurrence.period_end >= past_week
        ).count()

def compter_occurrences_ratees_par_tache(task_id: int) -> int:
    with SessionLocal() as db:
        return db.query(TaskOccurrence).filter(
            TaskOccurrence.task_id == task_id,
            TaskOccurrence.is_done == False
        ).count()
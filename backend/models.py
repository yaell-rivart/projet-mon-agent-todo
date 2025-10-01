#Je diviserai plus tard le module en plusieur partie plus
from sqlalchemy.orm import declarative_base, sessionmaker, Session,relationship
from sqlalchemy import (
    create_engine, Column,
    Integer, String, DateTime, Boolean, JSON, Time,
    ForeignKey)
from contextlib import contextmanager
from datetime import datetime, timezone, timedelta, time, date#attention à timezone c'est dans task voir datetime.now(timezone.utc))

# import enum

Base = declarative_base()

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True)
    description = Column(String, nullable=False)
    status = Column(String, default="a_faire")
    done_at = Column(DateTime(timezone=True), nullable=True)
    priority = Column(Integer, default=5)
    location = Column(String, nullable=True)
    periodicity = Column(String, nullable=True)
    task_start = Column(DateTime(timezone=True), nullable=True)
    task_end = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=datetime.utcnow)
    occurrences = relationship("TaskOccurrence", back_populates="task", cascade="all, delete-orphan")

class TaskOccurrence(Base):
    __tablename__ = "task_occurrences"
    id = Column(Integer, primary_key=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    is_done = Column(Boolean, default=False)
    task_start = Column(DateTime(timezone=True), nullable=False)
    task_end = Column(DateTime(timezone=True), nullable=False)
    task = relationship("Task", back_populates="occurrences")

class NonActivePeriod(Base):
    __tablename__ = "non_active_periods"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=True) 
    day_of_week = Column(JSON) 
    #voir si je garde ou le remplace par une Date
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    # duration_period = Column(Integer, nullable=True)  

class TempsDeDeplacement(Base):
    __tablename__ = "temps_de_deplacement"
    id = Column(Integer, primary_key=True)
    lieu_depart = Column(String, nullable=False)
    lieu_arrivee = Column(String, nullable=False)
    duree_minutes = Column(Integer, nullable=False)
    __table_args__ = (
        # Empêche les doublons
        # Tu peux inverser si tu veux rendre bidirectionnel
        # ou ajouter les deux versions dans la logique
        {'sqlite_autoincrement': True},
    )
    # __table_args__ = (#a voir
    #     UniqueConstraint("lieu_depart", "lieu_arrivee", name="unique_trajet"),
    # )

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

def make_aware(dt):#pour la partie indispo 
    if isinstance(dt, date) and not isinstance(dt, datetime):
        dt = datetime.combine(dt, time.min)  # transforme en datetime à minuit
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt
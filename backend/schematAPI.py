from pydantic import BaseModel, Field
from datetime import time, date, datetime
from typing import Optional

class TaskCreateRequest(BaseModel):
    description: str
    estimated_minutes: int = Field(..., alias="estimatedMinutes", gt=0)
    location: str | None = None
    periodicity: bool
    priority: int = Field(5, ge=1, le=9)
    # active: bool
    # start: datetime = None 
    # end: datetime = None
    class Config:
        allow_population_by_field_name  = True#attention avertisement pour allow_population_by_field_name!!!!!

class TempsDeplacementRequest(BaseModel):# a voir son utilité
    lieu_depart: str
    lieu_arrivee: str
    duree_minutes: int

class IndispoInput(BaseModel):
    name: Optional[str] = "Indisponibilité"
    days_of_week: list[int] = Field(...)
    start_time_indispo: time = Field(..., alias="start_time_indispo")
    end_time_indispo: time = Field(..., alias="end_time_indispo")
    start_time: datetime = Field(..., alias="start_time")   # date + heure ou au moins date + 00:00
    end_time: datetime = Field(..., alias="end_time")

    class Config:
        allow_population_by_field_name = True


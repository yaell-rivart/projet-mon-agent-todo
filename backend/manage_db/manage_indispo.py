from datetime import datetime, timezone, time, timedelta
# from zoneinfo import ZoneInfo  # Python 3.9+
from ..models import SessionLocal, NonActivePeriod, make_aware

def ajouter_indisponibilite(
    name: str,
    day_of_week: list[int],
    start_time_indispo: time,
    end_time_indispo: time,
    start_time: datetime,
    end_time: datetime
) -> str:
    #une fonction plus tard
    start_time = datetime.combine(start_time.date(), start_time_indispo)
    end_time =  datetime.combine(end_time.date(), end_time_indispo)
    with SessionLocal() as db:
        nouvelle = NonActivePeriod(
            name=name,
            day_of_week=day_of_week,
            start_time = start_time.astimezone(timezone.utc),
            end_time = end_time.astimezone(timezone.utc)
        )
        db.add(nouvelle)
        db.commit()
        db.refresh(nouvelle)
        return f"""Indisponibilité '{name}' ajoutée pour le jour {day_of_week}
        , de {start_time_indispo} à {end_time_indispo} entre {start_time} et {end_time}."""

def supprimer_indisponibilite_par_id(indispo_id: int) -> str | None:
    with SessionLocal() as db:
        indispo = db.query(NonActivePeriod).filter(NonActivePeriod.id == indispo_id).first()
        if not indispo:
            return None  # On ne lève plus ici, c’est géré dans la route

        nom = indispo.name  # On récupère le nom pour l'afficher dans la notification
        db.delete(indispo)
        db.commit()
        return nom

def lister_indisponibilites() -> list[dict]:
    with SessionLocal() as db:
        periods = db.query(NonActivePeriod).all()
        return [
            {
                "id": p.id,
                "name": p.name,
                "day_of_week": p.day_of_week,
                "start_time_indispo": p.start_time.time().isoformat(),
                "end_time_indispo": p.end_time.time().isoformat(),
                "start_time": p.start_time.isoformat(),
                "end_time": p.end_time.isoformat()
            }
            for p in periods
        ]

def verifie_indisponibilite( start: datetime , end: datetime) -> bool:
    if not start or not end:
        raise ValueError("Les paramètres 'start' et 'end' sont obligatoires.")
    
    start_task = make_aware(start)
    end_task = make_aware(end)
    day_current = make_aware(datetime.now(timezone.utc))
    with SessionLocal() as db:
        periods = db.query(NonActivePeriod).all()
        for period in periods:    
            start_period = make_aware(period.start_time)
            end_period = make_aware(period.end_time)

            # vérifie si on est dans l'interval de l'indispo (à changer peut etre plus tard)
            if not start_period <= day_current <= end_period:
                continue
            
            start_period = make_aware(datetime.combine(day_current,start_period.time()))
            end_period = make_aware(datetime.combine(day_current,end_period.time()))
            if start_period > end_period:
                minuit_utc = make_aware(time(0, 0, 0, tzinfo=timezone.utc))
                if make_aware(start_period.time()) <= make_aware(day_current.time()) < minuit_utc:
                    end_period += timedelta(days=1)
                elif minuit_utc <= make_aware(day_current.time()) < make_aware(end_period.time()):
                    start_period -= timedelta(days=1)         

            #si on est au jour de la période
            jour = start_task.weekday()
            if jour not in period.day_of_week:
                if start_period.date() == end_period.date():
                    continue
                else: 
                    #vérifie si on n'est pas au lendemain
                    if (jour - 1 if jour !=0 else 6 not in period.day_of_week):
                        continue

            # vérifie si les taches ne sont pas entièrement hors indispo
            if start_period < start_task and end_task < end_period:
                end_period = end_in_indispo(end_period, periods, day_current)
                return True ,end_period

            #False si le début et fin de tache est hors période indispo mais true si c'est entièrement
            # while current < end_task:
            #     # heure = current.time()
            #     # pour le meme jour
            #     # if period.start_time_indispo <= period.end_time_indispo:
            #     if not (start_period <= current <= start_period):
            #             fully_covered = False
            #             break
            #     # pour les jours différent (ex: 22h -> 06h)
            #     # else:
            #     #     if not (heure >= period.start_time_indispo or heure < period.end_time_indispo):
            #     #         fully_covered = False
            #     #         break
            #     current += timedelta(minutes=1)

            
        return False,

def end_in_indispo(period: datetime, periods, day_current) -> datetime:
    end = period
    relance = True
    while relance:#Si la dernière heur de période vérifié est hors d'une autre 
        relance = False#tant que end ne tombe pas dans une période indispo
        for period in periods:#vérifie que end ne tombe pas dans une période indispo
            start_period = make_aware(period.start_time)
            end_period = make_aware(period.end_time)
            end = make_aware(end)
            jour = end.weekday()

            if not start_period <= day_current <= end_period:
                continue
            
            start_period = make_aware(datetime.combine(day_current,start_period.time()))
            end_period = make_aware(datetime.combine(day_current,end_period.time()))
            if start_period > end_period:
                minuit_utc = make_aware(time(0, 0, 0, tzinfo=timezone.utc))
                if make_aware(start_period.time()) <= make_aware(day_current.time()) < minuit_utc:
                    end_period += timedelta(days=1)
                elif minuit_utc <= make_aware(day_current.time()) < make_aware(end_period.time()):
                    start_period -= timedelta(days=1) 

            #pour passer à une autre période
            if jour not in period.day_of_week:
                if start_period.date() == end_period.date():
                    continue
                else: 
                    #vérifie si on n'est pas au lendemain
                    if (jour - 1 if jour !=0 else 6 not in period.day_of_week):
                        continue
                    
            # Pour voir si 
            if start_period <= end < end_period:
                end = end_period
                relance = True  
                break
    return end




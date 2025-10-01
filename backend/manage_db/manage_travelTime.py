from datetime import timedelta

from ..models import SessionLocal, TempsDeDeplacement

#pour la partie gestion_deplacement
#a voir ou le placer
def enregistrer_temps_de_deplacement(depart: str, arrivee: str, duree_minutes: int):
    """Enregistre ou met à jour un temps de déplacement entre deux lieux"""
    with SessionLocal() as db:
        # Vérifie si l'enregistrement existe déjà
        existant = db.query(TempsDeDeplacement).filter_by(
            lieu_depart=depart, lieu_arrivee=arrivee
        ).first()

        if existant:
            # On met à jour la durée si différente
            nouvelle_duree = timedelta(minutes=duree_minutes)
            if existant.duree != nouvelle_duree:
                existant.duree = nouvelle_duree
                db.commit()
                return f"Temps de déplacement mis à jour : {depart} → {arrivee} = {duree_minutes} min"
            return "Temps de déplacement déjà enregistré avec cette durée."
        else:
            # Nouveau trajet
            nouveau = TempsDeDeplacement(
                lieu_depart=depart,
                lieu_arrivee=arrivee,
                duree=timedelta(minutes=duree_minutes)
            )
            db.add(nouveau)
            db.commit()
            return f"Nouveau temps de déplacement enregistré : {depart} → {arrivee} = {duree_minutes} min"

def get_temps_de_deplacement(depart: str, arrivee: str) -> timedelta | None:
    """Renvoie la durée de déplacement enregistrée entre deux lieux (dans un sens ou l'autre)"""
    with SessionLocal() as db:
        t = db.query(TempsDeDeplacement).filter_by(
            lieu_depart=depart, lieu_arrivee=arrivee
        ).first()
        if t:
            return t.duree
        
        # Tente aussi l'inverse (arrivée → départ)
        t_inverse = db.query(TempsDeDeplacement).filter_by(
            lieu_depart=arrivee, lieu_arrivee=depart
        ).first()
        if t_inverse:
            return t_inverse.duree
        
        return None
from fastapi import APIRouter, HTTPException
from ..schematAPI import IndispoInput
from ..manage_db.manage_indispo import ajouter_indisponibilite,lister_indisponibilites, supprimer_indisponibilite_par_id
from ..manage_db.manage_message import notify_user_action, notify_info
from ..models import make_aware, NonActivePeriod, SessionLocal

router = APIRouter(prefix="/indispos")

@router.post("/")
async def create_indisponibilite(payload: IndispoInput):
    if payload.start_time >= payload.end_time:
        msg = "La date de fin doit être postérieure à la date de début."
        await notify_info("Erreur",msg)
        raise HTTPException(status_code=400, detail="La date de fin doit être postérieure à la date de début.")
    
    try:
        start = make_aware(payload.start_time)
        end = make_aware(payload.end_time)
        result = ajouter_indisponibilite(
            name=payload.name,
            day_of_week=payload.days_of_week,
            start_time_indispo=payload.start_time_indispo,
            end_time_indispo=payload.end_time_indispo,
            start_time=start,
            end_time=end
        )
        await notify_user_action(
            "indisponible", "ajout", payload.name,
            start_time_indis = payload.start_time,
            end_time_indis = payload.end_time
            )
        await notify_info("Bot",f"Indisponibilité '{payload.name}' ajoutée avec succès.")
        return {"message": result}
    except Exception as e:
        await notify_info("Erreur", f"Erreur lors de l'ajout de l'indisponibilité '{payload.name}'.")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/")
def get_indisponibilites():
    indispos = lister_indisponibilites()
    return {"indisponibilites": indispos}

@router.patch("/{indispo_id}")
def update_indisponibilite(indispo_id: int, payload: IndispoInput):
    with SessionLocal() as db:
        indispo = db.query(NonActivePeriod).filter(NonActivePeriod.id == indispo_id).first()
        if not indispo:
            raise HTTPException(status_code=404, detail="Indisponibilité non trouvée.")

        if payload.start_time >= payload.end_time:
            raise HTTPException(status_code=400, detail="Heure de début après l'heure de fin")

        # Mise à jour des champs
        indispo.name = payload.name
        indispo.start_time = make_aware(payload.start_time)
        indispo.end_time = make_aware(payload.end_time)
        indispo.start_time_indispo = payload.start_time_indispo
        indispo.end_time_indispo = payload.end_time_indispo
        indispo.day_of_week = payload.days_of_week

        db.commit()
        return {"message": "Indisponibilité mise à jour avec succès."}

    
@router.delete("/{indispo_id}")
async def delete_indisponibilite(indispo_id: int):
    try:
        # tu dois avoir une fonction de suppression, supposons `supprimer_indisponibilite_par_id`
        nom = supprimer_indisponibilite_par_id(indispo_id)
        if not nom:
            msg = f"Indisponibilité non trouvée : {indispo_id}"
            await notify_info("Erreur",msg)
            raise HTTPException(status_code=404, detail=msg)
        await notify_user_action( "indisponible","suppression", nom)
        await notify_info("Bot",f"Indisponibilité '{nom}' supprimée avec succès.")
        return {"message": "Supprimée"}
    except Exception as e:
        await notify_info("Erreur","Erreur serveur lors de la suppression de l’indisponibilité.")
        raise HTTPException(status_code=500, detail=str(e))


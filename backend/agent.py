import re
from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate

from .models import SessionLocal
from .manage_db.manage_task import (
    ajouter_tache, supprimer_tache_par_id, lister_taches,
    get_task_by_description, get_task_by_id,
    compter_absences_total, compter_absences_recente)
memory = {}

def create_agent():
    llm = OllamaLLM(model="mistral", base_url="http://localhost:11434")

    prompt = PromptTemplate(
        input_variables=["input"],
        template="""
            Tu es un assistant de gestion de tâches. 
            Tu dois deviner si l'utilisateur souhaite :

            - ajouter une tâche
            - supprimer une tâche
            - lister les tâches

            Réponds uniquement par "ajout", "supprime", "liste", ou "inconnu".

            Exemples :
            - "Ajoute acheter du pain" → ajout
            - "Supprime la tâche acheter du pain" → supprime
            - "Montre-moi mes tâches" → liste

            Requête : {input}
            Réponse :
            """
    )
    return prompt | llm

def run_agent(agent, user_input: str) -> str:
    action = agent.invoke({"input": user_input}).strip().lower()
    
    # Annulation action en attente si nouvelle requête hors suppression
    if "supprime" not in action and memory.get("pending_action"):
        memory.pop("pending_action")
        return "D'accord, je ne fais rien."

    if user_input.lower() in ["oui", "yes"] and memory.get("pending_action"):
        action, task_id = memory.pop("pending_action")
        if action == "supprimer":
            return supprimer_tache_par_id(task_id)

    elif user_input.lower() in ["non", "no"] and memory.get("pending_action"):
        memory.pop("pending_action")
        return "D'accord, je ne fais rien"

    if "ajout" in action:
        # On pourrait extraire description ici plus proprement
        return ajouter_tache(user_input)

    elif "supprime" in action:
        match = re.search(r"\b(\d+)\b", user_input)
        if match:
            task_id = int(match.group(1))
            task = get_task_by_id(task_id)
            if task:
                memory["pending_action"] = ("supprimer", task_id)
                return f"Tu veux vraiment supprimer la tâche {task.id} : \"{task.description}\" ? (oui/non)"
            return f"Aucune tâche avec l’ID {task_id}"
        
        # Suppression par description
        cleaned_description = re.sub(r"\b(supprime(r)?)\b", "", user_input, flags=re.IGNORECASE).strip()
        task = get_task_by_description(cleaned_description)
        if task:
            memory["pending_action"] = ("supprimer", task.id)
            return f"Tu veux vraiment supprimer la tâche {task.id} : \"{task.description}\" ? (oui/non)"
        return f"Aucune tâche trouvée avec la description : \"{cleaned_description}\""

    elif "absence" in user_input.lower():
        if "total" in user_input.lower() or "tout" in user_input.lower():
            total = compter_absences_total()
            return f"Il y a eu {total} absences enregistrées au total."
        elif "récente" in user_input.lower() or "cette semaine" in user_input.lower():
            nb = compter_absences_recente()
            return f"Il y a eu {nb} absences au cours des 7 derniers jours."
        else:
            total = compter_absences_total()
            return f"Il y a eu {total} absences au total."
    
    elif "liste" in action:
        return lister_taches()
    
    elif "suggère" in user_input.lower() or "idée" in user_input.lower() or "suggestion" in user_input.lower():
        with SessionLocal() as db:
            tasks = db.query(Task).order_by(Task.priority.asc()).all()
            suggestions = []

            for task in tasks:
                occs = task.occurrences
                if len(occs) >= 3:
                    missed = sum(not o.is_done for o in occs)
                    if missed >= 2:
                        suggestions.append(f"- {task.description} [priorité {task.priority}] ({missed} fois ratée)")

            if suggestions:
                return "Voici quelques tâches que tu sembles oublier :\n" + "\n".join(suggestions)
            else:
                return "Tu sembles bien gérer tes tâches, je n’ai rien à suggérer."

    else:
        return "Je n'ai pas compris. Tu peux essayer : 'ajoute', 'supprime', ou 'liste'."
    

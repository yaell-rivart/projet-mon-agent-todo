# Assistant IA - ToDo Chat

Un assistant IA personnel pour la gestion intelligente de tâches, avec interface chat, automatisation, et support des tâches récurrentes.

> 🚧 Projet en cours de développement - d'autres fonctionnalités à développer!

---

## Fonctionnalités

- 💬 Interface de type **chat** pour ajouter, supprimer ou discuter avec l’IA.
- 🧠 Backend IA utilisant des modèles de langage (LLM) pour comprendre les intentions.
- 🕒 Gestion avancée de la **durée estimée** des tâches.
- 🔁 Tâches **récurrentes** avec détection automatique de l'échéance.
- ✅ Système de **validation** de tâche (manuel ou automatique si échue).
- 💡 Réponses du bot personnalisées + emoji contextuels.
- 🌐 API REST avec **FastAPI** (backend) et **React** (frontend).

---

## Stack technique

| Frontend    | Backend  | Divers                   |
|-------------|----------|--------------------------|
| React       | FastAPI  | Axios, localStorage      |
| CSS/JS      | Pydantic | Concurrence (dev script) |
| React Hooks | Uvicorn  | JSON API                 |

---

## Installation (dev)

```bash
# Cloner le dépôt
git clone git clone https://github.com/yaell-rivart/mon-agent-todo.git
cd nom-du-repo

# Installer les dépendances
cd frontend
npm install

# Revenir à la racine
cd ..

# Créer et activer l'environnement Python
python -m venv .venv
source .venv/bin/activate   # ou .venv\Scripts\activate sous Windows

# Installer les dépendances backend
pip install -r requirements.txt

# Lancer le projet
npm run dev
#sinon pour backend
uvicorn backend.main:app --reload
#sinon pour frontend
npm run start --prefix ./frontend

## Prérequis

- [Node.js](https://nodejs.org/) >= v22.16.0
- [Ollama](https://ollama.com) >= 0.1.34
- [Python](https://www.python.org/downloads/) >= 3.12.6

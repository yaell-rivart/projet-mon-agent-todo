import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TaskList from './components/TaskList';
import AddTask from './components/AddTask';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("normal");
  const [taches, setTaches] = useState([]);
  const [durations, setDurations] = useState({
    jours: 0,
    semaines: 0,
    mois: 0
  });
  
  useEffect(() => {
    fetch("/api/taches")
  .then((res) => res.text())
  .then((text) => {
    console.log("Réponse brute du serveur :", text);  // Afficher le texte brut avant de tenter de parser
    try {
      const data = JSON.parse(text);  // Essaie de parser seulement si la réponse est valide
      const tasksWithPeriodic = data.map(t => ({
        ...t,
        isPeriodic: t.isPeriodic ?? false
      }));
      setTaches(tasksWithPeriodic);
    } catch (error) {
      console.error("Erreur lors du parsing JSON :", error);
    }
  })
  .catch((err) => console.error("Erreur lors du chargement des tâches :", err));
  }, []);

  const handleDeleteTask = async (taskId) => {
  try {
    await axios.delete(`http://localhost:8000/tasks/${taskId}`);
    setTaches((prevTaches) => prevTaches.filter((task) => task.id !== taskId));
  } catch (error) {
    console.error("Erreur lors de la suppression de la tâche :", error);
  }
};

  // 1. fetchTasks doit être défini ici
  const fetchTasks = async () => {
    try {
      const res = await axios.get("http://localhost:8000/tasks");
      console.log("fetchTasks – res.data:", res.data);
      const formatted = res.data.map(t => ({
        ...t,
        isDone: t.status === "fait" || t.status === "en_attente", 
        isPeriodic: t.periodicity === true || t.periodicity === "true"
      }));
      console.log("Tâches reçues avec statut :", res.data.map(t => t.status));
      // console.log("fetchTasks – formatted taches:", formatted);
      setTaches(formatted);
    } catch (error) {
      console.error("Erreur lors du chargement des tâches :", error);
    }
  };

  // 2. envoyerMessage ici aussi
  const envoyerMessage = async () => {
    if (!input.trim()) return;

    const now = new Date().toLocaleTimeString();
    let texteEnvoye = input.trim();

    if (mode === "ajout") texteEnvoye = `ajoute ${texteEnvoye}`;
    else if (mode === "suppression") texteEnvoye = `supprime ${texteEnvoye}`;

    setMessages(prev => [...prev, { sender: "Moi", text: texteEnvoye, time: now }]);

    try {
      const res = await axios.post("http://localhost:8000/chat", { text: texteEnvoye });
      const data = res.data;

      setMessages(prev => [...prev, {
        sender: "Agent",
        text: data.response,
        time: new Date().toLocaleTimeString()
      }]);

      if (texteEnvoye.toLowerCase().includes("ajout") || texteEnvoye.toLowerCase().includes("supprime")) {
        fetchTasks();
      }

    } catch (error) {
      console.error("Erreur :", error);
      setMessages(prev => [...prev, {
        sender: "Agent",
        text: "Erreur de connexion au serveur.",
        time: now
      }]);
    }

    setInput("");
  };

const toggleTaskStatus = async (taskId) => {
  try {
    const task = taches.find((task) => task.id === taskId);
    const isDone = !task.isDone;  // Inverse l'état de la tâche : si elle est "faite", elle devient "à faire", et vice versa
    
    // Envoi de la mise à jour au backend pour modifier le statut et done_at
    const response = await axios.put(`http://localhost:8000/tasks/${taskId}/done`, { done: isDone });
    
    // Mise à jour de l'état local après la mise à jour du backend
    setTaches((prevTaches) =>
      prevTaches.map((task) =>
        task.id === taskId ? { ...task, isDone } : task
      )
    );
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la tâche :", error);
  }
};
  useEffect(() => {
    fetchTasks();
  }, []);
  const tasksToDo = taches.filter((task) => !task.isDone);
  const tasksDone = taches.filter((task) => task.isDone);
  console.log("Messages envoyés :", messages);
  return (
    <div style={{ padding: 20 }}>
      <h1>Agent IA - ToDo Chat</h1>
      <AddTask visible={true} onTaskAdded={fetchTasks}/>
      <div div style={{ display: "flex", gap: "40px", justifyContent: "center" }}>
      <TaskList titre="📋 Liste des tâches à faire" taches={tasksToDo} onToggleDone={toggleTaskStatus} onDeleteTask={handleDeleteTask} />
      <TaskList titre="📋 Liste des tâches terminées" taches={tasksDone} onToggleDone={toggleTaskStatus} onDeleteTask={handleDeleteTask} />
      </div>
    </div>
  );
}
export default App;
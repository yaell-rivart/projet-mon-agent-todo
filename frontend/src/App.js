import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TaskList from './components/TaskList';
import AddTask from './components/AddTask';

import useTasks from './hooks/useTasks';
import useAutoRefresh from './hooks/useAutoRefresh'; // import du hook


function App() {
  const { taches, fetchTasks, handleDeleteTask, toggleTaskStatus} = useTasks();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("normal");//à voir plus tard
  const [durations, setDurations] = useState({
    jours: 0,
    semaines: 0,
    mois: 0
  });

  //raffraichir la page
  useAutoRefresh(fetchTasks, 60000);

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

  const tasksToDo = taches.filter((task) => !task.isDone);
  const tasksDone = taches.filter((task) => task.isDone);
  console.log("Messages envoyés :", messages);
  return (
    <div style={{ padding: 20 }}>
      <h1>Agent IA - ToDo Chat</h1>
      <AddTask visible={true} onTaskAdded={fetchTasks}/>
      <div style={{ display: "flex", gap: "40px", justifyContent: "center", flexWrap: "wrap"}}>
      <TaskList 
      titre="📋 Liste des tâches à faire" 
      taches={tasksToDo} 
      onToggleDone={toggleTaskStatus} 
      onDeleteTask={handleDeleteTask} 
      />

      <TaskList 
      titre="📋 Liste des tâches terminées" 
      taches={tasksDone} 
      onToggleDone={toggleTaskStatus} 
      onDeleteTask={handleDeleteTask} 
      />
      </div>
    </div>
  );
}
export default App;

import React, { useEffect, useState } from 'react';
import axios from 'axios';

import TaskList from './components/Task/TaskList';
import AddTask from './components/Task/AddTask';
import IndisposList from './components/unavailability/IndisposList';
import AddIndispo from './components/unavailability/AddIndispo';
import MessagePanel from './components/MessagePanel';

import useTasks from './hooks/useTasks';
import useAutoRefresh from './hooks/useAutoRefresh'; 


function App() {
  const { taches, fetchTasks, handleDeleteTask, toggleTaskStatus} = useTasks();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("normal");//à voir plus tard
  // const [durations, setDurations] = useState({
  //   jours: 0,
  //   semaines: 0,
  //   mois: 0
  // });
  const [refreshIndispos, setRefreshIndispos] = useState(false);


  //raffraichir la page des taches
  useAutoRefresh(fetchTasks, 60000);
  
  const triggerRefreshIndispos = () => {
    // change de valeur à chaque appel
    // //Parce qu’on veut accéder à la valeur actuelle du state (prev)
    // et // Appelle une fonction pour rafraîchir la liste
    setRefreshIndispos(prev => !prev); 
  };

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

  // filtre tache
  const tasksToDo = taches.filter((task) => !task.isDone);
  const tasksDone = taches.filter((task) => task.isDone);
  const tasksInactive = taches.filter((task) => !task.isDone && task.non_actif);
  console.log("Messages envoyés :", messages);
  return (
    <div style={{ padding: 20 }}>
      <h1>Agent IA - ToDo Chat</h1>

      <MessagePanel/>

      <AddTask visible={true} onTaskAdded={fetchTasks}/>

      <AddIndispo onIndispoAdded={triggerRefreshIndispos} />

      <IndisposList refreshFlag={refreshIndispos} />

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
      
      <TaskList 
        titre="🚫 Tâches non actives (en période d’indisponibilité)" 
        taches={tasksInactive} 
        onToggleDone={() => {}} // désactivé
        onDeleteTask={handleDeleteTask}
        disableToggle={true}
      />
      </div>
    </div>
  );
}
const styles = {
  appContainer: {
    minWidth: 400,  
    minHeight: 600, 
    padding: 20,
    boxSizing: 'border-box', 
  },
};
export default App;

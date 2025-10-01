import React, { useState, useEffect } from "react";
import axios from "axios";


import DurationInput from "./DurationInput";
// import TaskPeriodicityInput from "./TaskPeriodicityInput"; pour une autre fonctionnalité

function AddTask({onTaskAdded}) {
  const [description, setDescription] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [periodicity, setPeriodicity] = useState(false);
  const [messages, setMessages] = useState([]);
  const [priority, setPriority] = useState(5); // Valeur par défaut : moyenne
  const [location, setLocation] = useState(""); // Facultatif

  // const [taskPeriodicityStart, setTaskPeriodicityStart] = useState('');
  // const [taskPeriodicityEnd, setTaskPeriodicityEnd] = useState('');
  // Envoi quand tu appuies sur le bouton ou Enter dans description


  const createTask = async () => {
    if (
      estimatedMinutes === null ||
      estimatedMinutes === undefined ||
      isNaN(estimatedMinutes) ||
      estimatedMinutes <= 0
    ) {
      setMessages((msgs) => [...msgs,
        { sender: "Bot",
        text: "Veuillez entrer un temps estimé > 0.",
        time: new Date().toLocaleTimeString() }]);
        return;
    } try {
    console.log("Payload  ajout tache envoyé :", {
    description,
    estimatedMinutes,
    periodicity,
    priority,
    location: location || null,
  });


  // Envoie la requête au backend
  const res = await axios.post("http://localhost:8000/tasks", {
    description,
    estimatedMinutes,
    periodicity,
    priority,
    location: location || null,
        // task_periodicity_start: taskPeriodicityStart || null,
        // task_periodicity_end: taskPeriodicityEnd || null
      });
      
      // Ajoute message utilisateur + réponse du backend dans MessageList
      setMessages((msgs) => [
        ...msgs,
        { sender: "Moi", text: description, time: new Date().toLocaleTimeString() },
        { sender: "Bot", text: res.data.message || "Tâche ajoutée !", time: new Date().toLocaleTimeString() },
      ]);
      if (res.status === 200 && onTaskAdded) {
      onTaskAdded(); // rafraîchit les tâches côté App
      }

      // Reset les inputs
      setDescription("");
      setEstimatedMinutes(0);
      setPeriodicity(false);
      setPriority(5);
      setLocation("");
      // setTaskPeriodicityStart("");pour plus tard
      // setTaskPeriodicityEnd("");
    } catch (err) {
      setMessages((msgs) => [...msgs,
        { sender: "Bot", text: "Erreur lors de l’ajout !", time: new Date().toLocaleTimeString() },
        {//a voir si je vais garder ou non
          sender: "Bot",
          text: `Tâche ajoutée : "${description}" avec priorité ${priority}${location ? ` à ${location}` : ""}.`,
          time: new Date().toLocaleTimeString()
        },
      ]);
    }
    
  };

  // On envoie si Enter est pressé dans le champ description
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      createTask();
    }
  };

  return (
    <div style={{ marginTop: 20, border: "1px solid #ccc", padding: 10 }}>
      <h3>Créer une tâche</h3>

      {/* Input description style InputBar */}
      <div style={{ marginTop: 10 }}>
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ width: "80%", padding: 8 }}
        />
        {/* Durée estimée */}
        <DurationInput
          value={estimatedMinutes}
          onDurationChange={setEstimatedMinutes}
          style={{ width: "80%", padding: 8 }}
        />
        {/* priorité */}
        <div style={{ marginTop: 10 }}>
            <label>Priorité (1 = urgente, 9 = faible) :</label><br />
            <input type="number" min="1" max="9" value={priority} 
              onChange={(e) => setPriority(parseInt(e.target.value) || 5)}
              style={{ width: 100 }}
            />
        </div>
        <div style={{ marginTop: 10 }}>
          <label>
            <input
              type="checkbox"
              checked={periodicity}
              onChange={(e) => setPeriodicity(e.target.checked)}
            />
            Tâche répétable
          </label>
        {/* <TaskPeriodicityInput
          onChange={({ start, end }) => {
            setTaskPeriodicityStart(start);
            setTaskPeriodicityEnd(end);
          }}
        /> */}
        </div>

        <button
            onClick={createTask}
            style={{ marginLeft: 10, padding: 8, backgroundColor: "#4c93afff", color: "white" }}
          >
            Envoyer
        </button>

        <div style={{ marginTop: 10 }}>
          <label>Lieu :</label><br />
          <input type="text" placeholder="Lieu de la tâche (facultatif)" value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{ width: "80%", padding: 8 }}
          />
        </div>
      </div>

    </div>
  );
}

export default AddTask;
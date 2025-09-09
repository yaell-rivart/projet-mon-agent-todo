import React, { useState } from "react";
import axios from "axios";
import DurationInput from "./DurationInput";

function AddTask({onTaskAdded}) {
  const [description, setDescription] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [periodicity, setPeriodicity] = useState(false);
  const [messages, setMessages] = useState([]);

  // Envoi quand tu appuies sur le bouton ou Enter dans description
  const createTask = async () => {
    if (
      estimatedMinutes === null ||
      estimatedMinutes === undefined ||
      isNaN(estimatedMinutes) ||
      estimatedMinutes <= 0
    ) {
      setMessages((msgs) => [...msgs, { sender: "Bot", text: "Veuillez entrer un temps estimé > 0.", time: new Date().toLocaleTimeString() }]);
      return;
    }

    try {
      // Envoie la requête au backend
      const res = await axios.post("http://localhost:8000/tasks", {
        description,
        estimatedMinutes,
        periodicity,
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
    } catch (err) {
      setMessages((msgs) => [...msgs, { sender: "Bot", text: "Erreur lors de l’ajout !", time: new Date().toLocaleTimeString() }]);
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

      {/* MessageList pour afficher la conversation */}
      <div style={{ height: "200px", overflowY: "auto", border: "1px solid #ccc", padding: 10, backgroundColor: "#f9f9f9" }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.sender === "Moi" ? "flex-end" : "flex-start",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                maxWidth: "70%",
                padding: 10,
                borderRadius: 10,
                backgroundColor: msg.sender === "Moi" ? "#dcf8c6" : "#e6e6e6",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ fontSize: "0.85em", marginBottom: 4 }}>
                <strong>{msg.sender}</strong>{" "}
                <span style={{ color: "#888", fontSize: "0.75em" }}>{msg.time}</span>
              </div>
              <div>{msg.text}</div>
            </div>
          </div>
        ))}
      </div>

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
        <button
          onClick={createTask}
          style={{ marginLeft: 10, padding: 8, backgroundColor: "#4CAF50", color: "white" }}
        >
          Envoyer
        </button>
      </div>

      {/* Garder les autres inputs */}
      <DurationInput
        value={estimatedMinutes}
        onDurationChange={setEstimatedMinutes}
        style={{ width: "80%", padding: 8 }}
      />
      <div style={{ marginTop: 10 }}>
        <label>
          <input
            type="checkbox"
            checked={periodicity}
            onChange={(e) => setPeriodicity(e.target.checked)}
          />
          Tâche répétable
        </label>
      </div>
    </div>
  );
}

export default AddTask;
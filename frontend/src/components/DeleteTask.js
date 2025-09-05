import React, { useState } from "react";

function DeleteTask({ visible }) {
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  if (!visible) return null;

  const handleDelete = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      setMessage("La description ne peut pas être vide.");
      return;
    }

    try {
      // Supposons que la suppression se fait via DELETE avec description en query ou body selon API
      const res = await fetch(`http://localhost:8000/tasks/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || "Tâche supprimée avec succès !");
        setDescription("");
      } else {
        setMessage(data.message || "Erreur lors de la suppression.");
      }
    } catch (err) {
      setMessage("Erreur réseau : " + err.message);
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <h3>Supprimer une tâche</h3>
      <form onSubmit={handleDelete}>
        <input
          type="text"
          placeholder="Description de la tâche à supprimer"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ width: "100%", padding: 8, fontSize: 16, marginBottom: 10 }}
        />
        <button type="submit" style={{ padding: "8px 16px", fontSize: 16 }}>
          Supprimer
        </button>
      </form>
      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </div>
  );
}

export default DeleteTask;
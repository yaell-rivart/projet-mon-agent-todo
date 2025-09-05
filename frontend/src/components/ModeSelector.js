import React from "react";

function ModeSelector({ mode, setMode }) {
  return (
    <div>
      <button
        onClick={() => setMode("normal")}
        style={{ backgroundColor: mode === "normal" ? "#ccc" : "#fff" }}
      >
        Normal
      </button>
      <button
        onClick={() => setMode("ajout")}
        style={{ backgroundColor: mode === "ajout" ? "#ccc" : "#fff" }}
      >
        Ajouter
      </button>
      <button
        onClick={() => setMode("suppression")}
        style={{ backgroundColor: mode === "suppression" ? "#ccc" : "#fff" }}
      >
        Supprimer
      </button>
    </div>
  );
}

export default ModeSelector;
import React, { useState, useEffect } from 'react';

function TaskPeriodicityInput({ start: propStart = '', end: propEnd = '', onChange }) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    setStart(propStart);
  }, [propStart]);

  useEffect(() => {
    setEnd(propEnd);
  }, [propEnd]);

  useEffect(() => {
    if (onChange) onChange({ start, end });
  }, [start, end]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`Tâche du ${start} au ${end}`);
    // Ici tu peux envoyer les données au serveur, les afficher, etc.
  };
  return (
    <form onSubmit={handleSubmit}>
        <div style={{ marginTop: 10 }}>
        <label>
            Début de la période de tâche(start) :{" "}
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)}
            style={{ width: '95%', padding: 8, marginBottom: 10 }}
            />
        </label>
        <br />
        <label>
            Fin de la période de tâche (end) :{" "}
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)}
            style={{ width: '95%', padding: 8, marginBottom: 10 }}
            />
        </label>
        </div>
    </form>
  );
}

export default TaskPeriodicityInput;
import React, { useState } from 'react';
import useIndispos from '../../hooks/useIndispos';

function AddIndispo({ onIndispoAdded }) {
  const { addIndispo } = useIndispos();

  const [name, setName] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [startTimeIndispo, setStartTimeIndispo] = useState('');
  const [endTimeIndispo, setEndTimeIndispo] = useState('');
  const [globalStart, setGlobalStart] = useState('');
  const [globalEnd, setGlobalEnd] = useState('');
  const [error, setError] = useState('');

  const toggleDay = (day) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // console.log("Payload envoyé :", {
  //   name,
  //   days_of_week: daysOfWeek,
  //   start_time_indispo: startTimeIndispo,
  //   end_time_indispo: endTimeIndispo,
  //   start_time: globalStart,
  //   end_time: globalEnd
  // });

  const convertLocalTimeToUTCString = (timeStr) => {
    // timeStr = "08:00"
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    const offsetMinutes = date.getTimezoneOffset();
    // Ajuster l'heure pour obtenir UTC
    date.setMinutes(date.getMinutes() + offsetMinutes);
    // Extraire l'heure au format "HH:mm:ssZ"
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = '00';
    return `${hh}:${mm}:${ss}Z`; // exemple "06:00:00Z"
  };

  const handleSubmit = async () => {
    setError('');
    if (!name || !startTimeIndispo || !endTimeIndispo || !globalStart || !globalEnd) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (new Date(globalStart) >= new Date(globalEnd)) {
      setError('La date de début globale doit être avant la date de fin.');
      return;
    }

    const payload = {
        name,
        days_of_week: daysOfWeek,
        start_time_indispo: convertLocalTimeToUTCString(startTimeIndispo), // UTC
        end_time_indispo: convertLocalTimeToUTCString(endTimeIndispo),     // UTC
        start_time: new Date(globalStart).toISOString(), // déjà une date => convertie en UTC
        end_time: new Date(globalEnd).toISOString(),
    };
      console.log("✅ Données envoyées à l'API (en UTC) :");
      console.log(JSON.stringify(payload, null, 2));

    try {
      await addIndispo(payload);
      if (onIndispoAdded) onIndispoAdded();
      // Réinitialiser les champs
      setName('');
      setDaysOfWeek([]);
      setStartTimeIndispo('');
      setEndTimeIndispo('');
      setGlobalStart('');
      setGlobalEnd('');
    } catch (err) {
      setError("Erreur lors de l'ajout de l'indisponibilité.");
    }
  };

  return (
    <div style={{ marginTop: 20, border: '1px solid #ccc', padding: 10 }}>
      <h3>➕ Ajouter une indisponibilité</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div>
        <label>Nom :</label><br />
        <input type="text" value={name}
          placeholder="Ex: Réunion, Congé..."
          onChange={(e) => setName(e.target.value)}
          style={{ width: '95%', padding: 8, marginBottom: 10 }}
        />
      </div>

      <div>
        <label>Jours de la semaine :</label><br />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((label, index) => (
            <label key={index}>
              <input
                type="checkbox"
                checked={daysOfWeek.includes(index)}
                onChange={() => {
                  setDaysOfWeek(prev =>
                    prev.includes(index)
                      ? prev.filter(day => day !== index)
                      : [...prev, index]
                  );
                }}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <label>Heure de début :</label><br />
        <input type="time" value={startTimeIndispo}
          onChange={(e) => setStartTimeIndispo(e.target.value)}
          style={{ padding: 8, marginBottom: 10 }}
        />
        <label>Heure de fin :</label><br />
        <input type="time" value={endTimeIndispo}
          onChange={(e) => setEndTimeIndispo(e.target.value)}
          style={{ padding: 8, marginBottom: 10 }}
        />
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
        <div>
          <label>Date de début globale :</label><br />
          <input type="date" value={globalStart}
            onChange={(e) => setGlobalStart(e.target.value)}
            style={{ padding: 8, marginBottom: 10 }}
          />
        </div>
        <div>
          <label>Date de fin globale :</label><br />
          <input type="date" value={globalEnd}
            onChange={(e) => setGlobalEnd(e.target.value)}
            style={{ padding: 8, marginBottom: 10 }}
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        style={{ padding: 10, backgroundColor: '#007bff', color: 'white', border: 'none' }}
      >
        Ajouter
      </button>
    </div>
  );
}

export default AddIndispo;
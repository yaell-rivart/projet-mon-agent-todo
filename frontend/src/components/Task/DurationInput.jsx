import React, { useState, useEffect } from 'react';

function DurationInput({value = 0, onDurationChange }) {
  const [duration, setDuration] = useState({ 
    minutes: 0, hours: 0, days: 0, weeks: 0, months: 0,
  });
  
  // Si `value` est remis à 0 dans le parent, reset tous les champs
  useEffect(() => {
    if (value === 0) {
      setDuration({
        minutes: 0,hours: 0,days: 0,weeks: 0,months: 0,
      });
    }
  }, [value]);
  useEffect(() => {
    // Convertir en minutes
    const totalMinutes =
      duration.minutes +
      duration.hours * 60 +
      duration.days * 24 * 60 +
      duration.weeks * 7 * 24 * 60 +
      duration.months * 30 * 24 * 60;
    onDurationChange(totalMinutes);
  }, [duration, onDurationChange]);

  const handleChange = (unit) => (e) => {
    setDuration((prev) => ({
      ...prev,
      [unit]: parseInt(e.target.value) || 0,
    }));
  };

  return (
    <div>
      <label>Durée estimée d'action à faire par tâche :</label>
      <div style={{ width: "100%", display: "flex", gap: "10px", marginTop: 5, flexWrap: "wrap" }}>
        <div>
          <label>minutes :</label><br />
          <input name="minutes" type="number" min="0" onChange={handleChange("minutes")}  value={duration.minutes} placeholder="Minutes" />
        </div>
        <div>
          <label>hours :</label><br />
          <input name="hours" type="number" min="0" onChange={handleChange("hours")}  value={duration.hours} placeholder="Heures" />
        </div>
        <div>
          <label>days :</label><br />
          <input name="days" type="number" min="0" onChange={handleChange("days")}  value={duration.days} placeholder="Jours" />
        </div>
        <div>
          <label>weeks :</label><br />
          <input name="weeks" type="number" min="0" onChange={handleChange("weeks")}  value={duration.weeks} placeholder="Semaines" />
        </div>
        <div>
          <label>months :</label><br />
          <input name="months" type="number" min="0" onChange={handleChange("months")}  value={duration.months} placeholder="Mois" />
        </div>
      </div>
    </div>
  );
}

// function DurationInput({ estimatedMinutes, setEstimatedMinutes }) {
//   return (
//     <div>
//       <label>Durée estimée :</label>
//       <button
//         onClick={() => setEstimatedMinutes(Math.max(0, estimatedMinutes - 15))}
//         style={{ marginLeft: 10 }}
//       >
//         -15 min
//       </button>
//       <span style={{ margin: '0 10px' }}>{estimatedMinutes} min</span>
//       <button onClick={() => setEstimatedMinutes(estimatedMinutes + 15)}>+15 min</button>
//     </div>
//   );
// }

export default DurationInput;

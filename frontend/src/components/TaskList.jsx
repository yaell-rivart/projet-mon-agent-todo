import React, { useEffect, useRef } from 'react';

function parseDateUTC(dateStr) {//Permet d'avoir des dates dans les fuseaux horaires avec les données recus
  let isoDate = dateStr.replace(' ', 'T');
  if (!isoDate.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(isoDate)) {
    isoDate += 'Z';
  }
  return new Date(isoDate);
}

function formatDateFr(dateStr) {//permet d'avoir un format de date, là c'est belge avec date.toLocaleDateString
  const date = parseDateUTC(dateStr);
  const options = {weekday: 'long',year: 'numeric',month: 'long',day: 'numeric',
    hour: '2-digit',minute: '2-digit',hour12: false,timeZoneName: 'short'
  };
  return date.toLocaleDateString('fr-BE', options);
}

function isOverdue(dueDateStr) {//Vérifie si une tâche est en retard par un boleen
  const now = new Date();
  const dueDate = parseDateUTC(dueDateStr);
  return now > dueDate;
}

// Composant principal
const TaskList = ({ titre, taches, onToggleDone, onDeleteTask }) => {
  const handledIds = useRef(new Set());//Set temporaire de tâches traitées très récemment (dans les 60 sec).
  const lastHandledRef = useRef(new Set());//Set temporaire de tâches traitées très récemment (dans les 60 sec).
  
  // j'en fairais un hook pour tasklist avec ces trois fonct plus tard
  const deleteTask = (taskId) => {
    onDeleteTask(taskId);
  };
  
  useEffect(() => {
  const intervalId = setInterval(async () => {
    const processTasks = async () => {
      for (const task of taches) {
        const due = task.next_due_date || task.period_end;
        if (!due) continue;

        const isPeriodic = Boolean(task.periodicity);
        const overdue = isOverdue(due);

        
        if (isPeriodic && task.isDone && overdue && !handledIds.current.has(task.id)) {
          try {
            await onToggleDone(task.id); // 🔥 Ici on attend que l'API fasse la maj
            // ✅ On ajoute à notre Set de tâches déjà traitées
            handledIds.current.add(task.id);
            lastHandledRef.current.add(task.id);
            // setHandledIds(prev => [...prev, task.id]);
            // lastHandledRef.current.add(task.id);

            setTimeout(() => {
              lastHandledRef.current.delete(task.id);
              handledIds.current.delete(task.id); // (optionnel mais utile si tu veux les retraiter plus tard)
            }, 60 * 1000);
          } catch (err) {
            console.error("Erreur lors du toggle automatique :", err);
          }
        }
      }
    }; processTasks(); // Lance le traitement asynchrone
  }, 60000);
  return () => clearInterval(intervalId);

  }, [taches, onToggleDone]);

  const renderTaskInfo = (task) => {
    const dueDateStr = task.next_due_date || task.period_end;
    if (!dueDateStr) return null;

    const overdue = isOverdue(dueDateStr);
    const isPeriodic = Boolean(task.periodicity === true || task.periodicity === "true");
    const missedCount = task.missed_count || 0;
    const tempsRestant = task.temps_restant
      ? `Temps restant : ${task.temps_restant.replace(/^Temps restant\s*:\s*/i, '').trim().replace(/^\d+\s*s(ec)?$/i, 'moins de 1 minute')}`
      : null;
    const dateLimite = `Date limite : ${formatDateFr(dueDateStr)}`;
    //pour plus tard
    // if (isPeriodic && !task.isDone && lastHandledRef.current.has(task.id)) {
    //   return (
    //     <div style={styles.infoBox}>
    //       <div>Tâche accomplie (suivante)</div>
    //       {tempsRestant && <div>{tempsRestant}</div>}
    //       <div>{dateLimite}</div>
    //     </div>
    //   );
    // }

    if (task.isDone) return null;

    if (isPeriodic) {
      // if (overdue && missedCount > 0) {//pour plus tard
      //   return (
      //     <div style={styles.infoBox}>
      //       <div>Attention, tâche ratée {missedCount} fois</div>
      //       {tempsRestant && <div>{tempsRestant}</div>}
      //       <div>{dateLimite}</div>
      //     </div>
      //   );
      // }
      if (!overdue) {
        return (
          <div style={styles.infoBox}>
            {tempsRestant && <div>{tempsRestant}</div>}
            <div>{dateLimite}</div>
          </div>
        );
      }
    }

    if (!isPeriodic) {
      return overdue
        ? <span style={styles.infoText}>Tâche ratée</span>
        : (
          <div style={styles.infoBox}>
            {tempsRestant && <div>{tempsRestant}</div>}
            <div>{dateLimite}</div>
          </div>
        );
    }

    return null;
  };


  return (
    <div>
      <h3 style={styles.header}>{titre}</h3>
      {taches.length === 0 && <p>Aucune tâche</p>}
      <ul style={styles.ul}>
        {taches.map((t) => (
          <li key={t.id} style={styles.listItem}>
            <div style={styles.taskRow}>
              <input
                type="checkbox"
                id={`task-checkbox-${t.id}`}
                checked={t.isDone}
                onChange={() => onToggleDone(t.id)}
              />
              <label
                htmlFor={`task-checkbox-${t.id}`}
                style={{
                  ...styles.label,
                  textDecoration: t.isDone ? "line-through" : "none",
                }}
              >
                {t.description}
              </label>
              {renderTaskInfo(t)}
              <button
                style={styles.deleteButton}
                onClick={() => deleteTask(t.id)}
                aria-label={`Supprimer la tâche ${t.description}`}
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Styles
const styles = {
  header: { textAlign: "right", marginRight: 10 },
  ul: { paddingLeft: 0, listStyleType: 'none' },
  listItem: { marginBottom: 8 },
  taskRow: { display: 'flex', alignItems: 'center' },
  label: { marginLeft: 8, flex: 1, cursor: 'pointer' },
  infoBox: { marginLeft: 12, color: 'gray', minWidth: 200, maxWidth: 250 },
  infoText: { marginLeft: 12, color: 'gray', whiteSpace: 'nowrap' },
  deleteButton: { marginLeft: 10, color: 'red', cursor: 'pointer', background: 'none', border: 'none' }
};

export default TaskList;
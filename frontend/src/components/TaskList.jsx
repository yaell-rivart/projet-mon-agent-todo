import React, { useEffect, useRef } from 'react';
import useLocalStorage from '../hook/useLocalStorage';

// Helpers
function parseDateUTC(dateStr) {
  let isoDate = dateStr.replace(' ', 'T');
  if (!isoDate.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(isoDate)) {
    isoDate += 'Z';
  }
  return new Date(isoDate);
}

function formatDateFr(dateStr) {
  const date = parseDateUTC(dateStr);
  const options = {weekday: 'long',year: 'numeric',month: 'long',day: 'numeric',
    hour: '2-digit',minute: '2-digit',hour12: false,timeZoneName: 'short'
  };
  return date.toLocaleDateString('fr-FR', options);
}

function isOverdue(dueDateStr) {
  const now = new Date();
  const dueDate = parseDateUTC(dueDateStr);
  return now > dueDate;
}

// Composant principal
const TaskList = ({ titre, taches, onToggleDone, onDeleteTask }) => {
  const [handledIds, setHandledIds] = useLocalStorage("handledTasks", []);
  const lastHandledRef = useRef(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!initializedRef.current) {
        initializedRef.current = true;
        return;
      }

      taches.forEach(task => {
        const due = task.next_due_date || task.period_end;
        if (!due) return;

        const isPeriodic = Boolean(task.periodicity);
        const overdue = isOverdue(due);

        if (isPeriodic && task.isDone && overdue && !handledIds.includes(task.id)) {
          onToggleDone(task.id);
          setHandledIds(prev => [...prev, task.id]);
          lastHandledRef.current.add(task.id);
          setTimeout(() => lastHandledRef.current.delete(task.id), 60 * 1000);
        }
      });
    }, 60000);

    return () => clearInterval(intervalId);
  }, [taches, onToggleDone, handledIds, setHandledIds]);

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

    if (isPeriodic && !task.isDone && lastHandledRef.current.has(task.id)) {
      return (
        <div style={styles.infoBox}>
          <div>Tâche accomplie (suivante)</div>
          {tempsRestant && <div>{tempsRestant}</div>}
          <div>{dateLimite}</div>
        </div>
      );
    }

    if (task.isDone) return null;

    if (isPeriodic) {
      if (overdue && missedCount > 0) {
        return (
          <div style={styles.infoBox}>
            <div>Attention, tâche ratée {missedCount} fois</div>
            {tempsRestant && <div>{tempsRestant}</div>}
            <div>{dateLimite}</div>
          </div>
        );
      }

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

  const deleteTask = (taskId) => {
    onDeleteTask(taskId);
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


// import React, { useEffect, useRef, useState } from 'react';
// import useLocalStorage from '../hook/useLocalStorage';

// function isOverdue(dueDateStr) {
//   return new Date() > new Date(dueDateStr);
// }

// const TaskList = ({ titre, taches, onToggleDone, onDeleteTask }) => {
//   const [handledIds, setHandledIds] = useLocalStorage('handledTasks', []);
//   const initialized = useRef(false);
  
//   // state interne pour forcer un rerender
//   const [, setTick] = useState(0);

//   useEffect(() => {
//     const intervalId = setInterval(() => {
//       if (!initialized.current) {
//         initialized.current = true;
//         return;
//       }

//       taches.forEach(task => {
//         const due = task.next_due_date || task.period_end;
//         if (!due || !task.isDone || !task.periodicity) return;

//         if (isOverdue(due) && !handledIds.includes(task.id)) {
//           onToggleDone(task.id);
//           setHandledIds(prev => [...prev, task.id]);
//         }
//       });

//       // Forcer le rerender chaque minute
//       setTick(t => t + 1);
//     }, 60000);

//     return () => clearInterval(intervalId);
//   }, [taches, onToggleDone, handledIds, setHandledIds]);

//   return (
//     <div>
//       <h3>{titre}</h3>
//       <ul>
//         {taches.map(t => (
//           <li key={t.id}>
//             <label>
//               <input
//                 type="checkbox"
//                 checked={t.isDone}
//                 onChange={() => onToggleDone(t.id)}
//               />
//               {t.description}
//             </label>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default TaskList;
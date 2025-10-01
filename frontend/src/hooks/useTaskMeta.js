// import { useMemo } from 'react';

// function parseDateUTC(dateStr) {
//   let isoDate = dateStr.replace(' ', 'T');
//   if (!isoDate.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(isoDate)) {
//     isoDate += 'Z';
//   }
//   return new Date(isoDate);
// }

// function isOverdue(dueDateStr) {
//   const now = new Date();
//   const dueDate = parseDateUTC(dueDateStr);
//   return now > dueDate;
// }

// function formatDateFr(dateStr) {
//   const date = parseDateUTC(dateStr);
//   const options = {
//     weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
//     hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short'
//   };
//   return date.toLocaleDateString('fr-BE', options);
// }

// export default function useTaskMeta(task) {
//   return useMemo(() => {
//     const dueDateStr = task.next_due_date || task.period_end;
//     const isDone = !!task.isDone;
//     const isPeriodic = Boolean(task.periodicity === true || task.periodicity === "true");
//     const tempsRestant = task.temps_restant
//       ? task.temps_restant.replace(/^Temps restant\s*:\s*/i, '').trim().replace(/^\d+\s*s(ec)?$/i, 'moins de 1 minute')
//       : null;

//     if (task.non_actif && !isDone) {
//       return {
//         type: 'inactive',
//         message: '⛔ Inactive maintenant (indisponibilité)',
//         tempsRestant,
//         dueDate: null,
//         overdue: false
//       };
//     }

//     if (!dueDateStr) {
//       return null;
//     }

//     const overdue = isOverdue(dueDateStr);
//     const dateLimite = formatDateFr(dueDateStr);

//     if (isDone) {
//       return null;
//     }

//     if (isPeriodic && !overdue) {
//       return {
//         type: 'periodic-upcoming',
//         tempsRestant,
//         dueDate: dateLimite,
//         overdue: false
//       };
//     }

//     if (!isPeriodic) {
//       return overdue
//         ? { type: 'one-shot-overdue', message: 'Tâche ratée', overdue: true }
//         : {
//           type: 'one-shot-upcoming',
//           tempsRestant,
//           dueDate: dateLimite,
//           overdue: false
//         };
//     }

//     return null;
//   }, [task]);
// }




// import useTaskMeta from './useTaskMeta';

// const renderTaskInfo = (task) => {
//   const meta = useTaskMeta(task);
//   if (!meta) return null;

//   if (meta.type === 'inactive') {
//     return (
//       <div style={styles.infoBox}>
//         <span style={{ color: 'orangered' }}>{meta.message}</span>
//       </div>
//     );
//   }

//   if (meta.type === 'one-shot-overdue') {
//     return <span style={styles.infoText}>{meta.message}</span>;
//   }

//   return (
//     <div style={styles.infoBox}>
//       {meta.tempsRestant && <div>Temps restant : {meta.tempsRestant}</div>}
//       {meta.dueDate && <div>Date limite : {meta.dueDate}</div>}
//     </div>
//   );
// };
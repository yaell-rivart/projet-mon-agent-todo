import React from 'react';

function IndispoItem({ indispo, onDelete }) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const formatted = date.toLocaleDateString('fr-BE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Europe/Brussels',
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const convertUTCHeureToBrussels = (dateStr, timeStr) => {
    if (!timeStr || !dateStr) return "";
    const [hours, minutes, seconds] = timeStr.split(":").map(Number);
    const utcDate = new Date(dateStr);
    utcDate.setUTCHours(hours, minutes, seconds || 0);

    return utcDate.toLocaleTimeString('fr-BE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Brussels',
    });
  };

  return (
    <li style={styles.item}>
      <div>
        <strong>{indispo.name || 'Sans nom'}</strong>
        <br />
        Du <em>
            {`${formatDate(indispo.start_time)}
            ${convertUTCHeureToBrussels(indispo.start_time, indispo.start_time_indispo)}`}
          </em><br />
        au <em>
            {`${formatDate(indispo.end_time)}
             ${convertUTCHeureToBrussels(indispo.end_time, indispo.end_time_indispo)}`}          
          </em>
      </div>
      {onDelete && (
        <button
          onClick={() => onDelete(indispo.id)}
          style={styles.deleteButton}
        >
          Supprimer
        </button>
      )}
    </li>
  );
}

const styles = {
  item: { 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    padding: '8px 0', borderBottom: '1px solid #ddd'
  },
  deleteButton: { 
    background: 'none', border: '1px solid red', color: 'red',
    padding: '4px 8px', cursor: 'pointer'
  }
};

export default IndispoItem;
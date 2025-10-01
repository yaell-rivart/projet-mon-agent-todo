import React, { useEffect } from 'react';
import useIndispos from '../../hooks/useIndispos';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import IndispoItem from './IndispoItem'; // ✅ Import du composant

function IndisposList({ refreshFlag }) {
  const { indispos, fetchIndispos } = useIndispos();
  useAutoRefresh(fetchIndispos, 60000);

  useEffect(() => {
    fetchIndispos();
  }, [refreshFlag, fetchIndispos]);

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/indispos/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      console.log("✅ Supprimé :", data.message);
      fetchIndispos(); // 🔁 Recharge la liste
    } catch (error) {
      console.error("❌ Erreur suppression :", error);
    }
  };
  return (
    <div style={{ marginTop: 20, border: "1px solid #ccc", padding: 10 }}>
      <h3>⛔ Périodes d’indisponibilité</h3>
      {indispos.length === 0 ? (
        <p>Aucune indisponibilité enregistrée.</p>
      ) : (
        <ul style={{ paddingLeft: 0, listStyleType: "none" }}>
          {indispos.map((indispo, index) => (
            <IndispoItem
              key={index}
              indispo={indispo}
              onDelete={handleDelete} // ✅ ICI
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default IndisposList;
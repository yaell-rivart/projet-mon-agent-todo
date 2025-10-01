import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
// Si tu veux garder les indispos même en cas de coupure backend :
import useLocalStorage from './useLocalStorage';

export default function useIndispos() {
  // Tu peux utiliser localStorage comme pour les tâches si tu veux
  const [indispos, setIndispos] = useLocalStorage("indispos", []);

  // récupere des données du server
  const fetchIndispos = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:8000/indispos");
      setIndispos(res.data.indisponibilites || []);
    } catch (err) {
      console.error("❌ Erreur lors du chargement des indisponibilités :", err);
    }
  }, [setIndispos]);

  useEffect(() => {
    fetchIndispos();
  }, [fetchIndispos]);

  // ajout des données en les envoyants dans le server
  const addIndispo = async (indispoData) => {
    try {
      const res = await axios.post("http://localhost:8000/indispos", indispoData);
      await fetchIndispos(); // rafraîchir après ajout
      return res.data;
    } catch (err) {
      console.error("❌ Erreur lors de l'ajout :", err);
      throw err;
    }
  };

  return {
    indispos,
    fetchIndispos,
    addIndispo,
  };
}

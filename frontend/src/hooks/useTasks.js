import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useLocalStorage from './useLocalStorage';

export default function useTasks() {
  // const [taches, setTaches] = useState([]);
  const [taches, setTaches] = useLocalStorage("taches", []);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:8000/tasks");
      const data = res.data;
      console.log("les taches", data)
      const tasksWithPeriodic = data.map(t => ({
        ...t,
        isPeriodic: t.isPeriodic ?? false
      }));

      setTaches(tasksWithPeriodic); // met à jour à la fois l’état ET le localStorage
    } catch (error) {
      console.error("❌ Erreur lors du chargement des tâches depuis l’API :", error);
      // Pas besoin de faire quoi que ce soit ici : taches reste tel quel (grâce à localStorage)
    }
  }, [setTaches]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);
  
  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`http://localhost:8000/tasks/${taskId}`);
      setTaches(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error("Erreur lors de la suppression de la tâche :", error);
    }
  };

  const toggleTaskStatus = async (taskId) => {
    try {
      const task = taches.find(t => t.id === taskId);
      const isDone = !task.isDone;
      await axios.put(`http://localhost:8000/tasks/${taskId}/done`, { done: isDone });
      setTaches(prev => prev.map(t => t.id === taskId ? { ...t, isDone } : t));
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la tâche :", error);
    }
  };

  return {
    taches,
    fetchTasks,
    handleDeleteTask,
    toggleTaskStatus
  };
}
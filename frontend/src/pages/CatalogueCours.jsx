import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function CatalogueCours() {
  const [courses, setCourses] = useState([]);
  const [message, setMessage] = useState('');

  // Charger les cours au démarrage
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/cours');
        setCourses(response.data);
      } catch (error) {
        console.error("Erreur chargement cours", error);
      }
    };
    fetchCourses();
  }, []);

  const handleInscription = async (coursId) => {
    try {
      const response = await api.post('/inscriptions', { cours_id: coursId });
      
      if (response.data.success) {
        alert("🎉 Inscription validée avec succès !");
        // Rafraîchir la liste pour mettre à jour les compteurs de places
        window.location.reload(); 
      } else {
        // Affiche le message d'erreur précis renvoyé par le PHP
        setMessage(response.data.error);
      }
    } catch (error) {
      setMessage("Erreur lors de la communication avec le serveur.");
    }
  };

  return (
    <div className="catalogue-container">
      <h2>Catalogue des cours</h2>
      {message && <div className="alert-box">{message}</div>}
      
      <div className="courses-grid">
        {courses.map(cours => (
          <div key={cours.id} className="course-card">
            <h3>{cours.titre}</h3>
            <p>Professeur : {cours.prof_nom}</p>
            <p>Places : {cours.places_occupees} / {cours.capacite_max}</p>
            
            {/* Bouton grisé si le cours est complet d'après la règle métier */}
            <button 
              onClick={() => handleInscription(cours.id)}
              disabled={cours.places_occupees >= cours.capacite_max}
              className={cours.places_occupees >= cours.capacite_max ? "btn-disabled" : "btn-active"}
            >
              {cours.places_occupees >= cours.capacite_max ? "Complet" : "S'inscrire"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './CatalogueCours.css'; // Import du style épuré

export default function CatalogueCours() {
  const [cours, setCours] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // 🔄 Chargement des cours depuis le PHP au démarrage de la page
  useEffect(() => {
    const fetchCours = async () => {
      try {
        const response = await api.get('/index.php');
        setCours(response.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des cours:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCours();
  }, []);

  // 🔍 Filtrage des cours en temps réel selon ce que tape l'étudiant
  const coursFiltres = cours.filter(c => 
    c.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.prof_nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'Georgia' }}>Chargement du pupitre académique...</div>;
  }

  return (
    <div className="catalogue-container">
      <div className="catalogue-header">
        <h1>Catalogue des Enseignements</h1>
        <p style={{ fontStyle: 'italic', color: '#666', fontSize: '14px' }}>Année Académique 2026 — Répétitions & Classes Terminales</p>
      </div>

      {/* Barre de recherche interactive */}
      <div className="search-container">
        <input 
          type="text" 
          placeholder="🔍 Rechercher une discipline ou un maître (ex: Piano, Bach...)" 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grille des cartes de cours */}
      <div className="courses-grid">
        {coursFiltres.map((c) => (
          <div key={c.id} className="course-card">
            <div>
              <div className="course-type">Cours {c.type_cours} • Semestre {c.semestre}</div>
              <h2 className="course-title">{c.titre}</h2>
              
              <div className="course-info">🎵 Maître de classe : <strong>Pr. {c.prenom} {c.prof_nom}</strong></div>
              <div className="course-info">🏛️ Lieu : <strong>{c.nom_salle}</strong></div>
              <div className="course-info">📅 Session : <strong>Jour {c.jour_semaine} • {c.heure_debut.substring(0, 5)} - {c.heure_fin.substring(0, 5)}</strong></div>
            </div>

            <div>
              <div className="course-info" style={{ marginTop: '15px', borderTop: '1px dashed #eee', paddingTop: '10px' }}>
                👥 Places occupées : <strong>{c.places_occupees} / {c.capacite_max}</strong>
              </div>
              <button className="register-button">
                Solliciter une inscription
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
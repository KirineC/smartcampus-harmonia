import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './CatalogueCours.css';

export default function CatalogueCours() {
  const [cours, setCours] = useState([]);
  const [mesInscriptions, setMesInscriptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [inscriptionLoading, setInscriptionLoading] = useState(null);

  const fetchCours = async () => {
    try {
      const response = await api.get('/index.php');
      setCours(response.data);
    } catch (err) {
      console.error("Erreur lors de la récupération des cours:", err);
      setMessage("Impossible de charger le catalogue des cours.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMesInscriptions = async () => {
    try {
      const response = await api.get('/index.php?mes_inscriptions=1');

      if (Array.isArray(response.data)) {
        setMesInscriptions(response.data);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des inscriptions:", err);
    }
  };

  useEffect(() => {
    fetchCours();
    fetchMesInscriptions();
  }, []);

  const handleInscription = async (coursId) => {
    setMessage('');
    setInscriptionLoading(coursId);

    try {
      const response = await api.post('/index.php', {
        cours_id: coursId
      });

      if (response.data.success) {
        setMessage('✅ Inscription validée avec succès.');
        await fetchCours();
        await fetchMesInscriptions();
      } else {
        setMessage(response.data.error || "Inscription impossible.");
      }
    } catch (err) {
      console.error("Erreur inscription:", err);

      if (err.response?.status === 401) {
        setMessage("⚠️ Vous devez être connecté pour vous inscrire.");
      } else {
        setMessage(err.response?.data?.error || "Erreur lors de l'inscription.");
      }
    } finally {
      setInscriptionLoading(null);
    }
  };

  const handleAnnulationInscription = async (coursId) => {
    setMessage('');
    setInscriptionLoading(coursId);

    try {
      const response = await api.post('/index.php', {
        action: 'annuler_inscription',
        cours_id: coursId
      });

      if (response.data.success) {
        setMessage('✅ Inscription annulée avec succès.');
        await fetchCours();
        await fetchMesInscriptions();
      } else {
        setMessage(response.data.error || "Annulation impossible.");
      }
    } catch (err) {
      console.error("Erreur annulation:", err);

      if (err.response?.status === 401) {
        setMessage("⚠️ Vous devez être connecté.");
      } else {
        setMessage(err.response?.data?.error || "Erreur lors de l'annulation.");
      }
    } finally {
      setInscriptionLoading(null);
    }
  };

  const coursFiltres = cours.filter(c =>
    c.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.prof_nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'Georgia' }}>
        Chargement du pupitre académique...
      </div>
    );
  }

  return (
    <div className="catalogue-container">
      <div className="catalogue-header">
        <h1>Catalogue des Enseignements</h1>
        <p style={{ fontStyle: 'italic', color: '#666', fontSize: '14px' }}>
          Année Académique 2026 — Répétitions & Classes Terminales
        </p>
      </div>

      {message && (
        <div style={{
          maxWidth: '700px',
          margin: '0 auto 25px auto',
          padding: '12px 16px',
          background: '#fff',
          border: '1px solid #ddd',
          borderLeft: '4px solid #d4af37',
          fontFamily: 'sans-serif',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      <div className="search-container">
        <input
          type="text"
          placeholder="🔍 Rechercher une discipline ou un maître (ex: Piano, Bach...)"
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="courses-grid">
        {coursFiltres.map((c) => {
          const coursComplet = Number(c.places_occupees) >= Number(c.capacite_max);
          const dejaInscrit = mesInscriptions.some(
            ins => Number(ins.cours_id) === Number(c.id)
          );

          return (
            <div key={c.id} className="course-card">
              <div>
                <div className="course-type">
                  Cours {c.type_cours} • Semestre {c.semestre}
                </div>

                <h2 className="course-title">{c.titre}</h2>

                <div className="course-info">
                  🎵 Maître de classe : <strong>Pr. {c.prenom} {c.prof_nom}</strong>
                </div>

                <div className="course-info">
                  🏛️ Lieu : <strong>{c.nom_salle}</strong>
                </div>

                <div className="course-info">
                  📅 Session : <strong>Jour {c.jour_semaine} • {c.heure_debut.substring(0, 5)} - {c.heure_fin.substring(0, 5)}</strong>
                </div>
              </div>

              <div>
                <div
                  className="course-info"
                  style={{
                    marginTop: '15px',
                    borderTop: '1px dashed #eee',
                    paddingTop: '10px'
                  }}
                >
                  👥 Places occupées : <strong>{c.places_occupees} / {c.capacite_max}</strong>
                </div>

                {dejaInscrit ? (
                  <button
                    className="register-button"
                    onClick={() => handleAnnulationInscription(c.id)}
                    disabled={inscriptionLoading === c.id}
                    style={{
                      backgroundColor: '#8b1e1e',
                      opacity: inscriptionLoading === c.id ? 0.7 : 1
                    }}
                  >
                    {inscriptionLoading === c.id ? 'Annulation...' : 'Annuler l’inscription'}
                  </button>
                ) : (
                  <button
                    className="register-button"
                    onClick={() => handleInscription(c.id)}
                    disabled={coursComplet || inscriptionLoading === c.id}
                    style={{
                      opacity: coursComplet ? 0.5 : 1,
                      cursor: coursComplet ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {coursComplet
                      ? 'Cours complet'
                      : inscriptionLoading === c.id
                        ? 'Inscription...'
                        : 'Solliciter une inscription'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
  
  // 🎯 Filtre de catégorie active
  const [activeFilter, setActiveFilter] = useState('tous');

  // Récupération de l'instrument majeur de l'élève connecté
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;
  const etudiantInstrument = user?.instrument_majeur || '';

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
        setMessage(response.data.message || "✅ Demande d’inscription envoyée au professeur.");
        await fetchCours();
        await fetchMesInscriptions();
      } else {
        setMessage(response.data.error || "Demande impossible.");
      }
    } catch (err) {
      console.error("Erreur inscription:", err);

      if (err.response?.status === 401) {
        setMessage("⚠️ Vous devez être connecté pour vous inscrire.");
      } else {
        setMessage(err.response?.data?.error || "Erreur lors de la demande d'inscription.");
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
        setMessage(response.data.message || '✅ Demande d’inscription annulée avec succès.');
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

  const getInscriptionPourCours = (coursId) => {
    return mesInscriptions.find(
      ins => Number(ins.cours_id) === Number(coursId)
    );
  };

  const getStatutStyle = (statut) => {
    if (!statut) return null;

    const statutLower = statut.toLowerCase();

    if (statutLower.includes('attente')) {
      return {
        label: '⏳ Demande en attente',
        background: '#fff7df',
        color: '#9a6200',
        border: '#d4af37'
      };
    }
    if (statutLower.includes('valid')) {
      return {
        label: '✅ Inscription acceptée',
        background: '#e8f5e9',
        color: '#137333',
        border: '#137333'
      };
    }
    if (statutLower.includes('refus')) {
      return {
        label: '❌ Demande refusée',
        background: '#fdecea',
        color: '#b3261e',
        border: '#b3261e'
      };
    }
    return {
      label: statut,
      background: '#f1f1f1',
      color: '#555',
      border: '#ccc'
    };
  };

  // Logique de filtrage combinée
  const coursFiltres = cours.filter(c => {
    const matchSearch = 
      c.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.prof_nom.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    if (activeFilter === 'autorises') {
      return !c.instrument_requis || (etudiantInstrument && c.instrument_requis.toLowerCase() === etudiantInstrument.toLowerCase());
    }
    if (activeFilter === 'individuel') {
      return c.type_cours.toLowerCase().includes('individuel');
    }
    if (activeFilter === 'ensemble') {
      return c.type_cours.toLowerCase().includes('ensemble') || c.type_cours.toLowerCase().includes('collectif');
    }

    return true; 
  });

  if (loading) {
    return (
      <div className="catalogue-loading">
        Chargement du pupitre académique...
      </div>
    );
  }

  return (
    <div className="catalogue-container">
      <div className="catalogue-header">
        <h1>Catalogue des Enseignements</h1>
        <p>
          Année Académique 2026 — Répétitions & Classes Terminales
        </p>
      </div>

      {message && (
        <div className="catalogue-message">
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

      <div className="filter-tabs-zone">
        <button 
          className={`filter-tab-btn ${activeFilter === 'tous' ? 'active' : ''}`}
          onClick={() => setActiveFilter('tous')}
        >
          Tous les cours ({cours.length})
        </button>
        <button 
          className={`filter-tab-btn ${activeFilter === 'autorises' ? 'active' : ''}`}
          onClick={() => setActiveFilter('autorises')}
        >
          🎻 Mon Pupitre Uniquement
        </button>
        <button 
          className={`filter-tab-btn ${activeFilter === 'individuel' ? 'active' : ''}`}
          onClick={() => setActiveFilter('individuel')}
        >
          🎼 Cours Individuels
        </button>
        <button 
          className={`filter-tab-btn ${activeFilter === 'ensemble' ? 'active' : ''}`}
          onClick={() => setActiveFilter('ensemble')}
        >
          👥 Ensembles & Collectifs
        </button>
      </div>

      <div className="courses-grid">
        {coursFiltres.map((c) => {
          const inscription = getInscriptionPourCours(c.id);
          const statutInfo = getStatutStyle(inscription?.statut_inscription);
          const coursComplet = Number(c.places_occupees) >= Number(c.capacite_max);

          const estEnAttente = inscription?.statut_inscription?.toLowerCase().includes('attente');
          const estValidee = inscription?.statut_inscription?.toLowerCase().includes('valid');
          const estRefusee = inscription?.statut_inscription?.toLowerCase().includes('refus');

          const isWrongInstrument = 
            c.instrument_requis && 
            etudiantInstrument && 
            c.instrument_requis.toLowerCase() !== etudiantInstrument.toLowerCase();

          return (
            <div
              key={c.id}
              className="course-card"
              style={{
                border: statutInfo ? `2px solid ${statutInfo.border}` : undefined,
                background: statutInfo ? statutInfo.background : undefined
              }}
            >
              <div className="course-card-content">
                <div className="course-type">
                  Cours {c.type_cours} • Semestre {c.semestre}
                </div>

                <h2 className="course-title">{c.titre}</h2>

                {statutInfo && (
                  <div
                    className="course-status-pill"
                    style={{
                      color: statutInfo.color,
                      borderColor: statutInfo.border
                    }}
                  >
                    {statutInfo.label}
                  </div>
                )}

                <div className="course-info">
                  🎵 Maître de classe : <strong>Pr. {c.prenom} {c.prof_nom}</strong>
                </div>

                <div className="course-info">
                  🎻 Pupitre requis :{' '}
                  <strong className={c.instrument_requis ? 'instrument-required' : ''}>
                    {c.instrument_requis || "Tous publics"}
                  </strong>
                </div>

                <div className="course-info">
                  🏛️ Lieu : <strong>{c.nom_salle}</strong>
                </div>

                <div className="course-info">
                  📅 Session :{' '}
                  <strong>
                    Jour {c.jour_semaine} • {c.heure_debut.substring(0, 5)} - {c.heure_fin.substring(0, 5)}
                  </strong>
                </div>
              </div>

              <div>
                <div
                  className="course-info"
                  style={{
                    marginTop: '15px',
                    borderTop: '1px dashed #ddd',
                    paddingTop: '10px',
                    marginBottom: '10px'
                  }}
                >
                  👥 Places occupées : <strong>{c.places_occupees || 0} / {c.capacite_max}</strong>
                </div>

                {estEnAttente && (
                  <button
                    className="register-button register-button-pending"
                    onClick={() => handleAnnulationInscription(c.id)}
                    disabled={inscriptionLoading === c.id}
                  >
                    {inscriptionLoading === c.id ? 'Annulation...' : 'Annuler la demande'}
                  </button>
                )}

                {estValidee && (
                  <div className="register-button accepted-inscription-badge" style={{ textAlign: 'center', backgroundColor: '#137333', color: '#fff', padding: '12px 0', borderRadius: '2px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Inscription acceptée
                  </div>
                )}

                {estRefusee && (
                  <button
                    className="register-button refused-inscription-button"
                    disabled
                  >
                    Demande refusée
                  </button>
                )}

                {!inscription && (
                  <button
                    className={`register-button ${isWrongInstrument ? 'disabled-rock' : ''}`}
                    onClick={() => !isWrongInstrument && handleInscription(c.id)}
                    disabled={coursComplet || isWrongInstrument || inscriptionLoading === c.id}
                    title={isWrongInstrument ? `Ce cours est exclusivement réservé au pupitre [${c.instrument_requis}]` : ''}
                  >
                    {isWrongInstrument
                      ? `Réservé aux ${c.instrument_requis}s`
                      : coursComplet
                        ? 'Cours complet'
                        : inscriptionLoading === c.id
                          ? 'Envoi de la demande...'
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
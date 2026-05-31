import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './MonPlanning.css';

export default function MonPlanning() {
  const [inscriptions, setInscriptions] = useState([]); // Pour l'étudiant
  const [coursSemaine, setCoursSemaine] = useState({}); // Pour l'enseignant/étudiant trié
  const [coursSelectionne, setCoursSelectionne] = useState(null); 
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const joursSemaine = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  // 🔐 1. Authentification globale
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/');
      return;
    }
    const userObj = JSON.parse(userData);
    setUser(userObj);

    if (userObj.role === 'enseignant') {
      chargerPlanningProf(userObj.id);
    }
  }, [navigate]);

  // 🔄 2. Partie ÉTUDIANT : Récupération et tri des cours
  useEffect(() => {
    const fetchInscriptions = async () => {
      try {
        setLoading(true);
        const response = await api.get('/index.php?mes_inscriptions=1');
        
        if (Array.isArray(response.data)) {
          // Dictionnaire de conversion chiffre -> texte
          const mapChiffreEnJour = { 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi' };
          
          const agencement = {};
          joursSemaine.forEach(j => agencement[j] = []);

          response.data.forEach(item => {
            const jourTextuel = mapChiffreEnJour[item.jour_semaine];
            if (agencement[jourTextuel]) {
              agencement[jourTextuel].push({
                id: item.cours_id,
                titre: item.titre, 
                code: item.nom_salle || 'Studio', 
                type: item.type_cours || 'Collectif', 
                debut: item.heure_debut ? item.heure_debut.substring(0, 5) : '00:00',
                fin: item.heure_fin ? item.heure_fin.substring(0, 5) : '00:00',
                prof: item.prof_nom ? `Pr. ${item.prof_prenom} ${item.prof_nom}` : 'Maître Indisponible',
                max: item.capacite_max,
                inscrits: item.inscrits_actifs,
                statut_inscription: item.statut_inscription, 
                statut_cours: item.cours_statut || 'Actif' // 🎯 Reçoit directement le statut du PHP
              });
            }
          });

          // Tri chronologique des heures
          Object.keys(agencement).forEach(j => {
            agencement[j].sort((a, b) => a.debut.localeCompare(b.debut));
          });

          setCoursSemaine(agencement);
        }
      } catch (err) {
        console.error(err);
        setError('Le registre des partitions est momentanément inaccessible.');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'etudiant') {
      fetchInscriptions();
    }
  }, [user]);

  // 👨‍🏫 3. Partie ENSEIGNANT : Récupération et tri des cours
  const chargerPlanningProf = async (profUserId) => {
    if (!profUserId) return;
    try {
      setLoading(true);
      setError(''); 
      const response = await api.get(`/index.php?liste_eleves_prof=${profUserId}`);
      if (response.data && response.data.success) {
        const agencement = {};
        joursSemaine.forEach(j => agencement[j] = []);

        const mapChiffreEnJour = { 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi' };
        const coursVisites = new Set();
        
        response.data.etudiants.forEach(item => {
          const cleUnique = `${item.cours_id}-${item.jour_semaine}-${item.heure_debut}`;
          if (!coursVisites.has(cleUnique) && item.jour_semaine) {
            coursVisites.add(cleUnique);
            const jourTextuel = mapChiffreEnJour[item.jour_semaine];

            if (agencement[jourTextuel]) {
              agencement[jourTextuel].push({
                id: item.cours_id,
                titre: item.cours,
                code: item.code_cours || 'HAR-90',
                type: item.type_cours || 'Masterclass',
                debut: item.heure_debut ? item.heure_debut.substring(0, 5) : '00:00',
                fin: item.heure_fin ? item.heure_fin.substring(0, 5) : '00:00',
                max: item.capacite_max,
                inscrits: item.inscrits_actifs,
                statut_cours: item.cours_statut || 'Actif'
              });
            }
          }
        });

        Object.keys(agencement).forEach(j => {
          agencement[j].sort((a, b) => a.debut.localeCompare(b.debut));
        });

        setCoursSemaine(agencement);
      }
    } catch (err) {
      console.error(err);
      setError("Impossible de charger l'emploi du temps.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="conservatoire-loading">Chargement du pupitre...</div>;

  return (
    <div className="harmonia-art-wrapper">
      
      {/* ============================================================ */}
      {/* EN-TÊTE ADAPTATIVE UNIQUE                                    */}
      {/* ============================================================ */}
      <header className="art-header">
        <div className="brand-block">
          <span className="sc-tag">SMARTCAMPUS // HARMONIA</span>
          <h1 className="main-art-title">
            {user?.role === 'etudiant' ? "Mon Registre d'Études" : "Votre Chaire d'Enseignement"}
          </h1>
          <p className="student-signature">
            {user?.role === 'etudiant' 
              ? `Pupitre virtuel de ${user?.prenom} — Session Académique` 
              : `Planification hebdomadaire des cours du Pr. ${user?.nom}`}
          </p>
        </div>
        {user?.role === 'etudiant' && (
          <div className="quick-actions">
            <button className="minimal-btn" onClick={() => navigate('/catalogue')}>
              + Solliciter une Masterclass
            </button>
          </div>
        )}
      </header>

      {error && <div className="art-error">{error}</div>}

      {/* ============================================================ */}
      {/* LA GRILLE DE PUPITRE UNIFIÉE (ÉTUDIANT & ENSEIGNANT)         */}
      {/* ============================================================ */}
      <div className="grille-pupitre">
        {joursSemaine.map(jour => (
          <div key={jour} className="colonne-jour">
            <div className="titre-jour">{jour}</div>
            <div className="liste-cours-jour">
              
              {coursSemaine[jour]?.map(c => {
                const estEtudiant = user?.role === 'etudiant';
                const estRevoque = c.statut_cours === 'Révoqué';

                return (
                  <div 
                    key={c.id} 
                    className={`carte-cours-planning ${coursSelectionne?.id === c.id ? 'selectionnee' : ''}`}
                    style={estRevoque ? { opacity: 0.4, backgroundColor: '#f5f4f0', borderLeft: '3px solid #b3261e', cursor: 'not-allowed' } : {}}
                    onClick={() => setCoursSelectionne(c)}
                  >
                    <span className="type-cours-tag" style={estRevoque ? { background: '#b3261e', color: '#fff' } : {}}>{c.type}</span>
      
                    <h4>{c.titre} {estRevoque && <span style={{ color: '#b3261e', fontSize: '12px', display: 'block', marginTop: '2px' }}>❌ (Chaire Annulée)</span>}</h4>
      
                    <div className="horaire-cours">{c.debut} — {c.fin}</div>
      
                    <div className="footer-cours-planning">
                      {estEtudiant ? (
                        <>
                          <div style={{ marginBottom: '6px', color: '#666' }}>📍 {c.code}</div>
                          <span className={`status-dot ${estRevoque ? 'annule' : (c.statut_inscription === 'Validée' ? 'approved' : 'pending')}`} style={estRevoque ? { background: '#b3261e', color: '#fff', fontSize: '9px', padding: '2px 6px' } : { fontSize: '9px', padding: '2px 6px' }}>
                            {estRevoque ? 'Annulé par l\'Admin' : (c.statut_inscription === 'Validée' ? 'Confirmé' : 'En attente')}
                          </span>
                        </>
                      ) : (
                        <>
                          {estRevoque ? (
                            <span style={{ color: '#b3261e', fontSize: '11px', fontWeight: '600' }}>Cours révoqué par le Secrétariat</span>
                          ) : (
                            <>📍 Salle {c.code} • <span style={{ color: '#a39264' }}>{c.inscrits}/{c.max} él.</span></>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {(!coursSemaine[jour] || coursSemaine[jour].length === 0) && (
                <div className="case-vide-planning">Aucun enseignement</div>
              )}

            </div>
          </div>
        ))}
      </div>

      {/* ============================================================ */}
      {/* LE TIROIR DE DÉTAIL COMMUN OPTIMISÉ                          */}
      {/* ============================================================ */}
      {coursSelectionne && (
        <div className="tiroir-details-planning animate-fade">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <span className="sc-tag" style={{ color: '#a39264' }}>Fiche de Séance</span>
              <h2 style={{ fontFamily: 'Georgia', fontWeight: 'normal', margin: '5px 0' }}>{coursSelectionne.titre}</h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Type : {coursSelectionne.type} • {user?.role === 'etudiant' ? `Lieu : ${coursSelectionne.code}` : `Salle ${coursSelectionne.code}`}</p>
            </div>
            <button className="close-tiroir-btn" onClick={() => setCoursSelectionne(null)}>✕</button>
          </div>

          <div style={{ marginTop: '20px', background: '#fcfbfa', padding: '15px', border: '1px solid #eae9e4' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>⏰ Horaires : <strong>{coursSelectionne.debut} à {coursSelectionne.fin}</strong></p>
            
            {user?.role === 'etudiant' ? (
              <p style={{ margin: 0, fontSize: '14px' }}>👨‍🏫 Maître de Conférence : <strong>{coursSelectionne.prof}</strong></p>
            ) : (
              <>
                <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>👥 Inscrits : <strong>{coursSelectionne.inscrits} / {coursSelectionne.max} places</strong></p>
                <button onClick={() => navigate('/enseignant/inscriptions')} className="minimal-btn" style={{ width: '100%', fontSize: '12px', padding: '10px' }}>
                  📄 Ouvrir le registre pour faire l'appel
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
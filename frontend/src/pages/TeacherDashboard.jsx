import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './TeacherDashboard.css';

export default function TeacherDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('classes');
  const [etudiants, setEtudiants] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/');
      return;
    }
    const userObj = JSON.parse(userData);
    if (userObj.role !== 'enseignant' && userObj.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    setUser(userObj);
    chargerElevesDuProf(userObj.id);
  }, [navigate]);

  const chargerElevesDuProf = async (profUserId) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const response = await api.get(`/index.php?liste_eleves_prof=${profUserId}`);
      if (response.data && response.data.success) {
        setEtudiants(response.data.etudiants || []);
      } else {
        setErrorMsg(response.data.error || "Impossible de charger le registre.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Erreur de liaison avec le secrétariat numérique.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccepterInscription = async (inscriptionId) => {
    if (!user) return;
    setActionLoading(inscriptionId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await api.post('/index.php', {
        action: 'valider_inscription',
        inscription_id: inscriptionId
      });

      if (response.data && response.data.success) {
        setSuccessMsg("✅ L'étudiant a été inscrit officiellement à votre classe.");
        await chargerElevesDuProf(user.id);
      } else {
        setErrorMsg(response.data.error || "Validation impossible.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Erreur lors de la validation de l'inscription.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSupprimerInscription = async (inscriptionId, typeAction = 'refuser') => {
    if (!user) return;
    setActionLoading(inscriptionId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await api.post('/index.php', {
        action: 'revoquer_inscription',
        inscription_id: inscriptionId
      });

      if (response.data && response.data.success) {
        if (typeAction === 'revoquer') {
          setSuccessMsg("❌ L'inscription a été révoquée du registre.");
        } else {
          setSuccessMsg("❌ La demande d'inscription a été refusée.");
        }
        await chargerElevesDuProf(user.id);
      } else {
        setErrorMsg(response.data.error || "Action impossible.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Erreur lors de l'action sur l'inscription.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleNoteChange = (inscriptionId, valeur) => {
    setEtudiants(prev => prev.map(et => et.inscription_id === inscriptionId ? { ...et, note: valeur } : et));
  };

  const handlePublierNotes = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    const validStudents = etudiants.filter(et => et.statut?.toLowerCase().includes('valid'));

    const notesAEnvoyer = validStudents
      .filter(et => et.note !== null && et.note !== '')
      .map(et => ({
        inscription_id: et.inscription_id,
        note: et.note
      }));

    if (notesAEnvoyer.length === 0) {
      alert("Aucune note saisie dans le tableau. Veuillez taper une note avant de publier.");
      return;
    }

    try {
      const response = await api.post('/index.php', {
        action: 'publier_notes',
        notes: notesAEnvoyer
      });

      if (response.data && response.data.success) {
        setSuccessMsg("✨ Les notes ont été publiées officiellement sur les bulletins des étudiants !");
        await chargerElevesDuProf(user.id);
      } else {
        setErrorMsg(response.data.error || "Erreur lors de la publication.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Impossible de transmettre les notes au rectorat numérique.");
    }
  };

  // 🖨️ Fonction magique pour générer et imprimer la feuille d'émargement en PDF
  const handleImprimerEmargement = (coursTitre) => {
    // 1. On filtre uniquement les élèves VALIDÉS pour ce cours précis
    const elevesDuCours = inscriptionsValidees.filter(et => et.cours === coursTitre);

    if (elevesDuCours.length === 0) {
      alert("Aucun étudiant n'est encore validé dans ce cours pour générer une feuille d'émargement.");
      return;
    }

    const dateDuJour = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // 2. On crée le contenu HTML de la page blanche d'émargement (Style Haute Couture / Quiet Luxury)
    const contenuImpression = `
      <html>
        <head>
          <title>Feuille d'émargement - ${coursTitre}</title>
          <style>
            @media print {
              @page { size: A4; margin: 20mm; }
            }
            body {
              font-family: 'Georgia', serif;
              color: #111111;
              background-color: #ffffff;
              margin: 0;
              padding: 0;
            }
            .header-emargement {
              text-align: center;
              border-bottom: 2px solid #d4af37;
              padding-bottom: 20px;
              margin-bottom: 40px;
            }
            .logo-main {
              font-size: 24px;
              letter-spacing: 4px;
              font-weight: normal;
              margin-bottom: 10px;
            }
            .subtitle {
              font-size: 10px;
              font-family: sans-serif;
              text-transform: uppercase;
              letter-spacing: 2px;
              color: #666;
            }
            .meta-info {
              margin-bottom: 30px;
              font-size: 14px;
              line-height: 1.6;
            }
            .meta-line { margin-bottom: 6px; }
            .meta-label { font-weight: bold; color: #a39264; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #cccccc;
              padding: 12px 15px;
              text-align: left;
              font-size: 13px;
            }
            th {
              background-color: #fcfbfa;
              font-family: sans-serif;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #333;
            }
            .col-num { width: 5%; text-align: center; color: #888; }
            .col-nom { width: 45%; font-weight: bold; }
            .col-signature { width: 50%; height: 45px; } /* Case haute pour laisser la place de signer */
            .footer-page {
              position: fixed;
              bottom: 0;
              width: 100%;
              text-align: center;
              font-size: 10px;
              font-family: sans-serif;
              color: #999;
              border-top: 1px solid #eee;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header-emargement">
            <div class="logo-main">H A R M O N I A</div>
            <div class="subtitle">Conservatoire National Supérieur • Feuille d'Émargement Officielle</div>
          </div>

          <div class="meta-info">
            <div class="meta-line"><span class="meta-label">Enseignement :</span> ${coursTitre}</div>
            <div class="meta-line"><span class="meta-label">Maître de Chaire :</span> Pr. ${user?.prenom} ${user?.nom}</div>
            <div class="meta-line"><span class="meta-label">Séance du :</span> ${dateDuJour}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th class="col-num">N°</th>
                <th class="col-nom">Nom & Prénom de l'Étudiant</th>
                <th>Émargement / Signature</th>
              </tr>
            </thead>
            <tbody>
              ${elevesDuCours.map((et, index) => `
                <tr>
                  <td class="col-num">${index + 1}</td>
                  <td class="col-nom">${et.nom.toUpperCase()} ${et.prenom}</td>
                  <td class="col-signature"></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer-page">
            Document généré via le Secrétariat Numérique Harmonia • Page 1 sur 1
          </div>

          <script>
            // Lance l'impression dès que la page est prête, puis ferme la fenêtre éphémère
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `;

    // 3. On ouvre un onglet masqué, on injecte le HTML et le navigateur propose instantanément d'enregistrer en PDF !
    const fenetreImpression = window.open('', '_blank', 'width=800,height=600');
    fenetreImpression.document.write(contenuImpression);
    fenetreImpression.document.close();
  };

  const demandesEnAttente = etudiants.filter(et => et.statut?.toLowerCase().includes('attente'));
  const inscriptionsValidees = etudiants.filter(et => et.statut?.toLowerCase().includes('valid'));

  // 🎨 Composant interne réutilisable pour afficher la jauge "Quiet Luxury"
  const RenderJaugeCapacite = ({ inscritsActifs, capaciteMax }) => {
    const inscrits = parseInt(inscritsActifs) || 0;
    const max = parseInt(capaciteMax) || 20; 
    const estPlein = inscrits >= max;
    const pourcentage = Math.min((inscrits / max) * 100, 100);

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
        <div style={{ width: '100px', height: '6px', backgroundColor: '#eae9e4', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${pourcentage}%`, 
            height: '100%', 
            backgroundColor: estPlein ? '#b3261e' : '#d4af37', 
            transition: 'width 0.3s ease' 
          }} />
        </div>
        <span style={{ fontSize: '11px', color: estPlein ? '#b3261e' : '#666', fontFamily: 'sans-serif' }}>
          {inscrits}/{max} places
        </span>
      </div>
    );
  };

  if (loading) {
    return <div className="conservatoire-loading">Ouverture du Registre des Maîtres...</div>;
  }

  return (
    <div className="teacher-wrapper">
      <section className="teacher-welcome">
        <div>
          <span className="sc-tag">CONSERVATOIRE NATIONAL SUPÉRIEUR • REGISTRE DES MAÎTRES</span>
          <h1 className="teacher-title">Bienvenue, Maître {user?.prenom} {user?.nom}</h1>
          <p className="teacher-status">Gestion pédagogique de vos chaires d'enseignements</p>

          {successMsg && <div style={{ marginTop: '16px', padding: '12px 16px', background: '#e8f5e9', border: '1px solid #137333', color: '#137333', fontFamily: 'sans-serif', fontSize: '14px', maxWidth: '620px' }}>{successMsg}</div>}
          {errorMsg && <div style={{ marginTop: '16px', padding: '12px 16px', background: '#fdecea', border: '1px solid #b3261e', color: '#b3261e', fontFamily: 'sans-serif', fontSize: '14px', maxWidth: '620px' }}>{errorMsg}</div>}
        </div>

        <div className="teacher-tabs">
          <button className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`} onClick={() => setActiveTab('classes')}>
            🎻 Vos Classes & Inscriptions
          </button>
          <button className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
            📊 Saisie des Notes
          </button>
        </div>
      </section>

      <div className="teacher-content">
        {activeTab === 'classes' && (
          <div className="teacher-card animate-fade">
            <h2>Demandes d’inscription à vos cours</h2>
            <p className="card-sub">Validez ou refusez les demandes envoyées par les étudiants.</p>

            <table className="chic-table">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Cours & Remplissage</th>
                  <th>Statut</th>
                  <th>Actions pédagogiques</th>
                </tr>
              </thead>
              <tbody>
                {demandesEnAttente.map(et => {
                  const estPlein = (parseInt(et.inscrits_actifs) || 0) >= (parseInt(et.capacite_max) || 20);
                  return (
                    <tr key={et.inscription_id}>
                      <td>
                        <strong>{et.prenom} {et.nom}</strong>
                        {et.courriel && <div style={{ fontSize: '12px', color: '#777', marginTop: '4px' }}>{et.courriel}</div>}
                      </td>
                      <td>
                        <div style={{ fontWeight: '500' }}>{et.cours}</div>
                        <RenderJaugeCapacite inscritsActifs={et.inscrits_actifs} capaciteMax={et.capacite_max} />
                      </td>
                      <td><span className="status-badge en-attente">{et.statut}</span></td>
                      <td>
                        <button 
                          className="action-btn-valid" 
                          onClick={() => handleAccepterInscription(et.inscription_id)} 
                          disabled={actionLoading === et.inscription_id || estPlein}
                          style={estPlein ? { backgroundColor: '#ccc', cursor: 'not-allowed', color: '#fff' } : {}}
                        >
                          {actionLoading === et.inscription_id ? 'Traitement...' : estPlein ? 'Complet' : 'Accepter'}
                        </button>
                        <button className="action-btn-delete" onClick={() => handleSupprimerInscription(et.inscription_id, 'refuser')} disabled={actionLoading === et.inscription_id}>
                          {actionLoading === et.inscription_id ? 'Traitement...' : 'Refuser'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {demandesEnAttente.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', fontStyle: 'italic', color: '#888', padding: '30px' }}>Aucune demande d’inscription en attente.</td></tr>
                )}
              </tbody>
            </table>

            <h2 style={{ marginTop: '45px' }}>Étudiants validés</h2>
            <p className="card-sub">Liste des étudiants officiellement inscrits à vos cours.</p>

            {/* 🖨️ Bandeau chic pour générer les feuilles d'émargement PDF */}
            {inscriptionsValidees.length > 0 && (
              <div style={{ 
                background: '#fcfbfa', 
                border: '1px solid #eae9e4', 
                padding: '16px', 
                borderRadius: '4px', 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                flexWrap: 'wrap'
              }}>
                <span style={{ fontFamily: 'Georgia', fontSize: '13px', color: '#111', fontStyle: 'italic' }}>
                  Émargements de cours :
                </span>
                {[...new Set(inscriptionsValidees.map(et => et.cours))].map(coursTitre => (
                  <button
                    key={coursTitre}
                    onClick={() => handleImprimerEmargement(coursTitre)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #d4af37',
                      color: '#111111',
                      padding: '6px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      borderRadius: '2px',
                      fontFamily: 'sans-serif',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => { e.target.style.background = '#fcfbfa'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
                    onMouseOut={(e) => { e.target.style.background = '#ffffff'; e.target.style.boxShadow = 'none'; }}
                  >
                    📄 Imprimer la liste : {coursTitre}
                  </button>
                ))}
              </div>
            )}

            <table className="chic-table">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Cours & Remplissage</th>
                  <th>Statut</th>
                  <th>Actions pédagogiques</th>
                </tr>
              </thead>
              <tbody>
                {inscriptionsValidees.map(et => (
                  <tr key={et.inscription_id}>
                    <td>
                      <strong>{et.prenom} {et.nom}</strong>
                      {et.courriel && <div style={{ fontSize: '12px', color: '#777', marginTop: '4px' }}>{et.courriel}</div>}
                    </td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{et.cours}</div>
                      <RenderJaugeCapacite inscritsActifs={et.inscrits_actifs} capaciteMax={et.capacite_max} />
                    </td>
                    <td><span className="status-badge validé">{et.statut}</span></td>
                    <td>
                      <button className="action-btn-delete" onClick={() => handleSupprimerInscription(et.inscription_id, 'revoquer')} disabled={actionLoading === et.inscription_id}>
                        {actionLoading === et.inscription_id ? 'Traitement...' : 'Révoquer'}
                      </button>
                    </td>
                  </tr>
                ))}
                {inscriptionsValidees.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', fontStyle: 'italic', color: '#888', padding: '30px' }}>Aucun étudiant validé pour vos cours actuellement.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="teacher-card animate-fade">
            <h2>Saisie des Évaluations</h2>
            <p className="card-sub">Attribuez les notes de vos élèves validés.</p>

            <table className="chic-table">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Cours</th>
                  <th>Note de l'Audition (/20)</th>
                </tr>
              </thead>
              <tbody>
                {inscriptionsValidees.map(et => (
                  <tr key={et.inscription_id}>
                    <td>{et.prenom} {et.nom}</td>
                    <td>{et.cours}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        className="chic-note-input"
                        value={et.note || ''}
                        onChange={(e) => handleNoteChange(et.inscription_id, e.target.value)}
                        placeholder="Non noté"
                      />
                    </td>
                  </tr>
                ))}
                {inscriptionsValidees.length === 0 && (
                  <tr><td colSpan="3" style={{ textAlign: 'center', fontStyle: 'italic', color: '#888', padding: '30px' }}>Aucun étudiant validé disponible pour la saisie des notes.</td></tr>
                )}
              </tbody>
            </table>
            
            <button className="teacher-btn-dark" style={{ marginTop: '20px' }} onClick={handlePublierNotes}>
              Confirmer et publier les notes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
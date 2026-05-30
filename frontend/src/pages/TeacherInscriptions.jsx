import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './TeacherDashboard.css';

export default function TeacherInscriptions() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [etudiants, setEtudiants] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/'); return; }
    const userObj = JSON.parse(userData);
    setUser(userObj);
    chargerEleves(userObj.id);
  }, []);

  const chargerEleves = async (profUserId) => {
    try {
      setLoading(true);
      const response = await api.get(`/index.php?liste_eleves_prof=${profUserId}`);
      if (response.data && response.data.success) {
        setEtudiants(response.data.etudiants || []);
      }
    } catch (err) {
      setErrorMsg("Impossible de joindre le secrétariat numérique.");
    } finally { setLoading(false); }
  };

  const handleAccepterInscription = async (inscriptionId) => {
    setActionLoading(inscriptionId);
    try {
      const response = await api.post('/index.php', { action: 'valider_inscription', inscription_id: inscriptionId });
      if (response.data && response.data.success) {
        setSuccessMsg("✅ L'étudiant a été inscrit officiellement.");
        await chargerEleves(user.id);
      }
    } catch (err) { setErrorMsg("Erreur lors de la validation."); }
    finally { setActionLoading(null); }
  };

  const handleSupprimerInscription = async (inscriptionId, typeAction) => {
    setActionLoading(inscriptionId);
    try {
      await api.post('/index.php', { action: 'revoquer_inscription', inscription_id: inscriptionId });
      setSuccessMsg(typeAction === 'revoquer' ? "❌ Inscription révoquée." : "❌ Demande refusée.");
      await chargerEleves(user.id);
    } catch (err) { setErrorMsg("Erreur système."); }
    finally { setActionLoading(null); }
  };

  const handleImprimerEmargement = (coursTitre) => {
    const elevesDuCours = inscriptionsValidees.filter(et => et.cours === coursTitre);
    if (elevesDuCours.length === 0) { alert("Aucun étudiant validé."); return; }
    const dateDuJour = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const contenuImpression = `
      <html>
        <head>
          <title>Feuille d'émargement - ${coursTitre}</title>
          <style>
            body { font-family: 'Georgia', serif; padding: 40px; color: #111; }
            .header { text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 20px; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 12px; text-align: left; }
            th { background-color: #fcfbfa; font-family: sans-serif; font-size: 11px; text-transform: uppercase; }
            .col-sig { height: 45px; }
          </style>
        </head>
        <body>
          <div class="header"><h2>H A R M O N I A</h2><p>Feuille d'Émargement Officielle</p></div>
          <p><strong>Cours :</strong> ${coursTitre} | <strong>Maître :</strong> Pr. ${user?.prenom} ${user?.nom} | <strong>Date :</strong> ${dateDuJour}</p>
          <table>
            <thead><tr><th>N°</th><th>Nom & Prénom</th><th>Signature</th></tr></thead>
            <tbody>
              ${elevesDuCours.map((et, i) => `<tr><td>${i+1}</td><td><strong>${et.nom.toUpperCase()}</strong> ${et.prenom}</td><td class="col-sig"></td></tr>`).join('')}
            </tbody>
          </table>
          <script>window.onload = function() { window.print(); window.close(); };</script>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    win.document.write(contenuImpression);
    win.document.close();
  };

  const demandesEnAttente = etudiants.filter(et => et.statut?.toLowerCase().includes('attente'));
  const inscriptionsValidees = etudiants.filter(et => et.statut?.toLowerCase().includes('valid'));

  const RenderJaugeCapacite = ({ inscritsActifs, capaciteMax }) => {
    const inscrits = parseInt(inscritsActifs) || 0;
    const max = parseInt(capaciteMax) || 20;
    const estPlein = inscrits >= max;
    const pourcentage = Math.min((inscrits / max) * 100, 100);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
        <div style={{ width: '100px', height: '6px', backgroundColor: '#eae9e4', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${pourcentage}%`, height: '100%', backgroundColor: estPlein ? '#b3261e' : '#d4af37', transition: 'width 0.3s ease' }} />
        </div>
        <span style={{ fontSize: '11px', color: estPlein ? '#b3261e' : '#666' }}>{inscrits}/{max} places</span>
      </div>
    );
  };

  if (loading) return <div className="conservatoire-loading">Chargement des pupitres...</div>;

  return (
    <div className="teacher-wrapper" style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <button onClick={() => navigate('/enseignant/dashboard')} className="logout-btn" style={{ marginBottom: '20px', border: '1px solid #eae9e4' }}>
        ← Retour au Registre
      </button>

      <h1 style={{ fontFamily: 'Georgia', fontWeight: 'normal', marginBottom: '30px' }}>Gestion des Classes & Inscriptions</h1>
      
      {successMsg && <div style={{ background: '#e8f5e9', border: '1px solid #137333', color: '#137333', padding: '12px', marginBottom: '20px' }}>{successMsg}</div>}

      <div className="teacher-card">
        <h2>Demandes d’inscription en attente</h2>
        <table className="chic-table">
          <thead><tr><th>Étudiant</th><th>Cours & Remplissage</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            {demandesEnAttente.map(et => {
              const estPlein = (parseInt(et.inscrits_actifs) || 0) >= (parseInt(et.capacite_max) || 20);
              return (
                <tr key={et.inscription_id}>
                  <td><strong>{et.prenom} {et.nom}</strong></td>
                  <td><div>{et.cours}</div><RenderJaugeCapacite inscritsActifs={et.inscrits_actifs} capaciteMax={et.capacite_max} /></td>
                  <td><span className="status-badge en-attente">{et.statut}</span></td>
                  <td>
                    <button className="action-btn-valid" onClick={() => handleAccepterInscription(et.inscription_id)} disabled={estPlein}>Accepter</button>
                    <button className="action-btn-delete" onClick={() => handleSupprimerInscription(et.inscription_id, 'refuser')}>Refuser</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="teacher-card" style={{ marginTop: '40px' }}>
        <h2>Étudiants validés</h2>
        
        {inscriptionsValidees.length > 0 && (
          <div style={{ background: '#fcfbfa', padding: '12px', border: '1px solid #eae9e4', marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontStyle: 'italic', fontSize: '13px' }}>Feuilles d'appel :</span>
            {[...new Set(inscriptionsValidees.map(et => et.cours))].map(c => (
              <button key={c} onClick={() => handleImprimerEmargement(c)} style={{ background: '#fff', border: '1px solid #d4af37', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}>📄 {c}</button>
            ))}
          </div>
        )}

        <table className="chic-table">
          <thead><tr><th>Étudiant</th><th>Cours & Remplissage</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            {inscriptionsValidees.map(et => (
              <tr key={et.inscription_id}>
                <td><strong>{et.prenom} {et.nom}</strong></td>
                <td><div>{et.cours}</div><RenderJaugeCapacite inscritsActifs={et.inscrits_actifs} capaciteMax={et.capacite_max} /></td>
                <td><span className="status-badge validé">{et.statut}</span></td>
                <td><button className="action-btn-delete" onClick={() => handleSupprimerInscription(et.inscription_id, 'revoquer')}>Révoquer</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
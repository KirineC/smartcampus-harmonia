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
        action: 'accepter_inscription',
        inscription_id: inscriptionId
      });

      if (response.data.success) {
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

  const handleSupprimerInscription = async (inscriptionId) => {
    if (!user) return;

    setActionLoading(inscriptionId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await api.post('/index.php', {
        action: 'refuser_inscription',
        inscription_id: inscriptionId
      });

      if (response.data.success) {
        setSuccessMsg("❌ La demande d'inscription a été refusée.");
        await chargerElevesDuProf(user.id);
      } else {
        setErrorMsg(response.data.error || "Refus impossible.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Erreur lors du refus de l'inscription.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleNoteChange = (etudiantId, valeur) => {
    setEtudiants(prev =>
      prev.map(et =>
        et.etudiant_id === etudiantId
          ? { ...et, note: valeur }
          : et
      )
    );
  };

  const demandesEnAttente = etudiants.filter(et =>
    et.statut?.toLowerCase().includes('attente')
  );

  const inscriptionsValidees = etudiants.filter(et =>
    et.statut?.toLowerCase().includes('valid')
  );

  const autresInscriptions = etudiants.filter(et =>
    !et.statut?.toLowerCase().includes('attente') &&
    !et.statut?.toLowerCase().includes('valid')
  );

  if (loading) {
    return <div className="conservatoire-loading">Ouverture du Registre des Maîtres...</div>;
  }

  return (
    <div className="teacher-wrapper">
      <section className="teacher-welcome">
        <div>
          <span className="sc-tag">CONSERVATOIRE NATIONAL SUPÉRIEUR • REGISTRE DES MAÎTRES</span>
          <h1 className="teacher-title">
            Bienvenue, Maître {user?.prenom} {user?.nom}
          </h1>
          <p className="teacher-status">
            Gestion pédagogique de vos chaires d'enseignements
          </p>

          {successMsg && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                background: '#e8f5e9',
                border: '1px solid #137333',
                color: '#137333',
                fontFamily: 'sans-serif',
                fontSize: '14px',
                maxWidth: '620px'
              }}
            >
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                background: '#fdecea',
                border: '1px solid #b3261e',
                color: '#b3261e',
                fontFamily: 'sans-serif',
                fontSize: '14px',
                maxWidth: '620px'
              }}
            >
              {errorMsg}
            </div>
          )}
        </div>

        <div className="teacher-tabs">
          <button
            className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
            onClick={() => setActiveTab('classes')}
          >
            🎻 Vos Classes & Inscriptions
          </button>

          <button
            className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            📊 Saisie des Notes
          </button>
        </div>
      </section>

      <div className="teacher-content">
        {activeTab === 'classes' && (
          <div className="teacher-card animate-fade">
            <h2>Demandes d’inscription à vos cours</h2>
            <p className="card-sub">
              Validez ou refusez les demandes envoyées par les étudiants.
            </p>

            <table className="chic-table">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Cours</th>
                  <th>Statut</th>
                  <th>Actions pédagogiques</th>
                </tr>
              </thead>

              <tbody>
                {demandesEnAttente.map(et => (
                  <tr key={et.inscription_id}>
                    <td>
                      <strong>{et.prenom} {et.nom}</strong>
                      {et.courriel && (
                        <div style={{ fontSize: '12px', color: '#777', marginTop: '4px' }}>
                          {et.courriel}
                        </div>
                      )}
                    </td>

                    <td>{et.cours}</td>

                    <td>
                      <span className="status-badge en-attente">
                        {et.statut}
                      </span>
                    </td>

                    <td>
                      <button
                        className="action-btn-valid"
                        onClick={() => handleAccepterInscription(et.inscription_id)}
                        disabled={actionLoading === et.inscription_id}
                      >
                        {actionLoading === et.inscription_id ? 'Traitement...' : 'Accepter'}
                      </button>

                      <button
                        className="action-btn-delete"
                        onClick={() => handleSupprimerInscription(et.inscription_id)}
                        disabled={actionLoading === et.inscription_id}
                      >
                        {actionLoading === et.inscription_id ? 'Traitement...' : 'Refuser'}
                      </button>
                    </td>
                  </tr>
                ))}

                {demandesEnAttente.length === 0 && (
                  <tr>
                    <td
                      colSpan="4"
                      style={{
                        textAlign: 'center',
                        fontStyle: 'italic',
                        color: '#888',
                        padding: '30px'
                      }}
                    >
                      Aucune demande d’inscription en attente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <h2 style={{ marginTop: '45px' }}>Étudiants validés</h2>
            <p className="card-sub">
              Liste des étudiants officiellement inscrits à vos cours.
            </p>

            <table className="chic-table">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Cours</th>
                  <th>Statut</th>
                  <th>Actions pédagogiques</th>
                </tr>
              </thead>

              <tbody>
                {inscriptionsValidees.map(et => (
                  <tr key={et.inscription_id}>
                    <td>
                      <strong>{et.prenom} {et.nom}</strong>
                      {et.courriel && (
                        <div style={{ fontSize: '12px', color: '#777', marginTop: '4px' }}>
                          {et.courriel}
                        </div>
                      )}
                    </td>

                    <td>{et.cours}</td>

                    <td>
                      <span className="status-badge validé">
                        {et.statut}
                      </span>
                    </td>

                    <td>
                      <button
                        className="action-btn-delete"
                        onClick={() => handleSupprimerInscription(et.inscription_id)}
                        disabled={actionLoading === et.inscription_id}
                      >
                        {actionLoading === et.inscription_id ? 'Traitement...' : 'Révoquer'}
                      </button>
                    </td>
                  </tr>
                ))}

                {inscriptionsValidees.length === 0 && (
                  <tr>
                    <td
                      colSpan="4"
                      style={{
                        textAlign: 'center',
                        fontStyle: 'italic',
                        color: '#888',
                        padding: '30px'
                      }}
                    >
                      Aucun étudiant validé pour vos cours actuellement.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {autresInscriptions.length > 0 && (
              <>
                <h2 style={{ marginTop: '45px' }}>Demandes refusées ou archivées</h2>
                <table className="chic-table">
                  <thead>
                    <tr>
                      <th>Étudiant</th>
                      <th>Cours</th>
                      <th>Statut</th>
                    </tr>
                  </thead>

                  <tbody>
                    {autresInscriptions.map(et => (
                      <tr key={et.inscription_id}>
                        <td>{et.prenom} {et.nom}</td>
                        <td>{et.cours}</td>
                        <td>
                          <span className="status-badge">
                            {et.statut}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="teacher-card animate-fade">
            <h2>Saisie des Évaluations</h2>
            <p className="card-sub">
              Attribuez les notes de vos élèves validés.
            </p>

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
                        onChange={(e) => handleNoteChange(et.etudiant_id, e.target.value)}
                        placeholder="Non noté"
                      />
                    </td>
                  </tr>
                ))}

                {inscriptionsValidees.length === 0 && (
                  <tr>
                    <td
                      colSpan="3"
                      style={{
                        textAlign: 'center',
                        fontStyle: 'italic',
                        color: '#888',
                        padding: '30px'
                      }}
                    >
                      Aucun étudiant validé disponible pour la saisie des notes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <button
              className="teacher-btn-dark"
              style={{ marginTop: '20px' }}
              onClick={() => setSuccessMsg("✅ Notes publiées officiellement.")}
            >
              Confirmer et publier les notes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
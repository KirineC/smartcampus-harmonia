import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './TeacherDashboard.css';

export default function TeacherNotes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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

    if (userObj.role !== 'enseignant') {
      navigate('/dashboard');
      return;
    }

    setUser(userObj);
    chargerElevesValides(userObj.id);
  }, [navigate]);

  const chargerElevesValides = async (profUserId) => {
    try {
      setLoading(true);
      setErrorMsg('');

      const response = await api.get(`/index.php?liste_eleves_prof=${profUserId}`);

      if (response.data && response.data.success) {
        setEtudiants(response.data.etudiants || []);
      } else {
        setErrorMsg(response.data.error || "Erreur lors de la récupération des élèves.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Erreur lors de la liaison académique.");
    } finally {
      setLoading(false);
    }
  };

  const estNoteValidee = (etudiant) => {
    return Number(etudiant.note_validee) === 1;
  };

  const handleNoteChange = (inscriptionId, valeur) => {
    setEtudiants(prev =>
      prev.map(et =>
        et.inscription_id === inscriptionId
          ? { ...et, note: valeur }
          : et
      )
    );
  };

  const executerActionNote = async (etudiant, mode) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (estNoteValidee(etudiant)) {
      setErrorMsg("Cette note est déjà validée et ne peut plus être modifiée.");
      return;
    }

    const valeur = String(etudiant.note ?? '').trim().replace(',', '.');

    if (valeur === '' || isNaN(Number(valeur))) {
      setErrorMsg("Veuillez saisir une note numérique avant de continuer.");
      return;
    }

    const noteNumber = Number(valeur);

    if (noteNumber < 0 || noteNumber > 20) {
      setErrorMsg("La note doit être comprise entre 0 et 20.");
      return;
    }

    if (mode === 'valider') {
      const confirmation = window.confirm(
        `Valider et publier la note de ${etudiant.prenom} ${etudiant.nom} ?\n\nAprès validation, elle sera visible par l'étudiant et ne pourra plus être modifiée.`
      );

      if (!confirmation) return;
    }

    try {
      setActionLoading(`${mode}-${etudiant.inscription_id}`);

      const response = await api.post('/index.php', {
        action: 'publier_notes',
        mode: mode,
        notes: [
          {
            inscription_id: etudiant.inscription_id,
            note: valeur
          }
        ]
      });

      if (response.data && response.data.success) {
        setSuccessMsg(
          mode === 'enregistrer'
            ? "Note enregistrée en brouillon. Elle n’est pas encore visible par l’étudiant."
            : "Note validée et publiée sur le bulletin de l’étudiant."
        );

        await chargerElevesValides(user.id);
      } else {
        setErrorMsg(response.data.error || "Impossible de traiter cette note.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || "Erreur de transmission.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleExporterCSV = () => {
    if (inscriptionsValidees.length === 0) {
      alert("Aucune donnée disponible à exporter.");
      return;
    }

    const entetes = [
      "ID Inscription",
      "Nom",
      "Prénom",
      "Enseignement / Cours",
      "Note Évaluation /20",
      "Statut"
    ];

    const lignes = inscriptionsValidees.map(et => [
      et.inscription_id,
      et.nom.toUpperCase(),
      et.prenom,
      et.cours,
      et.note !== null && et.note !== '' ? et.note : "Non noté",
      estNoteValidee(et) ? "Validée" : "Brouillon / non publiée"
    ]);

    const contenuCSV = [entetes, ...lignes]
      .map(ligne => ligne.map(valeur => `"${String(valeur).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), contenuCSV], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const lien = document.createElement('a');
    const nomFichier = `Carnet_Notes_${user?.nom || 'Chaire'}_${new Date().toISOString().split('T')[0]}.csv`;

    lien.setAttribute('href', url);
    lien.setAttribute('download', nomFichier);
    lien.style.visibility = 'hidden';

    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
  };

  const inscriptionsValidees = etudiants.filter(et =>
    et.statut?.toLowerCase().includes('valid')
  );

  if (loading) {
    return <div className="conservatoire-loading">Ouverture du Carnet de Notes...</div>;
  }

  return (
    <div className="teacher-wrapper" style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/enseignant/dashboard')}
        className="logout-btn"
        style={{ marginBottom: '20px', border: '1px solid #eae9e4' }}
      >
        ← Retour au Registre
      </button>

      <h1 style={{ fontFamily: 'Georgia', fontWeight: 'normal', marginBottom: '30px' }}>
        Saisie des Évaluations d'Audition
      </h1>

      {successMsg && (
        <div
          style={{
            background: '#e8f5e9',
            border: '1px solid #137333',
            color: '#137333',
            padding: '12px',
            marginBottom: '20px'
          }}
        >
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            background: '#fdecea',
            border: '1px solid #b3261e',
            color: '#b3261e',
            padding: '12px',
            marginBottom: '20px'
          }}
        >
          {errorMsg}
        </div>
      )}

      <div className="teacher-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '35px',
            borderBottom: '1px solid #eae9e4',
            paddingBottom: '20px'
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontFamily: 'Georgia, serif', fontWeight: 'normal' }}>
              Bulletins de Notes Numériques
            </h2>
            <p className="card-sub" style={{ margin: '6px 0 0 0', color: '#666' }}>
              Enregistrez d’abord les notes en brouillon, puis validez-les pour les publier aux élèves.
            </p>
          </div>

          {inscriptionsValidees.length > 0 && (
            <button
              onClick={handleExporterCSV}
              style={{
                background: '#ffffff',
                border: '1px solid #111111',
                color: '#111111',
                padding: '10px 20px',
                fontSize: '13px',
                cursor: 'pointer',
                borderRadius: '2px',
                fontFamily: 'sans-serif',
                letterSpacing: '0.5px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginLeft: '20px'
              }}
            >
              📥 Exporter le registre (.CSV)
            </button>
          )}
        </div>

        <table className="chic-table">
          <thead>
            <tr>
              <th>Étudiant</th>
              <th>Cours de Chaire</th>
              <th>Note de l'Audition (/20)</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {inscriptionsValidees.map(et => {
              const validee = estNoteValidee(et);
              const loadingEnregistrer = actionLoading === `enregistrer-${et.inscription_id}`;
              const loadingValider = actionLoading === `valider-${et.inscription_id}`;

              return (
                <tr key={et.inscription_id}>
                  <td>{et.prenom} {et.nom}</td>
                  <td>{et.cours}</td>

                  <td>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.25"
                      className="chic-note-input"
                      value={et.note ?? ''}
                      onChange={(e) => handleNoteChange(et.inscription_id, e.target.value)}
                      placeholder="Non noté"
                      disabled={validee}
                      style={{
                        opacity: validee ? 0.65 : 1,
                        cursor: validee ? 'not-allowed' : 'text'
                      }}
                    />
                  </td>

                  <td>
                    {validee ? (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '5px 10px',
                          border: '1px solid #137333',
                          color: '#137333',
                          background: '#e8f5e9',
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px'
                        }}
                      >
                        Validée 🔒
                      </span>
                    ) : et.note !== null && et.note !== '' ? (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '5px 10px',
                          border: '1px solid #d4af37',
                          color: '#8a6400',
                          background: '#fff7df',
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px'
                        }}
                      >
                        Brouillon
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '5px 10px',
                          border: '1px solid #d7d1c2',
                          color: '#6b6254',
                          background: '#f4f1e8',
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px'
                        }}
                      >
                        Non notée
                      </span>
                    )}
                  </td>

                  <td>
                    {validee ? (
                      <span style={{ color: '#777', fontStyle: 'italic', fontSize: '13px' }}>
                        Modification verrouillée
                      </span>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => executerActionNote(et, 'enregistrer')}
                          disabled={loadingEnregistrer || loadingValider}
                          style={{
                            border: '1px solid #111',
                            background: '#fff',
                            color: '#111',
                            padding: '7px 10px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {loadingEnregistrer ? '...' : 'Enregistrer'}
                        </button>

                        <button
                          onClick={() => executerActionNote(et, 'valider')}
                          disabled={loadingEnregistrer || loadingValider}
                          style={{
                            border: '1px solid #137333',
                            background: '#137333',
                            color: '#fff',
                            padding: '7px 10px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {loadingValider ? '...' : 'Valider et publier'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {inscriptionsValidees.length === 0 && (
              <tr>
                <td
                  colSpan="5"
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
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';

export default function MesNotes() {
  const [user, setUser] = useState(null);
  const [bulletin, setBulletin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();

  const getLatestNote = (notes = []) => {
    const notesPubliees = notes.filter(
      n => n.valeur_note !== null && n.valeur_note !== undefined
    );

    if (notesPubliees.length === 0) return null;

    return notesPubliees.sort((a, b) => {
      const dateA = a.date_evaluation || '';
      const dateB = b.date_evaluation || '';
      return dateB.localeCompare(dateA);
    })[0];
  };

  const getLatestSignature = (notes = []) => {
    const latest = getLatestNote(notes);

    if (!latest) return null;

    return `${latest.inscription_id}-${latest.valeur_note}-${latest.date_evaluation || 'sans-date'}`;
  };

  const getNoteInfo = (note) => {
    if (note === null || note === undefined || note === '') {
      return {
        label: 'En attente',
        mention: 'Évaluation à venir',
        background: '#f4f1e8',
        border: '#d7d1c2',
        color: '#6b6254'
      };
    }

    const valeur = Number(note);

    if (valeur >= 16) {
      return {
        label: `${valeur}/20`,
        mention: 'Virtuose',
        background: '#fff7df',
        border: '#d4af37',
        color: '#8a6400'
      };
    }

    if (valeur >= 14) {
      return {
        label: `${valeur}/20`,
        mention: 'Très bien',
        background: '#e8f5e9',
        border: '#137333',
        color: '#137333'
      };
    }

    if (valeur >= 10) {
      return {
        label: `${valeur}/20`,
        mention: 'Validé',
        background: '#eef3f7',
        border: '#46657f',
        color: '#24445c'
      };
    }

    return {
      label: `${valeur}/20`,
      mention: 'À retravailler',
      background: '#fdecea',
      border: '#b3261e',
      color: '#b3261e'
    };
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');

    if (!userData) {
      navigate('/');
      return;
    }

    const userObj = JSON.parse(userData);
    setUser(userObj);

    if (userObj.role !== 'etudiant') {
      navigate('/dashboard');
      return;
    }

    chargerBulletin(userObj);
  }, [navigate]);

  const chargerBulletin = async (userObj) => {
    try {
      setLoading(true);
      setErrorMsg('');

      const response = await api.get('/index.php?mes_notes=1');

      if (response.data && response.data.success) {
        setBulletin(response.data);

        const signature = getLatestSignature(response.data.notes || []);

        if (signature) {
          localStorage.setItem(`harmonia_notes_seen_${userObj.id}`, signature);
        }
      } else {
        setErrorMsg(response.data.error || "Impossible de charger votre bulletin.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Le bulletin académique est momentanément indisponible.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="conservatoire-loading">Ouverture du Bulletin de Pupitre...</div>;
  }

  const notes = bulletin?.notes || [];
  const stats = bulletin?.stats || {};
  const latestNote = getLatestNote(notes);

  return (
    <div className="dashboard-wrapper">
      <section className="welcome-section">
        <span className="sc-tag">BULLETIN DE PUPITRE • HARMONIA</span>
        <h1 className="welcome-title">Résultats académiques</h1>
        <p className="academic-status">
          {user?.prenom} {user?.nom} • Année académique 2026
        </p>
      </section>

      {errorMsg && (
        <div
          style={{
            padding: '14px 18px',
            border: '1px solid #b3261e',
            background: '#fdecea',
            color: '#b3261e',
            marginBottom: '25px',
            fontFamily: 'sans-serif'
          }}
        >
          {errorMsg}
        </div>
      )}

      {!errorMsg && (
        <>
          <section
            className="dashboard-card"
            style={{
              padding: '35px',
              border: '1px solid #d4af37',
              background: '#fffdf7',
              marginBottom: '30px'
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '24px',
                alignItems: 'center'
              }}
            >
              <div>
                <span className="sc-tag">MOYENNE GÉNÉRALE</span>
                <div
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '54px',
                    color: stats.moyenne !== null && stats.moyenne < 10 ? '#b3261e' : '#111',
                    marginTop: '8px'
                  }}
                >
                  {stats.moyenne !== null && stats.moyenne !== undefined ? `${stats.moyenne}/20` : '—'}
                </div>

                <div
                  style={{
                    display: 'inline-block',
                    marginTop: '10px',
                    padding: '6px 12px',
                    border: '1px solid #d4af37',
                    background: '#fff7df',
                    color: '#8a6400',
                    fontFamily: 'sans-serif',
                    textTransform: 'uppercase',
                    fontSize: '12px',
                    letterSpacing: '1px'
                  }}
                >
                  {stats.mention || 'En attente'}
                </div>
              </div>

              <div>
                <span className="sc-tag">PROGRESSION ACADÉMIQUE</span>

                <h2
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontWeight: 'normal',
                    marginBottom: '8px'
                  }}
                >
                  {stats.cours_notes || 0} cours évalué(s) sur {stats.total_cours || 0}
                </h2>

                <div
                  style={{
                    height: '8px',
                    background: '#eee8d8',
                    overflow: 'hidden',
                    marginTop: '12px'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${stats.total_cours ? ((stats.cours_notes || 0) / stats.total_cours) * 100 : 0}%`,
                      background: '#d4af37'
                    }}
                  />
                </div>
              </div>

              <div>
                <span className="sc-tag">DERNIÈRE PUBLICATION</span>

                {latestNote ? (
                  <>
                    <h2
                      style={{
                        fontFamily: 'Georgia, serif',
                        fontWeight: 'normal',
                        marginBottom: '6px'
                      }}
                    >
                      {latestNote.titre}
                    </h2>

                    <p style={{ margin: 0, color: '#555' }}>
                      Note publiée : <strong>{Number(latestNote.valeur_note)}/20</strong>
                    </p>

                    {latestNote.date_evaluation && (
                      <p style={{ marginTop: '4px', color: '#777', fontSize: '13px' }}>
                        Date : {latestNote.date_evaluation}
                      </p>
                    )}
                  </>
                ) : (
                  <p style={{ color: '#777', fontStyle: 'italic' }}>
                    Aucune note publiée pour le moment.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section>
            <h2 className="section-subtitle">Détail des matières</h2>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}
            >
              {notes.map((item) => {
                const noteInfo = getNoteInfo(item.valeur_note);

                return (
                  <div
                    key={item.inscription_id}
                    style={{
                      width: '100%',
                      padding: '24px 28px',
                      background: noteInfo.background,
                      border: `1px solid ${noteInfo.border}`,
                      minHeight: '145px',
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 0.8fr 0.7fr',
                      gap: '24px',
                      alignItems: 'center',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: 'sans-serif',
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          color: '#666',
                          marginBottom: '8px'
                        }}
                      >
                        {item.code_cours} • {item.type_cours}
                      </div>

                      <h3
                        style={{
                          fontFamily: 'Georgia, serif',
                          fontSize: '25px',
                          margin: '0 0 8px 0'
                        }}
                      >
                        {item.titre}
                      </h3>

                      <p
                        style={{
                          margin: 0,
                          color: '#555',
                          fontFamily: 'sans-serif',
                          fontSize: '13px'
                        }}
                      >
                        Pr. {item.prof_prenom} {item.prof_nom}
                      </p>
                    </div>

                    <div>
                      <div
                        style={{
                          fontFamily: 'Georgia, serif',
                          fontSize: '42px',
                          color: noteInfo.color,
                          lineHeight: 1
                        }}
                      >
                        {noteInfo.label}
                      </div>

                      <div
                        style={{
                          marginTop: '7px',
                          fontFamily: 'sans-serif',
                          fontSize: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px',
                          color: noteInfo.color
                        }}
                      >
                        {noteInfo.mention}
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign: 'right',
                        fontFamily: 'sans-serif',
                        fontSize: '12px',
                        color: '#777'
                      }}
                    >
                      {item.date_evaluation ? (
                        <>
                          Publié le<br />
                          <strong>{item.date_evaluation}</strong>
                        </>
                      ) : (
                        <>
                          Publication<br />
                          <strong>en attente</strong>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {notes.length === 0 && (
                <div
                  style={{
                    padding: '25px',
                    border: '1px dashed #d4af37',
                    background: '#fff',
                    color: '#666',
                    fontStyle: 'italic'
                  }}
                >
                  Aucun cours validé pour le moment. Vos résultats apparaîtront ici après validation de vos inscriptions.
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
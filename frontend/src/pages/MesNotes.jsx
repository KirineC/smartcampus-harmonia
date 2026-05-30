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

  const formatNote = (note) => {
    if (note === null || note === undefined || note === '') {
      return 'En attente';
    }

    return `${Number(note)}/20`;
  };

  const formatDate = (date) => {
    if (!date) return 'Non publiée';

    return new Date(date).toLocaleDateString('fr-FR');
  };

  const escapeHtml = (value) => {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
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

  const handleExporterPDF = () => {
    if (!bulletin || !user) {
      alert("Le bulletin n'est pas encore disponible.");
      return;
    }

    const notes = bulletin.notes || [];
    const stats = bulletin.stats || {};
    const dateEdition = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const lignesNotes = notes.map((item) => {
      const noteInfo = getNoteInfo(item.valeur_note);

      return `
        <tr>
          <td>
            <strong>${escapeHtml(item.titre)}</strong><br>
            <span class="muted">${escapeHtml(item.code_cours)} • ${escapeHtml(item.type_cours)}</span>
          </td>
          <td>Pr. ${escapeHtml(item.prof_prenom)} ${escapeHtml(item.prof_nom)}</td>
          <td class="note-cell ${item.valeur_note !== null && Number(item.valeur_note) < 10 ? 'danger' : ''}">
            ${escapeHtml(formatNote(item.valeur_note))}
          </td>
          <td>${escapeHtml(noteInfo.mention)}</td>
          <td>${escapeHtml(formatDate(item.date_evaluation))}</td>
        </tr>
      `;
    }).join('');

    const contenuImpression = `
      <html>
        <head>
          <title>Relevé de notes - ${escapeHtml(user.prenom)} ${escapeHtml(user.nom)}</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: Georgia, serif;
              color: #111;
              padding: 42px;
              background: #ffffff;
            }

            .header {
              text-align: center;
              border-bottom: 2px solid #d4af37;
              padding-bottom: 22px;
              margin-bottom: 28px;
            }

            .tag {
              font-family: Arial, sans-serif;
              font-size: 11px;
              letter-spacing: 2px;
              text-transform: uppercase;
              color: #8a6400;
              font-weight: bold;
            }

            h1 {
              font-size: 34px;
              font-weight: normal;
              margin: 12px 0 6px 0;
            }

            .subtitle {
              font-family: Arial, sans-serif;
              color: #666;
              font-size: 14px;
              margin: 0;
            }

            .student-box {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 18px;
              margin-bottom: 28px;
              font-family: Arial, sans-serif;
              font-size: 14px;
            }

            .box {
              border: 1px solid #e5e4e0;
              padding: 16px;
              background: #faf9f5;
            }

            .box strong {
              display: block;
              font-family: Georgia, serif;
              font-size: 20px;
              margin-top: 4px;
            }

            .stats {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 14px;
              margin-bottom: 30px;
            }

            .stat-card {
              border: 1px solid #d4af37;
              padding: 16px;
              background: #fffdf7;
            }

            .stat-label {
              font-family: Arial, sans-serif;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #777;
              margin-bottom: 8px;
            }

            .stat-value {
              font-size: 26px;
              color: #111;
            }

            .mention {
              color: #8a6400;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 18px;
              font-family: Arial, sans-serif;
              font-size: 13px;
            }

            th {
              text-align: left;
              border-bottom: 2px solid #111;
              padding: 12px 10px;
              text-transform: uppercase;
              letter-spacing: 1px;
              font-size: 10px;
              color: #555;
            }

            td {
              border-bottom: 1px solid #ddd;
              padding: 13px 10px;
              vertical-align: top;
            }

            .muted {
              color: #777;
              font-size: 12px;
            }

            .note-cell {
              font-family: Georgia, serif;
              font-size: 20px;
              white-space: nowrap;
              color: #137333;
            }

            .note-cell.danger {
              color: #b3261e;
            }

            .footer {
              margin-top: 34px;
              padding-top: 18px;
              border-top: 1px solid #d4af37;
              font-family: Arial, sans-serif;
              font-size: 12px;
              color: #666;
              display: flex;
              justify-content: space-between;
            }

            @media print {
              body {
                padding: 24px;
              }

              button {
                display: none;
              }
            }
          </style>
        </head>

        <body>
          <div class="header">
            <div class="tag">Conservatoire National Supérieur de Musique • Harmonia</div>
            <h1>Relevé officiel de notes</h1>
            <p class="subtitle">Bulletin de Pupitre • Année académique 2026</p>
          </div>

          <div class="student-box">
            <div class="box">
              Étudiant
              <strong>${escapeHtml(user.prenom)} ${escapeHtml(user.nom)}</strong>
            </div>

            <div class="box">
              Date d’édition
              <strong>${escapeHtml(dateEdition)}</strong>
            </div>
          </div>

          <div class="stats">
            <div class="stat-card">
              <div class="stat-label">Moyenne générale</div>
              <div class="stat-value">${stats.moyenne !== null && stats.moyenne !== undefined ? `${escapeHtml(stats.moyenne)}/20` : '—'}</div>
            </div>

            <div class="stat-card">
              <div class="stat-label">Mention</div>
              <div class="stat-value mention">${escapeHtml(stats.mention || 'En attente')}</div>
            </div>

            <div class="stat-card">
              <div class="stat-label">Progression académique</div>
              <div class="stat-value">${escapeHtml(stats.cours_notes || 0)}/${escapeHtml(stats.total_cours || 0)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Matière</th>
                <th>Professeur</th>
                <th>Note</th>
                <th>Appréciation</th>
                <th>Publication</th>
              </tr>
            </thead>

            <tbody>
              ${lignesNotes || `
                <tr>
                  <td colspan="5" style="text-align:center; padding: 30px; color: #777;">
                    Aucun résultat publié pour le moment.
                  </td>
                </tr>
              `}
            </tbody>
          </table>

          <div class="footer">
            <span>Document généré depuis l’espace étudiant Harmonia.</span>
            <span>Signature du secrétariat : __________________</span>
          </div>
        </body>
      </html>
    `;

    const fenetre = window.open('', '_blank');

    if (!fenetre) {
      alert("Impossible d'ouvrir la fenêtre d'impression. Vérifiez que les pop-ups ne sont pas bloquées.");
      return;
    }

    fenetre.document.write(contenuImpression);
    fenetre.document.close();
    fenetre.focus();

    setTimeout(() => {
      fenetre.print();
    }, 400);
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

        {!errorMsg && (
          <button
            onClick={handleExporterPDF}
            style={{
              marginTop: '22px',
              border: '1px solid #111',
              background: '#111',
              color: '#fff',
              padding: '11px 18px',
              fontFamily: 'sans-serif',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              cursor: 'pointer'
            }}
          >
            Exporter le relevé PDF
          </button>
        )}
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
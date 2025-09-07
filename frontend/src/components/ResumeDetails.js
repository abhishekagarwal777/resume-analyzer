import React from 'react';
import './ResumeDetails.css';

const ContactRow = ({ icon, children, href }) => {
  return (
    <div className="contact-item">
      <span className="contact-icon" aria-hidden>{icon}</span>
      {href ? (
        <a className="contact-link" href={href} target="_blank" rel="noreferrer">
          {children}
        </a>
      ) : (
        <span className="contact-text">{children}</span>
      )}
    </div>
  );
};

export const ResumeDetails = ({
  data,
  asModal = true,
  title = 'Resume Details',
  onClose,
  emptyMessage = 'No details available for this resume.',
}) => {
  const ContainerTag = asModal ? 'div' : 'section';
  const containerClass = asModal ? 'resume-details-modal' : 'resume-details-container';

  if (!data) {
    return (
      <div className={containerClass}>
        {asModal ? (
          <div className="modal-header">
            <h3 className="modal-title">
              <span role="img" aria-label="details">📄</span>
              {title}
            </h3>
            {onClose ? (
              <button className="close-button" onClick={onClose} aria-label="Close">✖</button>
            ) : null}
          </div>
        ) : null}
        <div className="resume-details-content">
          <div className="no-data-state">
            <div className="no-data-icon" aria-hidden>🗂️</div>
            <h3>No Data</h3>
            <p>{emptyMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  const {
    candidateName,
    email,
    phone,
    location,
    website,
    linkedin,
    github,
    ratingScore,
    ratingTotal = 10,
    ratingBand,
    ratingText,
    fileInfo = [],
    summary,
    experience = [],
    education = [],
    technicalSkills = [],
    softSkills = [],
    projects = [],
    certifications = [],
    improvementAreas = [],
    upskillSuggestions = [],
  } = data;

  const ratingClass =
    ratingBand === 'excellent' ? 'rating-excellent' :
    ratingBand === 'good' ? 'rating-good' :
    ratingBand === 'fair' ? 'rating-fair' :
    ratingBand === 'poor' ? 'rating-poor' : '';

  return (
    <ContainerTag className={containerClass}>
      {asModal ? (
        <div className="modal-header">
          <h3 className="modal-title">
            <span role="img" aria-label="details">📄</span>
            {title}
          </h3>
          {onClose ? (
            <button className="close-button" onClick={onClose} aria-label="Close">✖</button>
          ) : null}
        </div>
      ) : null}

      <div className="resume-details-content">
        {/* Header */}
        <div className="details-header">
          <div className="header-info">
            <h1 className="candidate-name">{candidateName ?? 'Unknown Candidate'}</h1>
            <div className="contact-info">
              {email ? <ContactRow icon="✉️" href={`mailto:${email}`}>{email}</ContactRow> : null}
              {phone ? <ContactRow icon="📞">{phone}</ContactRow> : null}
              {location ? <ContactRow icon="📍">{location}</ContactRow> : null}
              {website ? <ContactRow icon="🔗" href={website}>{website}</ContactRow> : null}
              {linkedin ? <ContactRow icon="in" href={linkedin}>LinkedIn</ContactRow> : null}
              {github ? <ContactRow icon="🐙" href={github}>GitHub</ContactRow> : null}
            </div>
          </div>

          {(ratingScore !== undefined || ratingText) && (
            <aside className="rating-section">
              <div className={`rating-display ${ratingClass}`.trim()}>
                {ratingScore !== undefined ? <span className="rating-score">{ratingScore}</span> : null}
                <span className="rating-total">/ {ratingTotal}</span>
              </div>
              <div className="rating-description">{ratingText ?? ratingBand ?? 'Rating'}</div>
            </aside>
          )}
        </div>

        {/* File Info */}
        {fileInfo.length > 0 && (
          <div className="file-info-section">
            {fileInfo.map((fi, i) => (
              <div key={i} className="file-info-item">
                <strong>{fi.label}:</strong> {fi.value}
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {summary && (
          <section className="section">
            <h3 className="section-title">
              <span role="img" aria-label="summary">📝</span>
              Summary
            </h3>
            <div className="section-content">
              <p className="summary-text">{summary}</p>
            </div>
          </section>
        )}

        {/* Experience */}
        <section className="section">
          <h3 className="section-title">
            <span role="img" aria-label="briefcase">💼</span>
            Work Experience
          </h3>
          <div className="section-content">
            {experience.length === 0 ? (
              <p className="no-items">No experience provided</p>
            ) : (
              <div className="experience-list">
                {experience.map(exp => (
                  <div className="experience-item" key={exp.id}>
                    <div className="experience-header">
                      <div className="experience-title">
                        <h4 className="role">{exp.role}</h4>
                        <p className="company">{exp.company}</p>
                      </div>
                      <div className="experience-duration">
                        <span className="duration">
                          {(exp.startDate ?? '—')} — {(exp.endDate ?? 'Present')}
                        </span>
                      </div>
                    </div>
                    {exp.bullets && exp.bullets.length > 0 ? (
                      <ul className="description-list">
                        {exp.bullets.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    ) : (
                      <p className="no-description">No description provided</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Education */}
        <section className="section">
          <h3 className="section-title">
            <span role="img" aria-label="education">🎓</span>
            Education
          </h3>
          <div className="section-content">
            {education.length === 0 ? (
              <p className="no-items">No education provided</p>
            ) : (
              <div className="education-list">
                {education.map(ed => (
                  <div className="education-item" key={ed.id}>
                    <div className="education-icon" aria-hidden>🎓</div>
                    <div className="education-content">
                      <h4 className="degree">{ed.degree}</h4>
                      <p className="institution">{ed.institution}</p>
                      {ed.year ? <span className="graduation-year">{ed.year}</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Skills */}
        {(technicalSkills.length > 0 || softSkills.length > 0) && (
          <section className="section skills-section">
            <div className="skills-column technical-skills">
              <h3 className="section-title">
                <span role="img" aria-label="gear">🛠️</span>
                Technical Skills
              </h3>
              <div className="section-content">
                <div className="skills-container">
                  {technicalSkills.map((s, i) => <span key={i} className="skill-tag">{s}</span>)}
                </div>
              </div>
            </div>
            <div className="skills-column soft-skills">
              <h3 className="section-title">
                <span role="img" aria-label="sparkles">✨</span>
                Soft Skills
              </h3>
              <div className="section-content">
                <div className="skills-container">
                  {softSkills.map((s, i) => <span key={i} className="skill-tag">{s}</span>)}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Projects */}
        <section className="section">
          <h3 className="section-title">
            <span role="img" aria-label="project">📦</span>
            Projects
          </h3>
          <div className="section-content">
            {projects.length === 0 ? (
              <p className="no-items">No projects provided</p>
            ) : (
              <div className="projects-list">
                {projects.map(p => (
                  <div className="project-item" key={p.id}>
                    <div className="project-header">
                      <h4 className="project-name">{p.name}</h4>
                    </div>
                    {p.description ? <p className="project-description">{p.description}</p> : null}
                    {p.technologies && p.technologies.length > 0 ? (
                      <div className="project-technologies">
                        <strong>Technologies</strong>
                        <div className="tech-tags">
                          {p.technologies.map((t, i) => <span key={i} className="tech-tag">{t}</span>)}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Certifications */}
        <section className="section">
          <h3 className="section-title">
            <span role="img" aria-label="cert">🏅</span>
            Certifications
          </h3>
          <div className="section-content">
            {certifications.length === 0 ? (
              <p className="no-items">No certifications provided</p>
            ) : (
              <div className="certifications-list">
                {certifications.map(c => (
                  <div className="certification-item" key={c.id}>
                    <div className="certification-icon" aria-hidden>🏅</div>
                    <div className="certification-content">
                      <h4 className="certification-name">{c.name}</h4>
                      <p className="certification-issuer">{c.issuer}</p>
                      {c.year ? <span className="certification-year">{c.year}</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Analysis */}
        {(improvementAreas.length > 0 || upskillSuggestions.length > 0) && (
          <section className="section analysis-section">
            {improvementAreas.length > 0 && (
              <div className="improvement-areas">
                <h3 className="section-title">
                  <span role="img" aria-label="warning">⚠️</span>
                  Improvement Areas
                </h3>
                <div className="section-content">
                  <div className="improvement-content">
                    {improvementAreas.map((a, i) => (
                      <div key={i} style={{ marginBottom: i < improvementAreas.length - 1 ? 8 : 0 }}>{a}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {upskillSuggestions.length > 0 && (
              <div className="upskill-suggestions">
                <h3 className="section-title">
                  <span role="img" aria-label="lightbulb">💡</span>
                  Upskill Suggestions
                </h3>
                <div className="section-content">
                  <div className="suggestions-list">
                    {upskillSuggestions.map((s, i) => (
                      <div key={i} className="suggestion-item">
                        <div className="suggestion-icon" aria-hidden>{s.icon ?? '✅'}</div>
                        <div className="suggestion-text">{s.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </ContainerTag>
  );
};

export default ResumeDetails;

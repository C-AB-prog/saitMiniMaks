import { Link } from 'react-router-dom';
import { fileUrl } from '../../api/client';
import type { FocusSummary } from '../../types/api';

type FocusCardProps = {
  focus: FocusSummary;
};

// Deterministic gradient per focus id
const getGradient = (id: string) => {
  const gradients = [
    'linear-gradient(135deg, rgba(99,102,241,.35) 0%, rgba(167,139,250,.2) 100%)',
    'linear-gradient(135deg, rgba(244,114,182,.3) 0%, rgba(167,139,250,.2) 100%)',
    'linear-gradient(135deg, rgba(45,212,191,.28) 0%, rgba(99,102,241,.18) 100%)',
    'linear-gradient(135deg, rgba(251,191,36,.25) 0%, rgba(244,114,182,.2) 100%)',
    'linear-gradient(135deg, rgba(59,130,246,.3) 0%, rgba(45,212,191,.2) 100%)',
    'linear-gradient(135deg, rgba(167,139,250,.3) 0%, rgba(244,114,182,.2) 100%)',
  ];
  const idx = id.charCodeAt(0) % gradients.length;
  return gradients[idx];
};

export const FocusCard = ({ focus }: FocusCardProps) => {
  const progress = focus.taskCount > 0 ? Math.round((focus.completedTaskCount / focus.taskCount) * 100) : 0;
  const cover = fileUrl(focus.coverImage);
  const openTasks = focus.taskCount - focus.completedTaskCount;

  return (
    <Link to={`/app/focuses/${focus.id}`} className="focus-card-link">
      <article className="focus-card focus-card-polished">
        <div
          className="focus-cover"
          style={
            cover
              ? { backgroundImage: `linear-gradient(180deg, rgba(6,6,8,.06) 0%, rgba(6,6,8,.75) 100%), url(${cover})` }
              : { background: getGradient(focus.id) }
          }
        >
          <div className="focus-cover-badge focus-cover-badge-rich">
            <span>{focus.taskCount} задач · {progress}% выполнено</span>
            <strong>{focus.title}</strong>
          </div>
          <div className="focus-card-access-pill-row">
            <span className={`status-pill ${focus.accessRole === 'member' ? 'status-pill-shared' : ''}`}>
              {focus.accessRole === 'owner' ? 'Owner' : 'Shared'}
            </span>
          </div>
        </div>

        <div className="focus-body focus-body-rich">
          <div className="focus-body-top focus-body-top-polished">
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3>{focus.title}</h3>
              <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {focus.description}
              </p>
            </div>
          </div>

          <div className="focus-meta-row focus-meta-row-rich">
            {openTasks > 0 ? (
              <span style={{ color: 'var(--accent-secondary)', fontWeight: 500 }}>
                {openTasks} открыто
              </span>
            ) : focus.taskCount > 0 ? (
              <span style={{ color: 'var(--success)', fontWeight: 500 }}>
                ✓ Всё выполнено
              </span>
            ) : (
              <span>Нет задач</span>
            )}
            <span>{focus.collaboratorCount + 1} участников</span>
            {focus.accessRole === 'member' ? <span>от {focus.owner.name}</span> : null}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div className="member-avatar-strip">
              <div className="member-avatar owner" title={focus.owner.name}>
                {focus.owner.name.slice(0, 1).toUpperCase()}
              </div>
              {focus.members.slice(0, 3).map((member) => (
                <div key={member.id} className="member-avatar" title={member.name}>
                  {member.name.slice(0, 1).toUpperCase()}
                </div>
              ))}
              {focus.members.length > 3 ? (
                <div className="member-avatar more">+{focus.members.length - 3}</div>
              ) : null}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
              {progress}%
            </span>
          </div>

          <div className="progress-track progress-track-spacious">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </article>
    </Link>
  );
};

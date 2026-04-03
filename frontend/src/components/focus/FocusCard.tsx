import { Link } from 'react-router-dom';
import { fileUrl } from '../../api/client';
import type { FocusSummary } from '../../types/api';

type FocusCardProps = {
  focus: FocusSummary;
};

export const FocusCard = ({ focus }: FocusCardProps) => {
  const progress = focus.taskCount > 0 ? Math.round((focus.completedTaskCount / focus.taskCount) * 100) : 0;
  const cover = fileUrl(focus.coverImage);

  return (
    <Link to={`/app/focuses/${focus.id}`} className="focus-card-link">
      <article className="focus-card focus-card-polished">
        <div
          className="focus-cover"
          style={cover ? { backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.06), rgba(0,0,0,.56)), url(${cover})` } : undefined}
        >
          <div className="focus-cover-badge focus-cover-badge-rich">
            <span>{focus.taskCount} задач · {focus.completedTaskCount} выполнено</span>
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
            <div>
              <h3>{focus.title}</h3>
              <p>{focus.description}</p>
            </div>
          </div>
          <div className="focus-meta-row focus-meta-row-rich">
            <span>Открыто: {focus.taskCount - focus.completedTaskCount}</span>
            <span>Участники: {focus.collaboratorCount + 1}</span>
            {focus.accessRole === 'member' ? <span>Владелец: {focus.owner.name}</span> : null}
          </div>
          <div className="member-avatar-strip">
            <div className="member-avatar owner">{focus.owner.name.slice(0, 1).toUpperCase()}</div>
            {focus.members.slice(0, 3).map((member) => (
              <div key={member.id} className="member-avatar">
                {member.name.slice(0, 1).toUpperCase()}
              </div>
            ))}
            {focus.members.length > 3 ? <div className="member-avatar more">+{focus.members.length - 3}</div> : null}
          </div>
          <div className="progress-track progress-track-spacious">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </article>
    </Link>
  );
};

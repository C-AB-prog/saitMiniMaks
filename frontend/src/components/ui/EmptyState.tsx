import { IconGrid } from './Icons';

export const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="empty-state">
    <div style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }}>
      <IconGrid size={28} />
    </div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

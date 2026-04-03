import { useEffect } from 'react';

type ModalProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'default' | 'wide' | 'xl';
  bodyClassName?: string;
};

export const Modal = ({ open, title, subtitle, onClose, children, footer, size = 'default', bodyClassName }: ModalProps) => {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal-card modal-card-${size}`} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header-row modal-header-row-candy">
          <div>
            <h3>{title}</h3>
            {subtitle ? <p className="muted-text">{subtitle}</p> : null}
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>
        <div className={bodyClassName}>{children}</div>
        {footer ? <div className="modal-footer modal-footer-candy">{footer}</div> : null}
      </div>
    </div>
  );
};

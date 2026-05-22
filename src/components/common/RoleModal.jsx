import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function RoleModal({
  open,
  onClose,
  eyebrow,
  title,
  warning,
  width = 520,
  actions,
  children,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="lk-role-modal-overlay" onClick={onClose}>
      <div
        className="lk-role-modal"
        style={{ width: `min(${width}px, calc(100vw - 2rem))` }}
        onClick={(event) => event.stopPropagation()}
      >
        {(eyebrow || title) ? (
          <header className="lk-role-modal__header">
            <div>
              {eyebrow ? <span className="lk-role-modal__eyebrow">{eyebrow}</span> : null}
              {title ? <h3 className="lk-role-modal__title">{title}</h3> : null}
            </div>

            <button type="button" className="lk-btn lk-btn--secondary" onClick={onClose}>
              Cerrar
            </button>
          </header>
        ) : null}

        {warning ? <p className="lk-role-modal__warning">{warning}</p> : null}

        {children}

        {actions ? <div className="lk-role-modal__actions">{actions}</div> : null}
      </div>
    </div>,
    document.body
  );
}

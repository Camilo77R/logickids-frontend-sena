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
  overlayClassName = "",
}) {
  const sizeClass =
    width >= 720 ? " lk-role-modal--wide" : width >= 640 ? " lk-role-modal--large" : "";

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
    <div className={`lk-role-modal-overlay${overlayClassName ? ` ${overlayClassName}` : ""}`} onClick={onClose}>
      <div
        className={`lk-role-modal${sizeClass}`}
        onClick={(event) => event.stopPropagation()}
      >
        {(eyebrow || title) ? (
          <header className="lk-role-modal__header">
            <div>
              {eyebrow ? <span className="lk-role-modal__eyebrow">{eyebrow}</span> : null}
              {title ? <h3 className="lk-role-modal__title">{title}</h3> : null}
            </div>
            {/* Botón de cerrar ELIMINADO del header */}
          </header>
        ) : null}

        {warning ? <p className="lk-role-modal__warning">{warning}</p> : null}

        <div className="lk-role-modal__content">{children}</div>

        {actions ? <div className="lk-role-modal__actions">{actions}</div> : null}
      </div>
    </div>,
    document.body
  );
}
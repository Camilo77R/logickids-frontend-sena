import RoleModal from "./RoleModal";
import StatusBadge from "./StatusBadge";

export default function StateChangeModal({
  open,
  onClose,
  onConfirm,
  eyebrow,
  title,
  warning,
  entityLabel,
  currentState,
  nextState,
  impactTitle = "Qué va a pasar",
  impactItems = [],
  detailsTitle,
  detailsItems = [],
  confirmLabel,
  confirmVariant = "primary",
  overlayClassName,
}) {
  return (
    <RoleModal
      open={open}
      onClose={onClose}
      eyebrow={eyebrow}
      title={title}
      warning={warning}
      overlayClassName={overlayClassName}
      actions={
        <>
          <button type="button" className="lk-btn lk-btn--secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className={`lk-btn ${confirmVariant === "danger" ? "lk-btn--ghost-danger" : "lk-btn--primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="lk-role-modal__field">
        <strong>Cuenta seleccionada</strong>
        <p>{entityLabel}</p>
      </div>

      <div className="lk-role-state-flow" aria-label="Cambio de estado">
        <div className="lk-role-state-flow__item">
          <span className="lk-role-state-flow__label">Estado actual</span>
          <StatusBadge label={currentState} variant={currentState} />
        </div>
        <span className="lk-role-state-flow__arrow" aria-hidden="true">→</span>
        <div className="lk-role-state-flow__item">
          <span className="lk-role-state-flow__label">Nuevo estado</span>
          <StatusBadge label={nextState} variant={nextState} />
        </div>
      </div>

      {impactItems.length > 0 ? (
        <section className="lk-role-impact-card">
          <strong className="lk-role-impact-card__title">{impactTitle}</strong>
          <ul className="lk-role-impact-list">
            {impactItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {detailsItems.length > 0 ? (
        <details className="lk-role-accordion">
          <summary>{detailsTitle || "Ver más contexto"}</summary>
          <ul className="lk-role-impact-list lk-role-impact-list--soft">
            {detailsItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </RoleModal>
  );
}

import { Bell, ChevronDown, Settings } from "lucide-react";
import { motion } from "framer-motion";

/**
 * PortalTopbar
 *
 * Encabezado superior compartido por admin y superadmin.
 * SOLO comunica contexto de pantalla y accesos rápidos.
 */
export default function PortalTopbar({
  title,
  subtitle,
  userName,
  roleLabel,
  initials,
  notificationCount = 0,
  showNotifications = true,
  onNotificationsClick,
  onAccountCenter,
  actions,
  toolbar,
}) {
  const shortName = userName?.trim()?.split(/\s+/)?.[0] || "Cuenta";

  return (
    <motion.header
      className={`lk-portal-topbar${toolbar ? " lk-portal-topbar--merged" : ""}`}
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="lk-portal-topbar__row">
        <div className="lk-portal-topbar__left">
          <div className="lk-portal-topbar__brand" aria-label="LogicKids">
            <span className="lk-portal-topbar__brand-logic">Logic</span>
            <span className="lk-portal-topbar__brand-kids">Kids</span>
          </div>

          <div className="lk-portal-topbar__copy">
            <h1 className="lk-portal-topbar__title">{title}</h1>
            {toolbar ? null : <p className="lk-portal-topbar__subtitle">{subtitle}</p>}
          </div>
        </div>

        <div className="lk-portal-topbar__right">
          {actions ? <div className="lk-portal-topbar__actions">{actions}</div> : null}

          {showNotifications ? (
            <button
              type="button"
              className="lk-portal-topbar__icon-btn"
              onClick={onNotificationsClick}
              aria-label="Notificaciones"
              title="Notificaciones"
            >
              <Bell size={18} />
              {notificationCount > 0 ? (
                <span className="lk-portal-topbar__badge">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              ) : null}
            </button>
          ) : null}

          <button
            type="button"
            className="lk-portal-topbar__icon-btn"
            onClick={onAccountCenter}
            aria-label="Centro de cuenta"
            title="Centro de cuenta"
          >
            <Settings size={18} />
          </button>

          <button
            type="button"
            className="lk-portal-topbar__profile"
            onClick={onAccountCenter}
            aria-label="Abrir centro de cuenta"
            title={userName}
          >
            <span className="lk-portal-topbar__profile-avatar" aria-hidden="true">
              {initials}
            </span>
            <span className="lk-portal-topbar__profile-copy">
              <strong>{shortName}</strong>
              <small>{roleLabel}</small>
            </span>
            <ChevronDown size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {toolbar ? <div className="lk-portal-topbar__toolbar">{toolbar}</div> : null}
    </motion.header>
  );
}

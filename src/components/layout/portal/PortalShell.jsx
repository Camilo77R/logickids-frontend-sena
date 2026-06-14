import { motion } from "framer-motion";
import PortalMobileNav from "./PortalMobileNav";
import PortalSidebar from "./PortalSidebar";
import PortalTopbar from "./PortalTopbar";

/**
 * PortalShell
 *
 * Cascarón moderno compartido para roles administrativos.
 * Orquesta sidebar + topbar + área scrollable.
 */
export default function PortalShell({
  navigation,
  roleLabel,
  title,
  subtitle,
  tertiary,
  userName,
  initials,
  notificationCount = 0,
  showNotifications = true,
  onNotificationsClick,
  onAccountCenter,
  onLogout,
  actions,
  toolbar,
  className = "",
  children,
}) {
  return (
    <div className={`lk-portal-shell${className ? ` ${className}` : ""}`}>
      <PortalSidebar
        navigation={navigation}
        roleLabel={roleLabel}
        userName={userName}
        initials={initials}
        onLogout={onLogout}
      />

      <div className="lk-portal-shell__main">
        <PortalTopbar
          title={title}
          subtitle={subtitle}
          tertiary={tertiary}
          userName={userName}
          roleLabel={roleLabel}
          initials={initials}
          notificationCount={notificationCount}
          showNotifications={showNotifications}
          onNotificationsClick={onNotificationsClick}
          onAccountCenter={onAccountCenter}
          actions={actions}
          toolbar={toolbar}
        />

        <PortalMobileNav
          navigation={navigation}
          roleLabel={roleLabel}
          onLogout={onLogout}
        />

        <motion.main
          className="lk-portal-shell__content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

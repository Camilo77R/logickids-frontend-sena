/**
 * TutorTopbar — Barra superior del portal tutor LogicKids
 *
 * Muestra bienvenida dinámica con el nombre del usuario,
 * botones de acción rápida, notificaciones y perfil.
 * Refactorizado aplicando SOLID (SRP).
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bell, Plus, RefreshCw, ChevronDown } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import AccountCenterModal from "../../account/AccountCenterModal";

// ==========================================
// Subcomponentes (SOLID: Single Responsibility)
// ==========================================

const TopbarBrand = () => (
  <div className="lk-tutor-topbar-brand">
    <span style={{ color: "var(--lk-purple)" }}>Logic</span>
    <span style={{ color: "var(--lk-yellow)" }}>Kids</span>
  </div>
);

const TopbarGreeting = ({ firstName }) => (
  <div className="lk-tutor-topbar-greeting-container">
    <div className="lk-tutor-topbar-greeting">
      ¡Hola, {firstName}! 👋
    </div>
    <div className="lk-tutor-topbar-subtitle">
      Revisa el progreso, resultados y tiempo de juego
    </div>
  </div>
);

const TopbarButton = ({ icon: Icon, label, variant = "outline", onClick, hasBadge }) => (
  <button 
    className={`lk-topbar-btn lk-topbar-btn--${variant}`} 
    onClick={onClick}
    aria-label={label || "Action"}
    title={label}
  >
    <Icon size={16} strokeWidth={2.5} />
    {label && <span>{label}</span>}
    {hasBadge && <span className="lk-topbar-btn-badge" />}
  </button>
);

const TopbarProfile = ({ initials, name, onClick }) => (
  <div className="lk-topbar-profile" onClick={onClick} role="button" tabIndex={0}>
    <div className="lk-tutor-avatar">{initials}</div>
    <span className="lk-topbar-profile-name">{name}</span>
    <ChevronDown size={14} className="lk-topbar-profile-chevron" strokeWidth={3} />
  </div>
);

// ==========================================
// Componente Principal
// ==========================================

export default function TutorTopbar() {
  const { user } = useAuth();
  const [showAccountCenter, setShowAccountCenter] = useState(false);

  const initials = user?.nombre
    ? user.nombre.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")
    : "TU";

  const firstName = user?.nombre?.split(" ")[0] || "Profe";

  return (
    <>
      <motion.header
        className="lk-tutor-topbar"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.30, ease: "easeOut" }}
      >
        {/* Lado Izquierdo: Branding y Saludo */}
        <div className="lk-tutor-topbar-left">
          <TopbarBrand />
          <TopbarGreeting firstName={firstName} />
        </div>

        {/* Lado Derecho: Acciones y Perfil */}
        <div className="lk-tutor-topbar-right">
          <TopbarButton 
            icon={RefreshCw} 
            label="Refresh stats" 
            variant="outline" 
            onClick={() => console.log("Refresh")} 
          />
          <TopbarButton 
            icon={Plus} 
            variant="primary" 
            onClick={() => console.log("Add")} 
          />
          <TopbarButton 
            icon={Bell} 
            variant="icon" 
            hasBadge={true} 
            onClick={() => console.log("Notificaciones click")} 
          />
          <TopbarProfile 
            initials={initials} 
            name={firstName} 
            onClick={() => setShowAccountCenter(true)} 
          />
        </div>
      </motion.header>

      {/* Modal de Centro de Cuenta */}
      <AccountCenterModal
        show={showAccountCenter}
        onHide={() => setShowAccountCenter(false)}
      />
    </>
  );
}

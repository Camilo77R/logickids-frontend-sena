/**
 * TutorTopbar — Barra superior del portal tutor LogicKids
 *
 * Muestra bienvenida dinámica con el nombre del usuario,
 * botones de acción rápida, notificaciones y perfil.
 * Refactorizado aplicando SOLID (SRP).
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, ChevronDown, Star } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import AccountCenterModal from "../../account/AccountCenterModal";

// ==========================================
// Subcomponentes (SOLID: Single Responsibility)
// ==========================================

const TopbarGreeting = ({ firstName }) => (
  <div className="lk-tutor-topbar-greeting-container">
    <div className="lk-tutor-topbar-greeting">
      ¡Hola, {firstName}!
    </div>
    <div className="lk-tutor-topbar-subtitle">
      Aquí tienes un resumen de lo que está pasando hoy.
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

const TopbarLevel = () => (
  <div className="lk-tutor-level" aria-label="Nivel de tutor avanzado">
    <span className="lk-tutor-level__icon"><Star size={19} fill="currentColor" /></span>
    <span><small>Nivel Tutor</small><strong>Avanzado</strong></span>
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
        <div className="lk-tutor-topbar-left">
          <TopbarGreeting firstName={firstName} />
        </div>

        <div className="lk-tutor-topbar-right">
          <TopbarLevel />
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

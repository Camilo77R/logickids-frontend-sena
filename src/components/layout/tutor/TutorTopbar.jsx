import { useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { Bell, Search, Settings } from "lucide-react";
import { motion } from "framer-motion";
import AccountCenterModal from "../../account/AccountCenterModal";

export default function TutorTopbar() {
  const { user } = useAuth();
  const [showAccountCenter, setShowAccountCenter] = useState(false);
  
  const initials = user?.nombre
    ? user.nombre.split(" ").slice(0, 2).map((chunk) => chunk[0]?.toUpperCase()).join("")
    : "TU";

  return (
    <motion.header 
      className="tutor-topbar"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="tutor-topbar-search">
        <Search size={18} className="search-icon" />
        <input type="text" placeholder="Buscar estudiante, grupo, o métrica..." />
      </div>

      <div className="tutor-topbar-actions">
        <button className="tutor-icon-btn">
          <Bell size={20} />
          <span className="tutor-badge">3</span>
        </button>

        <button className="tutor-icon-btn" onClick={() => setShowAccountCenter(true)}>
          <Settings size={20} />
        </button>
        
        <button className="tutor-profile" onClick={() => setShowAccountCenter(true)}>
          <div className="tutor-profile-info">
            <span className="tutor-name">{user?.nombre || "Tutor Demo"}</span>
            <span className="tutor-role">Tutor</span>
          </div>
          <div className="tutor-avatar">
            {initials}
          </div>
        </button>
      </div>

      <AccountCenterModal show={showAccountCenter} onHide={() => setShowAccountCenter(false)} />
    </motion.header>
  );
}

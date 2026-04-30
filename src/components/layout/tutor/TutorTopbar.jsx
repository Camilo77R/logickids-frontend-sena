import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { Bell, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function TutorTopbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const initials = user?.nombre
    ? user.nombre.split(" ").slice(0, 2).map((chunk) => chunk[0]?.toUpperCase()).join("")
    : "TU";

  const handleLogout = () => {
    signOut();
    navigate("/login", { replace: true });
  };

  return (
    <motion.header className="tutor-topbar">
      <div className="tutor-topbar-search">
        <Search size={18} className="search-icon" />
        <input type="text" placeholder="Buscar estudiante, grupo, o métrica..." />
      </div>

      <div className="tutor-topbar-actions">
        <button className="tutor-icon-btn">
          <Bell size={20} />
          <span className="tutor-badge">3</span>
        </button>
        
        {/* ✅ ENLACE AL PERFIL EN ESQUINA DERECHA */}
        <Link to="/tutor/perfil" className="tutor-profile" style={{ textDecoration: 'none' }}>
          <div className="tutor-profile-info">
            <span className="tutor-name">{user?.nombre || "Tutor Demo"}</span>
            <span className="tutor-role">Tutor</span>
          </div>
          <div className="tutor-avatar">{initials}</div>
        </Link>
      </div>
    </motion.header>
  );
}
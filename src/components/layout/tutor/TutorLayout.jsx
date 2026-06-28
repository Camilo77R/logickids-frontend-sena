/**
 * TutorLayout — Layout principal del portal tutor LogicKids
 *
 * Estructura: sidebar fijo (izquierda) + wrapper derecho (topbar + contenido).
 * Usa clases de shared-layout.css. No importa tutor.css (eliminado).
 */
import { motion } from "framer-motion";
import TutorSidebar from "./TutorSidebar";
import TutorTopbar from "./TutorTopbar";
import TutorMobileNav from "./TutorMobileNav";
import "./tutor.css";
import "./tutor-shell-dark.css";

export default function TutorLayout({ children }) {
  return (
    <div className="lk-tutor-shell">
      <TutorSidebar />

      <div className="lk-tutor-main-wrapper">
        <TutorTopbar />
        <TutorMobileNav />

        <motion.main
          className="lk-tutor-content"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

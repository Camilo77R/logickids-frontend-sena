import { motion } from "framer-motion";
import TutorSidebar from "./TutorSidebar";
import TutorTopbar from "./TutorTopbar";
import "./tutor.css";

export default function TutorLayout({ children }) {
  return (
    <div className="tutor-layout-container">
      {/* Background decorativo */}
      <div className="tutor-bg-blob blob-1"></div>
      <div className="tutor-bg-blob blob-2"></div>
      
      <TutorSidebar />
      
      <div className="tutor-main-wrapper">
        <TutorTopbar />
        
        <motion.main 
          className="tutor-main-content"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

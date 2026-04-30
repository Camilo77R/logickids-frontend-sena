// src/pages/Principal.jsx
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Star, Play, LogIn, UserPlus, Brain, Gamepad2, BarChart3, Shield, Users, Trophy } from 'lucide-react';

import './Principal.css';

const Home = () => {
  useEffect(() => {
    document.documentElement.style.setProperty('--scrollbar-width', '15px');
    // Soporte WebP simplificado
    const canvas = document.createElement('canvas');
    if (canvas.toDataURL('image/webp').indexOf('image/webp') === 5) {
      document.documentElement.classList.add('webp');
    }
  }, []);

  return (
    <div className="root">
      <Header />
      <main className="main-content">
        <HomeWelcome />
        <InfoSection />
        <Funciona />
      </main>
      <Footer />
      
    </div>
  );
};

// Componentes reutilizables (extraídos para reducir duplicación)
const SectionHeader = ({ badge, title, description }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true }}
    className="section-header"
  >
    <div className="section-badge">
      <Sparkles className="badge-icon" />
      <span>{badge}</span>
    </div>
    <h2>{title}</h2>
    <p>{description}</p>
  </motion.div>
);

const Card = ({ icon, title, description, color, number, onExplore }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true }}
    whileHover={{ y: -8, scale: 1.02 }}
    className={number ? "funciona-card" : "info-card"}
    style={{ '--card-color': color }}
  >
    <div className={number ? "funciona-card-gradient" : "info-card-gradient"} style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}>
      <div className={number ? "funciona-card-icon" : "info-card-icon"}>
        {number ? (
          <span className="funciona-number">{number}</span>
        ) : (
          <span className="info-emoji">{icon}</span>
        )}
      </div>
    </div>
    <div className={number ? "funciona-card-info" : "info-card-info"}>
      <h3>{title}</h3>
      <p>{description}</p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={number ? "funciona-card-btn" : "info-card-btn"}
        style={{ borderColor: color, color }}
        onMouseEnter={(e) => { e.target.style.background = color; e.target.style.color = 'white'; }}
        onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = color; }}
        onClick={onExplore}
      >
        Explorar →
      </motion.button>
    </div>
  </motion.div>
);

const HomeWelcome = () => {
  const navigate = useNavigate();
  
  const stats = [
    { number: "7-12", label: "Años objetivo" },
    { number: "6+", label: "Habilidades" },
    { number: "100%", label: "Evaluación didáctica" }
  ];

  const cards = [
    { icon: <Brain size={40} />, top: "10%", left: "20%", delay: "0s", color: "#00A1E4" },
    { icon: <Gamepad2 size={40} />, top: "50%", right: "10%", delay: "1s", color: "#00B300" },
    { icon: <BarChart3 size={40} />, bottom: "10%", left: "30%", delay: "2s", color: "#FF6F20" },
    { icon: <Users size={40} />, top: "30%", right: "30%", delay: "0.5s", color: "#A54DA8" }
  ];

  return (
    <section className="welcome-section">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="welcome-content">
          <div className="welcome-text">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="welcome-badge">
              <Sparkles className="badge-icon" />
              <span>Plataforma Educativa</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="welcome-title">
              <span className="title-gradient">LogicKids</span>
              <span className="title-sub">Transforma el juego en evidencia cognitiva</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="welcome-description">
              La plataforma interactiva que evalúa y potencia el talento lógico de los niños en tiempo real, 
              midiendo sus capacidades en un entorno de aulas seguras
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="welcome-stats">
              {stats.map((stat, i) => (
                <div key={i} className="stat">
                  <div className="stat-number">{stat.number}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </motion.div>
            <motion.button 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.6 }} 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }} 
              className="play-now-btn"
              onClick={() => navigate('/registro')}
            >
              <Play className="btn-icon" /> Inicia Ahora
            </motion.button>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="welcome-illustration">
            <div className="floating-cards">
              {cards.map((card, i) => (
                <div key={i} className="float-card" style={{ ...card, position: 'absolute', backgroundColor: card.color }}>
                  {card.icon}
                </div>
              ))}
            </div>
            <div className="gradient-orb"></div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const InfoSection = () => {
  const features = [
    { icon: <Brain size={48} />, title: "Evaluación Cognitiva", description: "Juegos diseñados para evaluar memoria, atención y razonamiento lógico.", color: "#00A1E4" },
    { icon: <Gamepad2 size={48} />, title: "Juegos con Propósito", description: "Cada mini-juego tiene un objetivo educativo específico.", color: "#00B300" },
    { icon: <BarChart3 size={48} />, title: "Reportes para Tutores", description: "Paneles claros que muestran el progreso real del niño.", color: "#FF6F20" },
    { icon: <Shield size={48} />, title: "Entorno Seguro", description: "Aulas controladas por el tutor.", color: "#A54DA8" },
    { icon: <Users size={48} />, title: "Gestión de Grupos", description: "Crea aulas, asigna jóvenes y controla sesiones.", color: "#00A1E4" },
    { icon: <Trophy size={48} />, title: "Gamificación Motivadora", description: "Estrellas, insignias y metas que premian el esfuerzo.", color: "#F6EB61" }
  ];

  return (
    <section className="info-section">
      <div className="container">
        <SectionHeader badge="Capacidades" title="No es otro juego más" description="Cada elemento fue diseñado para generar datos reales sobre el desarrollo cognitivo infantil" />
        <div className="info-grid">
          {features.map((feature, i) => <Card key={i} {...feature} />)}
        </div>
      </div>
    </section>
  );
};

const Funciona = () => {
  const steps = [
    { number: "01", title: "El tutor crea un aula", description: "Registra su cuenta y configura un grupo con códigos de acceso únicos.", color: "#00A1E4" },
    { number: "02", title: "Los jóvenes juegan y aprenden", description: "Ingresan con su clave secreta y completan minijuegos cognitivos.", color: "#00B300" },
    { number: "03", title: "Se generan los datos", description: "Cada interacción se convierte en evidencia cognitiva.", color: "#FF6F20" },
    { number: "04", title: "Recomendaciones personalizadas", description: "El sistema genera un perfil cognitivo y sugiere actividades.", color: "#A54DA8" }
  ];

  return (
    <section className="funciona-section">
      <div className="container">
        <SectionHeader badge="Proceso" title="¿Cómo Funciona?" description="En cuatro pasos simples, de la diversión a la evidencia" />
        <div className="funciona-grid">
          {steps.map((step, i) => <Card key={i} {...step} />)}
        </div>
      </div>
    </section>
  );
};

const Header = () => {
  const navigate = useNavigate();

  return (
    <motion.header initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.5 }} className="header">
      <div className="header-container">
        <Link to="/" className="logo-link">
          <div className="logo-icon">🎮</div>
          <span className="logo-text">LogicKids</span>
        </Link>
        <nav className="header-nav">
          {['Estadísticas', 'Juegos','Tutores'].map(item => (
            <motion.a key={item} href={`/${item.toLowerCase()}`} whileHover={{ y: -2 }}>{item}</motion.a>
          ))}
        </nav>
        <div className="header-actions">
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            className="login-btn"
            onClick={() => navigate('/login')}
          >
            <LogIn className="btn-icon-small" /> Iniciar Sesión
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            className="signup-btn"
            onClick={() => navigate('/registro')}
          >
            <UserPlus className="btn-icon-small" /> Registrarse
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};

const Footer = () => (
  <footer className="footer">
    <div className="footer-container">
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="logo-icon">🎮</span>
            <span className="logo-text">LogicKids</span>
          </div>
          <p className="footer-tagline">Making learning fun since 2024</p>
          <div className="social-links">
            {['📘', '🐦', '📷', '🎵'].map((icon, i) => (
              <a key={i} href="#" className="social-link">{icon}</a>
            ))}
          </div>
        </div>
        <div className="footer-links">
          {[
            { title: "LogicKids", links: ["Sobre Nosotros", "Contacto", "Blog"] },
            { title: "Recursos", links: ["Para Padres", "Para Tutores", "Centro de Ayuda"] },
            { title: "Legal", links: ["Política de Privacidad", "Términos de Uso", "Política de Cookies"] }
          ].map((col, i) => (
            <div key={i} className="footer-column">
              <h4>{col.title}</h4>
              {col.links.map(link => (
                <a key={link} href={`/${link.toLowerCase().replace(/ /g, '')}`}>{link}</a>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 LogicKids. Todos los derechos reservados. Hecho con ❤️ para aprender</p>
      </div>
    </div>
  </footer>
);

export default Home;
import { useEffect, useMemo, useState } from "react";
import { Modal, Spinner } from "react-bootstrap";
import { useAuth } from "../../hooks/useAuth";

const getRoleLabel = (role) => {
  if (role === "superadmin") return "Superadmin";
  if (role === "admin") return "Administrador";
  if (role === "tutor") return "Tutor";
  return "Usuario";
};

const mapErrorMessage = (error, fallback) => {
  if (!error) return fallback;
  if (Array.isArray(error.details) && error.details.length > 0) {
    return error.details.map((detail) => detail.message).join(" ");
  }
  return error.message || fallback;
};

export default function AccountCenterModal({ show, onHide }) {
  const { user, updateProfile, changePassword } = useAuth();

  const [nombre, setNombre] = useState("");
  const [passwords, setPasswords] = useState({ actual: "", nueva: "", confirmar: "" });
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!show) return;
    setNombre(user?.nombre ?? "");
    setPasswords({ actual: "", nueva: "", confirmar: "" });
    setFeedback(null);
  }, [show, user]);

  const roleLabel = useMemo(() => getRoleLabel(user?.rol), [user?.rol]);
  const initials = user?.nombre ? user.nombre.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") : "TU";

  const handleSave = async (e) => {
    e.preventDefault();
    setFeedback(null);

    // Si solo cambia el nombre
    if (!passwords.actual && !passwords.nueva) {
      if (nombre.trim() === user?.nombre) {
        onHide();
        return;
      }
      if (nombre.trim().length < 2) {
        return setFeedback({ type: "error", msg: "El nombre debe tener al menos 2 caracteres." });
      }
      try {
        setIsLoading(true);
        await updateProfile({ nombre: nombre.trim() });
        setFeedback({ type: "success", msg: "Perfil actualizado." });
        setTimeout(onHide, 1500);
      } catch (err) {
        setFeedback({ type: "error", msg: mapErrorMessage(err, "Error al actualizar.") });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Si cambia la contraseña
    if (!passwords.actual) return setFeedback({ type: "error", msg: "Ingresa tu contraseña actual." });
    if (passwords.nueva.length < 8) return setFeedback({ type: "error", msg: "La nueva contraseña debe tener 8+ caracteres." });
    if (passwords.nueva !== passwords.confirmar) return setFeedback({ type: "error", msg: "Las contraseñas no coinciden." });

    try {
      setIsLoading(true);
      if (nombre.trim() !== user?.nombre) await updateProfile({ nombre: nombre.trim() });
      await changePassword({ contrasena_actual: passwords.actual, contrasena_nueva: passwords.nueva });
      setFeedback({ type: "success", msg: "Datos actualizados correctamente." });
      setTimeout(onHide, 1500);
    } catch (err) {
      setFeedback({ type: "error", msg: mapErrorMessage(err, "Error al guardar.") });
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.7rem 1rem',
    borderRadius: '999px',
    border: '1.5px solid var(--lk-border)',
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'var(--lk-text)',
    outline: 'none',
    marginBottom: '0.9rem',
    boxShadow: 'var(--lk-shadow-sm)'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--lk-text-soft)',
    marginBottom: '0.3rem',
    paddingLeft: '0.5rem'
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Body style={{ padding: '2rem', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
        {/* Cabecera / Info de Usuario */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.8rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--lk-brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700 }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontFamily: '"Fredoka", system-ui, sans-serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--lk-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Mi Perfil
            </h2>
            <div style={{ fontSize: '0.9rem', color: 'var(--lk-text-soft)', fontWeight: 500, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </div>
            <div style={{ display: 'inline-block', marginTop: '5px', padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'var(--lk-brand-soft)', color: 'var(--lk-brand)', fontSize: '0.75rem', fontWeight: 700 }}>
              Rol: {roleLabel}
            </div>
          </div>
        </div>

        {feedback && (
          <div style={{ padding: '0.6rem 1rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center', marginBottom: '1rem', background: feedback.type === 'success' ? 'var(--lk-success-soft)' : 'var(--lk-danger-soft)', color: feedback.type === 'success' ? 'var(--lk-success)' : 'var(--lk-danger)' }}>
            {feedback.msg}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div>
            <label style={labelStyle}>Nombre visible</label>
            <input 
              type="text" 
              style={inputStyle} 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              placeholder="Tu nombre" 
            />
          </div>

          <div style={{ margin: '1rem 0 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--lk-brand)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Cambiar Contraseña (Opcional)
          </div>

          <div>
            <label style={labelStyle}>Contraseña actual</label>
            <input 
              type="password" 
              style={inputStyle} 
              value={passwords.actual} 
              onChange={(e) => setPasswords({...passwords, actual: e.target.value})} 
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Nueva</label>
              <input 
                type="password" 
                style={inputStyle} 
                value={passwords.nueva} 
                onChange={(e) => setPasswords({...passwords, nueva: e.target.value})} 
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Confirmar</label>
              <input 
                type="password" 
                style={inputStyle} 
                value={passwords.confirmar} 
                onChange={(e) => setPasswords({...passwords, confirmar: e.target.value})} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button 
              type="button" 
              onClick={onHide}
              style={{ flex: 1, padding: '0.7rem', borderRadius: '999px', background: 'var(--lk-surface-soft)', color: 'var(--lk-text-soft)', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              style={{ flex: 1, padding: '0.7rem', borderRadius: '999px', background: 'var(--lk-brand)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px var(--lk-brand-glow)' }}
            >
              {isLoading ? <Spinner size="sm" /> : "Guardar"}
            </button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
}

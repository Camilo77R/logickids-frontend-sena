import { useEffect, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import tutorService from "../../services/tutorService";
import { useAuth } from "../../hooks/useAuth";

export default function TutorProfilePage() {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await tutorService.getProfile();
        setProfile(data);
        setForm(data);
      } catch (err) {
        setError("No se pudo cargar el perfil del tutor.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setSuccess("");
    setError("");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setForm(profile);
    setSuccess("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        nombre: form.nombre,
      };
      const updated = await tutorService.updateProfile(payload);
      setProfile(updated);
      updateUser(updated);
      setIsEditing(false);
      setSuccess("Perfil actualizado correctamente.");
    } catch (err) {
      setError("No se pudo actualizar el perfil.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AppShell title="Perfil"><div className="lk-empty" style={{ textAlign: 'center' }}>Cargando información personal...</div></AppShell>;
  if (error) return <AppShell title="Perfil"><div className="lk-alert lk-alert--error">{error}</div></AppShell>;
  if (!profile) return null;

  return (
    <AppShell title="Mi Perfil" description="Visualiza y actualiza tu información personal">
      <div className="lk-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>Datos Personales</h2>
        
        {success && <div className="lk-alert lk-alert--success" style={{ marginBottom: '1.5rem' }}>{success}</div>}
        
        <form onSubmit={handleSubmit} className="lk-form-grid">
          <div className="lk-field">
            <label>Nombre Completo</label>
            <input 
              name="nombre" 
              value={form.nombre || ""} 
              onChange={handleChange} 
              disabled={!isEditing} 
              required 
              style={{ fontSize: '1.05rem', padding: '0.8rem 1rem' }}
            />
          </div>
          
          <div className="lk-field">
            <label>Correo Electrónico (No editable)</label>
            <input 
              name="email" 
              value={form.email || ""} 
              onChange={handleChange} 
              disabled 
              readOnly 
              style={{ opacity: 0.7, background: 'var(--lk-color-surface-soft)' }}
            />
          </div>
          
          <div className="lk-actions" style={{ marginTop: '2rem', justifyContent: 'flex-end', borderTop: '1px solid var(--lk-color-border)', paddingTop: '1.5rem' }}>
            {isEditing ? (
              <>
                <button type="button" className="lk-btn lk-btn--secondary" onClick={handleCancel} disabled={loading}>
                  Cancelar
                </button>
                <button type="submit" className="lk-btn lk-btn--primary" disabled={loading}>
                  Guardar Cambios
                </button>
              </>
            ) : (
              <button type="button" className="lk-btn lk-btn--primary" onClick={handleEdit}>
                Editar Perfil
              </button>
            )}
          </div>
        </form>
      </div>
    </AppShell>
  );
}

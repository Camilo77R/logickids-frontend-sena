import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Send, CheckCircle, Mail, FileText, MessageSquare } from 'lucide-react';
import { request } from '../services/httpClient';

export default function SolicitarReactivacionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailParam = location.state?.email || '';

  const [formData, setFormData] = useState({
    email: emailParam,           // email de la cuenta (no editable)
    correo_respuesta: '',        // correo para recibir respuesta (opcional)
    motivo: '',
    descripcion: ''
  });
  const [status, setStatus] = useState({
    loading: false,
    error: '',
    success: false
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setStatus({ ...status, error: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: false });

    try {
      await request('/solicitudes/reactivacion', {
        method: 'POST',
        auth: false,
        body: {
          email: formData.email,
          correo_respuesta: formData.correo_respuesta,
          motivo: formData.motivo,
          descripcion: formData.descripcion,
        },
      });

      setStatus({ loading: false, error: '', success: true });
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: false });
    }
  };

  if (status.success) {
    return (
      <div className="lk-auth-page">
        <div className="lk-auth-shell lk-auth-shell--single">
          <div className="lk-auth-card" style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <CheckCircle size={64} color="#10b981" strokeWidth={1.5} />
            </div>
            <h1 style={{ color: '#10b981', marginBottom: '1rem', fontSize: '1.75rem' }}>¡Solicitud Enviada!</h1>
            <p style={{ marginBottom: '0.5rem', color: '#374151' }}>
              Tu solicitud de reactivación ha sido enviada correctamente.
            </p>
            <p style={{ marginBottom: '2rem', color: '#6b7280', fontSize: '0.9rem' }}>
              Recibirás la respuesta en: <strong>{formData.correo_respuesta || formData.email}</strong>
            </p>
            <button
              onClick={() => navigate('/login')}
              className="lk-btn lk-btn--primary"
              style={{ width: '100%' }}
            >
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lk-auth-page">
      <div className="lk-auth-shell lk-auth-shell--single">
        <div className="lk-auth-card">
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div style={{
              padding: '0.5rem',
              background: '#fee2e2',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertCircle size={28} color="#dc2626" strokeWidth={1.5} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1f2937' }}>Cuenta Suspendida</h1>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                Solicita la reactivación de tu cuenta
              </p>
            </div>
          </div>

          {/* Mensaje de advertencia */}
          <div style={{
            background: '#fef3c7',
            borderLeft: '4px solid #f59e0b',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#92400e' }}>
              Tu cuenta ha sido suspendida por el administrador. Completa el formulario para solicitar la reactivación.
            </p>
          </div>

          {/* Error */}
          {status.error && (
            <div style={{
              background: '#fee2e2',
              borderLeft: '4px solid #dc2626',
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#991b1b' }}>{status.error}</p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit}>
            {/* Campo: Email de la cuenta (solo lectura) */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                <Mail size={14} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Email de tu cuenta *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                readOnly
                disabled
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  backgroundColor: '#f3f4f6',
                  cursor: 'not-allowed'
                }}
              />
              <small style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.7rem', color: '#6b7280' }}>
                Esta es la cuenta que será reactivada
              </small>
            </div>

            {/* Campo: Correo para recibir respuesta (opcional) */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                <Mail size={14} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Correo para recibir la respuesta (opcional)
              </label>
              <input
                type="email"
                name="correo_respuesta"
                value={formData.correo_respuesta}
                onChange={handleChange}
                placeholder="tucorreo@ejemplo.com"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1796ED'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
              <small style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.7rem', color: '#6b7280' }}>
                Si no especificas, recibirás la respuesta en tu email de cuenta ({formData.email})
              </small>
            </div>

            {/* Campo: Motivo */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                <FileText size={14} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Motivo de la solicitud *
              </label>
              <input
                type="text"
                name="motivo"
                value={formData.motivo}
                onChange={handleChange}
                required
                placeholder="Ej: Olvidé cerrar sesión, malentendido, etc."
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1796ED'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Campo: Descripción */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                <MessageSquare size={14} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Descripción (opcional)
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows="4"
                placeholder="Explica con más detalle tu situación..."
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1796ED'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Botones */}
            <button
              type="submit"
              disabled={status.loading}
              className="lk-btn lk-btn--primary"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                fontSize: '0.9rem'
              }}
            >
              {status.loading ? (
                'Enviando...'
              ) : (
                <>
                  <Send size={18} />
                  Enviar solicitud
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="lk-btn lk-btn--secondary"
              style={{
                width: '100%',
                marginTop: '0.75rem',
                padding: '0.75rem',
                fontSize: '0.9rem'
              }}
            >
              Volver al inicio de sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

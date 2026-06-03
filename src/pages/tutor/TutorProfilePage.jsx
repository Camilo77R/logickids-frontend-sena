import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Modal } from 'react-bootstrap';
import { Pencil, Save, X, Mail, User, Award, Calendar, Key, Eye, EyeOff } from 'lucide-react';
import authService from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

export default function TutorProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ nombre: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estado para el modal de cambio de contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    contrasenaActual: '',
    contrasenaNueva: '',
    confirmarNueva: ''
  });
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const loadProfile = async () => {
    try {
      const data = await authService.getProfile();
      setProfile(data);
      setForm({ nombre: data.nombre || '' });
    } catch (err) {
      setError('No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
  const colorIndex = (profile?.nombre?.length || 0) % colors.length;
  const avatarColor = colors[colorIndex];

  const initials = profile?.nombre
    ? profile.nombre.split(" ").slice(0, 2).map((chunk) => chunk[0]?.toUpperCase()).join("")
    : "U";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setForm({ nombre: profile.nombre || '' });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await authService.updateProfile({ nombre: form.nombre.trim() });
      await loadProfile();
      if (updateUser) {
        updateUser({ nombre: form.nombre.trim() });
      }
      setIsEditing(false);
      setSuccess('Perfil actualizado correctamente');
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  // ================== CAMBIO DE CONTRASEÑA ==================
  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setPasswordError('');
    setPasswordSuccess('');
  };

  const openPasswordModal = () => {
    setPasswordData({ contrasenaActual: '', contrasenaNueva: '', confirmarNueva: '' });
    setPasswordError('');
    setPasswordSuccess('');
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.contrasenaNueva !== passwordData.confirmarNueva) {
      setPasswordError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (passwordData.contrasenaNueva.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (passwordData.contrasenaNueva === passwordData.contrasenaActual) {
      setPasswordError('La contraseña nueva debe ser diferente a la actual');
      return;
    }

    setPasswordSaving(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      await authService.cambiarContrasena({
        contrasenaActual: passwordData.contrasenaActual,
        contrasenaNueva: passwordData.contrasenaNueva
      });
      setPasswordSuccess('Contraseña actualizada correctamente');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordData({ contrasenaActual: '', contrasenaNueva: '', confirmarNueva: '' });
      }, 1500);
    } catch (err) {
      setPasswordError(err.message || 'Error al cambiar la contraseña');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={7}>
          {/* Header */}
          <div className="text-center mb-4">
            <div 
              className="mx-auto mb-3 d-flex align-items-center justify-content-center"
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: avatarColor,
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)'
              }}
            >
              <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>
                {initials}
              </span>
            </div>
            <h2 className="mb-1" style={{ fontSize: '1.8rem' }}>{profile?.nombre}</h2>
            <div className="d-flex justify-content-center gap-2 mt-2">
              <span className="badge bg-primary px-3 py-1 rounded-pill fw-normal">Tutor</span>
              <span className="badge bg-success px-3 py-1 rounded-pill fw-normal">Verificado</span>
            </div>
          </div>

          {error && <Alert variant="danger" className="text-center py-2">{error}</Alert>}
          {success && <Alert variant="success" className="text-center py-2">{success}</Alert>}

          {/* Tarjeta */}
          <Card className="border-0 shadow-sm" style={{ borderRadius: '20px' }}>
            <div style={{ 
              background: '#8E35D5',
              padding: '14px 24px',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              color: 'white'
            }}>
              <h5 className="mb-0 fw-semibold">Información Personal</h5>
              <small className="opacity-75">Tus datos de cuenta</small>
            </div>
            
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold mb-2">
                    <User size={16} className="me-1" /> Nombre completo
                  </Form.Label>
                  <div className="position-relative">
                    <Form.Control 
                      type="text" 
                      name="nombre"
                      value={form.nombre}
                      onChange={handleChange}
                      disabled={!isEditing}
                      required
                      style={{
                        padding: '10px 16px',
                        borderRadius: '12px',
                        border: '1px solid #e0e0e0',
                        backgroundColor: isEditing ? '#fff' : '#f8f9fa'
                      }}
                    />
                    {!isEditing && (
                      <Button
                        variant="link"
                        onClick={handleEdit}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#667eea',
                          textDecoration: 'none'
                        }}
                      >
                        <Pencil size={16} /> Editar
                      </Button>
                    )}
                  </div>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold mb-2">
                    <Mail size={16} className="me-1" /> Correo electrónico
                  </Form.Label>
                  <Form.Control 
                    type="email" 
                    value={profile?.email || ''} 
                    disabled 
                    style={{ padding: '10px 16px', borderRadius: '12px', backgroundColor: '#f8f9fa' }}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold mb-2">
                    <Award size={16} className="me-1" /> Rol
                  </Form.Label>
                  <Form.Control 
                    type="text" 
                    value="Tutor" 
                    disabled 
                    style={{ padding: '10px 16px', borderRadius: '12px', backgroundColor: '#f8f9fa' }}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold mb-2">
                    <Calendar size={16} className="me-1" /> Miembro desde
                  </Form.Label>
                  <Form.Control 
                    type="text" 
                    value={profile?.creado_en ? new Date(profile.creado_en).toLocaleDateString('es-ES') : 'fecha no disponible'} 
                    disabled 
                    style={{ padding: '10px 16px', borderRadius: '12px', backgroundColor: '#f8f9fa' }}
                  />
                </Form.Group>

                {isEditing && (
                  <div className="d-flex gap-3 mt-4 pt-2 border-top">
                    <Button variant="outline-secondary" onClick={handleCancel} className="px-4 py-2 rounded-pill">
                      <X size={16} className="me-1" /> Cancelar
                    </Button>
                    <Button variant="primary" type="submit" disabled={saving} className="px-4 py-2 rounded-pill" style={{ background: '#667eea', border: 'none' }}>
                      <Save size={16} className="me-1" /> {saving ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                  </div>
                )}
              </Form>

              {/* Botón Cambiar Contraseña */}
              <div className="mt-4 pt-3 border-top text-center">
                <Button 
                  variant="outline-secondary" 
                  onClick={openPasswordModal}
                  className="px-4 py-2 rounded-pill"
                >
                  <Key size={16} className="me-1" /> Cambiar Contraseña
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal Cambiar Contraseña */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cambiar Contraseña</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {passwordError && <Alert variant="danger">{passwordError}</Alert>}
          {passwordSuccess && <Alert variant="success">{passwordSuccess}</Alert>}

          <Form onSubmit={handlePasswordSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Contraseña actual</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type={showActual ? "text" : "password"}
                  name="contrasenaActual"
                  value={passwordData.contrasenaActual}
                  onChange={handlePasswordChange}
                  required
                  style={{ paddingRight: '40px' }}
                />
                <Button
                  variant="link"
                  type="button"
                  onClick={() => setShowActual(!showActual)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '4px 8px',
                    color: '#667eea'
                  }}
                >
                  {showActual ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Contraseña nueva</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type={showNueva ? "text" : "password"}
                  name="contrasenaNueva"
                  value={passwordData.contrasenaNueva}
                  onChange={handlePasswordChange}
                  required
                  style={{ paddingRight: '40px' }}
                />
                <Button
                  variant="link"
                  type="button"
                  onClick={() => setShowNueva(!showNueva)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '4px 8px',
                    color: '#667eea'
                  }}
                >
                  {showNueva ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              <Form.Text className="text-muted">Mínimo 6 caracteres</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirmar contraseña nueva</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type={showConfirm ? "text" : "password"}
                  name="confirmarNueva"
                  value={passwordData.confirmarNueva}
                  onChange={handlePasswordChange}
                  required
                  style={{ paddingRight: '40px' }}
                />
                <Button
                  variant="link"
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '4px 8px',
                    color: '#667eea'
                  }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </Form.Group>

            <div className="d-flex gap-2 justify-content-end mt-4">
              <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit" disabled={passwordSaving} style={{ background: '#667eea', border: 'none' }}>
                {passwordSaving ? 'Actualizando...' : 'Actualizar contraseña'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

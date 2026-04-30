import { useState, useEffect } from 'react';
import { Container, Card, Form, Alert, Spinner } from 'react-bootstrap';
import authService from '../../services/authService';

export default function TutorProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authService.getProfile();
        setProfile(data);
      } catch (err) {
        setError('No se pudo cargar el perfil');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Iniciales para el avatar
  const initials = profile?.nombre
    ? profile.nombre.split(" ").slice(0, 2).map((chunk) => chunk[0]?.toUpperCase()).join("")
    : "U";

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Cargando perfil...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      {/* === AVATAR GRANDE CON INICIALES === */}
      <div className="text-center mb-4">
        <div 
          className="profile-avatar-large mx-auto"
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '1rem',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)'
          }}
        >
          {initials}
        </div>
        <h1 className="mb-1">{profile?.nombre}</h1>
        <p className="text-muted">
          <span className="badge bg-primary">Tutor</span>
          {' '}
          <span className="badge bg-success">✓ Cuenta verificada</span>
        </p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* === TARJETA DE INFORMACIÓN === */}
      <Card style={{ maxWidth: '600px', margin: '0 auto', borderRadius: '20px' }}>
        <Card.Body>
          <h4 className="mb-4">Información Personal</h4>
          
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>👤 Nombre completo</Form.Label>
              <Form.Control 
                type="text" 
                value={profile?.nombre || ''} 
                disabled 
                style={{ backgroundColor: '#f8f9fa' }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>📧 Correo electrónico</Form.Label>
              <Form.Control 
                type="email" 
                value={profile?.email || ''} 
                disabled 
                style={{ backgroundColor: '#f8f9fa' }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>🎓 Rol</Form.Label>
              <Form.Control 
                type="text" 
                value="Tutor" 
                disabled 
                style={{ backgroundColor: '#f8f9fa' }}
              />
            </Form.Group>

            <hr />

            <div className="text-center text-muted">
              <small>Miembro desde {profile?.creado_en ? new Date(profile.creado_en).toLocaleDateString('es-ES') : 'fecha no disponible'}</small>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
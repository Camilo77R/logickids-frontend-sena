import { render, screen, act } from '@testing-library/react';
import { AuthProvider } from '../../src/context/AuthContext';

const storedSession = { token: null, user: null };

vi.mock('../../src/utils/sessionStorage', () => ({
  getStoredSession: vi.fn(() => storedSession.token ? storedSession : null),
  saveStoredSession: vi.fn((s) => { storedSession.token = s.token; storedSession.user = s.user; }),
  clearStoredSession: vi.fn(() => { storedSession.token = null; storedSession.user = null; }),
}));

vi.mock('../../src/services/authService', () => ({
  default: {
    login: vi.fn().mockResolvedValue({ token: 'mock-token', user: { id: 1, nombre: 'Test', rol: 'tutor' } }),
    getProfile: vi.fn().mockResolvedValue({ id: 1, nombre: 'Test', rol: 'tutor' }),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  },
}));

import { useAuth } from '../../src/hooks/useAuth';

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../src/utils/paths', () => ({
  getHomePathByRole: vi.fn(() => '/tutor/dashboard'),
}));

function TestConsumer({ onValue }) {
  return null;
}

describe('AuthProvider (integrado con useAuth mock)', () => {
  it('envuelve children sin errores', () => {
    render(<AuthProvider><div>Hijo</div></AuthProvider>);
    expect(screen.getByText('Hijo')).toBeInTheDocument();
  });
});
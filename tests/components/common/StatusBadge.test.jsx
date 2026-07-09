import { render, screen } from '@testing-library/react';
import StatusBadge from '../../../src/components/common/StatusBadge';

describe('StatusBadge', () => {
  it('renderiza label explícito', () => {
    render(<StatusBadge label="Mi estado" variant="activo" />);
    expect(screen.getByText('Mi estado')).toBeInTheDocument();
  });

  it('usa label por defecto del config si no se pasa label', () => {
    render(<StatusBadge variant="activo" />);
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('normaliza variante suspendido', () => {
    render(<StatusBadge variant="suspendido" />);
    expect(screen.getByText('Suspendido')).toBeInTheDocument();
  });

  it('usa pendiente como fallback para variante desconocida', () => {
    render(<StatusBadge variant="desconocido" />);
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('tiene clase lk-status-badge', () => {
    const { container } = render(<StatusBadge variant="activo" />);
    expect(container.querySelector('.lk-status-badge')).toBeInTheDocument();
  });

  it('normaliza variante abierta a activo (label = Activo)', () => {
    render(<StatusBadge variant="abierta" />);
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });
});
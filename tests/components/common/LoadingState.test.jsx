import { render, screen } from '@testing-library/react';
import LoadingState from '../../../src/components/common/LoadingState';

describe('LoadingState', () => {
  it('renderiza mensaje por defecto', () => {
    render(<LoadingState />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('renderiza mensaje personalizado', () => {
    render(<LoadingState message="Procesando..." />);
    expect(screen.getByText('Procesando...')).toBeInTheDocument();
  });

  it('incluye el spinner', () => {
    const { container } = render(<LoadingState />);
    expect(container.querySelector('.lk-spinner')).toBeInTheDocument();
  });
});
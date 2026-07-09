import { render, screen } from '@testing-library/react';
import EmptyState from '../../../src/components/common/EmptyState';

describe('EmptyState', () => {
  it('renderiza título y descripción', () => {
    render(<EmptyState title="Sin datos" description="No hay registros disponibles" />);
    expect(screen.getByText('Sin datos')).toBeInTheDocument();
    expect(screen.getByText('No hay registros disponibles')).toBeInTheDocument();
  });

  it('tiene la clase lk-empty', () => {
    const { container } = render(<EmptyState title="Test" description="Desc" />);
    expect(container.firstChild).toHaveClass('lk-empty');
  });
});
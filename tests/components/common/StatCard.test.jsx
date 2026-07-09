import { render, screen } from '@testing-library/react';
import StatCard from '../../../src/components/common/StatCard';

describe('StatCard', () => {
  it('renderiza label, value y helpText', () => {
    render(<StatCard label="Alumnos" value="24" helpText="Este mes" />);
    expect(screen.getByText('Alumnos')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('Este mes')).toBeInTheDocument();
  });

  it('usa tone por defecto blue', () => {
    const { container } = render(<StatCard label="Test" value="0" />);
    expect(container.querySelector('.lk-stat-card--blue')).toBeInTheDocument();
  });

  it('aplica tone personalizado', () => {
    const { container } = render(<StatCard label="Test" value="0" tone="green" />);
    expect(container.querySelector('.lk-stat-card--green')).toBeInTheDocument();
  });
});
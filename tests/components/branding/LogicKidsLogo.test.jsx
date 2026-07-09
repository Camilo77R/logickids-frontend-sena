import { render } from '@testing-library/react';
import LogicKidsLogo from '../../../src/components/branding/LogicKidsLogo';

describe('LogicKidsLogo', () => {
  it('renderiza un svg', () => {
    const { container } = render(<LogicKidsLogo />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('usa tamaño por defecto 44', () => {
    const { container } = render(<LogicKidsLogo />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '44');
    expect(svg).toHaveAttribute('height', '44');
  });

  it('usa tamaño personalizado', () => {
    const { container } = render(<LogicKidsLogo size={80} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '80');
    expect(svg).toHaveAttribute('height', '80');
  });

  it('es aria-hidden', () => {
    const { container } = render(<LogicKidsLogo />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
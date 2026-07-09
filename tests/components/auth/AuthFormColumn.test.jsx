import { render, screen } from '@testing-library/react';
import AuthFormColumn from '../../../src/components/auth/form/AuthFormColumn';

describe('AuthFormColumn', () => {
  it('renderiza children', () => {
    render(<AuthFormColumn><span>Contenido</span></AuthFormColumn>);
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('tiene clases base', () => {
    const { container } = render(<AuthFormColumn>Test</AuthFormColumn>);
    const div = container.firstChild;
    expect(div.className).toContain('lk-auth-right');
    expect(div.className).toContain('w-100');
  });

  it('acepta className adicional', () => {
    const { container } = render(<AuthFormColumn className="mi-clase">Test</AuthFormColumn>);
    expect(container.firstChild.className).toContain('mi-clase');
  });
});
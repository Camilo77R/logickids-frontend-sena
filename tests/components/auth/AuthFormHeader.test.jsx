import { render, screen } from '@testing-library/react';
import AuthFormHeader from '../../../src/components/auth/form/AuthFormHeader';

describe('AuthFormHeader', () => {
  it('renderiza título y subtítulo', () => {
    render(<AuthFormHeader title="Login" subtitle="Ingresa tus datos" />);
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Ingresa tus datos')).toBeInTheDocument();
  });

  it('no muestra subtítulo si no se pasa', () => {
    const { container } = render(<AuthFormHeader title="Solo título" />);
    expect(screen.getByText('Solo título')).toBeInTheDocument();
    expect(container.querySelector('.lk-card-sub')).not.toBeInTheDocument();
  });

  it('muestra ícono si showIcon e iconSrc están presentes', () => {
    render(<AuthFormHeader title="T" iconSrc="/icon.png" iconAlt="Ícono" />);
    const img = screen.getByAltText('Ícono');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/icon.png');
  });

  it('oculta ícono si showIcon es false', () => {
    const { container } = render(
      <AuthFormHeader title="T" iconSrc="/icon.png" iconAlt="Ícono" showIcon={false} />
    );
    expect(container.querySelector('.lk-form-icon-wrap')).not.toBeInTheDocument();
  });

  it('aplica variante al header', () => {
    const { container } = render(<AuthFormHeader title="T" variant="warning" />);
    expect(container.querySelector('.lk-card-header--warning')).toBeInTheDocument();
  });
});
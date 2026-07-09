import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LkIconTextField from '../../../src/components/auth/form/LkIconTextField';

const MockIcon = () => <svg data-testid="mock-icon" />;

describe('LkIconTextField', () => {
  it('renderiza label e input', () => {
    render(<LkIconTextField id="email" name="email" label="Correo" />);
    expect(screen.getByText('Correo')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('asocia label con input mediante htmlFor', () => {
    render(<LkIconTextField id="email" name="email" label="Correo" />);
    expect(screen.getByLabelText('Correo')).toBeInTheDocument();
  });

  it('renderiza el ícono si se pasa', () => {
    render(<LkIconTextField id="e" name="e" label="E" icon={MockIcon} />);
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('muestra error si se pasa', () => {
    render(<LkIconTextField id="e" name="e" label="E" error="Campo requerido" />);
    expect(screen.getByText('Campo requerido')).toBeInTheDocument();
  });

  it('aplica clase de error al input', () => {
    render(<LkIconTextField id="e" name="e" label="E" error="Error" />);
    expect(screen.getByRole('textbox')).toHaveClass('lk-input--err');
  });

  it('dispara onChange al escribir', async () => {
    const handleChange = vi.fn();
    render(<LkIconTextField id="e" name="e" label="E" onChange={handleChange} />);
    await userEvent.type(screen.getByRole('textbox'), 'a');
    expect(handleChange).toHaveBeenCalled();
  });
});
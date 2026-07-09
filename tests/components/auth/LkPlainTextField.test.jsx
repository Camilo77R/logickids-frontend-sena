import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LkPlainTextField from '../../../src/components/auth/form/LkPlainTextField';

describe('LkPlainTextField', () => {
  it('renderiza label e input', () => {
    render(<LkPlainTextField id="nombre" name="nombre" label="Nombre" />);
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('asocia label con input', () => {
    render(<LkPlainTextField id="nombre" name="nombre" label="Nombre" />);
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
  });

  it('muestra error si se pasa', () => {
    render(<LkPlainTextField id="n" name="n" label="N" error="Requerido" />);
    expect(screen.getByText('Requerido')).toBeInTheDocument();
  });

  it('aplica clase error al input', () => {
    render(<LkPlainTextField id="n" name="n" label="N" error="Error" />);
    expect(screen.getByRole('textbox')).toHaveClass('lk-input--err');
  });

  it('dispara onChange', async () => {
    const handleChange = vi.fn();
    render(<LkPlainTextField id="n" name="n" label="N" onChange={handleChange} />);
    await userEvent.type(screen.getByRole('textbox'), 'x');
    expect(handleChange).toHaveBeenCalled();
  });

  it('acepta type password', () => {
    render(<LkPlainTextField id="p" name="p" label="Password" type="password" />);
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });
});
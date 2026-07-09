import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LkSelectField from '../../../src/components/auth/form/LkSelectField';

describe('LkSelectField', () => {
  it('renderiza label y select', () => {
    render(
      <LkSelectField id="rol" name="rol" label="Rol">
        <option value="tutor">Tutor</option>
      </LkSelectField>
    );
    expect(screen.getByText('Rol')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('asocia label con select', () => {
    render(
      <LkSelectField id="rol" name="rol" label="Rol">
        <option value="tutor">Tutor</option>
      </LkSelectField>
    );
    expect(screen.getByLabelText('Rol')).toBeInTheDocument();
  });

  it('renderiza placeholderOption', () => {
    render(
      <LkSelectField id="r" name="r" label="Rol" placeholderOption={<option value="">Seleccione</option>}>
        <option value="tutor">Tutor</option>
      </LkSelectField>
    );
    expect(screen.getByText('Seleccione')).toBeInTheDocument();
  });

  it('muestra error si se pasa', () => {
    render(
      <LkSelectField id="r" name="r" label="Rol" error="Campo requerido">
        <option value="tutor">Tutor</option>
      </LkSelectField>
    );
    expect(screen.getByText('Campo requerido')).toBeInTheDocument();
  });

  it('dispara onChange', async () => {
    const handleChange = vi.fn();
    render(
      <LkSelectField id="r" name="r" label="Rol" onChange={handleChange}>
        <option value="">Seleccione</option>
        <option value="tutor">Tutor</option>
      </LkSelectField>
    );
    await userEvent.selectOptions(screen.getByRole('combobox'), 'tutor');
    expect(handleChange).toHaveBeenCalled();
  });
});
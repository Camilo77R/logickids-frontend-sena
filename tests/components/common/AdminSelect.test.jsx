import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminSelect from '../../../src/components/common/AdminSelect';

const options = [
  { value: 1, label: 'Opción 1' },
  { value: 2, label: 'Opción 2' },
  { value: 3, label: 'Opción 3', description: 'Descripción 3' },
];

describe('AdminSelect', () => {
  it('renderiza el placeholder por defecto', () => {
    render(<AdminSelect options={options} onChange={vi.fn()} />);
    expect(screen.getByText('Selecciona una opcion')).toBeInTheDocument();
  });

  it('muestra la opción seleccionada', () => {
    render(<AdminSelect options={options} value={1} onChange={vi.fn()} />);
    expect(screen.getByText('Opción 1')).toBeInTheDocument();
  });

  it('abre el menú al hacer clic', async () => {
    render(<AdminSelect options={options} onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('cierra el menú al seleccionar una opción', async () => {
    const onChange = vi.fn();
    render(<AdminSelect options={options} searchable={false} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByText('Opción 2'));
    expect(onChange).toHaveBeenCalledWith(2);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('muestra descripción de la opción seleccionada', () => {
    render(<AdminSelect options={options} value={3} onChange={vi.fn()} />);
    expect(screen.getByText('Descripción 3')).toBeInTheDocument();
  });

  it('puede estar deshabilitado', () => {
    render(<AdminSelect options={options} disabled onChange={vi.fn()} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('no muestra search si options < searchMinOptions', () => {
    render(<AdminSelect options={options} onChange={vi.fn()} />);
    expect(screen.queryByPlaceholderText('Buscar...')).not.toBeInTheDocument();
  });
});
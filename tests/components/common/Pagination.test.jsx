import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from '../../../src/components/common/Pagination';

describe('Pagination', () => {
  it('retorna null si totalItems <= pageSize', () => {
    const { container } = render(<Pagination currentPage={1} totalItems={5} onPageChange={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renderiza navegación si hay más de una página', () => {
    render(<Pagination currentPage={1} totalItems={25} pageSize={10} onPageChange={vi.fn()} />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('1-10 de 25 registros')).toBeInTheDocument();
  });

  it('renderiza botones de página', () => {
    render(<Pagination currentPage={1} totalItems={30} pageSize={10} onPageChange={vi.fn()} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('marca página actual como activa', () => {
    render(<Pagination currentPage={2} totalItems={30} pageSize={10} onPageChange={vi.fn()} />);
    const activeBtn = screen.getByText('2');
    expect(activeBtn.className).toContain('is-active');
  });

  it('llama onPageChange al hacer clic en página', async () => {
    const onChange = vi.fn();
    render(<Pagination currentPage={1} totalItems={30} pageSize={10} onPageChange={onChange} />);
    await userEvent.click(screen.getByText('2'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('deshabilita botón anterior en primera página', () => {
    render(<Pagination currentPage={1} totalItems={30} pageSize={10} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText('Página anterior')).toBeDisabled();
  });

  it('deshabilita botón siguiente en última página', () => {
    render(<Pagination currentPage={3} totalItems={30} pageSize={10} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText('Página siguiente')).toBeDisabled();
  });

  it('usa pluralLabel si se proporciona', () => {
    render(
      <Pagination currentPage={1} totalItems={25} pageSize={10} itemLabel="alumno" itemPluralLabel="alumnos" onPageChange={vi.fn()} />
    );
    expect(screen.getByText('1-10 de 25 alumnos')).toBeInTheDocument();
  });
});
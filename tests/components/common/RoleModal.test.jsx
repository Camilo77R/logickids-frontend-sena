import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoleModal from '../../../src/components/common/RoleModal';

describe('RoleModal', () => {
  it('retorna null si open es false', () => {
    const { container } = render(<RoleModal open={false} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renderiza título y children cuando open es true', () => {
    render(<RoleModal open={true} onClose={vi.fn()} title="Mi Modal"><p>Contenido</p></RoleModal>);
    expect(screen.getByText('Mi Modal')).toBeInTheDocument();
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('renderiza eyebrow', () => {
    render(<RoleModal open={true} onClose={vi.fn()} eyebrow="Subtítulo" title="Título" />);
    expect(screen.getByText('Subtítulo')).toBeInTheDocument();
  });

  it('renderiza warning', () => {
    render(<RoleModal open={true} onClose={vi.fn()} warning="Cuidado" />);
    expect(screen.getByText('Cuidado')).toBeInTheDocument();
  });

  it('renderiza acciones', () => {
    render(<RoleModal open={true} onClose={vi.fn()} actions={<button>Aceptar</button>} />);
    expect(screen.getByText('Aceptar')).toBeInTheDocument();
  });

  it('cierra al hacer clic en el overlay', async () => {
    const onClose = vi.fn();
    render(<RoleModal open={true} onClose={onClose} title="Test" />);
    const overlay = document.querySelector('.lk-role-modal-overlay');
    await userEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('no cierra al hacer clic dentro del modal', async () => {
    const onClose = vi.fn();
    render(<RoleModal open={true} onClose={onClose} title="Test" />);
    const modal = document.querySelector('.lk-role-modal');
    await userEvent.click(modal);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('bloquea scroll del body cuando está abierto', () => {
    const { rerender } = render(<RoleModal open={false} onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe('');
    rerender(<RoleModal open={true} onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restaura scroll al cerrar', () => {
    const { rerender, unmount } = render(<RoleModal open={true} onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
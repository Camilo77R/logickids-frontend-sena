import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StateChangeModal from '../../../src/components/common/StateChangeModal';

describe('StateChangeModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    entityLabel: 'Usuario: Test',
    currentState: 'activo',
    nextState: 'inactivo',
    confirmLabel: 'Confirmar',
  };

  it('renderiza entityLabel', () => {
    render(<StateChangeModal {...defaultProps} />);
    expect(screen.getByText('Usuario: Test')).toBeInTheDocument();
  });

  it('muestra la flecha de transición', () => {
    render(<StateChangeModal {...defaultProps} />);
    expect(document.querySelector('.lk-role-state-flow__arrow')).toBeInTheDocument();
  });

  it('muestra StatusBadge para currentState y nextState', () => {
    render(<StateChangeModal {...defaultProps} />);
    expect(document.querySelector('.lk-role-state-flow')).toBeInTheDocument();
    expect(screen.getByText('inactivo')).toBeInTheDocument();
  });

  it('muestra impactItems', () => {
    render(<StateChangeModal {...defaultProps} impactItems={['Se desactivará la cuenta']} />);
    expect(screen.getByText('Se desactivará la cuenta')).toBeInTheDocument();
  });

  it('llama onConfirm al hacer clic en confirmar', async () => {
    const onConfirm = vi.fn();
    render(<StateChangeModal {...defaultProps} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByText('Confirmar'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('llama onClose al hacer clic en cancelar', async () => {
    const onClose = vi.fn();
    render(<StateChangeModal {...defaultProps} onClose={onClose} />);
    await userEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalled();
  });
});
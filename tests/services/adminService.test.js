import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../src/services/httpClient', () => ({
  request: vi.fn(),
}));

import { request } from '../../src/services/httpClient';
import adminService from '../../src/services/adminService';

describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listUsers GET /admin/usuarios con query params', async () => {
    const mockData = [{ id: 1, email: 'a@b.com' }];
    request.mockResolvedValue({ data: mockData });
    const result = await adminService.listUsers({ rol: 'tutor', institutionId: 3 });
    expect(request).toHaveBeenCalledWith('/admin/usuarios?rol=tutor&institucion_id=3');
    expect(result).toEqual(mockData);
  });

  it('listUsers omite institutionId si no se provee', async () => {
    request.mockResolvedValue({ data: [] });
    await adminService.listUsers({ rol: 'admin' });
    expect(request).toHaveBeenCalledWith('/admin/usuarios?rol=admin');
  });

  it('getUser GET /admin/usuarios/{id}', async () => {
    request.mockResolvedValue({ data: { id: 1 } });
    const result = await adminService.getUser(1);
    expect(request).toHaveBeenCalledWith('/admin/usuarios/1');
    expect(result).toEqual({ id: 1 });
  });

  it('updateUserState PATCH /admin/usuarios/{id}/estado', async () => {
    request.mockResolvedValue({ data: { id: 1, estado: 'activo' } });
    const result = await adminService.updateUserState(1, 'activo');
    expect(request).toHaveBeenCalledWith('/admin/usuarios/1/estado', {
      method: 'PATCH', body: { estado: 'activo' },
    });
    expect(result).toEqual({ id: 1, estado: 'activo' });
  });

  it('getDashboard GET /admin/dashboard', async () => {
    const mockData = { total_usuarios: 100 };
    request.mockResolvedValue({ data: mockData });
    const result = await adminService.getDashboard();
    expect(request).toHaveBeenCalledWith('/admin/dashboard');
    expect(result).toEqual(mockData);
  });

  it('listInstitutions GET /admin/instituciones', async () => {
    const mockData = [{ id: 1, nombre: 'Inst' }];
    request.mockResolvedValue({ data: mockData });
    const result = await adminService.listInstitutions();
    expect(request).toHaveBeenCalledWith('/admin/instituciones');
    expect(result).toEqual(mockData);
  });

  it('createInstitution POST /admin/instituciones', async () => {
    const data = { nombre: 'Nueva Inst' };
    request.mockResolvedValue({ data: { id: 1 } });
    const result = await adminService.createInstitution(data);
    expect(request).toHaveBeenCalledWith('/admin/instituciones', {
      method: 'POST', body: data,
    });
    expect(result).toEqual({ id: 1 });
  });

  it('updateInstitution PUT /admin/instituciones/{id}', async () => {
    request.mockResolvedValue({ data: { id: 1 } });
    await adminService.updateInstitution(1, { nombre: 'Editado' });
    expect(request).toHaveBeenCalledWith('/admin/instituciones/1', {
      method: 'PUT', body: { nombre: 'Editado' },
    });
  });

  it('deleteInstitution DELETE /admin/instituciones/{id}', async () => {
    request.mockResolvedValue({ data: { id: 1 } });
    await adminService.deleteInstitution(1);
    expect(request).toHaveBeenCalledWith('/admin/instituciones/1', {
      method: 'DELETE',
    });
  });

  it('deactivateInstitution PATCH /admin/instituciones/{id}/desactivar', async () => {
    request.mockResolvedValue({ data: { id: 1 } });
    await adminService.deactivateInstitution(1);
    expect(request).toHaveBeenCalledWith('/admin/instituciones/1/desactivar', {
      method: 'PATCH',
    });
  });

  it('reactivateInstitution PATCH /admin/instituciones/{id}/reactivar', async () => {
    request.mockResolvedValue({ data: { id: 1 } });
    await adminService.reactivateInstitution(1);
    expect(request).toHaveBeenCalledWith('/admin/instituciones/1/reactivar', {
      method: 'PATCH',
    });
  });

  it('listMinigames GET /admin/minijuegos', async () => {
    const mockData = [{ id: 1, nombre: 'Juego' }];
    request.mockResolvedValue({ data: mockData });
    const result = await adminService.listMinigames();
    expect(request).toHaveBeenCalledWith('/admin/minijuegos');
    expect(result).toEqual(mockData);
  });

  it('toggleMinigame PATCH /admin/minijuegos/{id}/toggle', async () => {
    request.mockResolvedValue({ data: { id: 1, activo: true } });
    await adminService.toggleMinigame(1, true);
    expect(request).toHaveBeenCalledWith('/admin/minijuegos/1/toggle', {
      method: 'PATCH', body: { activo: true },
    });
  });

  it('listReactivationRequests GET /solicitudes/admin/solicitudes', async () => {
    request.mockResolvedValue({ data: [{ id: 1 }] });
    const result = await adminService.listReactivationRequests();
    expect(request).toHaveBeenCalledWith('/solicitudes/admin/solicitudes');
    expect(result).toEqual([{ id: 1 }]);
  });

  it('approveReactivationRequest PUT /solicitudes/admin/solicitudes/{id}/aprobar', async () => {
    request.mockResolvedValue({ data: { id: 1 } });
    await adminService.approveReactivationRequest(1);
    expect(request).toHaveBeenCalledWith('/solicitudes/admin/solicitudes/1/aprobar', {
      method: 'PUT',
    });
  });

  it('rejectReactivationRequest PUT /solicitudes/admin/solicitudes/{id}/rechazar', async () => {
    request.mockResolvedValue({ data: { id: 1 } });
    await adminService.rejectReactivationRequest(1, 'Motivo');
    expect(request).toHaveBeenCalledWith('/solicitudes/admin/solicitudes/1/rechazar', {
      method: 'PUT', body: { motivo_rechazo: 'Motivo' },
    });
  });

  it('retorna array vacio cuando listUsers recibe payload sin data', async () => {
    request.mockResolvedValue({});
    const result = await adminService.listUsers({});
    expect(result).toEqual([]);
  });

  it('retorna null cuando getUser recibe payload null', async () => {
    request.mockResolvedValue(null);
    const result = await adminService.getUser(1);
    expect(result).toBeNull();
  });
});

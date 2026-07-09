import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../src/services/httpClient', () => ({
  request: vi.fn(),
}));

import { request } from '../../src/services/httpClient';
import adminInstitutionalAdminsService from '../../src/services/adminInstitutionalAdminsService';

describe('adminInstitutionalAdminsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listAdmins GET /admin/usuarios?rol=admin', async () => {
    const mockData = [{ id: 1, email: 'admin@test.com' }];
    request.mockResolvedValue({ data: mockData });
    const result = await adminInstitutionalAdminsService.listAdmins();
    expect(request).toHaveBeenCalledWith('/admin/usuarios?rol=admin');
    expect(result).toEqual(mockData);
  });

  it('createInstitutionalAdmin POST /admin/usuarios/admins', async () => {
    const data = { email: 'admin@test.com', nombre: 'Admin' };
    request.mockResolvedValue({ data: { id: 1 } });
    const result = await adminInstitutionalAdminsService.createInstitutionalAdmin(data);
    expect(request).toHaveBeenCalledWith('/admin/usuarios/admins', {
      method: 'POST', body: data,
    });
    expect(result).toEqual({ id: 1 });
  });

  it('updateAdminState PATCH /admin/usuarios/{id}/estado', async () => {
    request.mockResolvedValue({ data: { id: 1, estado: 'activo' } });
    const result = await adminInstitutionalAdminsService.updateAdminState(1, 'activo');
    expect(request).toHaveBeenCalledWith('/admin/usuarios/1/estado', {
      method: 'PATCH', body: { estado: 'activo' },
    });
    expect(result).toEqual({ id: 1, estado: 'activo' });
  });
});

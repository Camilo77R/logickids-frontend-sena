import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../src/services/httpClient', () => ({
  request: vi.fn(),
}));

import { request } from '../../src/services/httpClient';
import adminTutorsService from '../../src/services/adminTutorsService';

describe('adminTutorsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listTutors GET /admin/usuarios?rol=tutor', async () => {
    const mockData = [{ id: 1, nombre: 'Tutor' }];
    request.mockResolvedValue({ data: mockData });
    const result = await adminTutorsService.listTutors();
    expect(request).toHaveBeenCalledWith('/admin/usuarios?rol=tutor');
    expect(result).toEqual(mockData);
  });

  it('getTutor GET /admin/usuarios/{id}', async () => {
    request.mockResolvedValue({ data: { id: 1 } });
    const result = await adminTutorsService.getTutor(1);
    expect(request).toHaveBeenCalledWith('/admin/usuarios/1');
    expect(result).toEqual({ id: 1 });
  });

  it('createTutor POST /admin/usuarios/tutores', async () => {
    const data = { email: 'tutor@test.com', nombre: 'Tutor' };
    request.mockResolvedValue({ data: { id: 1 } });
    const result = await adminTutorsService.createTutor(data);
    expect(request).toHaveBeenCalledWith('/admin/usuarios/tutores', {
      method: 'POST', body: data,
    });
    expect(result).toEqual({ id: 1 });
  });

  it('updateTutorState PATCH /admin/usuarios/{id}/estado', async () => {
    request.mockResolvedValue({ data: { id: 1, estado: 'activo' } });
    const result = await adminTutorsService.updateTutorState(1, 'activo');
    expect(request).toHaveBeenCalledWith('/admin/usuarios/1/estado', {
      method: 'PATCH', body: { estado: 'activo' },
    });
    expect(result).toEqual({ id: 1, estado: 'activo' });
  });
});

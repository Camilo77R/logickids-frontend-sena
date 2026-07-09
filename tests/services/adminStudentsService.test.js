import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../src/services/httpClient', () => ({
  request: vi.fn(),
}));

import { request } from '../../src/services/httpClient';
import adminStudentsService from '../../src/services/adminStudentsService';

describe('adminStudentsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listGroups GET /grupos', async () => {
    const mockData = [{ id: 1, nombre: 'Grupo' }];
    request.mockResolvedValue({ data: mockData });
    const result = await adminStudentsService.listGroups();
    expect(request).toHaveBeenCalledWith('/grupos');
    expect(result).toEqual(mockData);
  });

  it('listStudents GET /estudiantes sin grupo', async () => {
    request.mockResolvedValue([{ id: 1 }]);
    const result = await adminStudentsService.listStudents({});
    expect(request).toHaveBeenCalledWith('/estudiantes');
    expect(result).toEqual([{ id: 1 }]);
  });

  it('listStudents GET /estudiantes/all con includeInactive', async () => {
    request.mockResolvedValue([]);
    await adminStudentsService.listStudents({ includeInactive: true });
    expect(request).toHaveBeenCalledWith('/estudiantes/all');
  });

  it('listStudents incluye query grupo_id', async () => {
    request.mockResolvedValue([]);
    await adminStudentsService.listStudents({ groupId: 3 });
    expect(request).toHaveBeenCalledWith('/estudiantes?grupo_id=3');
  });

  it('getStudent GET /estudiantes/{id}', async () => {
    request.mockResolvedValue({ data: { id: 1, nombre: 'Pepe' } });
    const result = await adminStudentsService.getStudent(1);
    expect(request).toHaveBeenCalledWith('/estudiantes/1');
    expect(result).toEqual({ id: 1, nombre: 'Pepe' });
  });

  it('createStudent POST /estudiantes', async () => {
    const data = { nombre: 'Pepe' };
    request.mockResolvedValue({ data: { id: 1 } });
    const result = await adminStudentsService.createStudent(data);
    expect(request).toHaveBeenCalledWith('/estudiantes', { method: 'POST', body: data });
    expect(result).toEqual({ id: 1 });
  });

  it('updateStudent PUT /estudiantes/{id}', async () => {
    request.mockResolvedValue({ data: { id: 1 } });
    await adminStudentsService.updateStudent(1, { nombre: 'Editado' });
    expect(request).toHaveBeenCalledWith('/estudiantes/1', { method: 'PUT', body: { nombre: 'Editado' } });
  });

  it('changeStudentGroup PATCH /estudiantes/{id}/grupo', async () => {
    request.mockResolvedValue({ data: { id: 1 } });
    await adminStudentsService.changeStudentGroup(1, 5);
    expect(request).toHaveBeenCalledWith('/estudiantes/1/grupo', {
      method: 'PATCH', body: { grupo_id: 5 },
    });
  });

  it('deactivateStudent DELETE /estudiantes/{id}', async () => {
    request.mockResolvedValue({ data: { id: 1 } });
    await adminStudentsService.deactivateStudent(1);
    expect(request).toHaveBeenCalledWith('/estudiantes/1', { method: 'DELETE' });
  });

  it('reactivateStudent PATCH /estudiantes/{id}/reactivar', async () => {
    request.mockResolvedValue({ data: { id: 1 } });
    await adminStudentsService.reactivateStudent(1);
    expect(request).toHaveBeenCalledWith('/estudiantes/1/reactivar', { method: 'PATCH' });
  });

  it('getStudentQr GET /estudiantes/{id}/qr', async () => {
    request.mockResolvedValue({ data: { qr: 'abc' } });
    const result = await adminStudentsService.getStudentQr(1);
    expect(request).toHaveBeenCalledWith('/estudiantes/1/qr');
    expect(result).toEqual({ qr: 'abc' });
  });
});

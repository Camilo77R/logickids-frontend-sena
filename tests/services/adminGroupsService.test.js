import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../src/services/httpClient', () => ({
  request: vi.fn(),
}));

import { request } from '../../src/services/httpClient';
import adminGroupsService from '../../src/services/adminGroupsService';

describe('adminGroupsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listGroups GET /grupos', async () => {
    const mockData = [{ id: 1, nombre: 'Grupo A' }];
    request.mockResolvedValue({ data: mockData });
    const result = await adminGroupsService.listGroups();
    expect(request).toHaveBeenCalledWith('/grupos');
    expect(result).toEqual(mockData);
  });

  it('getGroup GET /grupos/{id}', async () => {
    request.mockResolvedValue({ data: { id: 1, nombre: 'Grupo' } });
    const result = await adminGroupsService.getGroup(1);
    expect(request).toHaveBeenCalledWith('/grupos/1');
    expect(result).toEqual({ id: 1, nombre: 'Grupo' });
  });

  it('createGroup POST /grupos', async () => {
    const data = { nombre: 'Nuevo Grupo', institucion_id: 1 };
    request.mockResolvedValue({ data: { id: 1 } });
    const result = await adminGroupsService.createGroup(data);
    expect(request).toHaveBeenCalledWith('/grupos', { method: 'POST', body: data });
    expect(result).toEqual({ id: 1 });
  });

  it('updateGroup PUT /grupos/{id}', async () => {
    request.mockResolvedValue({ data: { id: 1 } });
    await adminGroupsService.updateGroup(1, { nombre: 'Editado' });
    expect(request).toHaveBeenCalledWith('/grupos/1', { method: 'PUT', body: { nombre: 'Editado' } });
  });

  it('assignTutor PATCH /grupos/{id}/tutor asigna tutor', async () => {
    request.mockResolvedValue({ data: { id: 1 } });
    await adminGroupsService.assignTutor(1, 5);
    expect(request).toHaveBeenCalledWith('/grupos/1/tutor', {
      method: 'PATCH', body: { tutor_id: 5 },
    });
  });

  it('unassignTutor PATCH /grupos/{id}/tutor limpia tutor', async () => {
    request.mockResolvedValue({ data: { id: 1 } });
    await adminGroupsService.unassignTutor(1);
    expect(request).toHaveBeenCalledWith('/grupos/1/tutor', {
      method: 'PATCH', body: { tutor_id: null },
    });
  });

  it('archiveGroup PATCH /grupos/{id}/archivar', async () => {
    request.mockResolvedValue({ data: { id: 1 } });
    await adminGroupsService.archiveGroup(1);
    expect(request).toHaveBeenCalledWith('/grupos/1/archivar', { method: 'PATCH' });
  });

  it('reactivateGroup PATCH /grupos/{id}/restaurar', async () => {
    request.mockResolvedValue({ data: { id: 1 } });
    await adminGroupsService.reactivateGroup(1);
    expect(request).toHaveBeenCalledWith('/grupos/1/restaurar', { method: 'PATCH' });
  });
});

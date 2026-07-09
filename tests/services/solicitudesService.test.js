import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../src/services/httpClient', () => ({
  request: vi.fn(),
}));

import { request } from '../../src/services/httpClient';
import solicitudesService from '../../src/services/solicitudesService';

describe('solicitudesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('solicitarReactivacion POST /solicitudes/reactivacion sin auth', async () => {
    const data = { email: 'tutor@test.com' };
    request.mockResolvedValue({ data: { id: 1 } });
    const result = await solicitudesService.solicitarReactivacion(data);
    expect(request).toHaveBeenCalledWith('/solicitudes/reactivacion', {
      method: 'POST', auth: false, body: data,
    });
    expect(result).toEqual({ id: 1 });
  });

  it('listSolicitudes GET /solicitudes/admin/solicitudes', async () => {
    const mockData = [{ id: 1, estado: 'pendiente' }];
    request.mockResolvedValue({ data: mockData });
    const result = await solicitudesService.listSolicitudes();
    expect(request).toHaveBeenCalledWith('/solicitudes/admin/solicitudes');
    expect(result).toEqual(mockData);
  });

  it('getSolicitud GET /solicitudes/admin/solicitudes/{id}', async () => {
    request.mockResolvedValue({ data: { id: 1 } });
    const result = await solicitudesService.getSolicitud(1);
    expect(request).toHaveBeenCalledWith('/solicitudes/admin/solicitudes/1');
    expect(result).toEqual({ id: 1 });
  });

  it('aprobarSolicitud PUT /solicitudes/admin/solicitudes/{id}/aprobar', async () => {
    request.mockResolvedValue({ data: { id: 1 } });
    await solicitudesService.aprobarSolicitud(1);
    expect(request).toHaveBeenCalledWith('/solicitudes/admin/solicitudes/1/aprobar', {
      method: 'PUT',
    });
  });

  it('rechazarSolicitud PUT /solicitudes/admin/solicitudes/{id}/rechazar', async () => {
    request.mockResolvedValue({ data: { id: 1 } });
    await solicitudesService.rechazarSolicitud(1, 'Motivo rechazo');
    expect(request).toHaveBeenCalledWith('/solicitudes/admin/solicitudes/1/rechazar', {
      method: 'PUT', body: { motivo_rechazo: 'Motivo rechazo' },
    });
  });
});

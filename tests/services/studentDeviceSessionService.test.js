import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../src/services/httpClient', () => ({
  request: vi.fn(),
}));

import { request } from '../../src/services/httpClient';
import studentDeviceSessionService from '../../src/services/studentDeviceSessionService';

describe('studentDeviceSessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getActiveSession GET /estudiantes/{id}/dispositivo-activo', async () => {
    const mockData = { sesion_id: 1, dispositivo: 'tablet' };
    request.mockResolvedValue({ data: mockData });
    const result = await studentDeviceSessionService.getActiveSession(1);
    expect(request).toHaveBeenCalledWith('/estudiantes/1/dispositivo-activo');
    expect(result).toEqual(mockData);
  });

  it('getActiveSession retorna null cuando payload no tiene data', async () => {
    request.mockResolvedValue({});
    const result = await studentDeviceSessionService.getActiveSession(1);
    expect(result).toBeNull();
  });

  it('getActiveSession lanza error si success es false', async () => {
    request.mockResolvedValue({ success: false, message: 'No hay sesion activa' });
    await expect(studentDeviceSessionService.getActiveSession(1)).rejects.toThrow('No hay sesion activa');
  });

  it('recover POST /estudiantes/{id}/recuperar-sesion-dispositivo', async () => {
    const mockData = { sesion_id: 1 };
    request.mockResolvedValue({ data: mockData, message: 'Recuperado' });
    const result = await studentDeviceSessionService.recover(1);
    expect(request).toHaveBeenCalledWith('/estudiantes/1/recuperar-sesion-dispositivo', {
      method: 'POST', body: { action: 'restart_current_activity' },
    });
    expect(result.data).toEqual(mockData);
    expect(result.message).toBe('Recuperado');
  });

  it('recover usa mensaje por defecto si no viene en payload', async () => {
    request.mockResolvedValue({ data: null });
    const result = await studentDeviceSessionService.recover(1);
    expect(result.message).toBe('La recuperación fue autorizada correctamente.');
  });

  it('recover lanza error si success es false', async () => {
    request.mockResolvedValue({ success: false, message: 'Error al recuperar' });
    await expect(studentDeviceSessionService.recover(1)).rejects.toThrow('Error al recuperar');
  });
});

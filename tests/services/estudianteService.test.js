import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../src/services/httpClient', () => ({
  request: vi.fn(),
}));

import { request } from '../../src/services/httpClient';
import estudianteService from '../../src/services/estudianteService';

describe('estudianteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listEstudiantes GET /estudiantes', async () => {
    const mockData = [{ id: 1, nombre: 'Pepe' }];
    request.mockResolvedValue(mockData);
    const result = await estudianteService.listEstudiantes();
    expect(request).toHaveBeenCalledWith('/estudiantes');
    expect(result).toEqual(mockData);
  });

  it('listEstudiantes incluye query grupo_id', async () => {
    request.mockResolvedValue([]);
    await estudianteService.listEstudiantes(5);
    expect(request).toHaveBeenCalledWith('/estudiantes?grupo_id=5');
  });

  it('listAllEstudiantes GET /estudiantes/all', async () => {
    request.mockResolvedValue({ data: [] });
    const result = await estudianteService.listAllEstudiantes();
    expect(request).toHaveBeenCalledWith('/estudiantes/all');
  });

  it('listAllEstudiantes incluye query grupo_id', async () => {
    request.mockResolvedValue({ data: [] });
    await estudianteService.listAllEstudiantes(3);
    expect(request).toHaveBeenCalledWith('/estudiantes/all?grupo_id=3');
  });

  it('getEstudiante GET /estudiantes/{id}', async () => {
    request.mockResolvedValue({ data: { id: 1 } });
    const result = await estudianteService.getEstudiante(1);
    expect(request).toHaveBeenCalledWith('/estudiantes/1');
    expect(result).toEqual({ id: 1 });
  });

  it('crearEstudiante POST /estudiantes', async () => {
    const data = { nombre: 'Pepe', edad: 7 };
    request.mockResolvedValue({ data: { id: 1 } });
    const result = await estudianteService.crearEstudiante(data);
    expect(request).toHaveBeenCalledWith('/estudiantes', { method: 'POST', body: data });
    expect(result).toEqual({ id: 1 });
  });

  it('actualizarEstudiante PUT /estudiantes/{id}', async () => {
    const data = { nombre: 'Pepe' };
    request.mockResolvedValue({ data: { id: 1 } });
    const result = await estudianteService.actualizarEstudiante(1, data);
    expect(request).toHaveBeenCalledWith('/estudiantes/1', { method: 'PUT', body: data });
    expect(result).toEqual({ id: 1 });
  });

  it('desactivarEstudiante DELETE /estudiantes/{id}', async () => {
    request.mockResolvedValue({ data: { id: 1 } });
    const result = await estudianteService.desactivarEstudiante(1);
    expect(request).toHaveBeenCalledWith('/estudiantes/1', { method: 'DELETE' });
    expect(result).toEqual({ id: 1 });
  });

  it('reactivarEstudiante PATCH /estudiantes/{id}/reactivar', async () => {
    request.mockResolvedValue({ data: { id: 1 } });
    const result = await estudianteService.reactivarEstudiante(1);
    expect(request).toHaveBeenCalledWith('/estudiantes/1/reactivar', { method: 'PATCH' });
    expect(result).toEqual({ id: 1 });
  });

  it('obtenerQr GET /estudiantes/{id}/qr', async () => {
    request.mockResolvedValue({ data: { qr: 'abc' } });
    const result = await estudianteService.obtenerQr(1);
    expect(request).toHaveBeenCalledWith('/estudiantes/1/qr');
    expect(result).toEqual({ qr: 'abc' });
  });

  it('cambiarGrupo PATCH /estudiantes/{id}/grupo', async () => {
    request.mockResolvedValue({ data: { id: 1, grupo_id: 5 } });
    const result = await estudianteService.cambiarGrupo(1, 5);
    expect(request).toHaveBeenCalledWith('/estudiantes/1/grupo', {
      method: 'PATCH', body: { grupo_id: 5 },
    });
    expect(result).toEqual({ id: 1, grupo_id: 5 });
  });

  it('retorna array vacio cuando listEstudiantes recibe null', async () => {
    request.mockResolvedValue(null);
    const result = await estudianteService.listEstudiantes();
    expect(result).toEqual([]);
  });

  it('retorna null cuando getEstudiante recibe null', async () => {
    request.mockResolvedValue(null);
    const result = await estudianteService.getEstudiante(1);
    expect(result).toBeNull();
  });
});

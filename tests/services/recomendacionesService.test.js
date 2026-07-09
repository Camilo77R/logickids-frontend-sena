import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../src/services/httpClient', () => ({
  request: vi.fn(),
}));

import { request } from '../../src/services/httpClient';
import recomendacionesService from '../../src/services/recomendacionesService';

describe('recomendacionesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('porEstudiante GET /recomendaciones/estudiante/{id}', async () => {
    const mockData = [{ id: 1, recomendacion: 'Jugar X' }];
    request.mockResolvedValue({ data: mockData });
    const result = await recomendacionesService.porEstudiante(1);
    expect(request).toHaveBeenCalledWith('/recomendaciones/estudiante/1');
    expect(result).toEqual(mockData);
  });

  it('listarPorEstudiante es alias de porEstudiante', async () => {
    request.mockResolvedValue({ data: [] });
    await recomendacionesService.listarPorEstudiante(1);
    expect(request).toHaveBeenCalledWith('/recomendaciones/estudiante/1');
  });

  it('porGrupo GET /recomendaciones/grupo/{id}', async () => {
    request.mockResolvedValue({ data: [{ id: 1 }] });
    const result = await recomendacionesService.porGrupo(1);
    expect(request).toHaveBeenCalledWith('/recomendaciones/grupo/1');
    expect(result).toEqual([{ id: 1 }]);
  });

  it('listarPorGrupo es alias de porGrupo', async () => {
    request.mockResolvedValue({ data: [] });
    await recomendacionesService.listarPorGrupo(1);
    expect(request).toHaveBeenCalledWith('/recomendaciones/grupo/1');
  });

  it('generarParaEstudiante POST /recomendaciones/generar/estudiante/{id}', async () => {
    request.mockResolvedValue({ data: { success: true } });
    const result = await recomendacionesService.generarParaEstudiante(1);
    expect(request).toHaveBeenCalledWith('/recomendaciones/generar/estudiante/1', {
      method: 'POST',
    });
    expect(result).toEqual({ success: true });
  });

  it('generarParaGrupo POST /recomendaciones/generar/grupo/{id}', async () => {
    request.mockResolvedValue({ data: { success: true } });
    await recomendacionesService.generarParaGrupo(1);
    expect(request).toHaveBeenCalledWith('/recomendaciones/generar/grupo/1', {
      method: 'POST',
    });
  });

  it('obtenerCatalogoCsvIA GET /ia/recomendaciones/catalogo-csv', async () => {
    request.mockResolvedValue({ data: { csv: 'data' } });
    const result = await recomendacionesService.obtenerCatalogoCsvIA();
    expect(request).toHaveBeenCalledWith('/ia/recomendaciones/catalogo-csv');
    expect(result).toEqual({ csv: 'data' });
  });

  it('generarDesdeCsvIA POST /ia/recomendaciones/generar-desde-archivo', async () => {
    request.mockResolvedValue({ success: true, total: 5, recomendaciones: [], historial_actualizado: 0 });
    const result = await recomendacionesService.generarDesdeCsvIA({ grupoId: 1 });
    expect(request).toHaveBeenCalledWith('/ia/recomendaciones/generar-desde-archivo', {
      method: 'POST', body: { grupoId: 1, estudianteId: undefined },
    });
    expect(result).toEqual({ success: true, total: 5, recomendaciones: [], historialActualizado: 0 });
  });

  it('obtenerHistorialCsvIA GET /ia/recomendaciones/historial-csv', async () => {
    request.mockResolvedValue({ data: [] });
    await recomendacionesService.obtenerHistorialCsvIA({ estudianteId: 5 });
    expect(request).toHaveBeenCalledWith('/ia/recomendaciones/historial-csv?estudianteId=5');
  });

  it('borrarHistorialCsvIA DELETE /ia/recomendaciones/historial-csv', async () => {
    request.mockResolvedValue({ deleted: 1, message: 'ok' });
    const result = await recomendacionesService.borrarHistorialCsvIA({ recommendationId: 3 });
    expect(request).toHaveBeenCalledWith('/ia/recomendaciones/historial-csv', {
      method: 'DELETE', body: { recommendationId: 3, grupoId: undefined, estudianteId: undefined },
    });
    expect(result).toEqual({ deleted: 1, message: 'ok' });
  });

  it('archivar PATCH /recomendaciones/{id}/archivar', async () => {
    request.mockResolvedValue({ data: { id: 1, archivada: true } });
    const result = await recomendacionesService.archivar(1);
    expect(request).toHaveBeenCalledWith('/recomendaciones/1/archivar', {
      method: 'PATCH',
    });
    expect(result).toBeUndefined();
  });
});

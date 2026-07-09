import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../src/services/httpClient', () => ({
  request: vi.fn(),
}));

import { request } from '../../src/services/httpClient';
import tutorGroupsService from '../../src/services/tutorGroupsService';

describe('tutorGroupsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listarGrupos GET /grupos retorna payload completo', async () => {
    const mockPayload = { data: [{ id: 1, nombre: 'Grupo A' }], message: 'ok' };
    request.mockResolvedValue(mockPayload);
    const result = await tutorGroupsService.listarGrupos();
    expect(request).toHaveBeenCalledWith('/grupos');
    expect(result).toEqual(mockPayload);
  });

  it('getGroups GET /grupos retorna data unwrapped', async () => {
    const mockData = [{ id: 1, nombre: 'Grupo A' }];
    request.mockResolvedValue({ data: mockData });
    const result = await tutorGroupsService.getGroups();
    expect(request).toHaveBeenCalledWith('/grupos');
    expect(result).toEqual(mockData);
  });

  it('obtenerGrupo GET /grupos/{id} retorna payload completo', async () => {
    const mockPayload = { data: { id: 1, nombre: 'Grupo A' } };
    request.mockResolvedValue(mockPayload);
    const result = await tutorGroupsService.obtenerGrupo(1);
    expect(request).toHaveBeenCalledWith('/grupos/1');
    expect(result).toEqual(mockPayload);
  });

  it('getGroup GET /grupos/{id} retorna data unwrapped', async () => {
    request.mockResolvedValue({ data: { id: 1 } });
    const result = await tutorGroupsService.getGroup(1);
    expect(request).toHaveBeenCalledWith('/grupos/1');
    expect(result).toEqual({ id: 1 });
  });

  it('listarMinijuegosActivos GET /minijuegos retorna ordenados por catalogo', async () => {
    const juegos = [
      { id: 2, nombre: 'B', orden_catalogo: 2 },
      { id: 1, nombre: 'A', orden_catalogo: 1 },
    ];
    request.mockResolvedValue({ data: juegos });
    const result = await tutorGroupsService.listarMinijuegosActivos();
    expect(request).toHaveBeenCalledWith('/minijuegos');
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });

  it('listarRutasPedagogicas GET /rutas-pedagogicas', async () => {
    request.mockResolvedValue({ data: [{ id: 1, nombre: 'Ruta' }] });
    const result = await tutorGroupsService.listarRutasPedagogicas();
    expect(request).toHaveBeenCalledWith('/rutas-pedagogicas');
    expect(result).toEqual([{ id: 1, nombre: 'Ruta' }]);
  });

  it('abrirSesionClase PATCH /grupos/{id}/sesion con modo single', async () => {
    const config = { modo: 'single', minijuegoId: 1, niveles: 3 };
    request.mockResolvedValue({ data: { success: true } });
    const result = await tutorGroupsService.abrirSesionClase(1, config);
    expect(request).toHaveBeenCalledWith('/grupos/1/sesion', {
      method: 'PATCH', body: { sesion_activa: true, modo: 'single', minijuego_id: 1, niveles: 3 },
    });
    expect(result).toEqual({ data: { success: true } });
  });

  it('cerrarSesionClase PATCH /grupos/{id}/sesion con sesion_activa false', async () => {
    request.mockResolvedValue({ data: { success: true } });
    await tutorGroupsService.cerrarSesionClase(1);
    expect(request).toHaveBeenCalledWith('/grupos/1/sesion', {
      method: 'PATCH', body: { sesion_activa: false },
    });
  });

  it('getGroups retorna array vacio cuando no hay data', async () => {
    request.mockResolvedValue({});
    const result = await tutorGroupsService.getGroups();
    expect(result).toEqual([]);
  });
});

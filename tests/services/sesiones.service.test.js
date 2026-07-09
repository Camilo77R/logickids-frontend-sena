import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../src/services/httpClient', () => ({
  request: vi.fn(),
}));

import { request } from '../../src/services/httpClient';
import { getSesionesByEstudiante, getSesionesPorGrupo, getEventosSesion } from '../../src/services/sesiones.service';

describe('sesiones.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSesionesByEstudiante', () => {
    it('GET /sesiones/estudiante/{id} y decora sesiones', async () => {
      const rawSession = {
        id: 1,
        iniciada_en: '2025-01-01T00:00:00Z',
        puntuacion: 100,
      };
      request.mockResolvedValue({ data: [rawSession] });

      const result = await getSesionesByEstudiante(1);

      expect(request).toHaveBeenCalledWith('/sesiones/estudiante/1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0]).toHaveProperty('actividad_clave');
      expect(result[0]).toHaveProperty('ajuste_visible');
    });

    it('retorna array vacio cuando no hay data', async () => {
      request.mockResolvedValue({});
      const result = await getSesionesByEstudiante(1);
      expect(result).toEqual([]);
    });
  });

  describe('getSesionesPorGrupo', () => {
    it('obtiene sesiones de todos los estudiantes y las ordena', async () => {
      const estudiantes = [
        { id: 1, nombre: 'Pepe' },
        { id: 2, nombre: 'Ana' },
      ];

      request.mockImplementation((url) => {
        if (url.includes('/1')) {
          return Promise.resolve({
            data: [{ id: 10, iniciada_en: '2025-01-02T00:00:00Z', puntuacion: 80 }],
          });
        }
        if (url.includes('/2')) {
          return Promise.resolve({
            data: [{ id: 11, iniciada_en: '2025-01-01T00:00:00Z', puntuacion: 90 }],
          });
        }
        return Promise.resolve({ data: [] });
      });

      const result = await getSesionesPorGrupo(estudiantes);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(10);
      expect(result[0].estudiante_id).toBe(1);
      expect(result[0].estudiante_nombre).toBe('Pepe');
      expect(result[1].id).toBe(11);
      expect(result[1].estudiante_id).toBe(2);
    });

    it('retorna array vacio si no hay estudiantes', async () => {
      const result = await getSesionesPorGrupo([]);
      expect(result).toEqual([]);
    });
  });

  describe('getEventosSesion', () => {
    it('GET /sesiones/{id}/eventos', async () => {
      const mockData = [{ id: 1, tipo: 'inicio', timestamp: '2025-01-01T00:00:00Z' }];
      request.mockResolvedValue({ data: mockData });
      const result = await getEventosSesion(1);
      expect(request).toHaveBeenCalledWith('/sesiones/1/eventos');
      expect(result).toEqual(mockData);
    });
  });
});

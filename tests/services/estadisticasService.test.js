import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../src/services/httpClient', () => ({
  request: vi.fn(),
}));

import { request } from '../../src/services/httpClient';
import estadisticasService from '../../src/services/estadisticasService';

describe('estadisticasService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('porEstudiante GET /estadisticas/estudiante/{id}', async () => {
    const mockData = { total_sesiones: 10, promedio: 85 };
    request.mockResolvedValue({ data: mockData });
    const result = await estadisticasService.porEstudiante(1);
    expect(request).toHaveBeenCalledWith('/estadisticas/estudiante/1');
    expect(result).toEqual(mockData);
  });

  it('porGrupo GET /estadisticas/grupo/{id}', async () => {
    const mockData = { total_estudiantes: 20 };
    request.mockResolvedValue({ data: mockData });
    const result = await estadisticasService.porGrupo(1);
    expect(request).toHaveBeenCalledWith('/estadisticas/grupo/1');
    expect(result).toEqual(mockData);
  });

  it('retorna array vacio cuando payload no tiene data', async () => {
    request.mockResolvedValue({});
    const result = await estadisticasService.porEstudiante(1);
    expect(result).toEqual([]);
  });
});

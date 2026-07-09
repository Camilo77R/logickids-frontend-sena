import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../src/services/httpClient', () => ({
  request: vi.fn(),
}));

import { request } from '../../src/services/httpClient';
import rankingService from '../../src/services/rankingService';

describe('rankingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('obtenerRankingGrupo GET /grupos/{id}/ranking', async () => {
    const mockData = [{ posicion: 1, nombre: 'Pepe', puntos: 100 }];
    request.mockResolvedValue({ data: mockData });
    const result = await rankingService.obtenerRankingGrupo(1);
    expect(request).toHaveBeenCalledWith('/grupos/1/ranking');
    expect(result).toEqual(mockData);
  });
});

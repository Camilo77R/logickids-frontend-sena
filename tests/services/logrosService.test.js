import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../src/services/httpClient', () => ({
  request: vi.fn(),
}));

import { request } from '../../src/services/httpClient';
import logrosService from '../../src/services/logrosService';

describe('logrosService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listCatalog GET /logros/catalogo', async () => {
    const mockData = [{ id: 1, nombre: 'Estrella' }];
    request.mockResolvedValue({ data: mockData });
    const result = await logrosService.listCatalog();
    expect(request).toHaveBeenCalledWith('/logros/catalogo');
    expect(result).toEqual(mockData);
  });

  it('listCatalog incluye query estudiante_id', async () => {
    request.mockResolvedValue({ data: [] });
    await logrosService.listCatalog(1);
    expect(request).toHaveBeenCalledWith('/logros/catalogo?estudiante_id=1');
  });

  it('listByStudent GET /logros/estudiante/{id}', async () => {
    request.mockResolvedValue({ data: [{ id: 1 }] });
    const result = await logrosService.listByStudent(1);
    expect(request).toHaveBeenCalledWith('/logros/estudiante/1');
    expect(result).toEqual([{ id: 1 }]);
  });
});

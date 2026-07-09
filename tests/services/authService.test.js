import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../src/services/httpClient', () => ({
  request: vi.fn(),
}));

import { request } from '../../src/services/httpClient';
import authService from '../../src/services/authService';

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listInstitutions llama GET /auth/instituciones sin auth', async () => {
    const mockData = [{ id: 1, nombre: 'Inst' }];
    request.mockResolvedValue({ data: mockData });
    const result = await authService.listInstitutions();
    expect(request).toHaveBeenCalledWith('/auth/instituciones', { auth: false });
    expect(result).toEqual(mockData);
  });

  it('getProfile llama GET /auth/perfil', async () => {
    const mockData = { id: 1, nombre: 'Test' };
    request.mockResolvedValue({ data: mockData });
    const result = await authService.getProfile();
    expect(request).toHaveBeenCalledWith('/auth/perfil');
    expect(result).toEqual(mockData);
  });

  it('login envia credenciales a POST /auth/login sin auth', async () => {
    const credentials = { email: 'a@b.com', contrasena: '123' };
    const mockData = { token: 'abc', usuario: { id: 1 } };
    request.mockResolvedValue({ data: mockData });
    const result = await authService.login(credentials);
    expect(request).toHaveBeenCalledWith('/auth/login', {
      method: 'POST', auth: false, body: credentials,
    });
    expect(result).toEqual({ token: 'abc', user: { id: 1 } });
  });

  it('register envia datos a POST /auth/registro sin auth', async () => {
    const data = { email: 'a@b.com', contrasena: '123' };
    request.mockResolvedValue({ data: { id: 1 } });
    const result = await authService.register(data);
    expect(request).toHaveBeenCalledWith('/auth/registro', {
      method: 'POST', auth: false, body: data,
    });
    expect(result).toEqual({ id: 1 });
  });

  it('updateProfile envia datos a PUT /auth/perfil', async () => {
    const data = { nombre: 'Nuevo' };
    request.mockResolvedValue({ data: { id: 1 } });
    const result = await authService.updateProfile(data);
    expect(request).toHaveBeenCalledWith('/auth/perfil', {
      method: 'PUT', body: data,
    });
    expect(result).toEqual({ id: 1 });
  });

  it('cambiarContrasena envia datos a PUT /auth/cambiar-contrasena', async () => {
    const data = { contrasenaActual: 'old', contrasenaNueva: 'new' };
    request.mockResolvedValue({ data: { success: true } });
    const result = await authService.cambiarContrasena(data);
    expect(request).toHaveBeenCalledWith('/auth/cambiar-contrasena', {
      method: 'PUT', body: { contrasena_actual: 'old', contrasena_nueva: 'new' },
    });
    expect(result).toEqual({ success: true });
  });

  it('changePassword envia credentials a PUT /auth/cambiar-contrasena', async () => {
    const credentials = { contrasena_actual: 'old', contrasena_nueva: 'new' };
    request.mockResolvedValue({ data: { success: true } });
    const result = await authService.changePassword(credentials);
    expect(request).toHaveBeenCalledWith('/auth/cambiar-contrasena', {
      method: 'PUT', body: credentials,
    });
    expect(result).toEqual({ success: true });
  });

  it('retorna null si payload no tiene data', async () => {
    request.mockResolvedValue({});
    const result = await authService.getProfile();
    expect(result).toBeNull();
  });

  it('retorna null si payload es null', async () => {
    request.mockResolvedValue(null);
    const result = await authService.getProfile();
    expect(result).toBeNull();
  });
});

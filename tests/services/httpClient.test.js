import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../src/utils/sessionStorage', () => ({
  getStoredSession: vi.fn(),
  clearStoredSession: vi.fn(),
}));

import { request, HttpError, isSessionExpirationError, resolveApiBaseUrl } from '../../src/services/httpClient';
import { getStoredSession, clearStoredSession } from '../../src/utils/sessionStorage';

describe('HttpError', () => {
  it('crea error con mensaje, status, detalles y meta', () => {
    const err = new HttpError('Error test', 400, ['campo invalido'], { code: 'BAD_REQUEST' });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('HttpError');
    expect(err.message).toBe('Error test');
    expect(err.status).toBe(400);
    expect(err.details).toEqual(['campo invalido']);
    expect(err.meta).toEqual({ code: 'BAD_REQUEST' });
  });

  it('usa valores por defecto para details y meta', () => {
    const err = new HttpError('Error test', 500);
    expect(err.details).toEqual([]);
    expect(err.meta).toEqual({});
  });
});

describe('isSessionExpirationError', () => {
  it('retorna true para error 401 con codigo TOKEN_EXPIRED', () => {
    const err = new HttpError('msg', 401, [], { code: 'TOKEN_EXPIRED' });
    expect(isSessionExpirationError(err)).toBe(true);
  });

  it('retorna true para error 401 con mensaje de sesion expirada', () => {
    const err = new HttpError('Sesión expirada', 401);
    expect(isSessionExpirationError(err)).toBe(true);
  });

  it('retorna false para error 401 sin patron de expiracion', () => {
    const err = new HttpError('Error generico', 401);
    expect(isSessionExpirationError(err)).toBe(false);
  });

  it('retorna false para error que no es HttpError', () => {
    expect(isSessionExpirationError(new Error('error'))).toBe(false);
  });

  it('retorna false para error con status diferente a 401', () => {
    const err = new HttpError('msg', 403);
    expect(isSessionExpirationError(err)).toBe(false);
  });
});

describe('resolveApiBaseUrl', () => {
  it('retorna la URL base configurada', () => {
    expect(resolveApiBaseUrl()).toBe('/api');
  });
});

describe('request', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('realiza GET y retorna payload cuando la respuesta es ok', async () => {
    const responseData = { data: [{ id: 1 }], message: 'ok' };
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve(responseData),
    });

    const result = await request('/test');

    expect(global.fetch).toHaveBeenCalledWith('/api/test', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      body: undefined,
    });
    expect(result).toEqual(responseData);
  });

  it('incluye Content-Type cuando hay body', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({}),
    });

    await request('/test', { method: 'POST', body: { nombre: 'test' } });

    const callArgs = global.fetch.mock.calls[0][1];
    expect(callArgs.headers['Content-Type']).toBe('application/json');
    expect(callArgs.body).toBe(JSON.stringify({ nombre: 'test' }));
  });

  it('incluye Authorization cuando auth=true y hay sesion', async () => {
    getStoredSession.mockReturnValue({ token: 'abc123' });
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({}),
    });

    await request('/test', { auth: true });

    const callArgs = global.fetch.mock.calls[0][1];
    expect(callArgs.headers.Authorization).toBe('Bearer abc123');
  });

  it('no incluye Authorization cuando auth=false', async () => {
    getStoredSession.mockReturnValue({ token: 'abc123' });
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({}),
    });

    await request('/test', { auth: false });

    const callArgs = global.fetch.mock.calls[0][1];
    expect(callArgs.headers.Authorization).toBeUndefined();
  });

  it('retorna null cuando respuesta es 204', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 204,
      headers: { get: () => '' },
    });

    const result = await request('/test');
    expect(result).toBeNull();
  });

  it('retorna null cuando respuesta no es JSON', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'text/plain' },
    });

    const result = await request('/test');
    expect(result).toBeNull();
  });

  it('lanza HttpError con status 0 cuando fetch falla por red', async () => {
    global.fetch.mockRejectedValue(new TypeError('Network error'));

    await expect(request('/test')).rejects.toThrow(HttpError);
    await expect(request('/test')).rejects.toThrow('No fue posible conectar');
  });

  it('lanza HttpError con el mensaje del payload cuando respuesta no es ok', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ message: 'Datos invalidos' }),
    });

    await expect(request('/test')).rejects.toThrow('Datos invalidos');
  });

  it('lanza HttpError con status de la respuesta fallida', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ message: 'No encontrado' }),
    });

    try {
      await request('/test');
    } catch (e) {
      expect(e.status).toBe(404);
    }
  });

  it('dispara evento session-expired en 401 con codigo de expiracion', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ code: 'TOKEN_EXPIRED', message: 'Token expirado' }),
    });

    await expect(request('/test')).rejects.toThrow();
    expect(clearStoredSession).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
  });

  it('incluye detalles de error concatenados cuando hay errors array', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 422,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({
        message: 'Error de validacion',
        errors: [{ message: 'campo requerido' }, { message: 'valor invalido' }],
      }),
    });

    await expect(request('/test')).rejects.toThrow('Error de validacion: campo requerido valor invalido');
  });
});

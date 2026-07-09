import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockSocket = vi.hoisted(() => ({
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  removeAllListeners: vi.fn(),
}));

vi.mock('socket.io-client', () => ({
  default: vi.fn(() => mockSocket),
  io: vi.fn(() => mockSocket),
}));

vi.mock('../../src/services/httpClient', () => ({
  resolveSocketBaseUrl: vi.fn(() => 'http://fake-socket.url'),
}));

vi.mock('../../src/utils/sessionStorage', () => ({
  clearStoredSession: vi.fn(),
  getStoredSession: vi.fn(),
}));

import realtimeService from '../../src/services/realtimeService';
import { resolveSocketBaseUrl } from '../../src/services/httpClient';
import { clearStoredSession } from '../../src/utils/sessionStorage';

describe('realtimeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribe sin token retorna funcion noop', () => {
    const unsubscribe = realtimeService.subscribe({});
    expect(typeof unsubscribe).toBe('function');
  });

  it('subscribe crea socket con url y auth', () => {
    realtimeService.subscribe({ token: 'abc123' });
    expect(resolveSocketBaseUrl).toHaveBeenCalled();
    expect(mockSocket.on).toHaveBeenCalled(); // socket was created
  });

  it('subscribe registra evento class_session:changed', () => {
    const handler = vi.fn();
    realtimeService.subscribe({ token: 'abc', onClassSessionChanged: handler });
    expect(mockSocket.on).toHaveBeenCalledWith('class_session:changed', handler);
  });

  it('subscribe registra evento ranking:updated', () => {
    const handler = vi.fn();
    realtimeService.subscribe({ token: 'abc', onRankingUpdated: handler });
    expect(mockSocket.on).toHaveBeenCalledWith('ranking:updated', handler);
  });

  it('subscribe registra evento student_access:changed', () => {
    const handler = vi.fn();
    realtimeService.subscribe({ token: 'abc', onStudentAccessChanged: handler });
    expect(mockSocket.on).toHaveBeenCalledWith('student_access:changed', handler);
  });

  it('subscribe siempre registra connect_error', () => {
    realtimeService.subscribe({ token: 'abc' });
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
  });

  it('unsubscribe remueve listeners y desconecta', () => {
    const unsubscribe = realtimeService.subscribe({ token: 'abc' });
    unsubscribe();
    expect(mockSocket.removeAllListeners).toHaveBeenCalled();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('connect_error con status 401 dispara session-expired', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    realtimeService.subscribe({ token: 'abc' });

    const connectErrorHandler = mockSocket.on.mock.calls.find(
      ([event]) => event === 'connect_error'
    )[1];
    connectErrorHandler({ data: { status: 401 } });

    expect(clearStoredSession).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
  });

  it('connect_error sin status 401 no dispara session-expired', () => {
    realtimeService.subscribe({ token: 'abc' });

    const connectErrorHandler = mockSocket.on.mock.calls.find(
      ([event]) => event === 'connect_error'
    )[1];
    connectErrorHandler({ data: { status: 500 } });

    expect(clearStoredSession).not.toHaveBeenCalled();
  });
});

import { io } from "socket.io-client";
import { clearStoredSession } from "../utils/sessionStorage";
import { resolveSocketBaseUrl } from "./httpClient";

const SOCKET_EVENTS = Object.freeze({
  classSessionChanged: "class_session:changed",
  rankingUpdated: "ranking:updated",
  studentAccessChanged: "student_access:changed",
});

const emitSessionExpired = () => {
  clearStoredSession();
  window.dispatchEvent(new Event("lk:session-expired"));
};

const realtimeService = {
  subscribe({ token, onClassSessionChanged, onRankingUpdated, onStudentAccessChanged } = {}) {
    if (!token) {
      return () => {};
    }

    const socket = io(resolveSocketBaseUrl(), {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    if (onClassSessionChanged) {
      socket.on(SOCKET_EVENTS.classSessionChanged, onClassSessionChanged);
    }

    if (onRankingUpdated) {
      socket.on(SOCKET_EVENTS.rankingUpdated, onRankingUpdated);
    }

    if (onStudentAccessChanged) {
      socket.on(SOCKET_EVENTS.studentAccessChanged, onStudentAccessChanged);
    }

    socket.on("connect_error", (error) => {
      if (error?.data?.status === 401) {
        emitSessionExpired();
      }
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  },
};

export default realtimeService;

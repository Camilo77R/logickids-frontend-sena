import {
  BarChart3,
  History,
  Sparkles,
  Users,
} from "lucide-react";

export const TUTOR_DASHBOARD_ACTIONS = [
  {
    to: "/tutor/grupos",
    label: "Abrir grupos",
    description: "Organiza tus clases y activa sesiones de juego.",
    Icon: Users,
    tone: "purple",
  },
  {
    to: "/tutor/estudiantes",
    label: "Gestionar estudiantes",
    description: "Revisa perfiles, sesiones y movimientos del grupo.",
    Icon: Sparkles,
    tone: "orange",
  },
  {
    to: "/tutor/sesiones",
    label: "Ver sesiones",
    description: "Consulta partidas, tiempos y trazas recientes.",
    Icon: History,
    tone: "blue",
  },
  {
    to: "/tutor/estadisticas",
    label: "Explorar estadísticas",
    description: "Analiza precisión, avance y desempeño pedagógico.",
    Icon: BarChart3,
    tone: "green",
  },
];

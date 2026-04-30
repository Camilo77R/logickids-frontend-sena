import { useEffect, useState } from "react";
import SesionesCharts from "../../components/sesiones/SesionesCharts";
import SesionesFilters from "../../components/sesiones/SesionesFilters";
import SesionesTable from "../../components/sesiones/SesionesTable";

import {
  getSesionesByEstudiante,
  getSesionesPorGrupo
} from "../../services/sesiones.service";

export default function TutorEstadisticasPage() {

  const [tipo, setTipo] = useState("estudiante");
  const [estudiante, setEstudiante] = useState(1);
  const [data, setData] = useState([]);

  const estudiantes = [
    { id: 1, nombre: "María" },
    { id: 2, nombre: "Carlos" }
  ];

  useEffect(() => {
    const cargar = async () => {
      let res = [];

      if (tipo === "estudiante") {
        res = await getSesionesByEstudiante(estudiante);
      } else {
        res = await getSesionesPorGrupo(estudiantes);
      }

      setData(Array.isArray(res) ? res : []);
    };

    cargar();
  }, [tipo, estudiante]);

  return (
    <div style={{ padding: "30px" }}>

      <h1 style={{ marginBottom: "20px" }}>
        Estadísticas de Sesiones
      </h1>

      <SesionesFilters
        tipo={tipo}
        setTipo={setTipo}
        estudiantes={estudiantes}
        setEstudiante={(id) => setEstudiante(Number(id))}
      />

      {/* GRAFICAS */}
      <div style={{ ...card, marginTop: "30px" }}>
        <SesionesCharts data={data} />
      </div>

      {/* TABLA */}
      <div style={{ ...card, marginTop: "30px" }}>
        <SesionesTable data={data} />
      </div>

    </div>
  );
}

const card = {
  background: "white",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  width: "100%"
};
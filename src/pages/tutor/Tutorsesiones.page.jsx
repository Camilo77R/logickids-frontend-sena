import { useEffect, useState } from "react";
import SesionesCharts from "../../components/sesiones/SesionesCharts";
import SesionesFilters from "../../components/sesiones/SesionesFilters";
import SesionesTable from "../../components/sesiones/SesionesTable";

import {
    getSesionesByEstudiante,
    getSesionesPorGrupo
} from "../../services/sesiones.service";

export default function SesionesPage() {

    const [tipo, setTipo] = useState("estudiante");
    const [estudiante, setEstudiante] = useState(1);
    const [data, setData] = useState([]);

    const estudiantes = [
        { id: 1, nombre: "Juan" },
        { id: 2, nombre: "Pedro" }
    ];

    useEffect(() => {
        const cargar = async () => {
            let res = [];

            if (tipo === "estudiante") {
                res = await getSesionesByEstudiante(estudiante);
            } else {
                res = await getSesionesPorGrupo(estudiantes);
            }

            setData(res);
        };

        cargar();
    }, [tipo, estudiante]);

    return (
        <div style={{ padding: "20px" }}>
            <h1>Sesiones</h1>

            <SesionesFilters
                tipo={tipo}
                setTipo={setTipo}
                estudiantes={estudiantes}
                setEstudiante={setEstudiante}
            />

            <SesionesCharts data={data} />

            <SesionesTable data={data} />
        </div>
    );
}
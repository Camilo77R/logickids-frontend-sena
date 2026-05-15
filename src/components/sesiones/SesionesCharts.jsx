import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from "chart.js";

import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

export default function SesionesCharts({ data }) {

  // sumar datos
  const totalAciertos = data.reduce((acc, s) => acc + s.aciertos, 0);
  const totalErrores = data.reduce((acc, s) => acc + s.errores, 0);

  const doughnutData = {
    labels: ["Aciertos", "Errores"],
    datasets: [
      {
        data: [totalAciertos, totalErrores],
        backgroundColor: ["#39D353", "#FF7F00"]
      }
    ]
  };

  const barData = {
    labels: data.map(s => s.minijuego || "Juego"),
    datasets: [
      {
        label: "Puntaje",
        data: data.map(s => s.puntaje),
        backgroundColor: "#007BFF"
      }
    ]
  };

  return (
    <div style={{ display: "flex", gap: "40px" }}>
      <div style={{ width: "300px" }}>
        <Doughnut data={doughnutData} />
      </div>

      <div style={{ width: "400px" }}>
        <Bar data={barData} />
      </div>
    </div>
  );
}
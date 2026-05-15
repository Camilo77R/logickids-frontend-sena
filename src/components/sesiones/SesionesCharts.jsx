import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function SesionesCharts({ data }) {
  const totalAciertos = data.reduce((acc, s) => acc + (s.aciertos || 0), 0);
  const totalErrores = data.reduce((acc, s) => acc + (s.errores || 0), 0);
  const total = totalAciertos + totalErrores;
  const pct = total > 0 ? Math.round((totalAciertos / total) * 100) : 0;

  const doughnutData = {
    labels: ["Aciertos", "Errores"],
    datasets: [
      {
        data: [totalAciertos, totalErrores],
        backgroundColor: ["#10b981", "#ef4444"],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const doughnutOptions = {
    cutout: "72%",
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.raw}`,
        },
      },
    },
  };

  const barData = {
    labels: data.map((s) => s.minijuego || "Juego"),
    datasets: [
      {
        label: "Puntaje",
        data: data.map((s) => s.puntaje),
        backgroundColor: "rgba(139, 92, 246, 0.75)",
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` Puntaje: ${ctx.raw}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: "#64748b", maxRotation: 30 },
      },
      y: {
        grid: { color: "rgba(15,23,42,0.05)" },
        ticks: { font: { size: 11 }, color: "#64748b" },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="ses-charts-container">
      {/* Donut + leyenda */}
      <div className="ses-donut-wrapper">
        <div className="ses-donut-canvas">
          <Doughnut data={doughnutData} options={doughnutOptions} />
          <div className="ses-donut-center">
            <span className="ses-donut-pct">{pct}%</span>
            <span className="ses-donut-label">aciertos</span>
          </div>
        </div>

        <div className="ses-chart-legend">
          <div className="ses-legend-item">
            <span className="ses-legend-dot ses-legend-dot--green" />
            Aciertos
            <strong>{totalAciertos}</strong>
          </div>
          <div className="ses-legend-item">
            <span className="ses-legend-dot ses-legend-dot--red" />
            Errores
            <strong>{totalErrores}</strong>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="ses-bar-wrapper">
        <Bar data={barData} options={barOptions} />
      </div>
    </div>
  );
}

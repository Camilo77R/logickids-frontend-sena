export default function SesionesTable({ data }) {
  return (
    <table border="1" style={{ width: "100%", marginTop: "20px" }}>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Minijuego</th>
          <th>Puntaje</th>
          <th>Aciertos</th>
          <th>Errores</th>
        </tr>
      </thead>
      <tbody>
        {data.map(s => (
          <tr key={s.id}>
            <td>{s.iniciada_en}</td>
            <td>{s.minijuego}</td>
            <td>{s.puntaje}</td>
            <td>{s.aciertos}</td>
            <td>{s.errores}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
import { useState } from "react";
import "./Ping.css";

export default function PingApp() {
  const [host, setHost] = useState("");
  const [result, setResult] = useState(null);

  const hacerPing = async () => {
    try {
      const res = await fetch("http://localhost:3001/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <div className="container">
      <h1>Ping Network Tool</h1>
      <input
        type="text"
        placeholder="Ej: 192.168.8.166"
        value={host}
        onChange={(e) => setHost(e.target.value)}
        className="input"
      />
      <button onClick={hacerPing} className="btn">
        Hacer Ping
      </button>

      {result && (
        <div className="result">
          <p>
            <b>Host:</b> {result.host}
          </p>
          <p>
            <b>Activo:</b> {result.alive ? "Sí" : "No"}
          </p>
          <p>
            <b>Tiempo:</b> {result.time} ms
          </p>
        </div>
      )}
    </div>
  );
}

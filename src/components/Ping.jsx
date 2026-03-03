import { useState } from "react";
import "./Ping.css";

export default function PingApp({ urls }) { // 👈 Recibir urls como prop
  const [host, setHost] = useState("192.168.");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const hacerPing = async () => {
    if (!host) {
      setError("Por favor ingresa una IP o dominio");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      // 👇 Usar la URL base recibida como prop
      const res = await fetch("http://192.168.8.166:3001/ping", { // Cambiado de "http://192.168.8.166/api/ping" a `${urls}/ping`
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host }),
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "Error al hacer ping");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      hacerPing();
    }
  };

  return (
    <div className="ping-container">
      <h2 className="ping-title">
        <span className="ping-icon">🌐</span> Ping Network Tool
      </h2>
      
      <div className="ping-input-group">
        <input
          type="text"
          placeholder="Ej: 192.168.8.1 o google.com"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          onKeyPress={handleKeyPress}
          className="ping-input"
          disabled={isLoading}
        />
        <button 
          onClick={hacerPing} 
          className={`ping-btn ${isLoading ? 'ping-btn-loading' : ''}`}
          disabled={isLoading || !host}
        >
          {isLoading ? (
            <>
              <span className="ping-spinner"></span>
              Pingueando...
            </>
          ) : (
            'Hacer Ping'
          )}
        </button>
      </div>

      {error && (
        <div className="ping-error">
          <span className="ping-error-icon">❌</span>
          {error}
        </div>
      )}

      {result && (
        <div className={`ping-result ${result.alive ? 'ping-result-success' : 'ping-result-error'}`}>
          <div className="ping-result-header">
            <span className="ping-result-icon">
              {result.alive ? '✅' : '❌'}
            </span>
            <span className="ping-result-title">
              {result.alive ? 'Host Activo' : 'Host Inactivo'}
            </span>
          </div>
          
          <div className="ping-result-details">
            <div className="ping-detail-item">
              <span className="ping-detail-label">Host:</span>
              <span className="ping-detail-value">{result.host}</span>
            </div>
            
            <div className="ping-detail-item">
              <span className="ping-detail-label">Estado:</span>
              <span className="ping-detail-value">
                {result.alive ? (
                  <span className="ping-status-active">Activo</span>
                ) : (
                  <span className="ping-status-inactive">Inactivo</span>
                )}
              </span>
            </div>
            
            <div className="ping-detail-item">
              <span className="ping-detail-label">Tiempo:</span>
              <span className="ping-detail-value">
                {result.time ? `${result.time} ms` : 'N/A'}
              </span>
            </div>
          </div>

          {result.alive && (
            <div className="ping-success-message">
              <span className="ping-success-icon">📡</span>
              El host respondió correctamente al ping
            </div>
          )}
          
          {!result.alive && (
            <div className="ping-error-message">
              <span className="ping-error-icon">⚠️</span>
              El host no respondió al ping. Verifica la IP o el estado del dispositivo.
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .ping-container {
          background: #1e293b;
          border-radius: 8px;
          padding: 20px;
          color: #f1f5f9;
        }

        .ping-title {
          margin: 0 0 20px 0;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #f1f5f9;
        }

        .ping-icon {
          font-size: 1.5rem;
        }

        .ping-input-group {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .ping-input {
          flex: 1;
          padding: 12px 16px;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 6px;
          color: #f1f5f9;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .ping-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
        }

        .ping-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ping-btn {
          padding: 12px 24px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border: none;
          border-radius: 6px;
          color: white;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .ping-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .ping-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ping-btn-loading {
          cursor: wait;
        }

        .ping-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .ping-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid #ef4444;
          border-radius: 6px;
          padding: 12px 16px;
          margin-bottom: 20px;
          color: #fecaca;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ping-error-icon {
          font-size: 1.1rem;
        }

        .ping-result {
          border-radius: 6px;
          overflow: hidden;
        }

        .ping-result-success {
          border: 1px solid #10b981;
        }

        .ping-result-error {
          border: 1px solid #ef4444;
        }

        .ping-result-header {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }

        .ping-result-success .ping-result-header {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .ping-result-error .ping-result-header {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .ping-result-icon {
          font-size: 1.2rem;
        }

        .ping-result-title {
          font-size: 1.1rem;
        }

        .ping-result-details {
          padding: 16px;
          background: #0f172a;
        }

        .ping-detail-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #334155;
        }

        .ping-detail-item:last-child {
          border-bottom: none;
        }

        .ping-detail-label {
          color: #94a3b8;
        }

        .ping-detail-value {
          color: #f1f5f9;
          font-weight: 500;
        }

        .ping-status-active {
          color: #10b981;
        }

        .ping-status-inactive {
          color: #ef4444;
        }

        .ping-success-message,
        .ping-error-message {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-top: 1px solid #334155;
        }

        .ping-success-message {
          background: rgba(16, 185, 129, 0.05);
          color: #10b981;
        }

        .ping-error-message {
          background: rgba(239, 68, 68, 0.05);
          color: #ef4444;
        }

        @media (max-width: 640px) {
          .ping-input-group {
            flex-direction: column;
          }

          .ping-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
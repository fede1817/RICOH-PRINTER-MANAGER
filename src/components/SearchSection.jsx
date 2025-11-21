import "./SearchSection.css";

const SearchSection = ({ codCenso, setCodCenso, fetchClienteData, cargando, onClose }) => {
  return (
    <div className="search-section">
      <div className="search-header">
        <h3>Búsqueda Manual</h3>
        <button className="close-button" onClick={onClose}>
          ✕
        </button>
      </div>
      <p className="search-subtitle">Ingrese otro código de censo o link para validar</p>
      <div className="search-box">
        <input
          type="text"
          placeholder="Ingrese código de censo o link..."
          value={codCenso}
          onChange={(e) => setCodCenso(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              fetchClienteData();
            }
          }}
        />
        <button onClick={fetchClienteData} disabled={cargando}>
          {cargando ? "Buscando..." : "Buscar"}
        </button>
      </div>
    </div>
  );
};

export default SearchSection;
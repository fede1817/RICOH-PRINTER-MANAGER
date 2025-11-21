const ValidationResults = ({ errores, advertencias }) => {
  return (
    <div className="validator-resultados">
      <h2>Resultados de Validación</h2>

      {errores.length === 0 ? (
        <div className="validator-success">Todos los datos son válidos</div>
      ) : (
        <div className="validator-errores">
          <h3>Errores:</h3>
          <ul className="validator-ul">
            {errores.map((error, index) => (
              <li key={index} className="validator-li">✗ {error}</li>
            ))}
          </ul>
        </div>
      )}

      {advertencias.length > 0 && (
        <div className="validator-advertencias">
          <h3>Advertencias:</h3>
          <ul className="validator-ul">
            {advertencias.map((advertencia, index) => (
              <li key={index} className="validator-li">{advertencia}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ValidationResults;
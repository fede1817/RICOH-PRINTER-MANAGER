import { useState } from 'react';
import './Mapa.css';

const Mapa = ({ latitud, longitud, razonsocial, direccion }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);

  if (!latitud || !longitud) {
    return (
      <div className="mapa-moderno">
        <div className="mapa-header-moderno">
          <h3>
            <i className="fas fa-map-marker-alt"></i>
            Ubicación del Cliente
          </h3>
        </div>
        <div className="mapa-error-moderno">
          <div className="error-content">
            <i className="fas fa-exclamation-triangle"></i>
            <p>No hay coordenadas GPS registradas para este cliente</p>
            <p className="text-muted">Las coordenadas GPS son necesarias para mostrar la ubicación en el mapa</p>
          </div>
        </div>
      </div>
    );
  }

  const lat = parseFloat(latitud);
  const lng = parseFloat(longitud);

  if (isNaN(lat) || isNaN(lng)) {
    return (
      <div className="mapa-moderno">
        <div className="mapa-header-moderno">
          <h3>
            <i className="fas fa-map-marker-alt"></i>
            Ubicación del Cliente
          </h3>
        </div>
        <div className="mapa-error-moderno">
          <div className="error-content">
            <i className="fas fa-times-circle"></i>
            <p>Coordenadas GPS inválidas</p>
          </div>
        </div>
      </div>
    );
  }

  // Zoom muy cercano para vista detallada
  const bbox = `${lng-0.001},${lat-0.001},${lng+0.001},${lat+0.001}`;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  const externalUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=19/${lat}/${lng}`;
  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}&z=19`;

  const copiarCoordenadas = async () => {
    const coords = `${latitud}, ${longitud}`;
    try {
      await navigator.clipboard.writeText(coords);
      // Podrías agregar una notificación toast aquí
      console.log('Coordenadas copiadas:', coords);
    } catch (err) {
      console.error('Error copiando coordenadas:', err);
    }
  };

  return (
    <div className="mapa-moderno">
      <div className="mapa-header-moderno">
        <h3>
          <i className="fas fa-map-marked-alt"></i>
          Ubicación del Cliente
        </h3>
        <div className="mapa-controls-moderno">
          <button 
            onClick={copiarCoordenadas}
            className="btn-mapa btn-copiar"
            title="Copiar coordenadas al portapapeles"
            type="button"
          >
            <i className="fas fa-copy"></i>
            Copiar Coordenadas
          </button>
          
          <div className="mapa-actions">
            <a 
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-mapa btn-externo"
              title="Abrir en OpenStreetMap"
            >
              <i className="fas fa-external-link-alt"></i>
              OSM
            </a>
            <a 
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-mapa btn-externo"
              title="Abrir en Google Maps"
            >
              <i className="fas fa-map"></i>
              GMaps
            </a>
          </div>
          
          <div className="coordenadas-display-moderno">
            <div className="coord-item">
              <span className="coord-label">Lat:</span>
              <span className="coord-value">{lat.toFixed(6)}</span>
            </div>
            <div className="coord-item">
              <span className="coord-label">Lng:</span>
              <span className="coord-value">{lng.toFixed(6)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mapa-contenedor-moderno">
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          title={`Ubicación de ${razonsocial || 'cliente'}`}
          onLoad={() => setMapLoaded(true)}
          onError={() => setError('Error al cargar el mapa')}
          className="mapa-iframe"
        />
        {!mapLoaded && !error && (
          <div className="mapa-cargando-moderno">
            <div className="spinner-moderno"></div>
            <p>Cargando mapa...</p>
          </div>
        )}
        {error && (
          <div className="mapa-error-inline">
            <i className="fas fa-exclamation-circle"></i>
            <p>{error}</p>
          </div>
        )}
      </div>
      
      <div className="mapa-footer-moderno">
        <div className="info-cliente">
          <div className="info-item">
            <i className="fas fa-building"></i>
            <div className="info-content">
              <strong>{razonsocial || 'Cliente no identificado'}</strong>
            </div>
          </div>
          <div className="info-item">
            <i className="fas fa-location-dot"></i>
            <div className="info-content">
              <span>{direccion || 'Dirección no especificada'}</span>
            </div>
          </div>
        </div>
        <div className="mapa-attribution-moderno">
          <small>
            <i className="fas fa-map"></i>
            Mapa proporcionado por{' '}
            <a 
              href="https://www.openstreetmap.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="attribution-link"
            >
              OpenStreetMap
            </a>
          </small>
        </div>
      </div>
    </div>
  );
};

export default Mapa;
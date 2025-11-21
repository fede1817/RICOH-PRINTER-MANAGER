import { useState, useEffect } from "react";
import SearchSection from "./SearchSection";
import "./HomePage.css";

const HomePage = ({ onSelectCenso }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [censos, setCensos] = useState([]);
  const [filteredCensos, setFilteredCensos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLinkSearch, setShowLinkSearch] = useState(false);
  const [linkSearchCode, setLinkSearchCode] = useState("");
  
  // 🔥 NUEVOS ESTADOS PARA FECHAS
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  
  // 🔥 NUEVOS ESTADOS PARA ORDENAMIENTO
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending'
  });

  // 🔥 NUEVOS ESTADOS PARA PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Función para formatear fechas en YYYY-MM-DD
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Función para obtener la fecha de hoy
  const getToday = () => {
    return formatDate(new Date());
  };

  // 🔥 INICIALIZAR FECHAS AL MONTAR EL COMPONENTE
  useEffect(() => {
    const today = getToday();
    setFechaInicio(today);
    setFechaFin(today);
  }, []);

  // 🔥 CALCULAR DATOS DE PAGINACIÓN
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCensos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCensos.length / itemsPerPage);

  // 🔥 FUNCIÓN PARA CAMBIAR DE PÁGINA
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // 🔥 FUNCIÓN PARA CAMBIAR ITEMS POR PÁGINA
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Volver a la primera página
  };

  // 🔥 RESETEAR PAGINACIÓN CUANDO CAMBIAN LOS FILTROS
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, fechaInicio, fechaFin, filteredCensos.length]);

  // 🔥 FUNCIÓN PARA MANEJAR EL CLICK EN LOS TÍTULOS DE COLUMNA
  const handleSort = (key) => {
    let direction = 'ascending';
    
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      setSortConfig({ key: null, direction: 'ascending' });
      return;
    }
    
    setSortConfig({ key, direction });
  };

  // 🔥 FUNCIÓN PARA ORDENAR LOS DATOS
  const sortData = (data, sortKey, sortDirection) => {
    if (!sortKey) return data;

    const sortedData = [...data].sort((a, b) => {
      let aValue = a[sortKey];
      let bValue = b[sortKey];

      // 🔥 MANEJO ESPECIAL PARA CAMPOS ANIDADOS O ESPECÍFICOS
      switch (sortKey) {
        case 'sucursal':
          aValue = getSucursal(a);
          bValue = getSucursal(b);
          break;
        case 'vendedor':
          aValue = getNombreVendedor(a);
          bValue = getNombreVendedor(b);
          break;
        case 'fecha':
          aValue = a.fecha || a.fechaenvio;
          bValue = b.fecha || b.fechaenvio;
          break;
        case 'estado':
          aValue = getEstado(a).texto;
          bValue = getEstado(b).texto;
          break;
        case 'codclientecenso':
          aValue = a.codclientecenso;
          bValue = b.codclientecenso;
          break;
        case 'razonsocial':
          aValue = a.razonsocial;
          bValue = b.razonsocial;
          break;
        case 'ruc':
          aValue = a.ruc || "";
          bValue = b.ruc || "";
          break;
        default:
          break;
      }

      // Manejar valores nulos o undefined
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      // Convertir a string para comparación case-insensitive
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();

      // Comparar
      if (aValue < bValue) {
        return sortDirection === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    return sortedData;
  };

  // 🔥 FUNCIÓN MEJORADA PARA FILTRAR CENSOS
  const filterCensos = () => {
    if (!searchTerm.trim()) {
      // Si no hay término de búsqueda, usar todos los censos
      const dataToUse = censos;
      // Aplicar ordenamiento si está activo
      const sortedData = sortConfig.key 
        ? sortData(dataToUse, sortConfig.key, sortConfig.direction)
        : dataToUse;
      setFilteredCensos(sortedData);
      return;
    }

    // Filtrar basado en el searchTerm
    const filtered = censos.filter(censo => 
      censo.razonsocial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      censo.ruc?.includes(searchTerm) ||
      censo.codclientecenso?.toString().includes(searchTerm) ||
      censo.usuario?.nombrepersona?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      censo.sucursal?.nombresucursal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      censo.direccion?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // 🔥 APLICAR ORDENAMIENTO A LOS DATOS FILTRADOS
    const sortedFiltered = sortConfig.key 
      ? sortData(filtered, sortConfig.key, sortConfig.direction)
      : filtered;
    
    setFilteredCensos(sortedFiltered);
  };

  // 🔥 EFECTO SIMPLIFICADO - SOLO FILTRAR CUANDO CAMBIE searchTerm O censos
  useEffect(() => {
    filterCensos();
  }, [searchTerm, censos]);

  // 🔥 EFECTO SEPARADO PARA ORDENAMIENTO - SE EJECUTA CUANDO CAMBIA sortConfig
  useEffect(() => {
    if (filteredCensos.length > 0 && sortConfig.key) {
      const sortedData = sortData(filteredCensos, sortConfig.key, sortConfig.direction);
      setFilteredCensos(sortedData);
    } else if (sortConfig.key === null) {
      // Si se limpia el ordenamiento, volver a aplicar el filtro normal
      filterCensos();
    }
  }, [sortConfig]);

  // 🔥 FUNCIÓN PARA OBTENER EL ÍCONO DE ORDENAMIENTO CON FONTAWESOME
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <i className="fas fa-sort" />;
    }
    return sortConfig.direction === 'ascending' 
      ? <i className="fas fa-sort-up" />
      : <i className="fas fa-sort-down" />;
  };

  // 🔥 FUNCIÓN MODIFICADA PARA CARGAR CENSOS CON FECHAS PERSONALIZADAS
  const fetchCensos = async (inicio = fechaInicio, fin = fechaFin) => {
    setLoading(true);
    setError("");

    try {
      const credentials = btoa(
        `${"federico.britez@surcomercial.com.py"}:${"Surcomercial.fb"}`
      );

      // Usar las fechas proporcionadas o las del estado
      const fechaInicioUsar = inicio || fechaInicio;
      const fechaFinUsar = fin || fechaFin;
      
      const response = await fetch(
        `https://apps.mobile.com.py:8443/mbusiness/rest/private/censo?codempresa=15&fechainicio=${fechaInicioUsar}&fechafin=${fechaFinUsar}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      setCensos(data);
    } catch (error) {
      console.error("Error fetching censos:", error);
      setError(`Error al cargar los censos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FUNCIÓN PARA BUSCAR CON LAS FECHAS SELECCIONADAS
  const handleBuscarPorFechas = () => {
    if (!fechaInicio || !fechaFin) {
      setError("Por favor seleccione ambas fechas");
      return;
    }
    
    if (fechaInicio > fechaFin) {
      setError("La fecha de inicio no puede ser mayor a la fecha fin");
      return;
    }
    
    fetchCensos(fechaInicio, fechaFin);
  };

  // 🔥 Cargar censos al montar el componente (con fechas por defecto)
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      fetchCensos();
    }
  }, [fechaInicio, fechaFin]); // Solo se ejecuta cuando las fechas están inicializadas

  // Configurar actualización automática cada 2 minutos
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log("Actualizando censos automáticamente...");
      fetchCensos();
    }, 24 * 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [fechaInicio, fechaFin]); // Depende de las fechas actuales

  // Función para abrir en nueva pestaña
  // En HomePage.js, en la función handleValidateInNewTab
const handleValidateInNewTab = (censo) => {
  const codigoCenso = censo.codclientecenso || censo.codigoCenso || censo.id;
  
  // 🔥 AGREGAR PARÁMETRO PARA FORZAR SECCIÓN DE CENSOS
  const url = `${window.location.origin}${window.location.pathname}?censo=${codigoCenso}&section=censos`;
  
  window.open(url, '_blank');
};
  // Función para mostrar/ocultar el SearchSection de links
  const handleToggleLinkSearch = () => {
    setShowLinkSearch(!showLinkSearch);
    setLinkSearchCode("");
  };

  // Función para buscar por link o código (abre en nueva pestaña)
  const handleLinkSearch = () => {
    if (linkSearchCode && linkSearchCode.trim() !== '') {
      const match = linkSearchCode.match(/\/editar\/'?(\d+)'?/);
      const codigoCenso = match ? match[1] : linkSearchCode.trim();
      const url = `${window.location.origin}${window.location.pathname}?censo=${codigoCenso}`;
      window.open(url, '_blank');
    }
  };

  // Función para obtener el nombre del vendedor
  const getNombreVendedor = (censo) => {
    return censo.usuario?.nombrepersona || 
           censo.nombrevendedor || 
           "No especificado";
  };

  // Función para obtener la sucursal
  const getSucursal = (censo) => {
    return censo.sucursal?.nombresucursal || 
           censo.codsucursalerp || 
           "No especificado";
  };

  // Función para obtener el estado del censo
  const getEstado = (censo) => {
    const estado = censo.estado;
    switch(estado) {
      case 'TEMP':
        return { texto: 'Temporal', clase: 'estado-temp' };
      case 'SYNC':
        return { texto: 'Sincronizado', clase: 'estado-sync' };
      case 'PENDIENTE':
        return { texto: 'Pendiente', clase: 'estado-pendiente' };
      default:
        return { texto: estado || 'Desconocido', clase: 'estado-desconocido' };
    }
  };

  // Función para formatear la fecha
  const formatFecha = (fechaMillis) => {
    if (!fechaMillis) return 'No disponible';
    const fecha = new Date(fechaMillis);
    return fecha.toLocaleDateString('es-PY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // 🔥 FUNCIÓN MODIFICADA PARA RECARGAR LOS CENSOS
  const handleReload = () => {
    fetchCensos();
  };

  // 🔥 FUNCIÓN PARA GENERAR LOS BOTONES DE PAGINACIÓN
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Ajustar startPage si estamos cerca del final
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Botón anterior
    buttons.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="pagination-btn pagination-prev"
      >
        <i className="fas fa-chevron-left"></i>
      </button>
    );

    // Primera página y puntos suspensivos si es necesario
    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="pagination-btn"
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(
          <span key="ellipsis1" className="pagination-ellipsis">
            ...
          </span>
        );
      }
    }

    // Páginas visibles
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`pagination-btn ${currentPage === i ? 'pagination-active' : ''}`}
        >
          {i}
        </button>
      );
    }

    // Última página y puntos suspensivos si es necesario
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="ellipsis2" className="pagination-ellipsis">
            ...
          </span>
        );
      }
      buttons.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="pagination-btn"
        >
          {totalPages}
        </button>
      );
    }

    // Botón siguiente
    buttons.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="pagination-btn pagination-next"
      >
        <i className="fas fa-chevron-right"></i>
      </button>
    );

    return buttons;
  };

  return (
    <div className="home-page">
      {/* 🔥 SECCIÓN DE FILTROS POR FECHA CON BOTONES DEBajo */}
      <div className="filters-section">
        <div className="date-filters">
          <div className="date-input-group">
            <label htmlFor="fechaInicio">Fecha Inicio:</label>
            <input
              type="date"
              id="fechaInicio"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="date-input"
              max={getToday()}
            />
          </div>
          
          <div className="date-input-group">
            <label htmlFor="fechaFin">Fecha Fin:</label>
            <input
              type="date"
              id="fechaFin"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="date-input"
              max={getToday()}
            />
          </div>
        </div>
        
        {/* 🔥 BOTONES MOVIDOS AQUÍ - DEBAJO DE LOS FILTROS DE FECHA */}
        <div className="search-actions">
          <button 
            className="search-dates-button"
            onClick={handleBuscarPorFechas}
            disabled={loading}
          >
            <i className="fas fa-calendar-alt"></i>
            {loading ? 'Buscando...' : 'Buscar por Fechas'}
          </button>
          
          <button 
            className="search-link-button" 
            onClick={handleToggleLinkSearch}
          >
            <i className="fas fa-link"></i>
            {showLinkSearch ? '✕ Cerrar' : 'Buscar por Link'}
          </button>
        </div>
      </div>

      {/* SearchSection - esto debería funcionar correctamente ahora */}
      {showLinkSearch && (
        <SearchSection
          codCenso={linkSearchCode}
          setCodCenso={setLinkSearchCode}
          fetchClienteData={handleLinkSearch}
          cargando={false}
          onClose={() => setShowLinkSearch(false)}
        />
      )}

      <div className="search-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Filtrar por razón social, RUC, sucursal o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {loading && <div className="search-spinner"></div>}
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {filteredCensos.length > 0 ? (
          <div className="results-container">
            {/* 🔥 CONTROLES DE PAGINACIÓN SUPERIOR */}
            <div className="pagination-controls top">
              <div className="pagination-info">
                Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredCensos.length)} de {filteredCensos.length} censos
              </div>
              <div className="pagination-items-per-page">
                <label htmlFor="itemsPerPage">Mostrar:</label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="items-per-page-select"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="table-container">
              <table className="censos-table">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => handleSort('codclientecenso')}>
                      <div className="th-content">
                        Código Censo
                        <span className="sort-icon">{getSortIcon('codclientecenso')}</span>
                      </div>
                    </th>
                    <th className="sortable" onClick={() => handleSort('sucursal')}>
                      <div className="th-content">
                        Sucursal
                        <span className="sort-icon">{getSortIcon('sucursal')}</span>
                      </div>
                    </th>
                    <th className="sortable" onClick={() => handleSort('vendedor')}>
                      <div className="th-content">
                        Vendedor
                        <span className="sort-icon">{getSortIcon('vendedor')}</span>
                      </div>
                    </th>
                    <th className="sortable" onClick={() => handleSort('razonsocial')}>
                      <div className="th-content">
                        Razón Social
                        <span className="sort-icon">{getSortIcon('razonsocial')}</span>
                      </div>
                    </th>
                    <th className="sortable" onClick={() => handleSort('ruc')}>
                      <div className="th-content">
                        RUC
                        <span className="sort-icon">{getSortIcon('ruc')}</span>
                      </div>
                    </th>
                    <th className="sortable" onClick={() => handleSort('fecha')}>
                      <div className="th-content">
                        Fecha
                        <span className="sort-icon">{getSortIcon('fecha')}</span>
                      </div>
                    </th>
                    <th className="sortable" onClick={() => handleSort('estado')}>
                      <div className="th-content">
                        Estado
                        <span className="sort-icon">{getSortIcon('estado')}</span>
                      </div>
                    </th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((censo) => {
                    const estado = getEstado(censo);
                    return (
                      <tr key={censo.codclientecenso || censo.id}>
                        <td className="codigo-censo">
                          <strong>{censo.codclientecenso}</strong>
                        </td>
                        <td className="sucursal">{getSucursal(censo)}</td>
                        <td className="vendedor">{getNombreVendedor(censo)}</td>
                        <td className="razon-social">
                          <div className="razon-social-content">
                            <strong>{censo.razonsocial}</strong>
                            {censo.cliente?.concatcliente && (
                              <div className="cliente-codigo">
                                Cliente: {censo.cliente.codclienteerp}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="ruc">{censo.ruc || "No especificado"}</td>
                        <td className="hora">{formatFecha(censo.fecha || censo.fechaenvio)}</td>
                        <td className="estado">
                          <span className={`estado-badge ${estado.clase}`}>
                            {estado.texto}
                          </span>
                        </td>
                        <td className="acciones">
                          <button 
                            className="select-button"
                            onClick={() => handleValidateInNewTab(censo)}
                            title="Abrir en nueva pestaña"
                          >
                            Validar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 🔥 CONTROLES DE PAGINACIÓN INFERIOR */}
            <div className="pagination-controls bottom">
              <div className="pagination-info">
                Página {currentPage} de {totalPages} - {filteredCensos.length} censos totales
              </div>
              
              <div className="pagination-buttons">
                {renderPaginationButtons()}
              </div>

              <div className="pagination-items-per-page">
                <label htmlFor="itemsPerPageBottom">Mostrar:</label>
                <select
                  id="itemsPerPageBottom"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="items-per-page-select"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="results-info">
              <span>
                {searchTerm && (
                  <span className="search-term-info">Filtrado para "{searchTerm}"</span>
                )}
                {sortConfig.key && (
                  <span className="sort-info">
                    | Ordenado por: {sortConfig.key} ({sortConfig.direction === 'ascending' ? 'ascendente' : 'descendente'})
                  </span>
                )}
              </span>
            </div>
          </div>
        ) : (
          <div className="no-results">
            {loading ? (
              <div className="loading-message">
                <div className="spinner-small"></div>
                Cargando censos...
              </div>
            ) : searchTerm ? (
              `No se encontraron censos para "${searchTerm}"`
            ) : (
              `No hay censos registrados para el período ${fechaInicio} al ${fechaFin}`
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
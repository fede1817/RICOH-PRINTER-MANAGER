import { useState, useEffect } from 'react'
import { FiNavigation } from 'react-icons/fi'
import { 
  FaChevronLeft, 
  FaChevronRight, 
  FaAngleDoubleLeft, 
  FaAngleDoubleRight,
  FaEllipsisH 
} from 'react-icons/fa'
import SearchControls from './SearchControls'
import Stats from './Stats'
import DeviceGrid from './DeviceGrid'
import Loading from './Loading'
import Error from './Error'
import NoResults from './NoResults'
import { useAuth } from "../context/AuthContext";

// Nuevo componente para la paginación con FontAwesome
function Pagination({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange, itemsPerPageOptions }) {
  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '24px',
      padding: '16px',
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      flexWrap: 'wrap',
      gap: '16px'
    },
    itemsPerPage: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    itemsPerPageLabel: {
      color: '#cbd5e1',
      fontSize: '14px'
    },
    itemsPerPageSelect: {
      backgroundColor: '#0f172a',
      border: '1px solid #475569',
      borderRadius: '6px',
      padding: '8px 12px',
      color: '#f1f5f9',
      fontSize: '14px',
      cursor: 'pointer',
      outline: 'none'
    },
    pageInfo: {
      color: '#cbd5e1',
      fontSize: '14px'
    },
    pageButtons: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center'
    },
    pageButton: {
      backgroundColor: '#0f172a',
      border: '1px solid #475569',
      borderRadius: '6px',
      padding: '8px 12px',
      color: '#f1f5f9',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      minWidth: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    pageButtonActive: {
      backgroundColor: '#3b82f6',
      borderColor: '#3b82f6',
      color: 'white'
    },
    pageButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
      '&:hover': {
        backgroundColor: '#0f172a',
        transform: 'none'
      }
    },
    ellipsis: {
      color: '#cbd5e1',
      padding: '8px',
      display: 'flex',
      alignItems: 'center'
    }
  }

  const handleItemsPerPageChange = (e) => {
    onItemsPerPageChange(Number(e.target.value))
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  return (
    <div style={styles.container}>
      <div style={styles.itemsPerPage}>
        <span style={styles.itemsPerPageLabel}>Mostrar:</span>
        <select 
          value={itemsPerPage} 
          onChange={handleItemsPerPageChange}
          style={styles.itemsPerPageSelect}
        >
          {itemsPerPageOptions.map(option => (
            <option key={option} value={option}>{option} por página</option>
          ))}
        </select>
      </div>

      <div style={styles.pageInfo}>
        Página {currentPage} de {totalPages}
      </div>

      <div style={styles.pageButtons}>
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          style={{
            ...styles.pageButton,
            ...(currentPage === 1 ? styles.pageButtonDisabled : {})
          }}
          title="Primera página"
        >
          <FaAngleDoubleLeft />
        </button>
        
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            ...styles.pageButton,
            ...(currentPage === 1 ? styles.pageButtonDisabled : {})
          }}
          title="Página anterior"
        >
          <FaChevronLeft />
        </button>

        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`dots-${index}`} style={styles.ellipsis}>
              <FaEllipsisH />
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              style={{
                ...styles.pageButton,
                ...(currentPage === page ? styles.pageButtonActive : {})
              }}
              title={`Página ${page}`}
            >
              {page}
            </button>
          )
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            ...styles.pageButton,
            ...(currentPage === totalPages ? styles.pageButtonDisabled : {})
          }}
          title="Página siguiente"
        >
          <FaChevronRight />
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          style={{
            ...styles.pageButton,
            ...(currentPage === totalPages ? styles.pageButtonDisabled : {})
          }}
          title="Última página"
        >
          <FaAngleDoubleRight />
        </button>
      </div>
    </div>
  )
}

function CellManager() {
  const [trackingData, setTrackingData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [paginatedData, setPaginatedData] = useState([]) // Estado para datos paginados
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSucursal, setSelectedSucursal] = useState('')
  const [selectedPowerStatus, setSelectedPowerStatus] = useState('')
  const [selectedActiveStatus, setSelectedActiveStatus] = useState('todos')
  
  // Nuevos estados para paginación - por defecto 10
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10) // Cambiado a 10 por defecto
  const itemsPerPageOptions = [10, 50, 100] // Opciones disponibles
  
  const { authCredentials } = useAuth();

  const fetchTrackingData = async () => {
    try {
      setLoading(true)
      setError(null)      
      const response = await fetch(
        `https://apps.mobile.com.py:8443/mbusiness/rest/private/rastreo/resumenzona?codusuario=3542`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${authCredentials}`,
          },
        }
      )

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`)
      
      const data = await response.json()
      const devicesArray = Array.isArray(data) ? data : [data]
      setTrackingData(devicesArray)
      setFilteredData(devicesArray)
      setCurrentPage(1) // Resetear a primera página cuando se cargan nuevos datos
      
    } catch (error) {
      console.error("❌ Error:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Función para formatear el tiempo transcurrido
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Sin datos'
    
    const now = Date.now()
    const diff = now - timestamp
    
    // Si el timestamp está en el futuro (diff negativo)
    if (diff < 0) {
      const futureDiff = Math.abs(diff)
      const seconds = Math.floor(futureDiff / 1000)
      
      if (seconds < 60) return `en ${seconds} segundos`
      
      const minutes = Math.floor(seconds / 60)
      if (minutes < 60) return `en ${minutes} minuto${minutes > 1 ? 's' : ''}`
      
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `en ${hours} hora${hours > 1 ? 's' : ''}`
      
      return 'en el futuro'
    }
    
    // Timestamp en el pasado (comportamiento normal)
    const seconds = Math.floor(diff / 1000)
    if (seconds < 60) return `hace ${seconds} segundos`
    
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `hace ${hours} hora${hours > 1 ? 's' : ''}`
    
    const days = Math.floor(hours / 24)
    if (days < 30) return `hace ${days} día${days > 1 ? 's' : ''}`
    
    const months = Math.floor(days / 30)
    if (months < 12) return `hace ${months} mes${months > 1 ? 'es' : ''}`
    
    const years = Math.floor(months / 12)
    return `hace ${years} año${years > 1 ? 's' : ''}`
  }

  // Función para obtener el color según la antigüedad
  const getTimeColor = (timestamp) => {
    if (!timestamp) return '#EF4444'
    
    const now = Date.now()
    const diff = now - timestamp
    
    // Si el timestamp está en el futuro, usar color especial
    if (diff < 0) {
      return '#8B5CF6' // Color violeta para timestamps futuros
    }
    
    // Timestamp en el pasado (comportamiento normal)
    const hours = Math.floor(diff / (60 * 60 * 1000))
    
    if (hours < 1) return '#10B981'
    if (hours < 6) return '#F59E0B'
    if (hours < 12) return '#F97316'
    if (hours < 24) return '#DC2626'
    return '#DC2626'
  }

  // Función para determinar el nivel de confianza del estado
  const getPowerConfidence = (device) => {
    const tracking = device.tracking
    if (!tracking) return 'sin_datos'
    
    const now = Date.now()
    const isDataRecent = tracking?.fechacaptura && 
      (now - tracking.fechacaptura) < (24 * 60 * 60 * 1000) &&
      (now - tracking.fechacaptura) >= 0 // Asegurar que no sea futuro
    
    // Si el timestamp está en el futuro, considerar como datos antiguos
    if (tracking?.fechacaptura && (now - tracking.fechacaptura) < 0) {
      return 'datos_antiguos'
    }
    
    if (!isDataRecent) return 'datos_antiguos'
    
    if (tracking.gpsactivo === true) return 'alta'
    if (tracking.bateria > 0 && tracking.imei) return 'media'
    if (tracking.tipored && tracking.bateria !== undefined) return 'baja'
    
    return 'insuficiente'
  }

  // Función para determinar si el teléfono está prendido
  const isPhoneOn = (device) => {
    const tracking = device.tracking
    
    if (!tracking) return false
    
    const isDataRecent = tracking?.fechacaptura && 
      (Date.now() - tracking.fechacaptura) < (24 * 60 * 60 * 1000)
    
    if (!isDataRecent) return false
    
    if (tracking.gpsactivo === true) return true
    if ((tracking.bateria > 0) && tracking.imei) return true
    if (tracking.tipored && tracking.bateria !== undefined) return true
    
    return false
  }

  // Filtrar dispositivos
  useEffect(() => {
    let filtered = trackingData
    
    // Filtro por estado activo/inactivo del usuario
    if (selectedActiveStatus !== 'todos') {
      filtered = filtered.filter(device => {
        const isActive = device.tracking?.usuario?.activo === true
        
        if (selectedActiveStatus === 'activo') {
          return isActive
        } else { // 'inactivo'
          return !isActive
        }
      })
    }
    
    if (searchTerm) {
      const batteryMatch = searchTerm.match(/(\d+)%?|bateria\s*(\d+)|carga\s*(\d+)/i)
      const batteryValue = batteryMatch ? parseInt(batteryMatch[1] || batteryMatch[2] || batteryMatch[3]) : null
      
      if (batteryValue !== null && !isNaN(batteryValue)) {
        filtered = filtered.filter(device => {
          const deviceBattery = device.tracking?.bateria || 0
          const minBattery = Math.max(0, batteryValue - 5)
          const maxBattery = Math.min(100, batteryValue + 5)
          return deviceBattery >= minBattery && deviceBattery <= maxBattery
        })
      } else {
        filtered = filtered.filter(device => 
          device.tracking?.usuario?.nombrepersona?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          device.tracking?.usuario?.sucursal?.nombresucursal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          device.tracking?.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          device.tracking?.nrotelefono?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
    }
    
    if (selectedSucursal) {
      filtered = filtered.filter(device => 
        device.tracking?.usuario?.sucursal?.nombresucursal === selectedSucursal
      )
    }
    
    if (selectedPowerStatus) {
      filtered = filtered.filter(device => {
        const phoneOn = isPhoneOn(device)
        if (selectedPowerStatus === 'encendido') return phoneOn
        if (selectedPowerStatus === 'apagado') return !phoneOn
        return true
      })
    }
    
    setFilteredData(filtered)
    setCurrentPage(1) // Resetear a primera página cuando cambian los filtros
  }, [searchTerm, selectedSucursal, selectedPowerStatus, selectedActiveStatus, trackingData])

  // Efecto para paginar los datos filtrados
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedData(filteredData.slice(startIndex, endIndex))
  }, [filteredData, currentPage, itemsPerPage])

  // Obtener lista única de sucursales
  const sucursales = [...new Set(trackingData
    .map(device => device.tracking?.usuario?.sucursal?.nombresucursal)
    .filter(Boolean)
  )].sort()

  useEffect(() => {
    fetchTrackingData()
    const interval = setInterval(fetchTrackingData, 24 * 60 * 60 * 1000) // 24 horas
    return () => clearInterval(interval)
  }, [])

  // Calcular total de páginas
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  // Manejadores para paginación
  const handlePageChange = (page) => {
    setCurrentPage(page)
    // Scroll suave hacia arriba cuando cambia la página
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Resetear a primera página cuando cambia el número de items por página
  }

  // Estilos CSS en objeto - MODO OSCURO
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#f8fafc'
    },
    header: {
      textAlign: 'center',
      marginBottom: '32px'
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#f1f5f9',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px'
    },
    subtitle: {
      color: '#94a3b8',
      marginBottom: '24px'
    },
    filterSection: {
      display: 'flex',
      justifyContent: 'center',
      gap: '16px',
      marginBottom: '24px',
      flexWrap: 'wrap'
    },
    filterGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      minWidth: '200px'
    },
    filterLabel: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#cbd5e1',
      marginBottom: '4px'
    },
    select: {
      backgroundColor: '#1e293b',
      border: '1px solid #475569',
      borderRadius: '8px',
      padding: '10px 12px',
      color: '#f1f5f9',
      fontSize: '14px',
      cursor: 'pointer',
      outline: 'none',
      width: '100%',
      transition: 'all 0.2s ease',
      '&:hover': {
        borderColor: '#64748b'
      },
      '&:focus': {
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)'
      }
    },
    resultsInfo: {
      textAlign: 'center',
      marginTop: '16px',
      color: '#94a3b8',
      fontSize: '14px'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          <FiNavigation size={32} />
          Sistema de Rastreo
        </h1>
        <p style={styles.subtitle}>Monitoreo en tiempo real de dispositivos móviles</p>
        
        <SearchControls
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedSucursal={selectedSucursal}
          setSelectedSucursal={setSelectedSucursal}
          selectedPowerStatus={selectedPowerStatus}
          setSelectedPowerStatus={setSelectedPowerStatus}
          sucursales={sucursales}
          loading={loading}
          fetchTrackingData={fetchTrackingData}
        />

        {/* Filtro para estado activo/inactivo */}
        <div style={styles.filterSection}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Estado del Usuario:</label>
            <select
              value={selectedActiveStatus}
              onChange={(e) => setSelectedActiveStatus(e.target.value)}
              style={styles.select}
              disabled={loading}
            >
              <option value="todos">Todos los usuarios</option>
              <option value="activo">Usuarios activos</option>
              <option value="inactivo">Usuarios inactivos</option>
            </select>
          </div>
        </div>

        <Stats 
          filteredData={filteredData}
          isPhoneOn={isPhoneOn}
        />

        {filteredData.length > 0 && (
          <div style={styles.resultsInfo}>
            Mostrando {paginatedData.length} de {filteredData.length} dispositivos
          </div>
        )}
      </div>

      {loading && filteredData.length === 0 && <Loading />}

      {error && (
        <Error 
          error={error} 
          fetchTrackingData={fetchTrackingData} 
        />
      )}

      {filteredData.length > 0 ? (
        <>
          <DeviceGrid 
            filteredData={paginatedData}
            isPhoneOn={isPhoneOn}
            getTimeAgo={getTimeAgo}
            getTimeColor={getTimeColor}
            getPowerConfidence={getPowerConfidence}
          />
          
          {filteredData.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
              itemsPerPageOptions={itemsPerPageOptions}
            />
          )}
        </>
      ) : (
        !loading && !error && <NoResults />
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spin {
            animation: spin 1s linear infinite;
          }
          input:focus, select:focus {
            border-color: #3B82F6 !important;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3) !important;
          }
          button:hover:not(:disabled) {
            background: #2563EB !important;
            transform: translateY(-1px);
          }
          div[style*="background: #1e293b"]:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px -5px rgba(0, 0, 0, 0.6) !important;
          }
        `}
      </style>
    </div>
  )
}

export default CellManager;
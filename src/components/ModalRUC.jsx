import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaTimes, FaEye, FaCopy, FaExclamationTriangle, FaCheckCircle, FaArrowsAlt, FaExclamationCircle } from 'react-icons/fa';
import './ModalRUC.css';

const ModalRUC = ({ 
  rucValue, 
  isOpen, 
  onClose,
  onUseData,
  isEditing = false
}) => {
  const [rucData, setRucData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rawApiResponse, setRawApiResponse] = useState(null);
  const [proxyUsed, setProxyUsed] = useState('');
  const [rucMismatch, setRucMismatch] = useState(false); // 🔥 NUEVO: Estado para validación
  
  // 🔥 REFERENCIAS PARA EL DRAGGING
  const modalRef = useRef(null);
  const backdropRef = useRef(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const modalPosition = useRef({ x: 0, y: 0 });
  const initialPosSet = useRef(false);

  // 🔥 PROXY PRINCIPAL
  const MAIN_PROXY = 'corsproxy.io';

  // 🔗 URL BASE DE LA NUEVA API
  const API_BASE_URL = 'https://fast.turuc.com.py/api/contribuyente/table';

  // 🔥 FUNCIÓN PARA COMPARAR RUCs
  const compareRucs = useCallback((apiRuc, inputRuc) => {
    if (!apiRuc || !inputRuc) return false;
    
    // Normalizar ambos RUCs (eliminar espacios, guiones, etc.)
    const normalizeRuc = (ruc) => {
      if (!ruc) return '';
      return ruc.toString().trim().toUpperCase().replace(/-/g, '');
    };
    
    const normalizedApiRuc = normalizeRuc(apiRuc);
    const normalizedInputRuc = normalizeRuc(inputRuc);
    
    console.log(`🔍 Comparando RUCs: API="${normalizedApiRuc}" vs INPUT="${normalizedInputRuc}"`);
    
    return normalizedApiRuc === normalizedInputRuc;
  }, []);

  // 🔥 FUNCIÓN OPTIMIZADA PARA LA NUEVA API
  const fetchRucData = useCallback(async (ruc) => {
    if (!ruc || ruc.trim() === '') {
      setError('No hay RUC para consultar');
      return;
    }

    setLoading(true);
    setError('');
    setRucData(null);
    setRawApiResponse(null);
    setProxyUsed('');
    setRucMismatch(false); // 🔥 Reiniciar estado de validación
    
    const rucFormateado = ruc.trim();
    
    try {
      // 🔧 Construir los parámetros específicos para esta API
      const params = new URLSearchParams({
        draw: '1',
        'columns[0][data]': 'ruc',
        'columns[0][name]': '',
        'columns[0][searchable]': 'true',
        'columns[0][orderable]': 'false',
        'columns[0][search][value]': '',
        'columns[0][search][regex]': 'false',
        'columns[1][data]': 'razonSocial',
        'columns[1][name]': '',
        'columns[1][searchable]': 'true',
        'columns[1][orderable]': 'false',
        'columns[1][search][value]': '',
        'columns[1][search][regex]': 'false',
        'columns[2][data]': 'estado',
        'columns[2][name]': '',
        'columns[2][searchable]': 'true',
        'columns[2][orderable]': 'false',
        'columns[2][search][value]': '',
        'columns[2][search][regex]': 'false',
        start: '0',
        length: '10',
        search: rucFormateado, // ← Aquí va el RUC que buscamos
        _: Date.now().toString() // Timestamp para evitar caché
      });

      const apiUrl = `${API_BASE_URL}?${params.toString()}`;
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
      
      console.log(`🚀 Consultando RUC con nueva API:`, apiUrl);
      setProxyUsed(MAIN_PROXY);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      setRawApiResponse(text);
      
      let data;
      try {
        data = JSON.parse(text);
        
        console.log("📊 Respuesta de la API:", data);
        
        // 🔍 Analizar la estructura de respuesta
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          const result = data.data[0];
          
          // 🎯 Extraer solo los datos necesarios
          const formattedData = {
            ruc: result.ruc || `${result.doc}-${result.dv}`, // Usar ruc o construir desde doc y dv
            razon_social: result.razonSocial || '',
            estado: result.estado || ''
          };
          
          // 🔥 VALIDACIÓN EXTRA: Comparar RUCs
          const rucsCoinciden = compareRucs(formattedData.ruc, rucFormateado);
          
          if (!rucsCoinciden) {
            setRucMismatch(true);
            console.warn(`⚠️ ADVERTENCIA: RUC no coincide. API: "${formattedData.ruc}" vs Input: "${rucFormateado}"`);
          }
          
          setRucData(formattedData);
          console.log("✅ Datos formateados:", formattedData);
          
        } else if (data.recordsFiltered === 0) {
          setError(`No se encontró el RUC: ${rucFormateado}`);
        } else {
          setError('La API no devolvió datos válidos');
        }
      } catch (parseError) {
        console.error("Error parseando JSON:", parseError);
        setError('Error al procesar la respuesta de la API');
      }
      
    } catch (error) {
      console.error("Error en consulta:", error);
      
      if (error.name === 'AbortError') {
        setError('La consulta tardó demasiado (más de 5 segundos)');
      } else if (error.message.includes('Failed to fetch')) {
        setError('Error de conexión. Verifica tu internet o intenta más tarde.');
      } else {
        setError(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [compareRucs]);

  // 🔥 EFECTO PARA CARGAR DATOS
  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const fetchData = async () => {
      if (isMounted && isOpen && rucValue) {
        await fetchRucData(rucValue);
      }
    };

    if (isOpen && rucValue) {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(fetchData, 50);
    }

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOpen, rucValue, fetchRucData]);

  // 🔥 FUNCIONES PARA DRAGGING
  const handleDragStart = useCallback((e) => {
    const isHeader = e.target.closest('.modal-ruc-header');
    const isDragHandle = e.target.closest('.modal-ruc-drag-handle');
    const isCloseBtn = e.target.closest('.modal-ruc-close-btn');
    
    if ((!isHeader && !isDragHandle) || isCloseBtn) return;
    
    isDragging.current = true;
    
    const rect = modalRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    modalRef.current.classList.add('dragging-active');
    modalRef.current.style.cursor = 'grabbing';
    
    document.body.style.userSelect = 'none';
    
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragMove = useCallback((e) => {
    if (!isDragging.current || !modalRef.current) return;
    
    modalPosition.current = {
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y
    };
    
    const backdropRect = backdropRef.current.getBoundingClientRect();
    const modalRect = modalRef.current.getBoundingClientRect();
    
    const maxX = backdropRect.width - modalRect.width;
    const maxY = backdropRect.height - modalRect.height;
    
    modalPosition.current.x = Math.max(0, Math.min(modalPosition.current.x, maxX));
    modalPosition.current.y = Math.max(0, Math.min(modalPosition.current.y, maxY));
    
    modalRef.current.style.left = `${modalPosition.current.x}px`;
    modalRef.current.style.top = `${modalPosition.current.y}px`;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!isDragging.current) return;
    
    isDragging.current = false;
    modalRef.current?.classList.remove('dragging-active');
    modalRef.current?.style.removeProperty('cursor');
    
    document.body.style.userSelect = '';
  }, []);

  // 🔥 EFECTO PARA MANEJAR DRAGGING
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseMove = (e) => handleDragMove(e);
    const handleMouseUp = () => handleDragEnd();
    const handleTouchMove = (e) => {
      if (e.touches.length === 1) {
        handleDragMove(e.touches[0]);
      }
    };
    const handleTouchEnd = () => handleDragEnd();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      handleDragEnd();
    };
  }, [isOpen, handleDragMove, handleDragEnd]);

  // 🔥 CENTRAR MODAL AL ABRIR
  const centerModal = useCallback(() => {
    if (!modalRef.current || !backdropRef.current || initialPosSet.current) return;
    
    const backdropRect = backdropRef.current.getBoundingClientRect();
    const modalRect = modalRef.current.getBoundingClientRect();
    
    modalPosition.current = {
      x: (backdropRect.width - modalRect.width) / 2,
      y: (backdropRect.height - modalRect.height) / 2
    };
    
    modalRef.current.style.left = `${modalPosition.current.x}px`;
    modalRef.current.style.top = `${modalPosition.current.y}px`;
    initialPosSet.current = true;
  }, []);

  // 🔥 EFECTO PARA POSICIONAR Y REINICIAR AL ABRIR
  useEffect(() => {
    if (isOpen) {
      initialPosSet.current = false;
      setTimeout(centerModal, 10);
    } else {
      initialPosSet.current = false;
    }
  }, [isOpen, centerModal]);

  // 🔥 EFECTO PARA CERRAR CON ESC
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  // 🔥 CERRAR AL HACER CLICK FUERA
  const handleBackdropClick = useCallback((e) => {
    if (e.target === backdropRef.current && !isDragging.current) {
      onClose();
    }
  }, [onClose, isDragging]);

  // 🔥 COPIAR AL PORTAPAPELES
  const copyToClipboard = useCallback((text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copiado:', text);
    });
  }, []);

  // 🔥 RENDERIZADO
  const renderContent = () => {
    if (loading) {
      return (
        <div className="modal-ruc-loading">
          <div className="modal-ruc-spinner"></div>
          <p>Consultando datos del RUC...</p>
          <p className="modal-ruc-subtext">
            Usando proxy: {proxyUsed || MAIN_PROXY}
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="modal-ruc-error">
          <div className="modal-ruc-error-icon">
            <FaExclamationTriangle />
          </div>
          <h4>Error de consulta</h4>
          <p>{error}</p>
          
          <div className="modal-ruc-retry-container">
            <button 
              onClick={() => fetchRucData(rucValue)}
              className="modal-ruc-retry-btn"
            >
              Reintentar consulta
            </button>
            {proxyUsed && (
              <span className="modal-ruc-proxy-info">
                Proxy usado: {proxyUsed}
              </span>
            )}
          </div>
        </div>
      );
    }

    if (rucData) {
      return (
        <div className="modal-ruc-data">
          {/* 🔥 BANNER DE ADVERTENCIA SI NO COINCIDEN LOS RUCs */}
          {rucMismatch && (
            <div className="modal-ruc-warning-extended">
              <div className="modal-ruc-warning-header">
                <FaExclamationCircle />
                <span>⚠️ ADVERTENCIA: Posible discrepancia en RUC</span>
              </div>
              <div className="modal-ruc-warning-content">
                <p>
                  El RUC recuperado de la API no coincide completamente con el consultado.
                </p>
                <div className="modal-ruc-warning-details">
                  <div><strong>API devuelve:</strong> {rucData.ruc}</div>
                  <div><strong>Usted consultó:</strong> {rucValue}</div>
                </div>
                <p className="modal-ruc-warning-note">
                  <strong>Recomendación:</strong> Verifique manualmente los datos antes de usarlos.
                </p>
              </div>
            </div>
          )}
          
          <div className="modal-ruc-success-banner">
            <FaCheckCircle />
            <span>Datos encontrados correctamente</span>
            {proxyUsed && (
              <span className="modal-ruc-speed-badge">
                ✓ {proxyUsed}
              </span>
            )}
          </div>
          
          <div className="modal-ruc-data-grid">
            <div className="modal-ruc-data-item">
              <label>RUC</label>
              <div className="modal-ruc-data-value-container">
                <span className={`modal-ruc-data-value highlight ${rucMismatch ? 'ruc-mismatch-value' : ''}`}>
                  {rucData.ruc || 'No disponible'}
                </span>
                <button 
                  onClick={() => copyToClipboard(rucData.ruc)}
                  className="modal-ruc-copy-btn"
                  title="Copiar RUC"
                >
                  <FaCopy />
                </button>
              </div>
              {rucMismatch && (
                <div className="modal-ruc-validation-note">
                  <small>Consulta original: <strong>{rucValue}</strong></small>
                </div>
              )}
            </div>
            
            <div className="modal-ruc-data-item">
              <label>Razón Social</label>
              <div className="modal-ruc-data-value-container">
                <span className="modal-ruc-data-value">{rucData.razon_social || 'No disponible'}</span>
                <button 
                  onClick={() => copyToClipboard(rucData.razon_social)}
                  className="modal-ruc-copy-btn"
                  title="Copiar Razón Social"
                >
                  <FaCopy />
                </button>
              </div>
            </div>
            
            <div className="modal-ruc-data-item">
              <label>Estado</label>
              <span className={`modal-ruc-data-value ${rucData.estado === 'ACTIVO' ? 'estado-activo' : 'estado-inactivo'}`}>
                {rucData.estado || 'No especificado'}
              </span>
            </div>
          </div>
          
          {rawApiResponse && (
            <div className="modal-ruc-raw-data">
              <details>
                <summary>Ver respuesta cruda de la API</summary>
                <pre>{JSON.stringify(JSON.parse(rawApiResponse), null, 2)}</pre>
              </details>
            </div>
          )}
          
          {isEditing && (
            <div className="modal-ruc-actions">
              <button 
                onClick={() => {
                  if (onUseData) {
                    onUseData(rucData);
                  }
                  onClose();
                }}
                className={`modal-ruc-use-btn ${rucMismatch ? 'with-warning' : ''}`}
              >
                <FaCopy style={{ marginRight: '8px' }} />
                {rucMismatch ? '⚠️ Usar datos (con advertencia)' : 'Usar estos datos en el formulario'}
              </button>
              <p className="modal-ruc-actions-note">
                {rucMismatch 
                  ? '⚠️ Atención: El RUC no coincide con la consulta original'
                  : 'Se copiarán: Razón Social y RUC'}
              </p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="modal-ruc-empty">
        <p>No se pudieron obtener datos del RUC</p>
        <button 
          onClick={() => fetchRucData(rucValue)}
          className="modal-ruc-retry-btn"
        >
          Intentar nuevamente
        </button>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={backdropRef}
      className="modal-ruc-backdrop-clear" 
      onClick={handleBackdropClick}
      onMouseDown={(e) => {
        if (e.target.closest('.modal-ruc-header') || e.target.closest('.modal-ruc-drag-handle')) {
          handleDragStart(e);
        }
      }}
      onTouchStart={(e) => {
        if (e.target.closest('.modal-ruc-header') || e.target.closest('.modal-ruc-drag-handle')) {
          if (e.touches.length === 1) {
            handleDragStart(e.touches[0]);
          }
        }
      }}
    >
      <div 
        ref={modalRef}
        className="modal-ruc-container draggable"
        style={{
          left: modalPosition.current.x + 'px',
          top: modalPosition.current.y + 'px'
        }}
      >
        <div className="modal-ruc-header">
          <div className="modal-ruc-title">
            <div className="modal-ruc-drag-handle">
              <FaArrowsAlt className="modal-ruc-drag-icon" />
            </div>
            <div>
              <h3>
                <FaEye className="modal-ruc-title-icon" />
                Verificación de RUC - Nueva API
              </h3>
              <p className="modal-ruc-subtitle">
                RUC consultado: <strong>{rucValue || 'No disponible'}</strong>
                {rucMismatch && <span className="warning-badge">⚠️ Discrepancia</span>}
              </p>
            </div>
          </div>
          <button 
            className="modal-ruc-close-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="modal-ruc-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ModalRUC;
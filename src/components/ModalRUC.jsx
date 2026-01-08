import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaTimes, FaEye, FaCopy, FaExclamationTriangle, FaCheckCircle, FaArrowsAlt } from 'react-icons/fa';
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
  
  // 🔥 REFERENCIAS PARA EL DRAGGING
  const modalRef = useRef(null);
  const backdropRef = useRef(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const modalPosition = useRef({ x: 0, y: 0 });
  const initialPosSet = useRef(false);

  // 🔥 PROXY PRINCIPAL
  const MAIN_PROXY = 'corsproxy.io';

  // 🔥 FUNCIÓN OPTIMIZADA
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
    
    const rucFormateado = ruc.trim();
    
    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(`https://api.guarani.app/ruc-data/buscar?termino=${rucFormateado}`)}`;
      
      console.log(`🚀 Consultando RUC con ${MAIN_PROXY}:`, proxyUrl);
      setProxyUsed(MAIN_PROXY);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
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
        
        if (data.success && data.data && Array.isArray(data.data) && data.data.length > 0) {
          setRucData(data.data[0]);
        } else if (data.data && data.data.length === 0) {
          setError('No se encontraron datos para este RUC');
        } else if (data.message) {
          setError(data.message);
        } else {
          setError('Respuesta inesperada de la API');
        }
      } catch (parseError) {
        console.error("Error parseando JSON:", parseError);
        setError('Error al procesar la respuesta');
      }
      
    } catch (error) {
      console.error("Error en consulta:", error);
      
      if (error.name === 'AbortError') {
        setError('La consulta tardó demasiado (más de 2 segundos)');
      } else {
        setError(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

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
    // Solo permitir dragging en el header o en el handle
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
    
    // Prevenir selección de texto mientras se arrastra
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
    
    // Limitar al área visible del backdrop
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
    
    // Restaurar selección de texto
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
      handleDragEnd(); // Asegurar reset
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
      // Usar timeout para asegurar que el DOM esté renderizado
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
                <span className="modal-ruc-data-value highlight">{rucData.ruc || 'No disponible'}</span>
                <button 
                  onClick={() => copyToClipboard(rucData.ruc)}
                  className="modal-ruc-copy-btn"
                  title="Copiar RUC"
                >
                  <FaCopy />
                </button>
              </div>
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
              <span className="modal-ruc-data-value">{rucData.estado || 'No especificado'}</span>
            </div>
          </div>
          
          {isEditing && (
            <div className="modal-ruc-actions">
              <button 
                onClick={() => {
                  if (onUseData) {
                    onUseData(rucData);
                  }
                  onClose();
                }}
                className="modal-ruc-use-btn"
              >
                <FaCopy style={{ marginRight: '8px' }} />
                Usar estos datos en el formulario
              </button>
              <p className="modal-ruc-actions-note">
                Se copiarán: Razón Social y RUC
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
        // Iniciar dragging si se hace clic en el header
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
      >
        <div className="modal-ruc-header">
          <div className="modal-ruc-title">
            <div className="modal-ruc-drag-handle">
              <FaArrowsAlt className="modal-ruc-drag-icon" />
            </div>
            <div>
              <h3>
                <FaEye className="modal-ruc-title-icon" />
                Verificación de RUC
              </h3>
              <p className="modal-ruc-subtitle">RUC consultado: <strong>{rucValue || 'No disponible'}</strong></p>
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
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import './ServerModal.css';

const ServerModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title, 
  serverData, 
  isEditing = false 
}) => {
  const [formData, setFormData] = React.useState({
    ip: '',
    sucursal: '',
    nombre: '',
    tipo: 'servidor'
  });
  const [errors, setErrors] = React.useState({});

  // Inicializar formData cuando el modal se abre o serverData cambia
  React.useEffect(() => {
    if (isOpen) {
      if (isEditing && serverData) {
        setFormData({
          ip: serverData.ip || '',
          sucursal: serverData.sucursal || '',
          nombre: serverData.nombre || '',
          tipo: serverData.tipo || 'servidor'
        });
      } else {
        setFormData({
          ip: '',
          sucursal: '',
          nombre: '',
          tipo: 'servidor'
        });
      }
      setErrors({});
    }
  }, [isOpen, isEditing, serverData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validar IP
    if (!formData.ip.trim()) {
      newErrors.ip = 'La IP es requerida';
    } else if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(formData.ip)) {
      newErrors.ip = 'Formato de IP inválido';
    }

    // Validar Sucursal
    if (!formData.sucursal.trim()) {
      newErrors.sucursal = 'La sucursal es requerida';
    }

    // Validar Nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
      onClose();
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="server-modal-overlay">
      <div className="server-modal">
        <div className="server-modal-header">
          <h2 className="server-modal-title">
            {isEditing ? 'Editar Servidor' : 'Agregar Nuevo Servidor'}
          </h2>
          <button 
            className="server-modal-close" 
            onClick={handleClose}
            type="button"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="server-modal-form">
          <div className="server-modal-body">
            <div className="server-form-group">
              <label htmlFor="ip" className="server-form-label">
                Dirección IP *
              </label>
              <input
                type="text"
                id="ip"
                name="ip"
                value={formData.ip}
                onChange={handleChange}
                className={`server-form-input ${errors.ip ? 'server-input-error' : ''}`}
                placeholder="Ej: 192.168.1.1"
              />
              {errors.ip && <span className="server-error-message">{errors.ip}</span>}
            </div>

            <div className="server-form-group">
              <label htmlFor="sucursal" className="server-form-label">
                Sucursal *
              </label>
              <input
                type="text"
                id="sucursal"
                name="sucursal"
                value={formData.sucursal}
                onChange={handleChange}
                className={`server-form-input ${errors.sucursal ? 'server-input-error' : ''}`}
                placeholder="Ej: Sucursal Central"
              />
              {errors.sucursal && <span className="server-error-message">{errors.sucursal}</span>}
            </div>

            <div className="server-form-group">
              <label htmlFor="nombre" className="server-form-label">
                Nombre del Equipo *
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={`server-form-input ${errors.nombre ? 'server-input-error' : ''}`}
                placeholder="Ej: Servidor Principal"
              />
              {errors.nombre && <span className="server-error-message">{errors.nombre}</span>}
            </div>

            <div className="server-form-group">
              <label htmlFor="tipo" className="server-form-label">
                Tipo de Equipo *
              </label>
              <select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className="server-form-select"
              >
                <option value="servidor">Servidor</option>
                <option value="switch">Switch</option>
                <option value="router">Router</option>
                <option value="firewall">Firewall</option>
                <option value="database">Base de Datos</option>
              </select>
            </div>
          </div>

          <div className="server-modal-footer">
            <button 
              type="button" 
              className="server-modal-btn server-modal-btn-cancel"
              onClick={handleClose}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="server-modal-btn server-modal-btn-primary"
            >
              <FontAwesomeIcon icon={faSave} />
              {isEditing ? ' Actualizar' : ' Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServerModal;
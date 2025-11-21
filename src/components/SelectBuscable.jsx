import { useState, useRef, useEffect } from 'react';
import Select from 'react-select';

const SelectBuscable = ({ 
  value, 
  onChange, 
  options, 
  placeholder = "Buscar o seleccionar...",
  isDisabled = false
}) => {
  const selectRef = useRef();
  const [menuPortalTarget, setMenuPortalTarget] = useState(null);

  useEffect(() => {
    // Usar el body como portal target para mejor control del z-index
    setMenuPortalTarget(document.body);
  }, []);

  // Convertir el valor actual al formato que espera React Select
  const valorActual = value ? { 
    value: value, 
    label: options.find(opt => opt.value === value)?.label || value 
  } : null;

  // Manejar el cambio de selección
  const manejarCambio = (selectedOption) => {
    onChange(selectedOption ? selectedOption.value : '');
  };

  // Estilos personalizados que coinciden con tu diseño oscuro
  const estilosPersonalizados = {
    control: (base, state) => ({
      ...base,
      border: '1px solid #475569',
      borderRadius: '6px',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'var(--shadow)',
      backgroundColor: '#0f172a',
      color: '#f1f5f9',
      minHeight: '38px',
      fontSize: '0.85rem',
      transition: 'all 0.2s ease',
      '&:hover': {
        borderColor: '#3b82f6'
      }
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '6px',
      boxShadow: 'var(--shadow-lg)',
      fontSize: '0.85rem',
      zIndex: 1000, // 🔥 Z-INDEX CONTROLADO
      position: 'absolute'
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999 // 🔥 Z-INDEX MÁS ALTO PARA EL PORTAL
    }),
    menuList: (base) => ({
      ...base,
      padding: '4px',
      backgroundColor: '#1e293b',
      maxHeight: '200px' // 🔥 LIMITAR ALTURA MÁXIMA
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? '#3b82f6' 
        : state.isFocused 
        ? 'rgba(59, 130, 246, 0.1)' 
        : 'transparent',
      color: state.isSelected ? 'white' : '#cbd5e1',
      borderRadius: '4px',
      padding: '8px 12px',
      margin: '2px 0',
      fontSize: '0.85rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        color: '#3b82f6'
      }
    }),
    singleValue: (base) => ({
      ...base,
      color: '#f1f5f9',
      fontSize: '0.85rem'
    }),
    placeholder: (base) => ({
      ...base,
      color: '#94a3b8',
      fontSize: '0.85rem'
    }),
    input: (base) => ({
      ...base,
      color: '#f1f5f9',
      fontSize: '0.85rem'
    }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: '#94a3b8',
      padding: '4px 8px',
      transition: 'all 0.2s ease',
      '&:hover': {
        color: '#3b82f6'
      }
    }),
    clearIndicator: (base, state) => ({
      ...base,
      color: '#94a3b8',
      padding: '4px 8px',
      transition: 'all 0.2s ease',
      '&:hover': {
        color: '#ef4444'
      }
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: '#475569'
    }),
    noOptionsMessage: (base) => ({
      ...base,
      color: '#94a3b8',
      fontSize: '0.85rem',
      padding: '12px'
    }),
    loadingMessage: (base) => ({
      ...base,
      color: '#94a3b8',
      fontSize: '0.85rem',
      padding: '12px'
    })
  };

  return (
    <div className="react-select-container" ref={selectRef}>
      <Select
        ref={selectRef}
        value={valorActual}
        onChange={manejarCambio}
        options={options}
        placeholder={placeholder}
        isDisabled={isDisabled}
        styles={estilosPersonalizados}
        isSearchable={true}
        isClearable={true}
        noOptionsMessage={({ inputValue }) => 
          inputValue ? "No se encontraron resultados" : "No hay opciones disponibles"
        }
        loadingMessage={() => "Cargando..."}
        className="react-select-dark"
        menuPortalTarget={menuPortalTarget} // 🔥 USAR PORTAL PARA MEJOR CONTROL
        menuPosition="fixed" // 🔥 POSICIÓN FIJA PARA MEJOR COMPORTAMIENTO
        menuShouldScrollIntoView={false} // 🔥 EVITAR SCROLL AUTOMÁTICO
      />
    </div>
  );
};

export default SelectBuscable;
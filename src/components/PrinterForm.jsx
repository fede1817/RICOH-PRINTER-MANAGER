import React from "react";
import { X } from "lucide-react";

export default function PrinterForm({
  formData,
  onChange,
  onSubmit,
  onClose,
  isEditing,
}) {
  return (
    <div className="printer-modal-overlay">
      <div className="printer-modal-content">
        <div className="printer-modal-header">
          <h2>{isEditing ? "Editar impresora" : "Agregar nueva impresora"}</h2>
          <button className="printer-close-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <input
            type="text"
            name="ip"
            placeholder="IP"
            value={formData.ip}
            onChange={onChange}
            required
          />
          <input
            type="text"
            name="sucursal"
            placeholder="Sucursal"
            value={formData.sucursal}
            onChange={onChange}
            required
          />
          <input
            type="text"
            name="modelo"
            placeholder="Modelo"
            value={formData.modelo}
            onChange={onChange}
            required
          />
          <input
            type="url"
            name="drivers_url"
            placeholder="URL de Drivers"
            value={formData.drivers_url}
            onChange={onChange}
          />
          <select name="tipo" value={formData.tipo} onChange={onChange}>
            <option value="principal">Principal</option>
            <option value="backup">Backup</option>
            <option value="comercial">Comercial</option>
          </select>
          <input
            type="number"
            name="toner_reserva"
            placeholder="Tóner de reserva"
            value={formData.toner_reserva}
            onChange={onChange}
          />
          <input
            name="direccion"
            placeholder="direccion"
            value={formData.direccion}
            onChange={onChange}
            required
          />

          <div className="printer-form-buttons">
            <button type="submit" className="submit-btn">
              {isEditing ? "Guardar cambios" : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

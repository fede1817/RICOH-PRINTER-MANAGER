CREATE TABLE IF NOT EXISTS perifericos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    sucursal VARCHAR(50) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS perifericos_solicitudes (
    id SERIAL PRIMARY KEY,
    periferico_id INTEGER REFERENCES perifericos(id) ON DELETE SET NULL,
    modelo_periferico VARCHAR(100), -- Copia para historial si se borra el original
    tipo_periferico VARCHAR(50),   -- Copia para historial si se borra el original
    solicitante VARCHAR(100) NOT NULL,
    sucursal VARCHAR(50) NOT NULL,
    cantidad INTEGER NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente',
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_procesado TIMESTAMP
);

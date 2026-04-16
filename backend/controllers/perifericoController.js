const pool = require("../config/database");

class PerifericoController {
  // ============================================
  // GESTIÓN DE STOCK DE PERIFÉRICOS
  // ============================================

  // Obtener todos los periféricos
  async getAll(req, res) {
    try {
      const query = `
        SELECT * FROM perifericos
        ORDER BY nombre ASC
      `;
      const result = await pool.query(query);

      res.json({
        success: true,
        perifericos: result.rows,
      });
    } catch (error) {
      console.error("Error al obtener periféricos:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  // Crear nuevo periférico (Solo admin)
  async create(req, res) {
    try {
      const { nombre, tipo, stock, sucursal } = req.body;

      const query = `
        INSERT INTO perifericos (nombre, tipo, stock, sucursal)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const result = await pool.query(query, [nombre, tipo, stock || 0, sucursal]);

      res.json({ success: true, periferico: result.rows[0] });
    } catch (error) {
      console.error("Error al crear periférico:", error);
      res.status(500).json({ success: false, error: "Error interno del servidor" });
    }
  }

  // Actualizar stock de un periférico (Solo admin)
  async updateStock(req, res) {
    try {
      const { id } = req.params;
      const { stock } = req.body;

      const query = `
        UPDATE perifericos
        SET stock = $1
        WHERE id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [stock, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Periférico no encontrado" });
      }

      res.json({ success: true, periferico: result.rows[0] });
    } catch (error) {
      console.error("Error al actualizar stock del periférico:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Actualizar todos los datos de un periférico (Solo admin)
  async update(req, res) {
    try {
      const { id } = req.params;
      const { nombre, tipo, stock, sucursal } = req.body;

      const query = `
        UPDATE perifericos
        SET nombre = $1, tipo = $2, stock = $3, sucursal = $4
        WHERE id = $5
        RETURNING *
      `;

      const result = await pool.query(query, [nombre, tipo, stock, sucursal, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Periférico no encontrado" });
      }

      res.json({ success: true, periferico: result.rows[0] });
    } catch (error) {
      console.error("Error al actualizar datos del periférico:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Eliminar periférico (Solo admin)
  async delete(req, res) {
    try {
      const { id } = req.params;
      
      const checkResult = await pool.query("SELECT * FROM perifericos WHERE id = $1", [id]);
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: "Periférico no encontrado" });
      }

      // 🔥 CORRECCIÓN: Ahora permitimos borrar el periférico. 
      // El historial se mantiene en perifericos_solicitudes gracias a ON DELETE SET NULL 
      // y a que guardamos el nombre al momento de crear la solicitud.

      await pool.query("DELETE FROM perifericos WHERE id = $1", [id]);
      res.json({ success: true, message: "Periférico eliminado correctamente. El historial de pedidos se mantiene intacto." });
    } catch (error) {
      console.error("Error al eliminar periférico:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // ============================================
  // GESTIÓN DE SOLICITUDES DE PERIFÉRICOS
  // ============================================

  // Obtener todas las solicitudes
  async getAllSolicitudes(req, res) {
    try {
      const query = `
        SELECT ps.*, 
               COALESCE(p.nombre, ps.modelo_periferico) as modelo_periferico_display, 
               COALESCE(p.tipo, ps.tipo_periferico) as tipo_periferico_display
        FROM perifericos_solicitudes ps
        LEFT JOIN perifericos p ON ps.periferico_id = p.id
        ORDER BY ps.fecha_solicitud DESC
      `;
      const result = await pool.query(query);

      res.json({
        success: true,
        solicitudes: result.rows,
      });
    } catch (error) {
      console.error("Error al obtener solicitudes de periféricos:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  // Crear nueva solicitud de periférico
  async createSolicitud(req, res) {
    try {
      const { periferico_id, solicitante, sucursal, cantidad } = req.body;

      if (!periferico_id || !solicitante || !cantidad) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
      }

      // 🔥 OBTENER DATOS ACTUALES DEL PERIFÉRICO PARA EL HISTORIAL
      const pResult = await pool.query("SELECT nombre, tipo FROM perifericos WHERE id = $1", [periferico_id]);
      if (pResult.rows.length === 0) {
        return res.status(404).json({ error: "El periférico seleccionado no existe" });
      }
      
      const { nombre, tipo } = pResult.rows[0];

      const query = `
        INSERT INTO perifericos_solicitudes (periferico_id, modelo_periferico, tipo_periferico, solicitante, sucursal, cantidad, estado)
        VALUES ($1, $2, $3, $4, $5, $6, 'pendiente')
        RETURNING id
      `;

      const result = await pool.query(query, [
        periferico_id,
        nombre,
        tipo,
        solicitante,
        sucursal,
        cantidad,
      ]);

      res.json({ success: true, id: result.rows[0].id });
    } catch (error) {
      console.error("Error al crear solicitud de periférico:", error);
      res.status(500).json({ success: false, error: "Error interno del servidor" });
    }
  }

  // Procesar solicitud (Cambiar a aprobado y descontar stock automáticamente)
  async procesarSolicitud(req, res) {
    const solicitudId = req.params.id;

    try {
      // 1. Obtener la solicitud y el periferico para checkear stock
      const querySolicitud = `
        SELECT ps.*, p.stock 
        FROM perifericos_solicitudes ps
        JOIN perifericos p ON ps.periferico_id = p.id
        WHERE ps.id = $1
      `;
      const solicitudResult = await pool.query(querySolicitud, [solicitudId]);
      
      if (solicitudResult.rows.length === 0) {
        return res.status(404).json({ error: "Solicitud no encontrada o periférico descontinuado/borrado" });
      }

      const solicitud = solicitudResult.rows[0];

      if (solicitud.estado === 'aprobado') {
        return res.status(400).json({ error: "La solicitud ya fue procesada anteriormente" });
      }

      // 🔥 VALIDACIÓN DE STOCK: No permitir stock negativo
      if (solicitud.stock < solicitud.cantidad) {
        return res.status(400).json({ 
          error: `Stock insuficiente. Disponible: ${solicitud.stock}, Solicitado: ${solicitud.cantidad}` 
        });
      }

      // 2. Transacción para asegurar la consistencia
      await pool.query('BEGIN');

      // 3. Cambiar estado a aprobado y registrar fecha
      await pool.query(
        "UPDATE perifericos_solicitudes SET estado = 'aprobado', fecha_procesado = NOW() WHERE id = $1", 
        [solicitudId]
      );

      // 4. Descontar stock correspondiente en perifericos
      await pool.query(
        "UPDATE perifericos SET stock = stock - $1 WHERE id = $2",
        [solicitud.cantidad, solicitud.periferico_id]
      );

      await pool.query('COMMIT');
      res.json({ message: "Solicitud procesada exitosamente y stock descontado" });
    } catch (err) {
      if (pool) await pool.query('ROLLBACK');
      console.error("Error al procesar solicitud de periférico:", err);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Cambiar estado de solicitud a pendiente (Revierte el descuento si venía de aprobado)
  async pendienteSolicitud(req, res) {
    const solicitudId = req.params.id;

    try {
      const solicitudResult = await pool.query("SELECT * FROM perifericos_solicitudes WHERE id = $1", [solicitudId]);

      if (solicitudResult.rows.length === 0) {
        return res.status(404).json({ error: "Solicitud no encontrada" });
      }

      const solicitud = solicitudResult.rows[0];

      await pool.query('BEGIN');

      // Si la solicitud estaba aprobada y el periférico aún existe, devolvemos el stock
      if (solicitud.estado === 'aprobado' && solicitud.periferico_id) {
        await pool.query(
          "UPDATE perifericos SET stock = stock + $1 WHERE id = $2",
          [solicitud.cantidad, solicitud.periferico_id]
        );
      }

      await pool.query(
        "UPDATE perifericos_solicitudes SET estado = 'pendiente', fecha_procesado = NULL WHERE id = $1", 
        [solicitudId]
      );

      await pool.query('COMMIT');
      res.json({ message: "Solicitud devuelta a pendiente exitosamente" });
    } catch (err) {
      if (pool) await pool.query('ROLLBACK');
      console.error("Error al retornar solicitud a pendiente:", err);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Rechazar solicitud
  async rechazarSolicitud(req, res) {
    const solicitudId = req.params.id;

    try {
      const solicitudResult = await pool.query("SELECT * FROM perifericos_solicitudes WHERE id = $1", [solicitudId]);

      if (solicitudResult.rows.length === 0) {
        return res.status(404).json({ error: "Solicitud no encontrada" });
      }

      const solicitud = solicitudResult.rows[0];

      await pool.query('BEGIN');

      // Si la solicitud estaba aprobada y el periférico existe, devolvemos el stock
      if (solicitud.estado === 'aprobado' && solicitud.periferico_id) {
        await pool.query(
          "UPDATE perifericos SET stock = stock + $1 WHERE id = $2",
          [solicitud.cantidad, solicitud.periferico_id]
        );
      }

      await pool.query(
        "UPDATE perifericos_solicitudes SET estado = 'rechazado', fecha_procesado = NOW() WHERE id = $1", 
        [solicitudId]
      );

      await pool.query('COMMIT');
      res.json({ message: "Solicitud rechazada exitosamente" });
    } catch (err) {
      if (pool) await pool.query('ROLLBACK');
      console.error("Error al rechazar solicitud:", err);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Eliminar solicitud
  async deleteSolicitud(req, res) {
    const solicitudId = req.params.id;

    try {
      const solicitudCheck = await pool.query("SELECT * FROM perifericos_solicitudes WHERE id = $1", [solicitudId]);

      if (solicitudCheck.rows.length === 0) {
        return res.status(404).json({ error: "Solicitud no encontrada" });
      }

      const solicitud = solicitudCheck.rows[0];

      await pool.query('BEGIN');

      // Si estaba aprobada devolvemos el stock antes de eliminarla (si el periférico existe)
      if (solicitud.estado === 'aprobado' && solicitud.periferico_id) {
        await pool.query(
          "UPDATE perifericos SET stock = stock + $1 WHERE id = $2",
          [solicitud.cantidad, solicitud.periferico_id]
        );
      }

      await pool.query("DELETE FROM perifericos_solicitudes WHERE id = $1", [solicitudId]);

      await pool.query('COMMIT');
      res.json({ message: "Solicitud eliminada exitosamente" });
    } catch (err) {
      if (pool) await pool.query('ROLLBACK');
      console.error("Error al eliminar solicitud:", err);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
}

module.exports = new PerifericoController();

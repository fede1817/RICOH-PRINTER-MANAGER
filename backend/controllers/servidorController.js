const pool = require("../config/database");
const pingService = require("../services/pingService");

class ServidorController {
  // Obtener todos los servidores
  async getAll(req, res) {
    try {
      const result = await pool.query("SELECT * FROM servidores ORDER BY id");
      res.json({ servidores: result.rows });
    } catch (error) {
      console.error("❌ Error consultando servidores:", error);
      res.status(500).json({ error: "Error al obtener servidores" });
    }
  }

  // Obtener servidor por ID
  async getById(req, res) {
    const { id } = req.params;
    try {
      const result = await pool.query(
        "SELECT * FROM servidores WHERE id = $1",
        [id],
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Servidor no encontrado" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("❌ Error consultando servidor:", error);
      res.status(500).json({ error: "Error al obtener servidor" });
    }
  }

  // Crear nuevo servidor
  async create(req, res) {
    const { ip, sucursal, nombre, tipo } = req.body;

    if (!ip || !sucursal) {
      return res.status(400).json({ error: "IP y Sucursal son requeridos" });
    }

    try {
      const existing = await pool.query(
        "SELECT id FROM servidores WHERE ip = $1",
        [ip],
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: "La IP ya existe en el sistema" });
      }

      const pingResult = await pingService.verificarServidor(ip);

      const result = await pool.query(
        `INSERT INTO servidores (ip, sucursal, nombre, tipo, estado, latencia, ultima_verificacion)
         VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
        [
          ip,
          sucursal,
          nombre || `Equipo ${ip}`,
          tipo || "servidor",
          pingResult.alive ? "activo" : "inactivo",
          pingResult.time,
        ],
      );

      res.status(201).json({
        message: "Servidor agregado correctamente",
        servidor: result.rows[0],
      });
    } catch (error) {
      console.error("❌ Error al agregar servidor:", error);
      res.status(500).json({ error: "Error al agregar servidor" });
    }
  }

  // Actualizar servidor
  async update(req, res) {
    const { id } = req.params;
    const { ip, sucursal, nombre, tipo } = req.body;

    try {
      const result = await pool.query(
        `UPDATE servidores SET
          ip = $1, sucursal = $2, nombre = $3, tipo = $4, updated_at = NOW()
         WHERE id = $5 RETURNING *`,
        [ip, sucursal, nombre, tipo, id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Servidor no encontrado" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("❌ Error al actualizar servidor:", error);
      res.status(500).json({ error: "Error al actualizar servidor" });
    }
  }

  // Eliminar servidor
  async delete(req, res) {
    const { id } = req.params;
    try {
      const result = await pool.query(
        "DELETE FROM servidores WHERE id = $1 RETURNING *",
        [id],
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Servidor no encontrado" });
      }
      res.json({ mensaje: "Servidor eliminado correctamente" });
    } catch (error) {
      console.error("❌ Error al eliminar servidor:", error);
      res.status(500).json({ error: "Error al eliminar servidor" });
    }
  }

  // Verificar estado de un servidor específico
  async verificar(req, res) {
    const { id } = req.params;

    try {
      const serverResult = await pool.query(
        "SELECT * FROM servidores WHERE id = $1",
        [id],
      );
      if (serverResult.rows.length === 0) {
        return res.status(404).json({ error: "Servidor no encontrado" });
      }

      const servidor = serverResult.rows[0];
      const pingResult = await pingService.verificarServidor(servidor.ip);

      await pool.query(
        `UPDATE servidores SET
          estado = $1,
          latencia = $2,
          ultima_verificacion = NOW()
         WHERE id = $3`,
        [pingResult.alive ? "activo" : "inactivo", pingResult.time, id],
      );

      res.json({
        servidor: servidor.ip,
        estado: pingResult.alive ? "activo" : "inactivo",
        latencia: pingResult.time,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error al verificar servidor:", error);
      res.status(500).json({ error: "Error al verificar servidor" });
    }
  }

  // Verificar todos los servidores
  async verificarTodos(req, res) {
    try {
      const { rows: servidores } = await pool.query("SELECT * FROM servidores");
      const resultados = [];

      for (const servidor of servidores) {
        try {
          const pingResult = await pingService.verificarServidor(servidor.ip);

          await pool.query(
            `UPDATE servidores SET
              estado = $1,
              latencia = $2,
              ultima_verificacion = NOW()
             WHERE id = $3`,
            [
              pingResult.alive ? "activo" : "inactivo",
              pingResult.time,
              servidor.id,
            ],
          );

          resultados.push({
            id: servidor.id,
            ip: servidor.ip,
            estado: pingResult.alive ? "activo" : "inactivo",
            latencia: pingResult.time,
            success: true,
          });
        } catch (error) {
          resultados.push({
            id: servidor.id,
            ip: servidor.ip,
            estado: "inactivo",
            latencia: "Error",
            success: false,
            error: error.message,
          });
        }
      }

      res.json({ message: "Verificación completada", resultados });
    } catch (error) {
      console.error("❌ Error al verificar todos los servidores:", error);
      res.status(500).json({ error: "Error en la verificación masiva" });
    }
  }

  // Obtener estadísticas
  async getEstadisticas(req, res) {
    try {
      const totalResult = await pool.query("SELECT COUNT(*) FROM servidores");
      const activosResult = await pool.query(
        "SELECT COUNT(*) FROM servidores WHERE estado = 'activo'",
      );
      const inactivosResult = await pool.query(
        "SELECT COUNT(*) FROM servidores WHERE estado = 'inactivo'",
      );

      const porTipoResult = await pool.query(`
        SELECT tipo, COUNT(*) as cantidad
        FROM servidores
        GROUP BY tipo
      `);

      const total = parseInt(totalResult.rows[0].count);
      const activos = parseInt(activosResult.rows[0].count);

      const estadisticas = {
        total,
        activos,
        inactivos: parseInt(inactivosResult.rows[0].count),
        porcentajeSalud: total > 0 ? Math.round((activos / total) * 100) : 0,
        porTipo: porTipoResult.rows,
      };

      res.json(estadisticas);
    } catch (error) {
      console.error("❌ Error obteniendo estadísticas:", error);
      res.status(500).json({ error: "Error al obtener estadísticas" });
    }
  }
}

module.exports = new ServidorController();

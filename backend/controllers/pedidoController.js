const pool = require("../config/database");

class PedidoController {
  // Obtener todos los pedidos
  async getAll(req, res) {
    try {
      const query = `
        SELECT * FROM pedidos
        ORDER BY fecha_pedido DESC
      `;
      const result = await pool.query(query);

      res.json({
        success: true,
        pedidos: result.rows,
      });
    } catch (error) {
      console.error("Error al obtener pedidos:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  // Crear nuevo pedido
  async create(req, res) {
    try {
      const { solicitante, sucursal, modelo_impresora, tipo_toner, cantidad } =
        req.body;

      const query = `
        INSERT INTO pedidos (solicitante, sucursal, modelo_impresora, tipo_toner, cantidad)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;

      const result = await pool.query(query, [
        solicitante,
        sucursal,
        modelo_impresora,
        tipo_toner,
        cantidad,
      ]);

      res.json({ success: true, id: result.rows[0].id });
    } catch (error) {
      console.error("Error al crear pedido:", error);
      res
        .status(500)
        .json({ success: false, error: "Error interno del servidor" });
    }
  }

  // Registrar pedido desde impresora (endpoint legacy)
  async registrarPedido(req, res) {
    const { impresora_id } = req.body;

    try {
      await pool.query(
        `UPDATE impresoras SET
          ultimo_pedido_fecha = NOW(),
          toner_reserva = toner_reserva + 1
         WHERE id = $1`,
        [impresora_id],
      );
      res.status(200).json({ message: "Pedido registrado correctamente" });
    } catch (error) {
      console.error("❌ Error en el pedido:", error);
      res.status(500).json({ error: "Error al registrar pedido" });
    }
  }

  // Procesar pedido (cambiar estado a 'aprobado')
  async procesar(req, res) {
    const pedidoId = req.params.id;

    try {
      const pedidoCheck = await pool.query(
        "SELECT * FROM pedidos WHERE id = $1",
        [pedidoId],
      );

      if (pedidoCheck.rows.length === 0) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      await pool.query("UPDATE pedidos SET estado = $1 WHERE id = $2", [
        "aprobado",
        pedidoId,
      ]);

      res.json({ message: "Pedido procesado exitosamente" });
    } catch (err) {
      console.error("Error al procesar pedido:", err);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Cambiar estado a pendiente
  async pendiente(req, res) {
    const pedidoId = req.params.id;

    try {
      const pedidoCheck = await pool.query(
        "SELECT * FROM pedidos WHERE id = $1",
        [pedidoId],
      );

      if (pedidoCheck.rows.length === 0) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      await pool.query("UPDATE pedidos SET estado = $1 WHERE id = $2", [
        "pendiente",
        pedidoId,
      ]);

      res.json({ message: "Pedido actualizado a pendiente exitosamente" });
    } catch (err) {
      console.error("Error al actualizar pedido:", err);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  // Eliminar pedido
  async delete(req, res) {
    const pedidoId = req.params.id;

    try {
      const pedidoCheck = await pool.query(
        "SELECT * FROM pedidos WHERE id = $1",
        [pedidoId],
      );

      if (pedidoCheck.rows.length === 0) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      await pool.query("DELETE FROM pedidos WHERE id = $1", [pedidoId]);

      res.json({ message: "Pedido eliminado exitosamente" });
    } catch (err) {
      console.error("Error al eliminar pedido:", err);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
}

module.exports = new PedidoController();

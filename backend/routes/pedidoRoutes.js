const express = require("express");
const pedidoController = require("../controllers/pedidoController");

const router = express.Router();

// Rutas de pedidos
router.get("/", pedidoController.getAll);
router.post("/", pedidoController.create);
router.put("/:id/procesar", pedidoController.procesar);
router.put("/:id/pendiente", pedidoController.pendiente);
router.delete("/:id", pedidoController.delete);

// Ruta para registrar pedido desde impresora
router.put("/", pedidoController.registrarPedido);

module.exports = router;

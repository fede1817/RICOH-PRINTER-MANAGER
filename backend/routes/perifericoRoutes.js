const express = require("express");
const perifericoController = require("../controllers/perifericoController");

const router = express.Router();

// ==========================================
// Rutas de Stock de Periféricos
// ==========================================
router.get("/", perifericoController.getAll);
router.post("/", perifericoController.create);
router.put("/:id", perifericoController.update);
router.put("/:id/stock", perifericoController.updateStock);
router.delete("/:id", perifericoController.delete);

// ==========================================
// Rutas de Solicitudes de Periféricos
// ==========================================
router.get("/solicitudes", perifericoController.getAllSolicitudes);
router.post("/solicitudes", perifericoController.createSolicitud);
router.put("/solicitudes/:id/procesar", perifericoController.procesarSolicitud);
router.put("/solicitudes/:id/pendiente", perifericoController.pendienteSolicitud);
router.put("/solicitudes/:id/rechazar", perifericoController.rechazarSolicitud);
router.delete("/solicitudes/:id", perifericoController.deleteSolicitud);

module.exports = router;

const express = require("express");
const servidorController = require("../controllers/servidorController");

const router = express.Router();

// Rutas CRUD básicas
router.get("/", servidorController.getAll);
router.get("/:id", servidorController.getById);
router.post("/", servidorController.create);
router.put("/:id", servidorController.update);
router.delete("/:id", servidorController.delete);

// Rutas de verificación
router.post("/verificar-todos", servidorController.verificarTodos);
router.post("/:id/verificar", servidorController.verificar);

// Estadísticas
router.get("/estadisticas/resumen", servidorController.getEstadisticas);

module.exports = router;

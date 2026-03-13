const express = require("express");
const multer = require("multer");
const impresoraController = require("../controllers/impresoraController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Rutas CRUD básicas
router.get("/", impresoraController.getAll);
router.post("/", impresoraController.create);
router.put("/:id", impresoraController.update);
router.delete("/:id", impresoraController.delete);

// Rutas de estado
router.get("/status", impresoraController.getAllStatus);
router.get("/:id/status", impresoraController.getStatus);

// Rutas de SNMP y reinicio
router.post("/:id/reboot", impresoraController.reboot);
router.get("/:id/snmp-check", impresoraController.checkSNMP);
router.get("/:id/color-toners", impresoraController.getColorToners);

// Ruta de impresión
router.post("/:id/print", upload.single("file"), impresoraController.print);

module.exports = router;

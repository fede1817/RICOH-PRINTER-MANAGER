const express = require("express");
const emailController = require("../controllers/emailController");

const router = express.Router();

// Ruta para solicitar carga de pedidos
router.post("/solicitar-carga", emailController.solicitarCarga);

module.exports = router;

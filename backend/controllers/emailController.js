const emailService = require("../services/emailService");

class EmailController {
  async solicitarCarga(req, res) {
    try {
      await emailService.enviarSolicitudCarga();

      res.status(200).json({
        success: true,
        message: "Correo enviado correctamente",
      });
    } catch (error) {
      console.error("Error al enviar correo:", error);
      res.status(500).json({
        success: false,
        message: "Error al enviar el correo: " + error.message,
      });
    }
  }
}

module.exports = new EmailController();

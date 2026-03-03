const transporter = require("../config/email");
const pool = require("../config/database");

class EmailService {
  async enviarAlertaTonerBajo(impresora, tonerActual, datosSNMP) {
    const info = {
      modelo: impresora.modelo,
      numero_serie: datosSNMP.numero_serie ?? "N/A",
      contador_total: datosSNMP.contador ?? "N/A",
      sucursal: impresora.sucursal || "Sucursal Desconocida",
      direccion: impresora.direccion || "Dirección no especificada",
      telefono: "0987 200316",
      correo: "dario.ocampos@surcomercial.com.py",
      tipo: impresora.tipo,
    };

    const htmlBody = `
      <h3>⚠ Nivel bajo de tóner detectado ${tonerActual}%</h3>
      <h3>⚠ tipo ${impresora.tipo}</h3>
      <h3>⚠ ip: ${impresora.ip}</h3>
      <ul>
        <li><strong>Sucursal:</strong> ${info.sucursal}</li>
        <li><strong>Dirección:</strong> ${info.direccion}</li>
        <li><strong>Modelo:</strong> ${info.modelo}</li>
        <li><strong>N° de serie:</strong> ${info.numero_serie}</li>
        <li><strong>Contador total:</strong> ${info.contador_total}</li>
        <li><strong>Teléfono:</strong> ${info.telefono}</li>
        <li><strong>Correo:</strong> ${info.correo}</li>
      </ul>
    `;

    await transporter.sendMail({
      from: '"Alerta de Tóner" <federico.britez@surcomercial.com.py>',
      to: "soporte@surcomercial.com.py",
      cc: [
        "federico.britez@surcomercial.com.py",
        "dario.ocampos@surcomercial.com.py",
      ],
      subject: `🖨 Tóner bajo en ${info.sucursal} - ${info.modelo} - ${info.tipo}`,
      html: htmlBody,
    });

    await pool.query(
      `UPDATE impresoras SET ultima_alerta = NOW() WHERE id = $1`,
      [impresora.id],
    );
    console.log(`📧 Alerta enviada para ${info.modelo} (${info.sucursal})`);
  }

  async enviarSolicitudCarga() {
    const htmlBody = this._generarHtmlSolicitudCarga();

    await transporter.sendMail({
      from: '"Sistema de Pedidos" <federico.britez@surcomercial.com.py>',
      to: [
        "araceli.villalba@surcomercial.com.py",
        "marlene.franco@surcomercial.com.py",
        "esther.minho@surcomercial.com.py",
        "edid.fernandez@surcomercial.com.py",
        "veronica.acuna@surcomercial.com.py",
        "karen.ramirez@surcomercial.com.py",
        "albercio.diaz@surcomercial.com.py",
      ],
      cc: [
        "federico.britez@surcomercial.com.py",
        "dario.ocampos@surcomercial.com.py",
      ],
      subject: "🖨️ Solicitud de Carga de Pedidos",
      html: htmlBody,
    });
  }

  _generarHtmlSolicitudCarga() {
    return `...`; // Tu HTML completo aquí
  }
}

module.exports = new EmailService();

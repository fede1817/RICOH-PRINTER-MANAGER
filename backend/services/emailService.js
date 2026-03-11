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
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solicitud de Carga de Pedidos</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f7fa;
        }
        .email-container {
            max-width: 650px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            border: 1px solid #e1e5eb;
        }
        .header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: black;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            margin: 10px 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 40px 30px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            color: #4f46e5;
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 15px;
            border-left: 4px solid #4f46e5;
            padding-left: 12px;
        }
        .message-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 25px;
        }
        .url-box {
            background-color: #f0f9ff;
            border: 2px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 25px 0;
        }
        .url {
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: 600;
            color: #0c4a6e;
            background-color: white;
            padding: 15px;
            border-radius: 6px;
            display: block;
            margin: 15px 0;
            text-decoration: none;
            word-break: break-all;
            border: 1px solid #cbd5e1;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            margin: 10px 0;
            border: none;
            cursor: pointer;
        }
        .warning-box {
            background-color: #fffbeb;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        .thank-you {
            background-color: #f0fdf4;
            border: 2px solid #22c55e;
            border-radius: 8px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
        }
        .signature {
            text-align: center;
            color: #64748b;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
        }
        .footer {
            background-color: #1e293b;
            color: white;
            padding: 30px;
            text-align: center;
        }
        .footer p {
            margin: 8px 0;
            opacity: 0.8;
        }
        .footer-links {
            margin-top: 20px;
        }
        .footer-links a {
            color: #94a3b8;
            text-decoration: none;
            margin: 0 10px;
        }
        .footer-links a:hover {
            color: #60a5fa;
        }
        .highlight {
            background-color: #e0f2fe;
            color: #0369a1;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
        }
        .icon {
            font-size: 24px;
            margin-right: 10px;
            vertical-align: middle;
        }
        @media (max-width: 640px) {
            .content, .header {
                padding: 25px 20px;
            }
            .url {
                font-size: 16px;
                padding: 12px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>📦 Solicitud de Carga de Pedidos</h1>
            <p>Sistema de Gestión de Toners - Sur Comercial</p>
        </div>
        
        <div class="content">
            <div class="section">
                <div class="message-box">
                    <p style="font-size: 18px; margin-bottom: 20px; color: #1e293b;">
                        <span class="icon">👋</span> <strong>Buenas,</strong>
                    </p>
                    <p style="font-size: 16px; color: #475569; line-height: 1.8;">
                        Para procesar los pedidos pendientes, por favor ingresen a la siguiente URL 
                        e inicien sesión con las mismas credenciales que utilizan en 
                        <span class="highlight">MBUSINESS</span> para realizar sus pedidos.
                    </p>
                </div>
                
                <div class="url-box">
                    <p style="color: #0369a1; font-weight: 600; margin-bottom: 15px;">
                        <span class="icon">🔗</span> Acceso al sistema:
                    </p>
                    <a href="http://192.168.8.165:3000/" class="url">
                        http://192.168.8.165:3000/
                    </a>
                    <div style="margin-top: 20px;">
                        <a href="http://192.168.8.165:3000/" class="btn">
                            <span class="icon">🌐</span> Acceder al Sistema de Pedidos
                        </a>
                    </div>
                </div>
                
                <div class="warning-box">
                    <p style="color: #92400e; font-weight: 600; margin: 0;">
                        <span class="icon">⚠️</span> Importante: Utilice sus credenciales de MBUSINESS para acceder al sistema
                    </p>
                </div>
                
                <div class="thank-you">
                    <p style="color: #166534; font-size: 18px; font-weight: 600; margin: 0;">
                        <span class="icon">🙏</span> Desde ya muchas gracias por su colaboración
                    </p>
                </div>
                
                <div class="signature">
                    <p style="font-size: 16px; color: #475569;">
                        <strong>Saludos cordiales,</strong><br>
                        Equipo de Sistemas
                    </p>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <div>
                <p style="font-size: 18px; font-weight: 600; margin-bottom: 15px;">
                    🖨️ Sistema de Gestión de Pedidos
                </p>
                <p>Sur Comercial - Gestión eficiente de suministros</p>
                <p>📧 soporte@surcomercial.com.py</p>
                <p>📍 Sistema interno de gestión</p>
                
                <div class="footer-links">
                    <a href="#">Soporte</a> |
                    <a href="#">Manual de Usuario</a> |
                    <a href="#">Contacto</a>
                </div>
                
                <p style="margin-top: 25px; font-size: 12px; color: #94a3b8;">
                    Este es un correo automático generado por el sistema. Por favor no responder.
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;
  }
}

module.exports = new EmailService();

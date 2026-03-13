const snmp = require("net-snmp");
const { OIDS, REBOOT_OIDS } = require("../utils/constants");

class SNMPService {
  async consultarToner(ip) {
    return new Promise((resolve) => {
      const session = snmp.createSession(ip, "public", { timeout: 3000 });
      const oids = [OIDS.TONER, OIDS.NUMERO_SERIE, OIDS.CONTADOR];

      session.get(oids, (error, varbinds) => {
        session.close();

        if (error) {
          resolve({ error: true, mensaje: "SNMP Error: " + error.message });
        } else {
          const tonerRaw = varbinds[0]?.value;
          const numeroSerieRaw = varbinds[1]?.value;
          const contadorRaw = varbinds[2]?.value;

          const toner =
            tonerRaw !== null && !isNaN(tonerRaw)
              ? parseInt(tonerRaw, 10)
              : null;
          const numero_serie = numeroSerieRaw
            ? String(numeroSerieRaw).trim()
            : null;
          const contador =
            contadorRaw !== null && !isNaN(contadorRaw)
              ? parseInt(contadorRaw, 10)
              : null;

          resolve({ toner, numero_serie, contador, error: false });
        }
      });
    });
  }

  async consultarColorToners(ip) {
    return new Promise((resolve) => {
      const session = snmp.createSession(ip, "public", { timeout: 3000 });
      const oids = [OIDS.TONER_CYAN, OIDS.TONER_MAGENTA, OIDS.TONER_YELLOW];

      session.get(oids, (error, varbinds) => {
        session.close();

        if (error) {
          resolve({ error: true, mensaje: "SNMP Error: " + error.message });
        } else {
          const cyanRaw = varbinds[0]?.value;
          const magentaRaw = varbinds[1]?.value;
          const yellowRaw = varbinds[2]?.value;

          const cyan = cyanRaw !== null && !isNaN(cyanRaw) ? parseInt(cyanRaw, 10) : null;
          const magenta = magentaRaw !== null && !isNaN(magentaRaw) ? parseInt(magentaRaw, 10) : null;
          const yellow = yellowRaw !== null && !isNaN(yellowRaw) ? parseInt(yellowRaw, 10) : null;

          resolve({ cyan, magenta, yellow, error: false });
        }
      });
    });
  }

  async verificarSNMPEscritura(ip, communityWrite = "private") {
    return new Promise((resolve) => {
      const session = snmp.createSession(ip, communityWrite, { timeout: 3000 });

      session.get([OIDS.SISTEMA], (error, varbinds) => {
        session.close();

        if (error) {
          resolve({
            habilitado: false,
            error: error.message,
            community: communityWrite,
          });
        } else {
          resolve({ habilitado: true, community: communityWrite });
        }
      });
    });
  }

  async reiniciarImpresora(
    ip,
    communityWrite = "private",
    tipoReinicio = "warm",
  ) {
    return new Promise((resolve, reject) => {
      console.log(`🔄 Intentando reinicio ${tipoReinicio} en ${ip}...`);

      const session = snmp.createSession(ip, communityWrite, {
        timeout: 5000,
        retries: 1,
      });

      let oidSeleccionado;
      let valor;

      if (tipoReinicio === "warm") {
        oidSeleccionado = REBOOT_OIDS.WARM_START;
        valor = 3;
      } else if (tipoReinicio === "cold") {
        oidSeleccionado = REBOOT_OIDS.COLD_START;
        valor = 2;
      } else {
        oidSeleccionado = REBOOT_OIDS.RICOH_REBOOT;
        valor = 1;
      }

      const varbinds = [
        { oid: oidSeleccionado, type: snmp.ObjectType.Integer, value: valor },
      ];

      session.set(varbinds, (error, varbinds) => {
        session.close();

        if (error) {
          console.error(`❌ Error SNMP en ${ip}:`, error);
          this._intentarReinicioAlternativo(
            ip,
            communityWrite,
            resolve,
            reject,
          );
        } else {
          console.log(`✅ Comando de reinicio enviado a ${ip}`);
          resolve({
            success: true,
            message: `Reinicio ${tipoReinicio} iniciado en ${ip}`,
            tipo: tipoReinicio,
            timestamp: new Date(),
            ip: ip,
          });
        }
      });
    });
  }

  _intentarReinicioAlternativo(ip, communityWrite, resolve, reject) {
    setTimeout(() => {
      const sessionAlt = snmp.createSession(ip, communityWrite, {
        timeout: 5000,
        retries: 1,
      });

      sessionAlt.set(
        [
          {
            oid: REBOOT_OIDS.WARM_START,
            type: snmp.ObjectType.Integer,
            value: 3,
          },
        ],
        (errorAlt) => {
          sessionAlt.close();
          if (errorAlt) {
            reject(new Error(`No se pudo reiniciar ${ip}`));
          } else {
            resolve({
              success: true,
              message: `Reinicio iniciado en ${ip}`,
              tipo: "warm",
              timestamp: new Date(),
              ip: ip,
            });
          }
        },
      );
    }, 1000);
  }
}

module.exports = new SNMPService();

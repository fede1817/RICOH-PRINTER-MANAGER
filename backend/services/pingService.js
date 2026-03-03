const ping = require("ping");
const snmp = require("net-snmp");
const { OIDS } = require("../utils/constants");

class PingService {
  async verificarEstadoImpresora(ip) {
    try {
      const pingResult = await ping.promise.probe(ip, { timeout: 3 });

      if (!pingResult.alive) {
        return { estado: "desconectada", ultima_verificacion: new Date() };
      }

      const snmpResult = await new Promise((resolve) => {
        const session = snmp.createSession(ip, "public", { timeout: 3000 });

        session.get([OIDS.SISTEMA], (error, varbinds) => {
          if (error) {
            resolve({
              estado: "desconectada",
              ultima_verificacion: new Date(),
            });
          } else {
            resolve({ estado: "conectada", ultima_verificacion: new Date() });
          }
          session.close();
        });
      });

      return snmpResult;
    } catch (error) {
      console.error(`❌ Error verificando estado de ${ip}:`, error);
      return { estado: "desconectada", ultima_verificacion: new Date() };
    }
  }

  async verificarServidor(ip) {
    try {
      const pingResult = await ping.promise.probe(ip, { timeout: 5 });
      return {
        alive: pingResult.alive,
        time: pingResult.alive ? `${pingResult.time}ms` : "Timeout",
      };
    } catch (error) {
      return { alive: false, time: "Error" };
    }
  }
}

module.exports = new PingService();

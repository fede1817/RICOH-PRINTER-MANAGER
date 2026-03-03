// OIDs SNMP comunes
const OIDS = {
  TONER: "1.3.6.1.2.1.43.11.1.1.9.1.1",
  NUMERO_SERIE: "1.3.6.1.2.1.43.5.1.1.17.1",
  CONTADOR: "1.3.6.1.2.1.43.10.2.1.4.1.1",
  SISTEMA: "1.3.6.1.2.1.1.1.0",
};

const REBOOT_OIDS = {
  WARM_START: "1.3.6.1.2.1.43.5.1.1.3.1",
  COLD_START: "1.3.6.1.2.1.25.3.2.1.5.1",
  RICOH_REBOOT: "1.3.6.1.4.1.367.3.2.1.2.1.0",
};

const SNMP_TYPES = {
  Integer: 2,
  OctetString: 4,
  Null: 5,
  ObjectIdentifier: 6,
};

const ESTADOS = {
  CONECTADA: "conectada",
  DESCONECTADA: "desconectada",
  ACTIVO: "activo",
  INACTIVO: "inactivo",
};

module.exports = {
  OIDS,
  REBOOT_OIDS,
  SNMP_TYPES,
  ESTADOS,
};

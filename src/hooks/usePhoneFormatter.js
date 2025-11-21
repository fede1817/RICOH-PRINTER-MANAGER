export const usePhoneFormatter = () => {
  const formatearNumeroParaguayo = (numero) => {
    if (!numero || numero.toString().trim() === "") return "";

    let numeroLimpio = numero.toString().replace(/\D/g, "");

    // Si el número ya tiene el formato correcto (10 dígitos con 0), retornarlo
    if (/^09\d{8}$/.test(numeroLimpio)) {
      return numeroLimpio;
    }

    // Si tiene código de país (595) + número
    if (/^5959\d{8}$/.test(numeroLimpio)) {
      return "0" + numeroLimpio.substring(3);
    }

    // Si tiene 9 dígitos (sin 0)
    if (/^9\d{8}$/.test(numeroLimpio)) {
      return "0" + numeroLimpio;
    }

    // Si tiene formato con espacios: 0984 566 444 (ya tiene 0)
    if (/^0\d{3}\s?\d{3}\s?\d{3}$/.test(numeroLimpio.replace(/\s/g, ""))) {
      return numeroLimpio.replace(/\s/g, "");
    }

    // Si tiene 10 dígitos pero con formato inconsistente
    if (numeroLimpio.length === 10) {
      return "0" + numeroLimpio.substring(1);
    }

    // Si no coincide con ningún formato conocido, retornar el original limpio
    return numeroLimpio;
  };

  const formatearRUC = (ruc) => {
    if (!ruc || ruc.toString().trim() === "") return "";

    let rucLimpio = ruc.toString().replace(/\./g, "").replace(/\s/g, "").trim();

    return rucLimpio;
  };

  return { formatearNumeroParaguayo, formatearRUC };
};

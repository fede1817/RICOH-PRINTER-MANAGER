import { useState } from "react";

export const useClipboard = () => {
  const [copiado, setCopiado] = useState(false);

  const copiarTexto = async (texto) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(texto);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = texto;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        if (!successful) {
          throw new Error("Fallback copy method failed");
        }
        document.body.removeChild(textArea);
      }
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch (error) {
      console.error("Error al copiar:", error);
    }
  };

  return { copiado, copiarTexto };
};

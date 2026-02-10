import "./Censo.css";
import { useState, useEffect } from "react";
import HomePage from "./HomePage";
import SearchSection from "./SearchSection";
import ValidationResults from "./ValidationResults";
import ClientData from "./ClientData";
import Loading from "./Loading";
import { useClientData } from "../hooks/useClientData";
import { useClipboard } from "../hooks/useClipboard";
import Mapa from "./Mapa";
import "./Censo.css";
import { useAuth } from "../context/AuthContext";

function Censo() {
  const [currentView, setCurrentView] = useState("home");
  const [selectedCenso, setSelectedCenso] = useState("");
  const [showSearchSection, setShowSearchSection] = useState(false);

  // Estados para catálogos
  const [listasPrecio, setListasPrecio] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [supervisores, setSupervisores] = useState([]);
  const [listasCargadas, setListasCargadas] = useState(false);
  const { authCredentials } = useAuth();

  // 🔥 PRIMERO: Declarar la función getNombreListaPrecio ANTES del hook
  const getNombreListaPrecio = (codListaPrecioErp) => {
    if (!codListaPrecioErp || !listasPrecio.length)
      return codListaPrecioErp || "No especificado";

    const lista = listasPrecio.find(
      (item) => item.codlistaprecioerp === codListaPrecioErp.toString()
    );

    return lista ? lista.nombrelistaprecio : codListaPrecioErp;
  };

  // 🔥 SEGUNDO: Usar el hook después de declarar la función
  const {
    codCenso,
    setCodCenso,
    clienteData,
    setClienteData, // 🔥 Asegúrate de que esto esté exportado desde tu hook
    clienteDataOriginal,
    errores,
    advertencias,
    cargando,
    mostrarResultado,
    fetchClienteData,
    getSubgrupo2Value,
  } = useClientData(getNombreListaPrecio);

  const { copiado, copiarTexto } = useClipboard();

  // 🔥 Función para manejar la edición desde ClientData
  const handleEdit = (datosActualizados) => {
    console.log("Datos actualizados recibidos:", datosActualizados);

    // Actualizar el estado en el hook useClientData
    if (setClienteData) {
      setClienteData(datosActualizados);
    }
  };

  // Función para cargar supervisores
  const fetchSupervisores = async () => {
    try {
      const response = await fetch(
        `https://apps.mobile.com.py:8443/mbusiness/rest/private/supervisores?codempresa=15&codsucursal=23&multisucursal=true`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${authCredentials}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      setSupervisores(data);
    } catch (error) {
      console.error("Error fetching supervisores:", error);
    }
  };

  // Función para obtener el nombre del supervisor
  const getNombreSupervisor = (codSupervisorErp) => {
    if (!codSupervisorErp || !supervisores.length)
      return codSupervisorErp || "No especificado";

    const supervisor = supervisores.find(
      (item) => item.codsupervisorerp === codSupervisorErp.toString()
    );

    return supervisor
      ? `${supervisor.codsupervisorerp} - ${supervisor.nombresupervisor}`
      : codSupervisorErp;
  };

  // Función para cargar vendedores
  const fetchVendedores = async () => {
    try {

      const response = await fetch(
        `https://apps.mobile.com.py:8443/mbusiness/rest/private/vendedores?codempresa=15`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${authCredentials}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      setVendedores(data);
    } catch (error) {
      console.error("Error fetching el vendedor:", error);
    }
  };

  // Función para obtener el nombre del vendedor
  const getNombreVendedor = (codVendedor) => {
    if (!codVendedor || !vendedores.length)
      return codVendedor || "No especificado";

    const vendedorEncontrado = vendedores.find(
      (item) => item.codvendedorerp === codVendedor.toString()
    );

    return vendedorEncontrado
      ? `${vendedorEncontrado.codvendedorerp} - ${vendedorEncontrado.nombrevendedor}`
      : codVendedor;
  };

  // Función para cargar las listas de precios
  const fetchListasPrecio = async () => {
    try {

      const response = await fetch(
        `https://apps.mobile.com.py:8443/mbusiness/rest/private/listaprecios?codempresa=15`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${authCredentials}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      setListasPrecio(data);
      setListasCargadas(true);
    } catch (error) {
      console.error("Error fetching listas de precio:", error);
    }
  };

  // Cargar todos los catálogos al montar
  useEffect(() => {
    fetchListasPrecio();
    fetchVendedores();
    fetchSupervisores();
  }, []);

  // Verificar parámetros de URL al cargar la aplicación
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const censoParam = urlParams.get("censo");

    if (censoParam) {
      setSelectedCenso(censoParam);
      setCodCenso(censoParam);
      setCurrentView("detail");
    }
  }, []);

  // Cargar automáticamente cuando cambie selectedCenso
  useEffect(() => {
    if (selectedCenso && currentView === "detail" && listasCargadas) {
      fetchClienteData();
    }
  }, [selectedCenso, currentView, listasCargadas]);

  // Función para manejar la selección de un censo desde HomePage
  const handleSelectCenso = (codigoCenso) => {
    const codigoString = codigoCenso.toString();
    setSelectedCenso(codigoString);
    setCodCenso(codigoString);
    setCurrentView("detail");
  };

  // Función para buscar manualmente desde SearchSection
  const handleManualSearch = () => {
    if (codCenso) {
      fetchClienteData();
    }
  };

  // Función para alternar la visibilidad del SearchSection
  const toggleSearchSection = () => {
    setShowSearchSection(!showSearchSection);
  };

   return (
    <div className="validator-root"> {/* Cambiar por validator-root */}

      <div className="validator-container"> {/* Cambiar por validator-container */}
        {currentView === "home" ? (
          <HomePage onSelectCenso={handleSelectCenso} />
        ) : (
          <>
            {showSearchSection && (
              <SearchSection
                codCenso={codCenso}
                setCodCenso={setCodCenso}
                fetchClienteData={handleManualSearch}
                cargando={cargando}
                onClose={() => setShowSearchSection(false)}
              />
            )}

            {cargando && <Loading />}

            {clienteData && (
              <div className="validator-client-data"> {/* Cambiar por validator-client-data */}
                <h2>Datos del Cliente - Censo: {selectedCenso}</h2>

                {mostrarResultado && (
                  <ValidationResults
                    errores={errores}
                    advertencias={advertencias}
                  />
                )}

                {copiado && (
                  <p className="validator-copy-notification"> {/* Cambiar por validator-copy-notification */}
                    ¡Copiado al portapapeles!
                  </p>
                )}
                
                <ClientData
                  clienteData={clienteData}
                  clienteDataOriginal={clienteDataOriginal}
                  copiarTexto={copiarTexto}
                  getNombreListaPrecio={getNombreListaPrecio}
                  getNombreVendedor={getNombreVendedor}
                  getNombreSupervisor={getNombreSupervisor}
                  listasPrecio={listasPrecio}
                  vendedores={vendedores}
                  supervisores={supervisores}
                  getSubgrupo2Value={getSubgrupo2Value}
                  onEdit={handleEdit}
                />
                <Mapa
                  latitud={clienteData.latitud}
                  longitud={clienteData.longitud}
                  razonsocial={clienteData.razonsocial}
                  direccion={clienteData.direccion}
                />
              </div>
            )}

            {!clienteData && !cargando && selectedCenso && (
              <div className="validator-no-data"> {/* Cambiar por validator-no-data */}
                <p>
                  No se pudieron cargar los datos del censo {selectedCenso}.
                  Verifique el código e intente nuevamente.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Censo;

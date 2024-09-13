"use client";

// Importar módulos necesarios
import React, {
  useEffect,
  useRef,
  useState,
  ChangeEvent,
  KeyboardEvent,
  FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Toaster, toast } from "sonner";
import {
  CircleHelp,
  CircleX,
  Ellipsis,
  PlusIcon,
  MinusIcon,
  X,
} from "lucide-react";
import {
  Input,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Link,
  Select,
  SelectItem,
  Spinner,
  Chip,
  Pagination,
} from "@nextui-org/react";

// Importar funciones de configuración
import {
  getWithAuth,
  postWithAuth,
  verificarAccesoPorPermiso,
} from "@/config/peticionesConfig";

// Importar estilos
import { title } from "@/components/primitives";

// Definición de interfaces para tipos de datos
interface Cliente {
  idCliente: number;
  nombre: string;
  estado: string;
}

interface Colaborador {
  idColaborador: number;
  nombre: string;
  estado: string;
}

interface Producto {
  idMarca: any;
  idProducto: number;
  nombre: string;
  precio: number;
  estado: string;
}

interface ProductoSeleccionado {
  id: string;
  producto: Producto;
  cantidad: number;
}

// Componente principal: VentasPageCrear
export default function VentasPageCrear() {
  // Estado para controlar el acceso al componente
  const [acceso, setAcceso] = useState<boolean>(false);
  // Verificar permisos de acceso al cargar el componente
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Ventas") == false) {
        window.location.href = "../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Ventas"));
    }
  }, []);

  // Estado para los datos de la venta
  const [venta, setVenta] = useState({
    fechaCreacion: new Date(),
    fechaFinalizacion: new Date(),
    fecha: new Date(),
    estado: "Pendiente",
    identificador: "Producto",
    total: 0,
    iva: 19,
    idCliente: null,
    idColaborador:
      typeof window !== "undefined"
        ? sessionStorage.getItem("idUsuario")
        : null,
    idPaquete: "",
  });

  const [mostrarProductos, setMostrarProductos] = useState(true);
  const [citasCliente, setCitasCliente] = useState([]);
  const [ventaProductos, setVentaProductos] = useState({
    total: 0,
  });
  const [ventaCitas, setVentaCitas] = useState({
    total: 0,
  });
  const [citaSeleccionada, setCitaSeleccionada] = useState<any>(null);

  // Estados para listas de clientes, colaboradores y productos
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [idCliente, setIdCliente] = useState("");
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [idColaborador, setIdColaborador] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState<
    ProductoSeleccionado[]
  >([]);

  // Estados para la búsqueda de productos
  const [busquedaModal, setBusquedaModal] = useState("");
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [textoInput, setTextoInput] = useState("");

  // Estados para manejo de errores
  const [errores] = useState<any>({});
  const [mensajeError, setMensajeError] = useState("");

  // Estados para control de modales
  const [paginaModal, setPaginaModal] = useState(1);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isOpenError,
    onOpen: onOpenError,
    onOpenChange: onOpenChangeError,
  } = useDisclosure();
  const {
    isOpen: isProductosModalOpen,
    onOpen: onOpenProductosModal,
    onOpenChange: onOpenChangeProductosModal,
  } = useDisclosure();

  // Router para navegación
  const router = useRouter();

  // Estado para indicar si se está cargando la información
  const [isLoading, setIsLoading] = useState(true);

  const handleDropdownChangeCitaCliente = async (value: any) => {
    setIdCliente(value.target.value);
    setVenta({ ...venta, idCliente: value.target.value });
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      idCliente: validateField("idCliente", value.target.value),
    }));

    // Obtener las citas aceptadas del cliente seleccionado
    try {
      const response = await getWithAuth(
        `http://localhost:8080/cita/cliente/${value.target.value}`
      );
      if (response.ok) {
        const data = await response.json();
        const citasAceptadas = data.filter(
          (cita: any) => cita.estado === "Aceptado"
        );
        setCitasCliente(citasAceptadas);
        setCitaSeleccionada(null);
      } else {
        setMensajeError("Hubo un problema al obtener las citas del cliente.");
        onOpenError();
      }
    } catch (error) {
      setMensajeError("Hubo un problema al obtener las citas del cliente.");
      onOpenError();
    }
  };

  // Función para manejar el cambio de cita seleccionada
  const handleCitaChange = (cita: any) => {
    setCitaSeleccionada(cita);
    setVenta({
      ...venta,
      fecha: cita.fecha,
      estado: "Aceptado",
      idCliente: cita.idCliente,
      idColaborador: cita.idColaborador,
      idPaquete: cita.idPaquete,
      identificador: "Servicio",
    });
    setIdCliente(cita.idCliente.toString());
    setIdColaborador(cita.idColaborador.toString());
  };

  // Obtener clientes, colaboradores y productos al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchClientes(),
          fetchColaboradores(),
          fetchProductos(),
        ]);
      } catch (error) {
        setMensajeError(
          "Hubo un problema al obtener los datos. Intenta recargar la página."
        );
        onOpenError();
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Función para obtener la lista de clientes
  const fetchClientes = async () => {
    try {
      const response = await getWithAuth("http://localhost:8080/cliente");
      if (response.ok) {
        const data = await response.json();
        setClientes(data);
      } else {
        setMensajeError(
          "Hubo un problema al obtener los clientes. Intenta recargar la página."
        );
        onOpenError();
      }
    } catch (error) {
      setMensajeError(
        "Hubo un problema al obtener los clientes. Intenta recargar la página."
      );
      onOpenError();
    }
  };

  // Función para obtener la lista de colaboradores
  const fetchColaboradores = async () => {
    try {
      const response = await getWithAuth("http://localhost:8080/colaborador");
      if (response.ok) {
        const data = await response.json();
        setColaboradores(data);
      } else {
        setMensajeError(
          "Hubo un problema al obtener los colaboradores. Intenta recargar la página."
        );
        onOpenError();
      }
    } catch (error) {
      setMensajeError(
        "Hubo un problema al obtener los colaboradores. Intenta recargar la página."
      );
      onOpenError();
    }
  };

  // Función para obtener la lista de productos
  const fetchProductos = async () => {
    try {
      const response = await getWithAuth(
        "http://localhost:8080/compras/productos"
      );
      if (response.ok) {
        const data = await response.json();
        setProductos(data);
      } else {
        setMensajeError(
          "Hubo un problema al obtener los productos. Intenta recargar la página."
        );
        onOpenError();
      }
    } catch (error) {
      setMensajeError(
        "Hubo un problema al obtener los productos. Intenta recargar la página."
      );
      onOpenError();
    }
  };

  // Función para crear una nueva venta
  const crearVenta = async (ventaData: any) => {
    try {
      const response = await postWithAuth(
        "http://localhost:8080/venta",
        ventaData
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear la venta");
      }
      return await response.json();
    } catch (error) {
      setMensajeError("Error al crear la venta. Inténtalo de nuevo.");
      onOpenError();
      throw error;
    }
  };

  // Función para crear los detalles de una venta de productos
  const crearDetallesVenta = async (nuevaVenta: any) => {
    try {
      const detalleVenta = {
        ventas: nuevaVenta,
        productosId: productosSeleccionados.map(
          (item) => item.producto.idProducto
        ),
        precioUnitario: productosSeleccionados.map(
          (item) => item.producto.precio
        ),
        cantidad: productosSeleccionados.map((item) => item.cantidad),
      };
      const response = await postWithAuth(
        "http://localhost:8080/venta/detalles-productos",
        detalleVenta
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Error al crear los detalles de la venta"
        );
      }

      const responseData = await response.json();
    } catch (error) {
      setMensajeError(
        "Error al crear los detalles de la venta. Inténtalo de nuevo."
      );
      onOpenError();
      throw error;
    }
  };

  // Función para crear los detalles de una venta de servicios (citas)
  const crearDetallesVentaCita = async (nuevaVenta: any) => {
    try {
      const detalleVentaCita = {
        idVenta: nuevaVenta.idVenta,
        idCita: citaSeleccionada.idCita,
        subtotal: calcularTotalCitaConIVA(),
      };
      const response = await postWithAuth(
        "http://localhost:8080/venta/detalles-servicios",
        detalleVentaCita
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            "Error al crear los detalles de la venta de la cita"
        );
      }
      const responseData = await response.json();
    } catch (error) {
      setMensajeError(
        "Error al crear los detalles de la venta de la cita. Inténtalo de nuevo."
      );
      onOpenError();
      throw error;
    }
  };

  // Función para manejar el envío del formulario de productos
  const handleSubmitProductos = async () => {
    try {
      const nuevaVenta = await crearVenta(venta);
      await crearDetallesVenta(nuevaVenta);
      toast.success("Venta creada con éxito!");
      setTimeout(() => {
        router.push("/admin/ventas");
      }, 1000);
    } catch (error) {
      setMensajeError("Error al crear la venta. Inténtalo de nuevo.");
      onOpenError();
    }
  };

  // Función para manejar el envío del formulario de citas
  const handleSubmitCitas = async () => {
    try {
      // Crear un objeto con los datos a enviar
      const ventaData = {
        fechaCreacion: venta.fechaCreacion,
        fechaFinalizacion: venta.fechaFinalizacion,
        fecha: venta.fecha,
        estado: venta.estado,
        identificador: venta.identificador,
        total: calcularTotalCitaConIVA(),
        iva: venta.iva,
        idCliente: venta.idCliente,
        idColaborador: venta.idColaborador,
      };
      // Enviar la solicitud POST al backend para crear la venta
      const nuevaVenta = await crearVenta(ventaData);
      // Luego, crear el detalle de la venta de la cita
      await crearDetallesVentaCita(nuevaVenta);
      toast.success("Venta de cita creada con éxito!");
      setTimeout(() => {
        router.push("/admin/ventas");
      }, 1000);
    } catch (error) {
      setMensajeError("Error al crear la venta de cita. Inténtalo de nuevo.");
      onOpenError();
    }
  };

  // Función para manejar cambios en el selector de cliente
  const handleDropdownChangeCliente = (value: any) => {
    setIdCliente(value.target.value);
    setVenta({ ...venta, idCliente: value.target.value });
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      idCliente: validateField("idCliente", value.target.value),
    }));
  };

  // Función para manejar cambios en el selector de colaborador
  const handleDropdownChangeColaborador = (value: any) => {
    setIdColaborador(value.target.value);
    setVenta({ ...venta, idColaborador: value.target.value });
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      idColaborador: validateField("idColaborador", value.target.value),
    }));
  };

  // Filtrar productos en tiempo real
  const productosFiltrados = productos.filter(
    (producto) =>
      producto.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) &&
      producto.estado === "Activo"
  );

  // Manejar el input de búsqueda de productos
  const handleBusquedaProductoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const letrasRegex = /^[a-zA-Z\s]*$/;
    if (letrasRegex.test(input)) {
      setTextoInput(input);
      setBusquedaProducto(input);
    }
  };

  const handleAgregarProducto = (producto: Producto) => {
    const productoExistente = productosSeleccionados.find(
      (p) => p.producto.idProducto === producto.idProducto
    );

    if (productoExistente) {
      const nuevosProductosSeleccionados = productosSeleccionados.map((p) =>
        p.producto.idProducto === producto.idProducto
          ? { ...p, cantidad: p.cantidad + 1 }
          : p
      );
      setProductosSeleccionados(nuevosProductosSeleccionados);

      // Calcula el nuevo total y total con IVA
      const nuevoTotal = nuevosProductosSeleccionados.reduce(
        (sum, item) => sum + item.producto.precio * item.cantidad,
        0
      );
      const nuevoTotalConIVA = calcularTotalProductoConIVA(nuevoTotal);

      // Actualiza ventaProductos y venta.total en una sola llamada
      setVentaProductos((prevVenta) => ({
        ...prevVenta,
        total: nuevoTotal,
        totalConIVA: nuevoTotalConIVA,
      }));

      setVenta((prevVenta) => ({
        ...prevVenta,
        total: nuevoTotal,
      }));
    } else {
      const nuevosProductosSeleccionados = [
        ...productosSeleccionados,
        { id: uuidv4(), producto, cantidad: 1 },
      ];
      setProductosSeleccionados(nuevosProductosSeleccionados);

      // Calcula el nuevo total y total con IVA
      const nuevoTotal = nuevosProductosSeleccionados.reduce(
        (sum, item) => sum + item.producto.precio * item.cantidad,
        0
      );
      const nuevoTotalConIVA = calcularTotalProductoConIVA(nuevoTotal);

      // Actualiza ventaProductos y venta.total en una sola llamada
      setVentaProductos((prevVenta) => ({
        ...prevVenta,
        total: nuevoTotal,
        totalConIVA: nuevoTotalConIVA,
      }));

      setVenta((prevVenta) => ({
        ...prevVenta,
        total: nuevoTotal,
      }));
    }

    setTextoInput("");
    setBusquedaProducto("");
  };

  const handleEliminarProducto = (id: string) => {
    const nuevosProductosSeleccionados = productosSeleccionados.filter(
      (p) => p.id !== id
    );
    setProductosSeleccionados(nuevosProductosSeleccionados);

    // Calcula el nuevo total y total con IVA
    const nuevoTotal = nuevosProductosSeleccionados.reduce(
      (sum, item) => sum + item.producto.precio * item.cantidad,
      0
    );
    const nuevoTotalConIVA = calcularTotalProductoConIVA(nuevoTotal);

    // Actualiza ventaProductos y venta.total en una sola llamada
    setVentaProductos((prevVenta) => ({
      ...prevVenta,
      total: nuevoTotal,
      totalConIVA: nuevoTotalConIVA,
    }));

    setVenta((prevVenta) => ({
      ...prevVenta,
      total: nuevoTotal,
    }));
  };

  // Manejador del evento "keydown" en el input de búsqueda
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "Backspace" &&
      !e.currentTarget.value &&
      productosSeleccionados.length > 0
    ) {
      e.preventDefault();
      handleEliminarProducto(
        productosSeleccionados[productosSeleccionados.length - 1].id
      );
    }
  };

  // Calcular el total con IVA
  const calcularTotalProductoConIVA = (totalSinIVA: number) => {
    const ivaAmount = (totalSinIVA * venta.iva) / 100;
    return Math.round(totalSinIVA + ivaAmount);
  };

  // Calcular el total con IVA
  const calcularTotalCitaConIVA = () => {
    const totalSinIVA = ventaCitas.total;
    const ivaAmount = (totalSinIVA * venta.iva) / 100;
    return Math.round(totalSinIVA + ivaAmount);
  };

  // Manejar la presentación del formulario de productos
  const handleFormSubmitProductos = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (productosSeleccionados.length === 0) {
      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        productos: "Debes agregar al menos un producto válido",
      }));
      return;
    } else {
      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        productos: "",
      }));
    }
    onOpen();
  };

  // Manejar la presentación del formulario de citas
  const handleFormSubmitCitas = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onOpen();
  };

  // Manejar la confirmación del envío del formulario de productos
  const handleConfirmSubmitProductos = () => {
    handleSubmitProductos();
    onOpenChange();
  };

  // Manejar la confirmación del envío del formulario de citas
  const handleConfirmSubmitCitas = () => {
    handleSubmitCitas();
    onOpenChange();
  };

  // Validación en tiempo real
  const [validationErrors, setValidationErrors] = useState({
    total: "",
    idCliente: "",
    idColaborador: "",
    idProducto: "",
    productos: "",
  });

  // Función para validar un campo individual
  const validateField = (name: string, value: string | number) => {
    switch (name) {
      case "total":
        return /^[1-9]\d*$/.test(value.toString())
          ? ""
          : "El total debe ser un número positivo. Además no puede empezar con 0 o ser 0";
      case "idCliente":
        return value !== 0 ? "" : "Debes seleccionar un cliente.";
      case "idColaborador":
        return value !== 0 ? "" : "Debes seleccionar un colaborador.";
      default:
        return "";
    }
  };

  // Renderizar el componente
  return (
    <>
      {acceso ? (
        <div className="container">
          <h1 className={title()}>Crear Venta</h1>
          <br />
          <br />
          {/* Botones para alternar entre productos y citas */}
          <div className="flex gap-4 mb-4">
            <Button
              color="warning"
              variant={mostrarProductos ? "solid" : "light"}
              onClick={() => {
                setMostrarProductos(true);
              }}
            >
              Pedido Productos
            </Button>
            <Button
              color="warning"
              variant={!mostrarProductos ? "solid" : "light"}
              onClick={() => {
                setMostrarProductos(false);
              }}
            >
              Confirmación Citas
            </Button>
          </div>
          {/* Mostrar spinner de carga si la información se está cargando */}
          {isLoading ? (
            <div className="flex justify-center h-screen text-center">
              <div className="text-center">
                <Spinner color="warning" size="lg" />
              </div>
            </div>
          ) : mostrarProductos ? (
            // Mostrar formulario si la información se ha cargado
            <form onSubmit={handleFormSubmitProductos}>
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Selector de cliente */}
                <Select
                  isRequired
                  name="idCliente"
                  label="Cliente"
                  selectedKeys={[idCliente]}
                  onChange={handleDropdownChangeCliente}
                  required
                  onError={errores.idCliente}
                  isInvalid={!!validationErrors.idCliente}
                  errorMessage={validationErrors.idCliente}
                >
                  {clientes
                    .filter((cliente) => cliente.estado === "Activo")
                    .map((cliente) => (
                      <SelectItem
                        key={cliente.idCliente}
                        value={cliente.idCliente.toString()}
                      >
                        {cliente.nombre}
                      </SelectItem>
                    ))}
                </Select>

                {/* Selector de colaborador */}
                <Select
                  isRequired
                  name="idColaborador"
                  label="Colaborador"
                  selectedKeys={[idColaborador]}
                  onChange={handleDropdownChangeColaborador}
                  required
                  onError={errores.idColaborador}
                  isInvalid={!!validationErrors.idColaborador}
                  errorMessage={validationErrors.idColaborador}
                >
                  {colaboradores
                    .filter((colaborador) => colaborador.estado === "Activo")
                    .map((colaborador) => (
                      <SelectItem
                        key={colaborador.idColaborador}
                        value={colaborador.idColaborador.toString()}
                      >
                        {colaborador.nombre}
                      </SelectItem>
                    ))}
                </Select>

                {/* Input de búsqueda de productos */}
                <div className="relative">
                  <Input
                    ref={inputRef}
                    type="text"
                    label="Producto"
                    value={textoInput}
                    onChange={handleBusquedaProductoChange}
                    onKeyDown={handleKeyDown}
                    isInvalid={!!validationErrors.productos}
                    errorMessage={validationErrors.productos}
                    startContent={
                      // Mostrar chips de productos seleccionados
                      Object.values(
                        productosSeleccionados.reduce((acc, item) => {
                          acc[item.producto.nombre] = acc[
                            item.producto.nombre
                          ] || { ...item, cantidad: 0 };
                          acc[item.producto.nombre].cantidad += item.cantidad;
                          return acc;
                        }, {} as Record<string, ProductoSeleccionado>)
                      )
                        .slice(0, 4)
                        .map((item) => (
                          <Chip
                            key={item.id}
                            
                            color="default"
                            className="mr-2"
                          >
                            {item.producto.nombre} x {item.cantidad}
                          </Chip>
                        ))
                    }
                    endContent={
                      <>
                        {/* Botón para limpiar la búsqueda */}
                        {textoInput && (
                          <Button
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setTextoInput("");
                              setBusquedaProducto("");
                            }}
                          >
                            <X size={16} />
                          </Button>
                        )}
                        {/* Botón para abrir el modal de productos seleccionados */}
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onClick={onOpenProductosModal}
                          isDisabled={productosSeleccionados.length === 0}
                          className="mr-2"
                        >
                          <Ellipsis />
                        </Button>
                      </>
                    }
                  />

                  {/* Mostrar sugerencias de productos */}
                  {productosFiltrados.length > 0 && busquedaProducto !== "" && (
                    <ul
                      className="absolute left-0 z-10 w-full overflow-y-auto bg-white rounded-md shadow-md top-full dark:bg-gray-800 max-h-40"
                      style={{ backgroundColor: "#303030" }}
                    >
                      {productosFiltrados.map((producto) => (
                        <li
                          key={producto.idProducto}
                          className="flex justify-between px-4 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                          onClick={() => handleAgregarProducto(producto)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleAgregarProducto(producto);
                            }
                          }}
                          tabIndex={0}
                        >
                          <span>{producto.nombre}</span>
                          <span className="text-sm text-gray-500">
                            {producto.idMarca.nombre.toString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Input para el total (deshabilitado) */}
                <Input
                  isDisabled
                  isRequired
                  name="total"
                  label="Total"
                  type="number"
                  value={ventaProductos?.total.toFixed(2) || ""}
                  required
                />

                {/* Input para el total con IVA (deshabilitado) */}
                <Input
                  isDisabled
                  isRequired
                  name="totalConIVA"
                  label="Total con IVA"
                  type="number"
                  value={calcularTotalProductoConIVA(
                    ventaProductos.total
                  ).toFixed(2)}
                  required
                />

                {/* Input para el IVA (deshabilitado) */}
                <Input
                  isDisabled
                  isRequired
                  name="iva"
                  label="IVA (19% SIEMPRE SE COBRARÁ ESE PORCENTAJE)"
                  type="number"
                  value={venta?.iva.toString() || ""}
                  required
                />
              </div>

              {/* Botones para cancelar o enviar el formulario */}
              <div className="flex justify-end mt-4">
                <Link href="/admin/ventas">
                  <Button
                    className="mr-2 bg-gradient-to-tr from-red-600 to-red-300"
                    type="button"
                  >
                    Cancelar
                  </Button>
                </Link>
                <Button
                  className="bg-gradient-to-tr from-yellow-600 to-yellow-300"
                  type="submit"
                >
                  Enviar
                </Button>
              </div>
            </form>
          ) : (
            // Formulario para citas
            <form onSubmit={handleFormSubmitCitas}>
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Selector de cliente */}
                <Select
                  isRequired
                  name="idCliente"
                  label="Cliente"
                  selectedKeys={[idCliente]}
                  onChange={handleDropdownChangeCitaCliente}
                  required
                  onError={errores.idCliente}
                  isInvalid={!!validationErrors.idCliente}
                  errorMessage={validationErrors.idCliente}
                >
                  {clientes
                    .filter((cliente) => cliente.estado === "Activo")
                    .map((cliente) => (
                      <SelectItem
                        key={cliente.idCliente}
                        value={cliente.idCliente.toString()}
                      >
                        {cliente.nombre}
                      </SelectItem>
                    ))}
                </Select>
                {/* Selector de citas del cliente seleccionado */}
                <Select
                  label="Seleccionar Cita"
                  disabled={!idCliente}
                  onChange={(e) => {
                    const citaSeleccionada = citasCliente.find(
                      (cita: any) => cita.idCita.toString() === e.target.value
                    );
                    if (citaSeleccionada) {
                      handleCitaChange(citaSeleccionada);
                    }
                  }}
                >
                  {citasCliente.map((cita: any) => (
                    <SelectItem
                      key={cita.idCita}
                      value={cita.idCita.toString()}
                    >
                      Cita #{cita.idCita}
                    </SelectItem>
                  ))}
                </Select>
                {/* Input para la fecha de la Cita */}
                {citaSeleccionada && (
                  <Input
                    isDisabled
                    label="Fecha de la Cita"
                    type="date"
                    value={
                      new Date(citaSeleccionada.fecha)
                        .toISOString()
                        .split("T")[0]
                    }
                  />
                )}
                {/* Input para el Colaborador de la Cita */}
                {citaSeleccionada && (
                  <Input
                    isDisabled
                    label="Colaborador"
                    value={
                      colaboradores.find(
                        (colaborador) =>
                          colaborador.idColaborador ===
                          citaSeleccionada.idColaborador
                      )?.nombre || ""
                    }
                  />
                )}
                {/* Input para el Paquete de la Cita */}
                <Input
                  isDisabled
                  label="Paquete"
                  value={venta.idPaquete || ""}
                />
                {/* Input para el Estado de la Cita */}
                <Input isDisabled label="Estado" value={venta.estado} />
                {/* Input para el Total de la Venta (editable) */}
                <Input
                  isRequired
                  name="total"
                  label="Total"
                  type="number"
                  value={ventaCitas?.total.toFixed(2) || ""}
                  onChange={(e) => {
                    setVentaCitas({
                      ...ventaCitas,
                      total: parseInt(e.target.value),
                    });
                  }}
                  required
                  onError={errores.total}
                  isInvalid={!!validationErrors.total}
                  errorMessage={validationErrors.total}
                />
                {/* Input para el Total con IVA (deshabilitado) */}
                <Input
                  isDisabled
                  isRequired
                  name="totalConIVA"
                  label="Total con IVA"
                  type="number"
                  value={calcularTotalCitaConIVA().toFixed(2)}
                  required
                />{" "}
              </div>

              {/* Botones para cancelar o enviar el formulario */}
              <div className="flex justify-end mt-4">
                <Link href="/admin/ventas">
                  <Button
                    className="mr-2 bg-gradient-to-tr from-red-600 to-red-300"
                    type="button"
                  >
                    Cancelar
                  </Button>
                </Link>
                <Button
                  className="bg-gradient-to-tr from-yellow-600 to-yellow-300"
                  type="submit"
                >
                  Enviar
                </Button>
              </div>
            </form>
          )}

          {/* Modal de confirmación (compartido para productos y citas) */}
          <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col items-center gap-1">
                    <CircleHelp color="#fef08a" size={100} />
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <h1 className="text-3xl ">¿Desea crear la venta?</h1>
                    <p>
                      {mostrarProductos
                        ? "La venta se creará con los productos seleccionados."
                        : "La venta se creará con la información de la cita seleccionada."}
                    </p>
                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                      Cancelar
                    </Button>
                    <Button
                      color="warning"
                      variant="light"
                      onPress={() => {
                        if (mostrarProductos) {
                          handleConfirmSubmitProductos();
                        } else {
                          handleConfirmSubmitCitas();
                        }
                        onClose();
                      }}
                    >
                      Crear
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>

          {/* Modal de error */}
          <Modal isOpen={isOpenError} onOpenChange={onOpenChangeError}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col items-center gap-1">
                    <CircleX color="#894242" size={100} />
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <h1 className="text-3xl ">Error</h1>
                    <p>{mensajeError}</p>
                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                      Cerrar
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>

          {/* Modal de productos seleccionados */}
          <Modal
            isOpen={isProductosModalOpen}
            onOpenChange={onOpenChangeProductosModal}
          >
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader>Productos Seleccionados</ModalHeader>
                  <ModalBody>
                    {/* Input de búsqueda dentro del modal */}
                    <Input
                      placeholder="Buscar producto..."
                      value={busquedaModal}
                      onChange={(e) => {
                        setBusquedaModal(e.target.value);
                        setPaginaModal(1);
                      }}
                    />
                    <ul>
                      {Object.values(
                        productosSeleccionados.reduce((acc, item) => {
                          acc[item.producto.nombre] = acc[
                            item.producto.nombre
                          ] || { ...item, cantidad: 0 };
                          acc[item.producto.nombre].cantidad += item.cantidad;
                          return acc;
                        }, {} as Record<string, ProductoSeleccionado>)
                      )
                        .filter((item) =>
                          item.producto.nombre
                            .toLowerCase()
                            .includes(busquedaModal.toLowerCase())
                        )
                        .slice((paginaModal - 1) * 6, paginaModal * 6)
                        .map((item) => (
                          <li
                            key={item.id}
                            className="flex items-center justify-between mb-2"
                          >
                            <span>
                              {item.producto.nombre} x {item.cantidad}
                            </span>
                            <div className="flex">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="success"
                                onClick={() =>
                                  handleAgregarProducto(item.producto)
                                }
                                className="mr-2"
                              >
                                <PlusIcon size={16} />
                              </Button>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onClick={() => handleEliminarProducto(item.id)}
                              >
                                <MinusIcon size={16} />
                              </Button>
                            </div>
                          </li>
                        ))}
                    </ul>
                    {/* Mostrar mensaje si no hay productos que coincidan con la búsqueda */}
                    {busquedaModal !== "" &&
                      Object.values(productosSeleccionados).filter((item) =>
                        item.producto.nombre
                          .toLowerCase()
                          .includes(busquedaModal.toLowerCase())
                      ).length === 0 && <p>No se encontraron productos.</p>}
                    {/* Paginación */}
                    {Object.values(productosSeleccionados).filter((item) =>
                      item.producto.nombre
                        .toLowerCase()
                        .includes(busquedaModal.toLowerCase())
                    ).length > 6 && (
                      <div className="flex justify-center mt-4">
                        <Pagination
                          color="warning"
                          total={Math.ceil(
                            Object.values(productosSeleccionados).filter(
                              (item) =>
                                item.producto.nombre
                                  .toLowerCase()
                                  .includes(busquedaModal.toLowerCase())
                            ).length / 6
                          )}
                          initialPage={paginaModal}
                          onChange={(page) => setPaginaModal(page)}
                          showControls
                        />
                      </div>
                    )}
                  </ModalBody>
                  <ModalFooter>
                    <Button color="warning" onPress={onClose}>
                      Cerrar
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>
          <Toaster position="bottom-right" />
        </div>
      ) : (
        // Mostrar spinner si no tiene acceso
        <div className="flex justify-center h-screen text-center">
          <div className="text-center">
            <Spinner color="warning" size="lg" />
          </div>
        </div>
      )}
    </>
  );
}

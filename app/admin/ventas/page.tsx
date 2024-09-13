"use client";

// Importar módulos necesarios
import React, {
  useState,
  useEffect,
  useCallback,
  FC,
  Dispatch,
  SetStateAction,
  useMemo,
} from "react";
import { useMediaQuery } from "react-responsive";
import {
  PlusIcon,
  Ellipsis,
  CircleHelp,
  CircleX,
  Eye,
  FileBarChart2,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Input,
  Button,
  Link,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Card,
  CardBody,
  Select,
  SelectItem,
  Spinner,
} from "@nextui-org/react";

// Importar funciones de configuración
import {
  getWithAuth,
  postWithAuth,
  verificarAccesoPorPermiso,
} from "@/config/peticionesConfig";

// Importar estilos
import { title } from "@/components/primitives";

// Importar la librería para generar PDFs
import jsPDF from "jspdf";
import "jspdf-autotable";

// Definición de interfaces para tipos de datos
interface Venta {
  idVenta: string;
  numeroFactura: string;
  fechaCreacion: string;
  fechaFinalizacion: string;
  fecha: string;
  estado: "Pendiente" | "Aceptado" | "Cancelado";
  identificador: string;
  total: string;
  iva: string;
  idCliente: string;
  idColaborador: string;
}

// Definición de columnas para la tabla
const columns = [
  { name: "ID", uid: "idVenta" },
  { name: "N° Pedido", uid: "numeroFactura" },
  { name: "Fecha", uid: "fecha" },
  { name: "Total", uid: "total" },
  { name: "Cliente", uid: "idCliente" },
  { name: "Colaborador", uid: "idColaborador" },
  { name: "Estado", uid: "estado" },
  { name: "Identificador", uid: "identificador" },
  { name: "Acciones", uid: "acciones" },
];

// Componente para la celda de estado de la venta
const EstadoVentaCell: FC<{
  venta: Venta;
  estadosPermitidos: Record<Venta["estado"], Venta["estado"][]>;
  handleToggleEstado: (idVenta: string, nuevoEstado: Venta["estado"]) => void;
  handleOpenModal: (idVenta: string, estadoActual: Venta["estado"]) => void;
  setSelectedEstado: Dispatch<SetStateAction<Venta["estado"] | null>>;
}> = ({
  venta,
  estadosPermitidos,
  handleToggleEstado,
  handleOpenModal,
  setSelectedEstado,
}) => {
  const [showSelect, setShowSelect] = useState(false);

  const handleEstadoChange = (nuevoEstado: Venta["estado"]) => {
    if (nuevoEstado !== "Pendiente") {
      setSelectedEstado(nuevoEstado);
      handleOpenModal(venta.idVenta, nuevoEstado);
    } else {
      handleToggleEstado(venta.idVenta, nuevoEstado);
    }
    setShowSelect(false);
  };

  return (
    <>
      {showSelect ? (
        <Select
          className="min-w-[86px]"
          label="Pendiente"
          value={venta.estado}
          onChange={(e) =>
            handleEstadoChange(e.target.value as Venta["estado"])
          }
          isDisabled={venta.estado !== "Pendiente"}
        >
          {estadosPermitidos[venta.estado].map((estado) => (
            <SelectItem
              key={estado}
              value={estado}
              color={
                estado === "Aceptado"
                  ? "success"
                  : estado === "Cancelado"
                  ? "danger"
                  : "default"
              }
            >
              {estado}
            </SelectItem>
          ))}
        </Select>
      ) : (
        <Chip
          className="transition-transform duration-100 ease-in-out cursor-pointer hover:scale-110"
          isDisabled={venta.estado !== "Pendiente"}
          key={venta.estado}
          color={
            venta.estado === "Aceptado"
              ? "success"
              : venta.estado === "Pendiente"
              ? "warning"
              : "danger"
          }
          variant="bordered"
          onClick={(e) => {
            e.stopPropagation();
            setShowSelect(true);
          }}
        >
          {venta.estado}
        </Chip>
      )}
    </>
  );
};

// Componente principal: VentasPage
export default function VentasPage() {
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

  // Estados para la lista de ventas y detalles de una venta seleccionada
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [ventaDetallesProductos, setVentaDetallesProductos] = useState<
    any | null
  >([]);
  const [ventaDetallesServicios, setVentaDetallesServicios] = useState<
    any | null
  >([]);
  const [selectedVentaId, setSelectedVentaId] = useState<string | null>(null);

  // Mapas para almacenar información de clientes, colaboradores y productos
  const [clientes, setClientes] = useState<Map<string, string>>(new Map());
  const [colaboradores, setColaboradores] = useState<Map<string, string>>(
    new Map()
  );
  const [productos, setProductos] = useState<Map<string, any>>(new Map());
  const [, setCitas] = useState<Map<string, any>>(new Map());

  // Estado para almacenar productos agrupados por ID
  const [productosAgrupados, setProductosAgrupados] = useState<any[]>([]);

  // Estados para la búsqueda, paginación y carga
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [productPage, setProductPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);

  // Estados para manejo de errores y modales
  const [mensajeError, setMensajeError] = useState("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isOpenError,
    onOpen: onOpenError,
    onOpenChange: onOpenChangeError,
  } = useDisclosure();
  const {
    isOpen: isOpenWarning,
    onOpen: onOpenWarning,
    onOpenChange: onOpenChangeWarning,
  } = useDisclosure();
  const {
    isOpen: isOpenDetalles,
    onOpen: onOpenDetalles,
    onOpenChange: onOpenChangeDetalles,
  } = useDisclosure();

  // Variables para la paginación y detección de tamaño de pantalla
  const rowsPerPage = 6;
  const tamanoMovil = useMediaQuery({ maxWidth: 768 });

  // Estado para el manejo del estado de la venta
  const [selectedEstado, setSelectedEstado] = useState<Venta["estado"] | null>(
    null
  );
  const estadosPermitidos: Record<Venta["estado"], Venta["estado"][]> = {
    Pendiente: ["Aceptado", "Cancelado"],
    Aceptado: [],
    Cancelado: [],
  };

  // Función para obtener los detalles de una venta de productos
  const fetchVentaDetallesProductos = async (idVenta: string) => {
    try {
      const ventaResponse = await getWithAuth(
        "http://localhost:8080/venta/detalles-productos/" + idVenta
      );
      const ventaData = await ventaResponse.json();

      const updatedProductos = ventaData.productos.reduce(
        (acc: any, producto: any) => {
          if (!acc[producto.idProducto]) {
            acc[producto.idProducto] = { ...producto, cantidad: 0 };
          }
          acc[producto.idProducto].cantidad++;
          return acc;
        },
        {}
      );

      const productosAgrupados: any[] = Object.values(updatedProductos);
      setProductosAgrupados(productosAgrupados);

      const mergedData = {
        ...ventaData,
        productos: productosAgrupados,
      };

      return mergedData;
    } catch (error) {
      setMensajeError(
        "Error al obtener los detalles de la venta de productos. Por favor, inténtalo de nuevo."
      );
      onOpenError();
    }
  };

  // Función para obtener los detalles de una venta de servicios (citas)
  const fetchVentaDetallesServicios = async (idVenta: string) => {
    try {
      const ventaResponse = await getWithAuth(
        "http://localhost:8080/venta/detalles-servicios/" + idVenta
      );
      if (!ventaResponse.ok) {
        throw new Error("No se encontró el detalle de venta de servicios.");
      }
      const ventaData = await ventaResponse.json();

      const detalles = {
        ventas: ventaData.ventas,
        cita: ventaData.cita,
      };

      return detalles;
    } catch (error) {
      setMensajeError(
        "Error al obtener los detalles de la venta de servicios. Por favor, inténtalo de nuevo."
      );
      onOpenError();
    }
  };

  // Obtener datos de ventas, clientes, colaboradores, productos y citas al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          ventasResponse,
          clientesResponse,
          colaboradoresResponse,
          productosResponse,
          citasResponse,
        ] = await Promise.all([
          getWithAuth("http://localhost:8080/venta"),
          getWithAuth("http://localhost:8080/cliente"),
          getWithAuth("http://localhost:8080/colaborador"),
          getWithAuth("http://localhost:8080/compras/productos"),
          getWithAuth("http://localhost:8080/cita"),
        ]);

        const [
          ventasData,
          clientesData,
          colaboradoresData,
          productosData,
          citasData,
        ] = await Promise.all([
          ventasResponse.json(),
          clientesResponse.json(),
          colaboradoresResponse.json(),
          productosResponse.json(),
          citasResponse.json(),
        ]);

        // Procesar datos de ventas
        if (Array.isArray(ventasData) && ventasData.length > 0) {
          setVentas(
            ventasData.map((item: any) => ({
              idVenta: item.idVenta,
              numeroFactura: item.numeroFactura,
              fechaCreacion: item.fechaCreacion,
              fechaFinalizacion: item.fechaFinalizacion,
              fecha: item.fecha,
              estado: item.estado,
              identificador: item.identificador,
              total: item.total,
              iva: item.iva,
              idCliente: item.idCliente,
              idColaborador: item.idColaborador,
            }))
          );
        }

        // Crear mapa de clientes
        const clienteMap = new Map<string, string>();
        clientesData.forEach((item: any) => {
          clienteMap.set(item.idCliente, item.nombre);
        });
        setClientes(clienteMap);

        // Crear mapa de colaboradores
        const colaboradorMap = new Map<string, string>();
        colaboradoresData.forEach((item: any) => {
          colaboradorMap.set(item.idColaborador, item.nombre);
        });
        setColaboradores(colaboradorMap);

        // Crear mapa de productos
        const productosMap = new Map<string, any>();
        productosData.forEach((item: any) => {
          productosMap.set(item.idProducto, item);
        });
        setProductos(productosMap);

        // Crear mapa de citas
        const citasMap = new Map<string, any>();
        citasData.forEach((item: any) => {
          citasMap.set(item.idCita, item);
        });
        setCitas(citasMap);
      } catch (err: any) {
        // Manejo de errores
        if (err.message === "Unexpected end of JSON input") {
          setMensajeError("No hay ventas registradas aún.");
          onOpenWarning();
        } else if (
          err instanceof TypeError &&
          err.message.includes("Failed to fetch")
        ) {
          setMensajeError(
            "Error al obtener ventas. Problemas con la conexión del servidor."
          );
          onOpenError();
        } else {
          setMensajeError(
            "El servicio se está reiniciando o cargando. Inténtalo de nuevo más tarde."
          );
          onOpenError();
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Función para cambiar el estado de una venta
  const handleToggleEstado = useCallback(
    (idVenta: string, nuevoEstado: Venta["estado"]) => {
      const venta = ventas.find((venta) => venta.idVenta === idVenta);
      if (!venta || !estadosPermitidos[venta.estado].includes(nuevoEstado))
        return;
      const updatedVenta = { ...venta, estado: nuevoEstado };

      const promise = new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          postWithAuth("http://localhost:8080/venta/" + idVenta, updatedVenta)
            .then((response) => {
              if (response.ok) {
                setVentas((prevVentas) =>
                  prevVentas.map((v) =>
                    v.idVenta === idVenta ? updatedVenta : v
                  )
                );
                resolve();
              } else {
                reject(new Error("Error al cambiar el estado"));
              }
            })
            .catch((error) => {
              setMensajeError(
                "Error al cambiar el estado de la venta. Por favor, inténtalo de nuevo."
              );
              onOpenError();
              reject();
            });
        }, 1000);
      });
      toast.promise(promise, {
        loading: "Editando...",
        success: "El estado ha sido cambiado con éxito",
        error: (err) => err.message,
      });
    },
    [ventas]
  );

  // Filtrar ventas según el término de búsqueda
  const ventasFiltradas = useMemo(() => {
    const totalRegex = new RegExp(
      searchTerm.replace(/[$,.]/g, "").replace(",", "."),
      "i"
    );
    return ventas.filter((venta) => {
      const clienteNombre = clientes.get(venta.idCliente) || "";
      const colaboradorNombre = colaboradores.get(venta.idColaborador) || "";
      return (
        Object.values(venta).some((value) =>
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        colaboradorNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        totalRegex.test(venta.total)
      );
    });
  }, [ventas, searchTerm, clientes, colaboradores]);

  // Ordenar ventas: Pendientes primero
  const ventasOrdenadas = useMemo(() => {
    return ventasFiltradas.sort((a) => (a.estado === "Pendiente" ? -1 : 1));
  }, [ventasFiltradas]);

  // Calcular los elementos a mostrar en la página actual
  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return ventasOrdenadas.slice(start, end);
  }, [page, ventasOrdenadas]);

  // Función para abrir el modal de cambio de estado
  const handleOpenModal = (idVenta: string, estadoActual: Venta["estado"]) => {
    setSelectedVentaId(idVenta);
    setSelectedEstado(estadoActual);
    onOpen();
  };

  // Función para formatear el total como moneda
  const formatCurrency = (
    valor: string | number,
    currencyCode: string = "COP"
  ) => {
    let valorString = valor.toString();
    const valorNumerico = parseFloat(
      valorString.replace(/[^\d.,]/g, "").replace(",", ".")
    );

    if (isNaN(valorNumerico)) {
      return "N/A";
    }
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      notation: "standard",
    }).format(valorNumerico);
  };

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Función para generar el PDF de todas las ventas
  const generarPDFVentas = () => {
    const doc = new jsPDF();

    // Agregar título
    doc.setFontSize(20);
    doc.text("Reporte de Ventas", 10, 20);

    // Preparar datos para la tabla
    const data = ventas.map((venta) => [
      venta.idVenta,
      venta.numeroFactura,
      venta.fecha,
      venta.total,
      clientes.get(venta.idCliente) || venta.idCliente,
      colaboradores.get(venta.idColaborador) || venta.idColaborador,
      venta.estado,
      venta.identificador,
    ]);

    // Agregar tabla al PDF
    (doc as any).autoTable({
      head: [
        [
          "ID",
          "N° Factura",
          "Fecha",
          "Total",
          "Cliente",
          "Colaborador",
          "Estado",
          "Identificador",
        ],
      ],
      body: data,
    });

    // Guardar el PDF
    doc.save("reporte_ventas.pdf");
  };

  // Función para generar el PDF de un detalle de venta de productos
  const generarPDFDetalleVentaProductos = () => {
    if (!ventaDetallesProductos) return;

    const doc = new jsPDF();

    // Agregar título
    doc.setFontSize(20);
    doc.text(
      `Detalle de Venta Productos: ${ventaDetallesProductos.ventas.numeroFactura}`,
      10,
      20
    );

    // Agregar información de la venta
    doc.setFontSize(12);
    doc.text(
      `Cliente: ${clientes.get(ventaDetallesProductos.ventas.idCliente)}`,
      10,
      40
    );
    doc.text(
      `Colaborador: ${colaboradores.get(
        ventaDetallesProductos.ventas.idColaborador
      )}`,
      10,
      50
    );
    doc.text(
      `Total: ${formatCurrency(ventaDetallesProductos.ventas.total)} COP`,
      10,
      60
    );
    doc.text(`IVA: ${ventaDetallesProductos.ventas.iva}%`, 10, 70);

    // Agregar información de los productos
    const productosData = productosAgrupados.map((producto) => [
      producto.nombre,
      productos.get(producto.idProducto)?.idMarca.nombre ||
        "Marca no encontrada",
      producto.cantidad,
      formatCurrency(producto.precio),
    ]);

    (doc as any).autoTable({
      head: [["Nombre", "Marca", "Cantidad", "Precio"]],
      body: productosData,
      startY: 90,
    });

    // Guardar el PDF
    doc.save(
      `detalle_venta_productos_${ventaDetallesProductos.ventas.numeroFactura}.pdf`
    );
  };

  // Función para generar el PDF de un detalle de venta de servicios (citas)
  const generarPDFDetalleVentaServicios = () => {
    if (!ventaDetallesServicios) return;

    const doc = new jsPDF();

    // Agregar título
    doc.setFontSize(20);
    doc.text(
      `Detalle de Venta Servicios: ${ventaDetallesServicios.ventas.numeroFactura}`,
      10,
      20
    );

    // Agregar información de la venta
    doc.setFontSize(12);
    doc.text(
      `Cliente: ${clientes.get(ventaDetallesServicios.ventas.idCliente)}`,
      10,
      40
    );
    doc.text(
      `Colaborador: ${colaboradores.get(
        ventaDetallesServicios.ventas.idColaborador
      )}`,
      10,
      50
    );
    doc.text(
      `Total: ${formatCurrency(ventaDetallesServicios.ventas.total)} COP`,
      10,
      60
    );
    doc.text(`IVA: ${ventaDetallesServicios.ventas.iva}%`, 10, 70);

    // Agregar información de la cita en una tabla
    const citaData = [
      ["Fecha", formatDate(ventaDetallesServicios.cita.fecha)],
      ["Hora", ventaDetallesServicios.cita.hora],
      ["Detalle", ventaDetallesServicios.cita.detalle],
      ["ID Paquete", ventaDetallesServicios.cita.idPaquete],
      ["Estado", ventaDetallesServicios.cita.estado],
    ];

    // Agregar tabla al PDF
    (doc as any).autoTable({
      head: [["Detalle", "Información"]],
      body: citaData,
      startY: 90, // Ajusta la posición vertical de la tabla
    });

    // Guardar el PDF
    doc.save(
      `detalle_venta_servicios_${ventaDetallesServicios.ventas.numeroFactura}.pdf`
    );
  };

  // Función para abrir el modal de detalles, identificando si es venta de productos o servicios
  const handleOpenDetallesModal = async (idVenta: string) => {
    const venta = ventas.find((venta) => venta.idVenta === idVenta);
    if (!venta) {
      setMensajeError("No se encontró la venta.");
      onOpenError();
      return;
    }

    setSelectedVentaId(idVenta);

    if (venta.identificador === "Producto") {
      const detalles = await fetchVentaDetallesProductos(idVenta);
      setVentaDetallesProductos(detalles);
    } else if (venta.identificador === "Servicio") {
      const detalles = await fetchVentaDetallesServicios(idVenta);
      setVentaDetallesServicios(detalles);
    } else {
      setMensajeError("Identificador de venta desconocido.");
      onOpenError();
      return;
    }
    onOpenDetalles();
  };

  // Renderizar el componente
  return (
    <>
      {/* Verificar si tiene acceso */}
      {acceso ? (
        <div>
          {/* Título */}
          <h1 className={title()}>Ventas</h1>

          {/* Toaster para notificaciones */}
          <Toaster position="bottom-right" />

          {/* Contenedor para la barra de búsqueda y botones */}
          <div className="flex flex-col items-start sm:flex-row sm:items-center">
            {/* Barra de búsqueda */}
            <div className="p-0 my-4 rounded-lg basis-1/4 bg-gradient-to-tr from-yellow-600 to-yellow-300">
              <Input
                classNames={{
                  label: "text-black/50 dark:text-white/90",
                  input: [
                    "bg-transparent",
                    "text-black/90 dark:text-white/90",
                    "placeholder:text-default-700/50 dark:placeholder:text-white/60",
                  ],
                  innerWrapper: "bg-transparent",
                  inputWrapper: [
                    "shadow-xl",
                    "rounded-lg",
                    "bg-default-200/50",
                    "dark:bg-default/60",
                    "backdrop-blur-xl",
                    "backdrop-saturate-200",
                    "hover:bg-default-200/70",
                    "dark:hover:bg-default/70",
                    "group-data-[focus=true]:bg-default-200/50",
                    "dark:group-data-[focus=true]:bg-default/60",
                    "!cursor-text",
                  ],
                }}
                style={{ width: "284px" }}
                placeholder="Buscar..."
                onChange={(e: any) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Espacio flexible */}
            <div className="basis-1/2"></div>

            {/* Botones de acciones */}
            <div className="flex items-center justify-end mb-4 space-x-2 basis-1/4 sm:my-4 text-end">
              {/* Botón para crear reporte */}
              <Button
                isIconOnly
                className="bg-gradient-to-tr from-red-600 to-red-100"
                aria-label="Crear Reporte"
                onClick={generarPDFVentas}
              >
                <FileBarChart2 />
              </Button>

              {/* Enlace para crear una nueva venta de productos */}
              <Link href="/admin/ventas/venta-producto">
                <Button
                  className="bg-gradient-to-tr from-red-600 to-orange-300"
                  aria-label="Crear Venta"
                >
                  <PlusIcon /> Pedidos
                </Button>
              </Link>
            </div>
          </div>

          {/* Mostrar un spinner de carga si la información se está cargando */}
          {isLoading ? (
            <div className="flex justify-center h-screen text-center">
              <div className="text-center">
                <Spinner color="warning" size="lg" />
              </div>
            </div>
          ) : // Mostrar la tabla de ventas o la vista móvil si la información se ha cargado
          tamanoMovil ? (
            // Vista móvil: tarjetas para cada venta
            <div>
              {items.map((item) => (
                <Card key={item.idVenta} className="mb-4">
                  <CardBody>
                    {/* Iterar sobre las columnas para mostrar la información de la venta */}
                    {columns.map((column) => (
                      <div key={column.uid}>
                        <strong>{column.name}: </strong>
                        {/* Renderizar la celda de acciones */}
                        {column.uid === "acciones" ? (
                          <Dropdown>
                            <DropdownTrigger className="w-auto my-2 bg-transparent">
                              <Button
                                isIconOnly
                                className="border"
                                aria-label="Actions"
                                isDisabled={item.estado !== "Pendiente"}
                              >
                                <Ellipsis />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu onAction={(action) => action}>
                              <DropdownItem key={"detalles"}>
                                <Button
                                  className="w-full bg-transparent"
                                  onPress={() =>
                                    handleOpenDetallesModal(item.idVenta)
                                  }
                                >
                                  <Eye />
                                  Detalles
                                </Button>
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        ) : // Renderizar la celda de fecha formateada
                        column.uid === "fecha" ? (
                          formatDate(item.fecha)
                        ) : // Renderizar la celda de estado con el componente EstadoVentaCell
                        column.uid === "estado" ? (
                          <EstadoVentaCell
                            venta={item}
                            estadosPermitidos={estadosPermitidos}
                            handleToggleEstado={handleToggleEstado}
                            handleOpenModal={handleOpenModal}
                            setSelectedEstado={setSelectedEstado}
                          />
                        ) : // Renderizar la celda de total formateada como moneda
                        column.uid === "total" ? (
                          formatCurrency(item.total)
                        ) : // Renderizar la celda de cliente con el nombre del cliente
                        column.uid === "idCliente" ? (
                          <span>
                            {clientes.get(item.idCliente) || item.idCliente}
                          </span>
                        ) : // Renderizar la celda de colaborador con el nombre del colaborador
                        column.uid === "idColaborador" ? (
                          <span>
                            {colaboradores.get(item.idColaborador) ||
                              item.idColaborador}
                          </span>
                        ) : (
                          // Renderizar el valor de la columna por defecto
                          <span>{item[column.uid as keyof Venta]}</span>
                        )}
                      </div>
                    ))}
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : (
            // Vista de escritorio: tabla para mostrar las ventas
            <Table className="mb-8" isStriped>
              <TableHeader columns={columns}>
                {(column) => (
                  <TableColumn className="text-base" key={column.uid}>
                    {column.name}
                  </TableColumn>
                )}
              </TableHeader>
              <TableBody items={items}>
                {(item) => (
                  <TableRow key={item.idVenta}>
                    {columns.map((column) => (
                      <TableCell key={column.uid}>
                        {column.uid === "acciones" ? (
                          <Dropdown>
                            <DropdownTrigger className="w-auto my-2 bg-transparent">
                              <Button
                                isIconOnly
                                className="border"
                                aria-label="Actions"
                              >
                                <Ellipsis />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu onAction={(action) => action}>
                              <DropdownItem key={"detalles"}>
                                <Button
                                  className="w-full bg-transparent"
                                  onPress={() =>
                                    handleOpenDetallesModal(item.idVenta)
                                  }
                                >
                                  <Eye />
                                  Detalles
                                </Button>
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        ) : column.uid === "fecha" ? (
                          formatDate(item.fecha)
                        ) : column.uid === "estado" ? (
                          <EstadoVentaCell
                            venta={item}
                            estadosPermitidos={estadosPermitidos}
                            handleToggleEstado={handleToggleEstado}
                            handleOpenModal={handleOpenModal}
                            setSelectedEstado={setSelectedEstado}
                          />
                        ) : column.uid === "total" ? (
                          formatCurrency(item.total)
                        ) : column.uid === "idCliente" ? (
                          <span>
                            {clientes.get(item.idCliente) || item.idCliente}
                          </span>
                        ) : column.uid === "idColaborador" ? (
                          <span>
                            {colaboradores.get(item.idColaborador) ||
                              item.idColaborador}
                          </span>
                        ) : (
                          <span>{item[column.uid as keyof Venta]}</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {/* Paginación */}
          <div className="flex justify-center w-full mb-4">
            <Pagination
              showControls
              color="warning"
              page={page}
              total={Math.ceil(ventas.length / rowsPerPage)}
              onChange={(page) => setPage(page)}
            />
          </div>

          {/* Modal para mostrar los detalles de la venta */}
          <Modal
            isOpen={isOpenDetalles}
            onOpenChange={onOpenChangeDetalles}
            className="max-w-5xl"
          >
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col items-center pb-4 border-b border-gray-200">
                    <Eye color="#FFD700" size={100} />
                    <h1 className="mt-2 text-3xl font-semibold">
                      Detalles de la Venta
                    </h1>
                  </ModalHeader>
                  <ModalBody className="p-6">
                    {/* Mostrar detalles de la venta según el identificador */}
                    {selectedVentaId &&
                    ventas.find((venta) => venta.idVenta === selectedVentaId)
                      ?.identificador === "Producto" &&
                    ventaDetallesProductos ? (
                      <div className="flex flex-col gap-6 lg:flex-row">
                        {/* Tabla para información de la venta */}
                        <div style={{ width: "50%" }}>
                          <Table aria-label="Detalles de la Venta de Productos">
                            <TableHeader>
                              <TableColumn>Venta AlexaSoft</TableColumn>
                              <TableColumn>Información</TableColumn>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell>N° Factura</TableCell>
                                <TableCell>
                                  {ventaDetallesProductos.ventas.numeroFactura}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Cliente</TableCell>
                                <TableCell>
                                  {clientes.get(
                                    ventaDetallesProductos.ventas.idCliente
                                  )}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Colaborador</TableCell>
                                <TableCell>
                                  {colaboradores.get(
                                    ventaDetallesProductos.ventas.idColaborador
                                  )}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Total</TableCell>
                                <TableCell>
                                  {formatCurrency(
                                    ventaDetallesProductos.ventas.total
                                  )}{" "}
                                  COP - (IVA INCLUIDO)
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>IVA</TableCell>
                                <TableCell>
                                  {ventaDetallesProductos.ventas.iva}% - (19 por
                                  ciento)
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                          <br />
                          <Button
                            color="warning"
                            onPress={generarPDFDetalleVentaProductos}
                          >
                            Generar PDF
                          </Button>
                        </div>
                        {/* Tabla para información de los productos */}
                        <div style={{ width: "50%" }}>
                          <Table aria-label="Productos">
                            <TableHeader>
                              <TableColumn>Nombre</TableColumn>
                              <TableColumn>Marca</TableColumn>
                              <TableColumn>Cantidad</TableColumn>
                              <TableColumn>Precio</TableColumn>
                            </TableHeader>
                            <TableBody
                              items={productosAgrupados.slice(
                                (productPage - 1) * rowsPerPage,
                                productPage * rowsPerPage
                              )}
                            >
                              {(producto: any) => (
                                <TableRow key={producto.idProducto}>
                                  <TableCell>{producto.nombre}</TableCell>
                                  <TableCell>
                                    {productos.get(producto.idProducto)?.idMarca
                                      .nombre || "Marca no encontrada"}
                                  </TableCell>
                                  <TableCell>{producto.cantidad}</TableCell>
                                  <TableCell>
                                    {formatCurrency(producto.precio)}
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                          {/* Paginación para productos */}
                          {productosAgrupados.length > rowsPerPage && (
                            <div className="flex justify-center w-full mt-4">
                              <Pagination
                                showControls
                                color="warning"
                                page={productPage}
                                total={Math.ceil(
                                  productosAgrupados.length / rowsPerPage
                                )}
                                onChange={(page) => setProductPage(page)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : selectedVentaId &&
                      ventas.find((venta) => venta.idVenta === selectedVentaId)
                        ?.identificador === "Servicio" &&
                      ventaDetallesServicios ? (
                      <div className="flex flex-col gap-6 lg:flex-row">
                        {/* Tabla para información de la venta */}
                        <div style={{ width: "50%" }}>
                          <Table aria-label="Detalles de la Venta de Servicios">
                            <TableHeader>
                              <TableColumn>Venta AlexaSoft</TableColumn>
                              <TableColumn>Información</TableColumn>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell>N° Factura</TableCell>
                                {/* Accede a numeroFactura a través de ventaDetallesServicios.ventas con operador de encadenamiento opcional */}
                                <TableCell>
                                  {ventaDetallesServicios?.ventas
                                    ?.numeroFactura ?? "N/A"}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Cliente</TableCell>
                                {/* Accede a idCliente a través de ventaDetallesServicios.ventas con operador de encadenamiento opcional */}
                                <TableCell>
                                  {clientes.get(
                                    ventaDetallesServicios?.ventas?.idCliente
                                  ) ?? "N/A"}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Colaborador</TableCell>
                                {/* Accede a idColaborador a través de ventaDetallesServicios.ventas con operador de encadenamiento opcional */}
                                <TableCell>
                                  {colaboradores.get(
                                    ventaDetallesServicios?.ventas
                                      ?.idColaborador
                                  ) ?? "N/A"}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Total</TableCell>
                                {/* Accede a total a través de ventaDetallesServicios.ventas con operador de encadenamiento opcional */}
                                <TableCell>
                                  {ventaDetallesServicios?.ventas?.total !==
                                  undefined
                                    ? formatCurrency(
                                        ventaDetallesServicios.ventas.total
                                      )
                                    : "N/A"}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>IVA</TableCell>
                                {/* Accede a iva a través de ventaDetallesServicios.ventas con operador de encadenamiento opcional */}
                                <TableCell>
                                  {ventaDetallesServicios?.ventas?.iva ?? "N/A"}
                                  % - (19 por ciento)
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                          <br />
                          <Button
                            color="warning"
                            onPress={generarPDFDetalleVentaServicios}
                          >
                            Generar PDF
                          </Button>
                        </div>
                        {/* Tabla para información de la cita */}
                        <div style={{ width: "50%" }}>
                          <Table aria-label="Cita">
                            <TableHeader>
                              <TableColumn>Detalle</TableColumn>
                              <TableColumn>Información</TableColumn>
                            </TableHeader>
                            <TableBody>
                              <TableRow key={"fecha"}>
                                <TableCell>Fecha</TableCell>
                                <TableCell>
                                  {formatDate(
                                    ventaDetallesServicios.cita.fecha
                                  )}
                                </TableCell>
                              </TableRow>
                              <TableRow key={"hora"}>
                                <TableCell>Hora</TableCell>
                                <TableCell>
                                  {ventaDetallesServicios.cita.hora}
                                </TableCell>
                              </TableRow>
                              <TableRow key={"detalle"}>
                                <TableCell>Detalle</TableCell>
                                <TableCell>
                                  {ventaDetallesServicios.cita.detalle}
                                </TableCell>
                              </TableRow>
                              <TableRow key={"idPaquete"}>
                                <TableCell>ID Paquete</TableCell>
                                <TableCell>
                                  {ventaDetallesServicios.cita.idPaquete}
                                </TableCell>
                              </TableRow>
                              <TableRow key={"estado"}>
                                <TableCell>Estado</TableCell>
                                <TableCell>
                                  {ventaDetallesServicios.cita.estado}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ) : isLoading ? (
                      // Mostrar un spinner de carga si se están cargando los detalles
                      <div className="flex items-center justify-center">
                        <Spinner color="warning" size="lg" />
                      </div>
                    ) : (
                      // Mostrar un mensaje si no hay detalles para mostrar
                      <p>No hay detalles para mostrar</p>
                    )}
                  </ModalBody>
                  <ModalFooter className="pt-4 border-t border-gray-200">
                    <Button color="danger" variant="light" onPress={onClose}>
                      Cerrar
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>

          {/* Modal para confirmar el cambio de estado */}
          <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col items-center gap-1">
                    <CircleHelp color="#fef08a" size={100} />
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <h1 className="text-3xl">
                      ¿Desea cambiar el estado de la venta?
                    </h1>
                  </ModalBody>
                  <ModalFooter>
                    <Button
                      color="danger"
                      variant="light"
                      onPress={() => {
                        onClose();
                        setSelectedEstado(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      color="warning"
                      variant="light"
                      onPress={() => {
                        handleToggleEstado(selectedVentaId!, selectedEstado!);
                        onClose();
                      }}
                    >
                      Confirmar
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>

          {/* Modal para mostrar errores */}
          <Modal isOpen={isOpenError} onOpenChange={onOpenChangeError}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col items-center gap-1">
                    <CircleX color="#894242" size={100} />
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <h1 className="text-3xl">Error</h1>
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

          {/* Modal para mostrar advertencias */}
          <Modal isOpen={isOpenWarning} onOpenChange={onOpenChangeWarning}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col items-center gap-1">
                    <CircleHelp color="gold" size={100} />
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <h1 className="text-3xl">Ups...</h1>
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

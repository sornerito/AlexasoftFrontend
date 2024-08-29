"use client";

// Importar módulos necesarios
import React, { useEffect, useRef, useState, ChangeEvent, KeyboardEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Toaster, toast } from "sonner";
import { CircleHelp, CircleX, Ellipsis, PlusIcon, MinusIcon, X } from "lucide-react";
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
  CircularProgress
} from "@nextui-org/react";

// Importar funciones de configuración
import { getWithAuth, postWithAuth, verificarAccesoPorPermiso } from "@/config/peticionesConfig";

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
        window.location.href = "../../../acceso/noAcceso"
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
    idColaborador: typeof window !== 'undefined' ? sessionStorage.getItem('idUsuario') : null
  });

  // Estados para listas de clientes, colaboradores y productos
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [idCliente, setIdCliente] = useState("");
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [idColaborador, setIdColaborador] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoSeleccionado[]>([]);

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
  const { isOpen: isOpenError, onOpen: onOpenError, onOpenChange: onOpenChangeError } = useDisclosure();
  const { isOpen: isProductosModalOpen, onOpen: onOpenProductosModal, onOpenChange: onOpenChangeProductosModal } = useDisclosure();

  // Router para navegación
  const router = useRouter();

  // Estado para indicar si se está cargando la información
  const [isLoading, setIsLoading] = useState(true);

  // Obtener clientes, colaboradores y productos al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchClientes(), fetchColaboradores(), fetchProductos()]);
      } catch (error) {
        console.error("Error al obtener datos:", error);
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
        console.error("Error al obtener clientes:", response.status);
        setMensajeError("Hubo un problema al obtener los clientes. Intenta recargar la página.");
        onOpenError();
      }
    } catch (error) {
      console.error("Error al obtener clientes:", error);
      setMensajeError("Hubo un problema al obtener los clientes. Intenta recargar la página.");
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
        console.error("Error al obtener colaboradores:", response.status);
        setMensajeError("Hubo un problema al obtener los colaboradores. Intenta recargar la página.");
        onOpenError();
      }
    } catch (error) {
      console.error("Error al obtener colaboradores:", error);
      setMensajeError("Hubo un problema al obtener los colaboradores. Intenta recargar la página.");
      onOpenError();
    }
  };

  // Función para obtener la lista de productos
  const fetchProductos = async () => {
    try {
      const response = await getWithAuth("http://localhost:8080/compras/productos");
      if (response.ok) {
        const data = await response.json();
        setProductos(data);
      } else {
        console.error("Error al obtener productos:", response.status);
        setMensajeError("Hubo un problema al obtener los productos. Intenta recargar la página.");
        onOpenError();
      }
    } catch (error) {
      console.error("Error al obtener productos:", error);
      setMensajeError("Hubo un problema al obtener los productos. Intenta recargar la página.");
      onOpenError();
    }
  };

  // Función para crear una nueva venta
  const crearVenta = async () => {
    try {
      const response = await postWithAuth("http://localhost:8080/venta", venta);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear la venta');
      }

      return await response.json();
    } catch (error) {
      console.error("Error al crear venta:", error);
      setMensajeError("Error al crear la venta. Inténtalo de nuevo.");
      onOpenError();
      throw error;
    }
  };

  // Función para crear los detalles de una venta
  const crearDetallesVenta = async (nuevaVenta: Event) => {
    try {
      const detalleVenta = {
        ventas: nuevaVenta,
        productosId: productosSeleccionados.map(item => item.producto.idProducto),
        precioUnitario: productosSeleccionados.map(item => item.producto.precio),
        cantidad: productosSeleccionados.map(item => item.cantidad)
      };

      console.log("Enviando detalle de venta:", detalleVenta);

      const response = await postWithAuth("http://localhost:8080/venta/detalles-productos", detalleVenta);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear los detalles de la venta');
      }

      const responseData = await response.json();
      console.log("Respuesta del servidor:", responseData);

    } catch (error) {
      console.error("Error al crear detalles de venta:", error);
      setMensajeError("Error al crear los detalles de la venta. Inténtalo de nuevo.");
      onOpenError();
      throw error;
    }
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async () => {
    try {
      const nuevaVenta = await crearVenta();
      await crearDetallesVenta(nuevaVenta);

      toast.success("Venta creada con éxito!");
      setTimeout(() => {
        router.push("/admin/ventas");
      }, 1000);
    } catch (error) {
      // El error ya ha sido manejado en crearVenta o crearDetallesVenta
    }
  };

  // Función para manejar cambios en los campos del formulario
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVenta({ ...venta, [name]: value });
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      [name]: validateField(name, value)
    }));
  };

  // Función para manejar cambios en el selector de cliente
  const handleDropdownChangeCliente = (value: any) => {
    setIdCliente(value.target.value)
    setVenta({ ...venta, "idCliente": value.target.value });
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      idCliente: validateField("idCliente", value.target.value)
    }));
  };

  // Función para manejar cambios en el selector de colaborador
  const handleDropdownChangeColaborador = (value: any) => {
    setIdColaborador(value.target.value)
    setVenta({ ...venta, "idColaborador": value.target.value });
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      idColaborador: validateField("idColaborador", value.target.value)
    }));
  };

  // Filtrar productos en tiempo real
  const productosFiltrados = productos.filter((producto) =>
    producto.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) && producto.estado === "Activo"
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

  // Agregar un producto a la lista de productos seleccionados
  const handleAgregarProducto = (producto: Producto) => {
    setProductosSeleccionados((prevProductos) => [
      ...prevProductos,
      { id: uuidv4(), producto, cantidad: 1 }
    ]);
    setVenta((prevVenta) => {
      const nuevoTotal = prevVenta.total + producto.precio;
      return {
        ...prevVenta,
        total: nuevoTotal
      };
    });
    setTextoInput("");
    setBusquedaProducto("");
  };

  // Eliminar un producto de la lista de productos seleccionados
  const handleEliminarProducto = (id: string) => {
    const productoAEliminar = productosSeleccionados.find(p => p.id === id);
    if (productoAEliminar) {
      setProductosSeleccionados((prevProductos) => prevProductos.filter(p => p.id !== id));
      setVenta((prevVenta) => {
        const nuevoTotal = prevVenta.total - (productoAEliminar.producto.precio * productoAEliminar.cantidad);
        return {
          ...prevVenta,
          total: nuevoTotal
        };
      });
    }
  };

  // Manejador del evento "keydown" en el input de búsqueda
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "Backspace" && !e.currentTarget.value &&
      productosSeleccionados.length > 0
    ) {
      e.preventDefault();
      handleEliminarProducto(
        productosSeleccionados[productosSeleccionados.length - 1].id
      );
    }
  };

  // Calcular el total con IVA
  const calcularTotalConIVA = () => {
    const totalSinIVA = venta.total;
    const ivaAmount = (totalSinIVA * venta.iva) / 100;
    return totalSinIVA + ivaAmount;
  };

  // Manejar la presentación del formulario
  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (productosSeleccionados.length === 0) {
      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        productos: "Debes agregar al menos un producto válido"
      }));
      return;
    } else {
      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        productos: ""
      }));
    }
    onOpen();
  };

  // Manejar la confirmación del envío del formulario
  const handleConfirmSubmit = () => {
    handleSubmit();
    onOpenChange();
  };

  // Validación en tiempo real
  const [validationErrors, setValidationErrors] = useState({
    total: "",
    idCliente: "",
    idColaborador: "",
    idProducto: "",
    productos: ""
  });

  // Función para validar un campo individual
  const validateField = (name: string, value: string | number) => {
    switch (name) {
      case "total":
        return /^[1-9]\d*$/.test(value.toString())
          ? ""
          : "El total debe ser un número positivo. Además no puede empezar con 0 o ser 0";
      case "idCliente":
        return value !== 0
          ? ""
          : "Debes seleccionar un cliente.";
      case "idColaborador":
        return value !== 0
          ? ""
          : "Debes seleccionar un colaborador.";
      default:
        return "";
    }
  };

  // Renderizar el componente
  return (
    <>
      {acceso ? (
        <div className="lg:mx-60">
          <h1 className={title()}>Crear Venta Producto</h1>
          <br /><br />
          {/* Mostrar spinner de carga si la información se está cargando */}
          {isLoading ? (
            <div className="flex justify-center text-center h-screen">
              <div className="text-center">
                <Spinner color="warning" size="lg" />
              </div>
            </div>
          ) : (
            // Mostrar formulario si la información se ha cargado
            <form onSubmit={handleFormSubmit}>
              <div className="grid gap-4">
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
                      <SelectItem key={cliente.idCliente} value={cliente.idCliente.toString()}>
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
                      <SelectItem key={colaborador.idColaborador} value={colaborador.idColaborador.toString()}>
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
                          acc[item.producto.nombre] = acc[item.producto.nombre] || { ...item, cantidad: 0 };
                          acc[item.producto.nombre].cantidad += item.cantidad;
                          return acc;
                        }, {} as Record<string, ProductoSeleccionado>)
                      )
                        .slice(0, 4)
                        .map((item) => (
                          <Chip
                            key={item.id}
                            variant="bordered"
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
                      className="absolute top-full left-0 w-full bg-white dark:bg-gray-800 rounded-md shadow-md z-10 max-h-40 overflow-y-auto"
                      style={{ backgroundColor: "#303030" }}
                    >
                      {productosFiltrados.map((producto) => (
                        <li
                          key={producto.idProducto}
                          className="px-4 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 flex justify-between"
                          onClick={() => handleAgregarProducto(producto)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAgregarProducto(producto);
                            }
                          }}
                          tabIndex={0}
                        >
                          <span>{producto.nombre}</span>
                          <span className="text-gray-500 text-sm">
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
                  value={venta?.total.toString() || ""}
                  onChange={handleChange}
                  required
                  onError={errores.total}
                  isInvalid={!!validationErrors.total}
                  errorMessage={validationErrors.total}
                />

                {/* Input para el total con IVA (deshabilitado) */}
                <Input
                  isDisabled
                  isRequired
                  name="totalConIVA"
                  label="Total con IVA"
                  type="number"
                  value={calcularTotalConIVA().toFixed(2)}
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
                  <Button className="bg-gradient-to-tr from-red-600 to-red-300 mr-2" type="button">
                    Cancelar
                  </Button>
                </Link>
                <Button className="bg-gradient-to-tr from-yellow-600 to-yellow-300" type="submit">
                  Enviar
                </Button>
              </div>
            </form>
          )}

          {/* Modal de confirmación */}
          <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col gap-1 items-center">
                    <CircleHelp color="#fef08a" size={100} />
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <h1 className=" text-3xl">¿Desea crear la venta?</h1>
                    <p>La venta se creará con la información proporcionada.</p>
                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                      Cancelar
                    </Button>
                    <Button
                      color="warning"
                      variant="light"
                      onPress={() => {
                        handleConfirmSubmit();
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
                  <ModalHeader className="flex flex-col gap-1 items-center">
                    <CircleX color="#894242" size={100} />
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <h1 className=" text-3xl">Error</h1>
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
          <Modal isOpen={isProductosModalOpen} onOpenChange={onOpenChangeProductosModal}>
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
                      {Object.values(productosSeleccionados.reduce((acc, item) => {
                        acc[item.producto.nombre] = acc[item.producto.nombre] || { ...item, cantidad: 0 };
                        acc[item.producto.nombre].cantidad += item.cantidad;
                        return acc;
                      }, {} as Record<string, ProductoSeleccionado>))
                        .filter(item => item.producto.nombre.toLowerCase().includes(busquedaModal.toLowerCase()))
                        .slice((paginaModal - 1) * 6, paginaModal * 6)
                        .map((item) => (
                          <li key={item.id} className="flex items-center justify-between mb-2">
                            <span>{item.producto.nombre} x {item.cantidad}</span>
                            <div className="flex">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="success"
                                onClick={() => handleAgregarProducto(item.producto)}
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
                    {busquedaModal !== "" && Object.values(productosSeleccionados).filter(item => item.producto.nombre.toLowerCase().includes(busquedaModal.toLowerCase())).length === 0 && (
                      <p>No se encontraron productos.</p>
                    )}
                    {/* Paginación */}
                    {Object.values(productosSeleccionados).filter(item => item.producto.nombre.toLowerCase().includes(busquedaModal.toLowerCase())).length > 6 && busquedaModal === "" && (
                      <div className="flex justify-center mt-4">
                        <Button
                          size="sm"
                          variant="light"
                          onClick={() => setPaginaModal(paginaModal - 1)}
                          isDisabled={paginaModal === 1}
                        >
                          Anterior
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          onClick={() => setPaginaModal(paginaModal + 1)}
                          isDisabled={paginaModal === Math.ceil(Object.values(productosSeleccionados).filter(item => item.producto.nombre.toLowerCase().includes(busquedaModal.toLowerCase())).length / 6)}
                        >
                          Siguiente
                        </Button>
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
        // Mostrar CircularProgress si no tiene acceso
        <CircularProgress color="warning" aria-label="Cargando..." />
      )}
    </>
  );
}
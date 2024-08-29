"use client";

// Importar módulos necesarios
import React, { useEffect, useState, useRef, ChangeEvent, KeyboardEvent, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Toaster } from "sonner";
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

// Componente principal: VentasPageEditar
export default function VentasPageEditar() {
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

  // Estados para listas de clientes, colaboradores, productos y productos seleccionados
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [idCliente, setIdCliente] = useState("");
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [idColaborador, setIdColaborador] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoSeleccionado[]>([]);
  const [totalSinIva, setTotalSinIva] = useState(0);

  // Estados para la búsqueda de productos
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [textoInput, setTextoInput] = useState("");

  // Estados para manejo de errores
  const [errores] = useState<any>({});
  const [mensajeError, setMensajeError] = useState("");

  // Estados para control de modales
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { isOpen: isOpenError, onOpen: onOpenError, onOpenChange: onOpenChangeError } = useDisclosure();
  const { isOpen: isProductosModalOpen, onOpen: onOpenProductosModal, onOpenChange: onOpenChangeProductosModal } = useDisclosure();

  // Router para navegación y parámetros de la URL
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { idVenta } = useParams();

  // Obtener clientes, colaboradores, productos y la venta al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([fetchClientes(), fetchColaboradores(), fetchProductos(), fetchVenta(parseInt(idVenta as string))]);
      } catch (error) {
        console.error("Error al obtener datos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [idVenta]);

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

  // Función para obtener la venta por ID
  const fetchVenta = async (id: number) => {
    try {
      const response = await getWithAuth(`http://localhost:8080/venta/detalles-productos/${id}`);
      if (response.ok) {
        const data = await response.json();
        setIdCliente(data.ventas.idCliente.toString());
        setIdColaborador(data.ventas.idColaborador.toString());

        // Convertir productos a ProductoSeleccionado
        const productosSeleccionadosData = data.productos.map((producto: Producto) => ({
          id: uuidv4(),
          producto,
          cantidad: 1
        }));
        setProductosSeleccionados(productosSeleccionadosData);

        // Calcular el total sin IVA
        setTotalSinIva(
          productosSeleccionadosData.reduce(
            (acc: number, item: ProductoSeleccionado) => acc + (item.producto.precio * item.cantidad),
            0
          )
        );
      } else {
        console.error("Error al obtener la venta:", response.status);
        setMensajeError("Hubo un problema al obtener la venta. Intenta recargar la página.");
        onOpenError();
      }
    } catch (error) {
      console.error("Error al obtener la venta:", error);
      setMensajeError("Hubo un problema al obtener la venta. Intenta recargar la página.");
      onOpenError();
    }
  };

  // Función para actualizar la venta
  const actualizarVenta = async (venta: any) => {
    try {
      const response = await postWithAuth(`http://localhost:8080/venta/detalles-productos/${idVenta}`, venta);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar la venta');
      }
      return await response.json();
    } catch (error) {
      console.error("Error al actualizar la venta:", error);
      setMensajeError("Error al actualizar la venta. Inténtalo de nuevo.");
      onOpenError();
      throw error;
    }
  };

  // Función para manejar cambios en el selector de cliente
  const handleDropdownChangeCliente = (value: any) => {
    setIdCliente(value.target.value);
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      idCliente: validateField("idCliente", value.target.value)
    }));
  };

  // Función para manejar cambios en el selector de colaborador
  const handleDropdownChangeColaborador = (value: any) => {
    setIdColaborador(value.target.value);
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
    setTextoInput(e.target.value);
    setBusquedaProducto(e.target.value);
  };

  // Agregar un producto a la venta
  const handleAgregarProducto = (producto: Producto) => {
    setProductosSeleccionados((prevProductos) => [
      ...prevProductos,
      { id: uuidv4(), producto, cantidad: 1 }
    ]);
    setTotalSinIva(totalSinIva + producto.precio);
    setTextoInput("");
    setBusquedaProducto("");
  };

  // Eliminar un producto de la venta
  const handleEliminarProducto = (id: string) => {
    const productoAEliminar = productosSeleccionados.find(p => p.id === id);
    if (productoAEliminar) {
      setProductosSeleccionados((prevProductos) => prevProductos.filter(p => p.id !== id));
      setTotalSinIva(totalSinIva - (productoAEliminar.producto.precio * productoAEliminar.cantidad));
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

  // Función para manejar el envío del formulario
  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Validación del formulario
    const errors = validateForm();
    setValidationErrors(errors);

    // Si no hay errores, muestra el modal de confirmación
    if (Object.values(errors).every((error) => error === "")) {
      onOpen();
    }
  };

  // Función para validar el formulario
  const validateForm = () => {
    const errors = {
      total: validateField("total", totalSinIva.toString()),
      idCliente: validateField("idCliente", idCliente),
      idColaborador: validateField("idColaborador", idColaborador)
    };
    return errors;
  };

  // Función para manejar la confirmación del envío del formulario
  const handleConfirmSubmit = () => {
    const total = productosSeleccionados.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);
    console.log(total);

    // Crear el objeto VentasConProductos con los datos necesarios
    const ventaActualizada: any = {
      ventas: {
        idVenta: parseInt(idVenta as string),
        idCliente: parseInt(idCliente),
        idColaborador: parseInt(idColaborador),
        total: total,
        iva: 19
      },
      productosId: productosSeleccionados.map(item => item.producto.idProducto),
      precioUnitario: productosSeleccionados.map(item => item.producto.precio),
      cantidad: productosSeleccionados.map(item => item.cantidad)
    };

    // Depurar el objeto `ventaActualizada` en la consola del navegador
    console.log("VentasPageEditar.handleConfirmSubmit: ", ventaActualizada);

    // Llamar a actualizarVenta
    actualizarVenta(ventaActualizada)
      .then(() => {
        // Manejar el éxito
        onOpenChange();
        router.push("/admin/ventas");
      })
      .catch(error => {
        // Manejar los errores
        console.error("Error al actualizar la venta: ", error);
        onOpenError();
      });
  };

  // Validación en tiempo real
  const [validationErrors, setValidationErrors] = useState({
    total: "",
    idCliente: "",
    idColaborador: ""
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
      {/* Verificar si tiene acceso */}
      {acceso ? (
        <div className="lg:mx-60">
          {/* Título */}
          <h1 className={title()}>Editar Venta Producto</h1>
          <br /><br />

          {/* Mostrar un spinner de carga si la información se está cargando */}
          {isLoading ? (
            <div className="flex justify-center text-center h-screen">
              <div className="text-center">
                <Spinner color="warning" size="lg" />
              </div>
            </div>
          ) : (
            // Mostrar el formulario si la información se ha cargado
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
                    isInvalid={!busquedaProducto && productosSeleccionados.length === 0}
                    errorMessage={
                      !busquedaProducto && productosSeleccionados.length === 0
                        ? "Debes agregar al menos un producto"
                        : ""
                    }
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
                  value={totalSinIva.toString() || ""}
                  required
                  onError={errores.total}
                  isInvalid={!!validationErrors.total}
                  errorMessage={validationErrors.total}
                />

                {/* Input para el IVA (deshabilitado) */}
                <Input
                  isDisabled
                  isRequired
                  name="iva"
                  label="IVA (19% SIEMPRE SE COBRARÁ ESE PORCENTAJE)"
                  type="number"
                  value={"19"}
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
                    <h1 className=" text-3xl">¿Desea editar la venta?</h1>
                    <p>La venta se editará con la información proporcionada.</p>
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
                      Editar
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
                    <ul>
                      {Object.values(productosSeleccionados.reduce((acc, item) => {
                        acc[item.producto.nombre] = acc[item.producto.nombre] || { ...item, cantidad: 0 };
                        acc[item.producto.nombre].cantidad += item.cantidad;
                        return acc;
                      }, {} as Record<string, ProductoSeleccionado>)).map((item) => (
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

          {/* Toaster para notificaciones */}
          <Toaster position="bottom-right" />
        </div>
      ) : (
        // Mostrar CircularProgress si no tiene acceso
        <CircularProgress color="warning" aria-label="Cargando..." />
      )}
    </>
  );
}
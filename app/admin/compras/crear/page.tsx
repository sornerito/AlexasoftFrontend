"use client";
import { title } from "@/components/primitives";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleHelp, CircleX, Ellipsis, X } from "lucide-react";
import { Toaster, toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
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
  CircularProgress,
} from "@nextui-org/react";
import {
  getWithAuth,
  postWithAuth,
  verificarAccesoPorPermiso,
} from "@/config/peticionesConfig";

// Definición del tipo Proveedor
interface Proveedor {
  idProveedor: number;
  nombre: string;
  estado: String;
}

// Definición del tipo Producto (Compras)
interface Producto {
  idMarca: any;
  idProducto: number;
  nombre: string;
  precio: number;
  estado: string;
  imagenes: string;
}

// Definición del tipo ProductoSeleccionado
interface ProductoSeleccionado {
  id: string;
  producto: Producto;
  cantidad: number;
  precioporunidad: number;
}

// Componente principal
export default function VentasPageCrear() {
  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Compras") == false) {
        window.location.href = "../../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Compras"));
    }
  }, []);

  const [compra, setCompra] = useState({
    idCompra: null,
    idProveedor: null,
    precioTotal: 0,
    fecha: new Date(),
    subTotal: 0,
    motivoAnular: null,
    precioPorUnidad: 0,
  });

  // Estados y Hooks
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [idProveedor, setIdProveedro] = React.useState("");

  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [productosSeleccionados, setProductosSeleccionados] = useState<
    ProductoSeleccionado[]
  >([]);
  const [errores] = useState<any>({});
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
  const [mensajeError, setMensajeError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [textoInput, setTextoInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const router = useRouter();

  // Efecto para obtener la lista de clientes y colaboradores al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchProveedor(), fetchProductos()]);
      } catch (error) {
        console.error("Error al obtener clientes o colaboradores:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch de clientes
  const fetchProveedor = async () => {
    try {
      const response = await getWithAuth(
        "http://localhost:8080/compras/proveedores"
      );
      if (response.ok) {
        const data = await response.json();
        setProveedores(data);
      } else {
        console.error("Error al obtener proveedores:", response.status);
        setMensajeError(
          "Hubo un problema al obtener los proveedores. Intenta recargar la página."
        );
        onOpenError();
      }
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
      setMensajeError(
        "Hubo un problema al obtener los Proveedores. Intenta recargar la página."
      );
      onOpenError();
    }
  };

  // Fetch de Productos
  const fetchProductos = async () => {
    try {
      const response = await getWithAuth(
        "http://localhost:8080/compras/productos"
      );
      if (response.ok) {
        const data = await response.json();
        setProductos(data);
      } else {
        console.error("Error al obtener colaboradores:", response.status);
        setMensajeError(
          "Hubo un problema al obtener los productos. Intenta recargar la página."
        );
        onOpenError();
      }
    } catch (error) {
      console.error("Error al obtener colaboradores:", error);
      setMensajeError(
        "Hubo un problema al obtener los productos. Intenta recargar la página."
      );
      onOpenError();
    }
  };

  // Función para enviar el formulario
  const crearCompra = async () => {
    try {
      const response = await postWithAuth("http://localhost:8080/compras", {
        ...compra,
        subtotal: compra.subTotal,
        precio: compra.precioTotal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear la compra");
      }

      const nuevaCompra = await response.json();
      return nuevaCompra;
    } catch (error) {
      console.error("Error al crear compra:", error);
      setMensajeError("Error al crear la compra. Inténtalo de nuevo.");
      onOpenError();
      throw error;
    }
  };

  const crearDetallesCompra = async (idCompra: number) => {
    try {
      const detalleCompra = {
        idCompra,
        unidades: productosSeleccionados.map((item) => item.cantidad),
        idProducto: productosSeleccionados.map(
          (item) => item.producto.idProducto
        ),
        precioporunidad: productosSeleccionados.map(
          (item) => item.precioporunidad
        ),
      };

      console.log("Enviando detalle de compra:", detalleCompra);

      const response = await postWithAuth(
        "http://localhost:8080/compras/detalle-producto-compra",
        detalleCompra
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Error al crear los detalles de la compra"
        );
      }

      const responseData = await response.json();
      console.log("Respuesta del servidor:", responseData);
    } catch (error) {
      console.error("Error al crear detalles de compra:", error);
      setMensajeError(
        "Error al crear los detalles de la Compra. Inténtalo de nuevo."
      );
      onOpenError();
      throw error;
    }
  };
  const handleSubmit = async () => {
    try {
      const nuevaCompra = await crearCompra();
      await crearDetallesCompra(nuevaCompra.idCompra);

      toast.success("Compra creada con éxito!");
      setTimeout(() => {
        router.push("/admin/compras");
      }, 1000);
    } catch (error) {
      // El error ya ha sido manejado en crearCompra o crearDetallesCompra
    }
  };

  // Función para manejar cambios en los selectores de Proveedor
  const handleDropdownChangeProveedor = (value: any) => {
    setIdProveedro(value.target.value);
    setCompra({ ...compra, idProveedor: value.target.value });
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      idProveedor: validateField("idProveedor", value.target.value),
    }));
  };

  // Filtrar productos en tiempo real
  const productosFiltrados = productos.filter(
    (producto) =>
      producto.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) &&
      producto.estado === "Activo"
  );

  // Manejar el input de búsqueda
  const handleBusquedaProductoChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const input = e.target.value;
    const letrasRegex = /^[a-zA-Z\s]*$/;
    if (letrasRegex.test(input)) {
      setTextoInput(input);
      setBusquedaProducto(input);
    }
  };

  // Agregar producto a la compra
  const handleAgregarProducto = (producto: Producto) => {
    const productoExistente = productosSeleccionados.find(
      (p) => p.producto.idProducto === producto.idProducto
    );

    if (productoExistente) {
      // Si el producto ya está en la lista, aumenta su cantidad
      handleCantidadChange(
        productoExistente.id,
        productoExistente.cantidad + 1
      );
    } else {
      // Si el producto es nuevo, agrégalo a la lista
      setProductosSeleccionados((prevProductos) => [
        ...prevProductos,
        { id: uuidv4(), producto, cantidad: 1, precioporunidad: 0 },
      ]);
    }

    setCompra((prevCompras) => ({
      ...prevCompras,
    }));
    setTextoInput("");
    setBusquedaProducto("");
  };

  // Eliminar producto de la compra
  const handleEliminarProducto = (id: string) => {
    const productoAEliminar = productosSeleccionados.find((p) => p.id === id);
    if (productoAEliminar) {
      setProductosSeleccionados((prevProductos) =>
        prevProductos.filter((p) => p.id !== id)
      );
      setCompra((prevCompras) => ({
        ...prevCompras,
      }));
    }
  };

  // Manejador del evento "keydown" en el input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

  // Calcular el subtotal
  const calcularSubtotal = (productos: ProductoSeleccionado[]) => {
    return productos.reduce(
      (acc, item) => acc + item.precioporunidad * item.cantidad,
      0
    );
  };

  // Calcular el IVA
  const calcularIva = (subtotal: number) => {
    return subtotal * 0.19;
  };

  // Manejar cambios en la cantidad del producto
  const handleCantidadChange = (id: string, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) {
      return;
    }

    setProductosSeleccionados((prevProductos) => {
      const productosActualizados = prevProductos.map((item) =>
        item.id === id ? { ...item, cantidad: nuevaCantidad } : item
      );

      // Recalcula el subtotal después de actualizar la cantidad
      const nuevoSubTotal = calcularSubtotal(productosActualizados);

      // Recalcula el precio total
      const nuevoPrecioTotal = nuevoSubTotal + calcularIva(nuevoSubTotal);

      setCompra((prevCompra) => ({
        ...prevCompra, // Mantén todas las propiedades anteriores de compra
        subTotal: nuevoSubTotal, // Solo actualiza el subtotal
        precioTotal: nuevoPrecioTotal, // Actualiza el precio total
      }));

      return productosActualizados;
    });
  };

  // Manejar cambios en el precio por unidad del producto
  const handlPrecioporunidadChange = (
    id: string,
    nuevaPrecioporunidad: number
  ) => {
    if (nuevaPrecioporunidad < 1) {
      return;
    }

    setProductosSeleccionados((prevProductos) => {
      const productosActualizados = prevProductos.map((item) =>
        item.id === id
          ? { ...item, precioporunidad: nuevaPrecioporunidad }
          : item
      );

      // Recalcula el subtotal después de actualizar el precio por unidad
      const nuevoSubTotal = calcularSubtotal(productosActualizados);

      // Recalcula el precio total
      const nuevoPrecioTotal = nuevoSubTotal + calcularIva(nuevoSubTotal);

      setCompra((prevCompra) => ({
        ...prevCompra,
        subTotal: nuevoSubTotal,
        precioTotal: nuevoPrecioTotal,
      }));

      return productosActualizados;
    });
  };

  // Función para manejar la presentación del formulario
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let isValid = true;
    const newValidationErrors = { ...validationErrors };
    productosSeleccionados.forEach((producto) => {
      const precioError = validatePrecioPorUnidad(producto.precioporunidad);
      const cantidadError = validateCantidad(producto.cantidad);

      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        [`precioporunidad-${producto.id}`]: precioError,
        [`cantidad-${producto.id}`]: cantidadError,
      }));

      if (precioError || cantidadError) {
        isValid = false;
      }
    });

    setValidationErrors(newValidationErrors);

    if (
      isValid &&
      productosSeleccionados.length > 0 &&
      compra.subTotal > 0 &&
      compra.precioTotal > 0
    ) {
      onOpen();
    } else {
      if (!isValid) {
        toast.error(
          "Por favor, completa los campos de precio y cantidad para todos los productos."
        );
      }
    }

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

    if (compra.subTotal <= 0) {
      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        subtotal:
          "El subtotal no puede ser igual o menor a 0. Por favor agregar el precio por unidad al producto",
      }));
      return;
    } else {
      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        subtotal: "",
      }));
    }
    if (compra.precioTotal <= 0) {
      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        precioTotal:
          "EL precio total no puede ser igual o menor a 0. Por favor agregar el precio por unidad al producto",
      }));
      return;
    } else {
      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        precioTotal: "",
      }));
    }
  };

  // Función para manejar la confirmación del envío del formulario
  const handleConfirmSubmit = () => {
    handleSubmit();
    onOpenChange();
  };

  // Validación en tiempo real
  const [validationErrors, setValidationErrors] = useState({
    idProveedor: "",
    precioTotal: "",
    subtotal: "",
    productos: "",
    precioporunidad: 0,
  });

  // Función para validar un campo individual
  const validateField = (name: string, value: string | number) => {
    switch (name) {
      case "precioTotal":
        if (!/^[1-9]\d*$/.test(value.toString())) {
          return "El precio total debe ser un número positivo. Además, no puede empezar con 0 o ser 0";
        } else if (Number(value) > 9000000) {
          return "El precio total no puede ser mayor a 9.000.000";
        } else {
          return "";
        }
      case "idProveedor":
        return value !== 0 ? "" : "Debes seleccionar un proveedor.";
      case "subtotal":
        if (!/^[1-9]\d*$/.test(value.toString())) {
          return "El subtotal no puede empezar con 0 o ser 0";
        } else {
          return "";
        }
      case "precioporunidad":
        if (!/^[1-9]\d*$/.test(value.toString())) {
          return "El precio por unidad  debe ser un número positivo. Además, no puede empezar con 0 o ser 0";
        } else {
          return "";
        }
      default:
        return "";
    }
  };

  const validatePrecioPorUnidad = (precio: number): string | null => {
    if (precio <= 0) {
      return "El precio por unidad debe ser mayor que 0.";
    }
    return null;
  };

  const validateCantidad = (cantidad: number): string | null => {
    if (cantidad < 1) {
      return "La cantidad debe ser al menos 1.";
    }
    return null;
  };

  const handlePrecioporunidadChange = (id: number, value: number) => {
    const error = validatePrecioPorUnidad(value);
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      [`precioporunidad-${id}`]: error,
    }));
    // Aquí actualiza el estado o haz lo que necesites con el valor
  };

  const handleCantidadChange1 = (id: number, value: number) => {
    const error = validateCantidad(value);
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      [`cantidad-${id}`]: error,
    }));
    // Aquí actualiza el estado o haz lo que necesites con el valor
  };

  const [isLoading, setIsLoading] = useState(true);

  // Manejar cambio de el campo de busqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Función formatear el total de string a número con formato de moneda
  const formatCurrency = (
    valor: string | number,
    currencyCode: string = "COP"
  ) => {
    let valorString = valor.toString();
    const valorNumerico = parseFloat(
      valorString.replace(/[^\d.,]/g, "").replace(",", ".")
    );

    if (isNaN(valorNumerico)) {
      console.error("Error al convertir el valor a número:", valorString);
      return "N/A";
    }
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      notation: "standard",
    }).format(valorNumerico);
  };
  const formattedSubTotal = formatCurrency(compra?.subTotal || 0);
  const formattedTotal = formatCurrency(compra?.precioTotal || 0);

  // Retorno del componente
  return (
    <>
      {acceso ? (
        <div className="container">
          <h1 className={title()}>Crear Compra de Productos</h1>
          <br />
          <br />
          {isLoading ? (
            <div className="flex justify-center h-screen text-center">
              <div className="text-center">
                <Spinner color="warning" size="lg" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  isRequired
                  name="idProveedor"
                  label="Proveedor"
                  selectedKeys={[idProveedor]}
                  onChange={handleDropdownChangeProveedor}
                  required
                  onError={errores.idProveedor}
                  isInvalid={!!validationErrors.idProveedor}
                  errorMessage={validationErrors.idProveedor}
                >
                  {proveedores
                    .filter((proveedor) => proveedor.estado === "Activo")
                    .map((proveedor) => (
                      <SelectItem
                        key={proveedor.idProveedor}
                        value={proveedor.idProveedor.toString()}
                      >
                        {proveedor.nombre}
                      </SelectItem>
                    ))}
                </Select>
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
                    startContent={Object.values(
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
                        <Chip key={item.id} color="default" className="mr-2">
                          {item.producto.nombre} x {item.cantidad}
                        </Chip>
                      ))}
                    endContent={
                      <>
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
                      style={{ backgroundColor: "#303030", zIndex: 1000 }}
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

                <Input
                  isRequired
                  name="subTotal"
                  label="Subtotal"
                  type="text"
                  value={formattedSubTotal}
                  readOnly
                  onError={errores.subtotal}
                  isInvalid={!!validationErrors.subtotal}
                  errorMessage={validationErrors.subtotal}
                />
                <Input
                  isRequired
                  name="precioTotal"
                  label="Precio Total"
                  type="text"
                  value={formattedTotal}
                  readOnly
                  onError={errores.precioTotal}
                  isInvalid={!!validationErrors.precioTotal}
                  errorMessage={validationErrors.precioTotal}
                />
              </div>
              <div className="flex justify-end mt-4">
                <Link href="/admin/compras">
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
          {/* Modales de confirmación y error */}
          <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col items-center gap-1">
                    <CircleHelp color="#fef08a" size={100} />
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <h1 className="text-3xl ">¿Desea crear la Compra?</h1>
                    <p>La compra se creará con la información proporcionada.</p>
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
            size="xl"
          >
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader>Productos Seleccionados</ModalHeader>
                  <ModalBody>
                    {/* Input para buscar productos */}
                    <Input
                      type="text"
                      placeholder="Buscar producto..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="mb-4"
                    />
                    <ul className="overflow-y-auto max-h-40">
                      {/* Agrupar y filtrar productos por nombre */}
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
                            .includes(searchTerm.toLowerCase())
                        )
                        .map((item) => (
                          <li
                            key={item.id}
                            className="flex items-center justify-between mb-3"
                          >
                            <span className="flex-1 text-center">
                              {item.producto.nombre}
                            </span>
                            <div className="flex-1 text-center">
                              <Input
                                name="precio por unidad"
                                label="Precio por Unidad"
                                type="number"
                                required
                                value={item.precioporunidad.toString()}
                                onChange={(e) =>
                                  handlPrecioporunidadChange(
                                    item.id,
                                    parseInt(e.target.value)
                                  )
                                }
                                onError={errores.precioporunidad}
                                isInvalid={!!validationErrors.precioporunidad}
                                errorMessage={validationErrors.precioporunidad}
                                className="w-40 mx-auto"
                              />
                            </div>
                            <div className="flex-1 text-center">
                              <Input
                                name="cantidad"
                                label="Cantidad"
                                type="number"
                                min={1}
                                value={item.cantidad.toString()}
                                onChange={(e) =>
                                  handleCantidadChange(
                                    item.id,
                                    parseInt(e.target.value)
                                  )
                                }
                                className="w-20 mx-auto"
                              />
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

          <Toaster position="bottom-right" />
        </div>
      ) : (
        <CircularProgress color="warning" aria-label="Cargando..." />
      )}
    </>
  );
}

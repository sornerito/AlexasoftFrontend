"use client";

// Importar módulos necesarios
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  PlusIcon,
  MinusIcon,
  TrashIcon,
  XCircle,
  ShoppingCart,
  ArrowUpCircle,
} from "lucide-react";
import { title } from "@/components/primitives";
import { Toaster, toast } from "sonner";

// Importar funciones de configuración
import {
  getWithAuth,
  postWithAuth,
  verificarAccesoPorPermiso,
} from "@/config/peticionesConfig";

// Importar componentes de NextUI
import {
  Card,
  CardBody,
  Button,
  Input,
  Divider,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
  Image,
  Pagination,
} from "@nextui-org/react";

// Definición de interfaces para tipos de datos
interface Producto {
  idProducto: string;
  idMarca: string;
  nombre: string;
  precio: string;
  imagenes: string;
  unidades: number;
  estado: string;
}

interface CarritoItem extends Producto {
  cantidad: number;
  precioUnitario: number;
}

interface VentasConProductos {
  ventas: {
    idVenta?: number;
    [key: string]: any;
  };
  productosId: number[];
  precioUnitario: number[];
  cantidad: number[];
}

// Componente para el carrito de compras
export default function Carrito() {
  // Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Carrito de compras") == false) {
        window.location.href = "../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Carrito de compras"));
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
    idCliente:
      typeof window !== "undefined"
        ? sessionStorage.getItem("idUsuario")
        : null,
    idColaborador: 1,
  });

  // Estados para el carrito de compras
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [total, setTotal] = useState(0);

  // Estados para control de la interfaz
  const [showCarritoModal, setShowCarritoModal] = useState(false);
  const carritoRef = useRef<HTMLDivElement>(null);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Estado para manejo de errores
  const [mensajeError, setMensajeError] = useState("");

  // Estados para control de modales
  const {
    isOpen: isOpenConfirm,
    onOpen: onOpenConfirm,
    onClose: onCloseConfirm,
    onOpenChange: onOpenChangeConfirm,
  } = useDisclosure();
  const {
    isOpen: isErrorOpen,
    onOpen: onOpenError,
    onClose: onCloseError,
  } = useDisclosure();

  // Estados para indicar la carga de datos
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingVenta, setIsLoadingVenta] = useState(false);

  // Estado para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const productosPorPagina = 9;

  // Cargar productos al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseProductos = await getWithAuth(
          "http://192.168.56.1:8080/compras/productos"
        );
        if (responseProductos.ok) {
          const dataProductos = await responseProductos.json();

          // Formatear los productos a un formato compatible con el estado
          const productos: Producto[] = dataProductos.map((item: any) => ({
            idProducto: item.idProducto,
            idMarca: item.idMarca,
            nombre: item.nombre,
            precio: item.precio,
            imagenes:
              item.imagenes ||
              "https://prodjmedia.com/wp-content/uploads/2019/05/prodjmedia-agotado-web2.png",
            unidades: item.unidades,
            estado: item.estado,
          }));
          setProductos(productos);
        } else {
          // Si alguna petición falló
          setMensajeError(
            "Error al obtener información. Intenta recargar la página."
          );
          onOpenError();
        }
      } catch (error) {
        setMensajeError("Error al cargar los datos.");
        onOpenError();
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Función para agregar un producto al carrito
  const addToCarrito = (producto: Producto) => {
    // Verifica si el producto está desactivado
    if (producto.estado === "Desactivado") {
      return; // No agregues productos desactivados
    }

    // Verifica la cantidad antes de agregar
    if (producto.unidades === 0) {
      toast.info("El producto está agotado.");
      return;
    }

    const existingItem = carrito.find(
      (item) => item.idProducto === producto.idProducto
    );

    if (existingItem) {
      setCarrito((prevCarrito) =>
        prevCarrito.map((item) =>
          item.idProducto === producto.idProducto
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      setCarrito((prevCarrito) => [
        ...prevCarrito,
        {
          ...producto,
          cantidad: 1,
          precioUnitario: parseFloat(producto.precio),
        },
      ]);
    }
  };

  // Función para eliminar un producto del carrito
  const removeDelCarrito = (idProducto: string) => {
    setCarrito((prevCarrito) =>
      prevCarrito.filter((item) => item.idProducto !== idProducto)
    );
  };

  // Función para actualizar la cantidad de un producto en el carrito
  const actualizarCantidad = (idProducto: string, newQuantity: number) => {
    setCarrito((prevCarrito) =>
      prevCarrito.map((item) =>
        item.idProducto === idProducto
          ? { ...item, cantidad: newQuantity }
          : item
      )
    );
  };

  // Función para actualizar el total del carrito
  useEffect(() => {
    const total = carrito.reduce(
      (acc, item) => acc + item.precioUnitario * item.cantidad,
      0
    );
    setTotal(total);
    setVenta((prev) => ({ ...prev, total }));
  }, [carrito]);

  // Función para abrir el modal del carrito
  const openCarritoModal = () => {
    setShowCarritoModal(true);
  };

  // Función para cerrar el modal del carrito
  const closeCarritoModal = () => {
    setShowCarritoModal(false);
  };

  // Filtrado de productos por nombre
  const productosFiltrados = useMemo(() => {
    return productos.filter(
      (producto) =>
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
        producto.estado !== "Desactivado"
    );
  }, [productos, searchTerm]);

  // Calcular el índice inicial y final de los productos para la página actual
  const indexOfLastProducto = currentPage * productosPorPagina;
  const indexOfFirstProducto = indexOfLastProducto - productosPorPagina;
  const productosActuales = productosFiltrados.slice(
    indexOfFirstProducto,
    indexOfLastProducto
  );

  // Función para cambiar la página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Función para formatear el total a moneda
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

  // Función para calcular el IVA
  const calcularIVA = (valor: number) => {
    return valor * 0.19;
  };

  // Función para manejar la confirmación del envío
  const handleConfirmSubmit = async () => {
    const iva = calcularIVA(total);
    const totalConIVA = total + iva;

    // Ahora el total es correcto (con el IVA)
    setVenta((prevVenta) => ({ ...prevVenta, total: totalConIVA }));
    try {
      setIsLoadingVenta(true);

      const nuevaVenta = await crearVenta();
      await crearDetallesVenta(nuevaVenta);
      onCloseConfirm();
      setCarrito([]);

      toast.success("¡Venta creada correctamente!");
    } catch (error) {
      toast.error("Error al crear la venta: " + (error as Error).message);
    } finally {
      setIsLoadingVenta(false);
    }
  };

  // Función para enviar la venta
  const crearVenta = async () => {
    try {
      const response = await postWithAuth("http://192.168.56.1:8080/venta", venta);

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

  // Función para enviar los detalles de la venta
  const crearDetallesVenta = async (nuevaVenta: any) => {
    const iva = calcularIVA(total);
    const totalConIVA = total + iva;
    try {
      const ventasConProductos: VentasConProductos = {
        ventas: {
          ...nuevaVenta,
          total: totalConIVA,
          iva: 19,
        },
        productosId: carrito
          .filter((item) => item.cantidad > 0)
          .map((item) => parseInt(item.idProducto)),
        precioUnitario: carrito
          .filter((item) => item.cantidad > 0)
          .map((item) => item.precioUnitario),
        cantidad: carrito
          .filter((item) => item.cantidad > 0)
          .map((item) => item.cantidad),
      };

      const response = await postWithAuth(
        "http://192.168.56.1:8080/venta/detalles-productos",
        ventasConProductos
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Error al crear los detalles de la venta"
        );
      }
    } catch (error) {
      setMensajeError(
        "Error al crear los detalles de la venta. Inténtalo de nuevo."
      );
      onOpenError();
      throw error;
    }
  };

  // Componente para el formulario de envío del pedido
  const FormularioEnvio = () => {
    const iva = calcularIVA(total);
    const totalConIVA = total + iva;

    const handleSubmit = () => {
      onOpenConfirm();
    };

    return (
      <div className="flex flex-col gap-2 p-4 rounded-lg shadow-md">
        <h2 className="mb-4 text-lg font-bold">Resumen del Pedido</h2>
        <div className="flex justify-between mb-2">
          <div className="font-bold">Total:</div>
          <div className="font-bold">{formatCurrency(total)}</div>
        </div>
        <div className="flex justify-between mb-2">
          <div className="font-bold">IVA (19%):</div>
          <div className="font-bold">{formatCurrency(iva)}</div>
        </div>
        <div className="flex justify-between mb-2">
          <div className="font-bold">Total con IVA:</div>
          <div className="font-bold">{formatCurrency(totalConIVA)}</div>
        </div>
        <Button
          className="rounded-lg bg-gradient-to-tr from-yellow-600 to-yellow-300"
          onClick={() => setShowCartPreview(true)}
        >
          Ver Carrito
        </Button>
        <Button
          className="rounded-lg bg-gradient-to-tr from-gray-600 to-gray-300"
          disabled={carrito.length === 0}
          onClick={handleSubmit}
        >
          Enviar Pedido
        </Button>
        <p className="mt-4 text-center text-red-600">⚠ LEER ESTO ⚠</p>
        <p className="text-justify text-gray-600">
          Este será un pedido que será confirmado por el área encargada. No es
          una compra directa para pago.
        </p>
      </div>
    );
  };

  // Componente para la vista previa del carrito
  const CarritoPreview = () => {
    return (
      <div
        className="fixed z-50 p-4 rounded-lg shadow-md top-30 right-10 bg-gradient-to-tr from-yellow-600 to-yellow-300"
        style={{ width: "300px" }}
      >
        <div className="flex items-center justify-between mb-2">
          <ShoppingCart className="text-gray-600" size={20} />
          <button
            onClick={() => setShowCartPreview(false)}
            className="text-gray-600 hover:text-gray-800"
          >
            <XCircle size={16} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-48">
          {carrito.length === 0 ? (
            <div className="text-center text-gray-500">
              Tu carrito está vacío.
            </div>
          ) : (
            carrito.map((item) => (
              <div
                key={item.idProducto}
                className="flex items-center justify-between mb-2"
              >
                <div className="font-medium text-gray-700">{item.nombre}</div>
                <div className="text-gray-500">Cantidad: {item.cantidad}</div>
              </div>
            ))
          )}
        </div>
        <div className="mt-2">
          {carrito.length > 0 && (
            <Button
              className="rounded-lg bg-gradient-to-tr from-gray-600 to-gray-300"
              onPress={() => openCarritoModal()}
            >
              Ver Carrito Completo
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Función para scroll hacia arriba
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Retorno del componente
  return (
    <>
      {acceso ? (
        <div className="flex flex-col min-h-screen">
          <Toaster position="bottom-right" />
          {/* Modal de error */}
          <Modal isOpen={isErrorOpen} onOpenChange={onCloseError}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col items-center gap-1">
                    <XCircle color="#894242" size={100} />
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

          {/* Barra de búsqueda */}
          <h1 className={title()}>Carrito de Compras</h1>
          <Toaster position="bottom-right" />
          <div className="flex flex-col items-start px-4 py-2 sm:flex-row sm:items-center">
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
          </div>

          {/* Lista de productos y Resumen del Pedido */}
          <div className="flex flex-col gap-4 px-4 py-2 md:flex-row">
            {/* Cards de productos */}
            <div
              className="flex flex-wrap gap-4 flex-grow- min-h-[calc(100vh - 100px)]"
              style={{ width: "100%", height: "100%" }}
            >
              {isLoading ? (
                <div className="flex justify-center h-screen text-center">
                  <div className="text-center">
                    <Spinner color="warning" size="lg" />
                  </div>
                </div>
              ) : (
                productosActuales.map((producto) => (
                  <div
                    key={producto.idProducto}
                    className="w-full md:w-1/4 lg:w-1/4"
                  >
                    <Card className="h-full transition-transform duration-100 ease-in-out shadow-md hover:scale-105">
                      <Image
                        src={producto.imagenes}
                        alt={producto.nombre}
                        className="rounded-t-lg"
                        width="100%"
                        height={200}
                      />
                      <CardBody className="flex flex-col p-4 space-y-2">
                        <div className="font-bold">{producto.nombre}</div>
                        <div className="text-gray-500">
                          {formatCurrency(producto.precio)}
                        </div>
                        {carrito.find(
                          (item) => item.idProducto === producto.idProducto
                        )?.cantidad ?? 0 > 0 ? (
                          <div className="flex items-center space-x-2">
                            <Button
                              className="bg-gradient-to-tr from-gray-600 to-gray-300"
                              isIconOnly
                              onPress={() => {
                                const itemCantidad = carrito.find(
                                  (item) =>
                                    item.idProducto === producto.idProducto
                                )?.cantidad;
                                if (itemCantidad !== undefined) {
                                  actualizarCantidad(
                                    producto.idProducto,
                                    itemCantidad + 1
                                  );
                                }
                              }}
                              disabled={producto.unidades >= 10}
                            >
                              <PlusIcon />
                            </Button>
                            <div className="font-bold">
                              {
                                carrito.find(
                                  (item) =>
                                    item.idProducto === producto.idProducto
                                )?.cantidad
                              }
                            </div>
                            <Button
                              className="bg-gradient-to-tr from-gray-600 to-gray-300"
                              isIconOnly
                              onPress={() => {
                                const itemCantidad = carrito.find(
                                  (item) =>
                                    item.idProducto === producto.idProducto
                                )?.cantidad;
                                if (
                                  itemCantidad !== undefined &&
                                  itemCantidad > 0
                                ) {
                                  actualizarCantidad(
                                    producto.idProducto,
                                    itemCantidad - 1
                                  );
                                }
                              }}
                              disabled={producto.unidades <= 0}
                            >
                              <MinusIcon />
                            </Button>
                            <Button
                              className="bg-gradient-to-tr from-yellow-600 to-yellow-300"
                              isIconOnly
                              onPress={() =>
                                removeDelCarrito(producto.idProducto)
                              }
                            >
                              <TrashIcon />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            className="rounded-lg bg-gradient-to-tr from-gray-600 to-gray-300"
                            onPress={() => addToCarrito(producto)}
                            disabled={carrito.length >= 100}
                          >
                            <PlusIcon className="mr-2" />
                            Agregar al carrito
                          </Button>
                        )}
                      </CardBody>
                    </Card>
                  </div>
                ))
              )}
            </div>

            {/* Resumen del Pedido se mantiene como antes */}
            <FormularioEnvio />
          </div>

          {/* Paginación */}
          <div className="flex justify-center mt-4">
            <Pagination
              total={Math.ceil(productosFiltrados.length / productosPorPagina)}
              initialPage={1}
              onChange={handlePageChange}
              color="warning"
              showControls
            />
          </div>

          {/* Modal del carrito */}
          <Modal
            isOpen={showCarritoModal}
            onClose={closeCarritoModal}
            aria-label="Cart"
          >
            <ModalContent className="max-w-screen-lg">
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col items-center pb-4 border-b border-gray-200">
                    <h1 className="mt-2 text-3xl font-semibold">
                      Carrito de Compras
                    </h1>
                    <div className="text-gray-500">
                      Productos:{" "}
                      {carrito.filter((item) => item.cantidad > 0).length}
                    </div>
                  </ModalHeader>
                  <ModalBody className="p-6 overflow-y-auto max-h-96">
                    {carrito.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="text-gray-500">
                          Tu carrito está vacío.
                        </div>{" "}
                        <br /> <br />
                        <Button
                          className="bg-gradient-to-tr from-gray-600 to-gray-300"
                          onPress={() => setShowCarritoModal(false)}
                        >
                          {" "}
                          Volver a la tienda
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div ref={carritoRef}>
                          {carrito.map((item) =>
                            item.cantidad > 0 ? (
                              <Card key={item.idProducto} className="mb-4">
                                <CardBody className="flex flex-row items-center justify-between">
                                  <div className="flex items-center">
                                    <Image
                                      src={item.imagenes}
                                      alt={item.nombre}
                                      className="rounded-full"
                                      width={50}
                                      height={50}
                                    />
                                    <div className="ml-4">
                                      <div className="font-bold">
                                        {item.nombre}
                                      </div>
                                      <div className="text-gray-500">
                                        {formatCurrency(item.precioUnitario)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      className="bg-gradient-to-tr from-gray-600 to-gray-300"
                                      isIconOnly
                                      onPress={() =>
                                        actualizarCantidad(
                                          item.idProducto,
                                          item.cantidad + 1
                                        )
                                      }
                                      disabled={item.cantidad >= 10}
                                    >
                                      <PlusIcon />
                                    </Button>
                                    <div className="font-bold">
                                      {item.cantidad}
                                    </div>
                                    <Button
                                      className="bg-gradient-to-tr from-gray-600 to-gray-300"
                                      isIconOnly
                                      onPress={() =>
                                        actualizarCantidad(
                                          item.idProducto,
                                          item.cantidad - 1
                                        )
                                      }
                                      disabled={item.cantidad <= 1}
                                    >
                                      <MinusIcon />
                                    </Button>
                                    <Button
                                      className="bg-gradient-to-tr from-yellow-600 to-yellow-300"
                                      isIconOnly
                                      onPress={() =>
                                        removeDelCarrito(item.idProducto)
                                      }
                                    >
                                      <TrashIcon />
                                    </Button>
                                  </div>
                                </CardBody>
                              </Card>
                            ) : null
                          )}
                        </div>
                        <Divider className="my-4" />
                        <div className="flex items-center justify-between">
                          <div className="font-bold">Total:</div>
                          <div className="font-bold">
                            {formatCurrency(total)}
                          </div>
                        </div>
                      </>
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

          {/* Modal de confirmación */}
          <Modal
            isOpen={isOpenConfirm}
            onClose={onCloseConfirm}
            onOpenChange={onOpenChangeConfirm}
          >
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col items-center gap-1">
                    <h1 className="text-2xl font-bold">Confirmar Pedido</h1>
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <p>¿Estás seguro de que deseas enviar este pedido?</p>
                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                      Cancelar
                    </Button>
                    <Button
                      color="warning"
                      variant="light"
                      onPress={handleConfirmSubmit}
                      isLoading={isLoadingVenta}
                    >
                      Confirmar
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>

          {showCartPreview && <CarritoPreview />}

          {/* Botón para subir al inicio */}
          <Button
            className="fixed rounded-lg shadow-md bottom-10 right-10 bg-gradient-to-tr from-red-600 to-orange-300"
            isIconOnly
            onClick={scrollToTop}
          >
            <ArrowUpCircle size={30} />
          </Button>
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

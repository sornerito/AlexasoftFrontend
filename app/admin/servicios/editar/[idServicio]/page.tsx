"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Input,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Table,
  TableColumn,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  Select,
  SelectItem,
  CircularProgress,
  Divider,
} from "@nextui-org/react";
import { CircleHelp, CircleX, Link, PlusIcon } from "lucide-react";
import {
  getWithAuth,
  postWithAuth,
  verificarAccesoPorPermiso,
} from "@/config/peticionesConfig";
import {
  validarCampoString,
  validarDescripcionModal,
  validarTiempoModal,
  validarCantidadModal,
} from "@/config/validaciones2";
import React from "react";

// Interfaces de datos
interface Servicio {
  idServicio: string;
  nombre: string;
  descripcion: string;
  tiempoMinutos: string;
  estado: string;
  imagen: string;
}

interface Producto {
  idProducto: number;
  nombre: string;
  marca: number;
  precio: string;
  unidades: string;
  estado: string;
  idcategoriaproducto: number;
  unidadMedida: string;
}

interface ProductoSeleccionado extends Producto {
  idProducto: number;
  cantidad: number;
  unidadMedida: string;
}

export default function EditarServicioPage() {
  const [acceso, setAcceso] = useState<boolean>(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isOpenError,
    onOpen: onOpenError,
    onClose: onCloseError,
  } = useDisclosure();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [mensajeError, setMensajeError] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState<
    ProductoSeleccionado[]
  >([]);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tiempoMinutos, setTiempoMinutos] = useState("");
  const [estado, setEstado] = useState("Activo");
  const [imagen, setImagen] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState<number>(0);
  const [unidadMedida, setUnidadMedida] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Número de productos por página

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = productosSeleccionados.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(productosSeleccionados.length / itemsPerPage);
  const [nombreError, setNombreError] = useState("");
  const [descripcionError, setDescripcionError] = useState("");
  const [tiempoMinutosError, setTiempoMinutosError] = useState("");
  const [cantidadError, setCantidadError] = useState("");

  const [isFormValid, setIsFormValid] = useState(false);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const unidadesMedida = [
    { key: "ml", label: "ml" },
    { key: "g", label: "g" },
  ];

  const router = useRouter();
  const { idServicio } = useParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Servicios") === false) {
        window.location.href = "../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Servicios"));
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          fetchProductos(),
          fetchServicio(idServicio as string),
        ]);
      } catch (error) {
        console.error("Error al obtener datos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [idServicio]);

  const fetchServicio = async (idServicio: string) => {
    try {
      const response = await getWithAuth(
        `http://localhost:8080/servicio/${idServicio}`
      );
      if (response.ok) {
        const data = await response.json();
        setNombre(data.servicios.nombre);
        setDescripcion(data.servicios.descripcion);
        setTiempoMinutos(data.servicios.tiempoMinutos);
        setImagen(data.servicios.imagen);
        setEstado(data.estado);
        console.log(data);
        // Precargar los productos seleccionados
        setProductosSeleccionados(
          data.productos.map((producto: any) => ({
            idProducto: producto.idProducto,
            nombre: producto.nombre,
            cantidad: producto.cantidad,
            unidadMedida: producto.unidadMedida,
          }))
        );
      } else {
        const errorData = await response.json();
        setMensajeError(
          errorData.error || "Hubo un problema al obtener el servicio."
        );
        onOpenError();
      }
    } catch (error) {
      setMensajeError("Error en la comunicación con el servidor");
      onOpenError();
    }
    setIsLoading(false);
  };

  const fetchProductos = async () => {
    try {
      const response = await getWithAuth(
        "http://localhost:8080/compras/productos"
      );
      if (response.ok) {
        const data = await response.json();
        setProductos(data);
      } else {
        const errorData = await response.json();
        setMensajeError(
          errorData.error || "Hubo un problema al obtener los productos."
        );
        onOpenError();
      }
    } catch (error) {
      setMensajeError("Error en la comunicación con el servidor");
      onOpenError();
    }
  };

  useEffect(() => {
    validarNombre(nombre);
    validarDescripcion(descripcion);
    validarTiempo(tiempoMinutos);
    validarCantidad(cantidad, unidadMedida);
    validarImagenes(imagen);

    // Si no hay errores, habilitar el botón de Guardar
    setIsFormValid(
      !nombreError && !descripcionError && !tiempoMinutosError && !cantidadError
    );
  }, [
    nombre,
    descripcion,
    tiempoMinutos,
    cantidad,
    nombreError,
    descripcionError,
    tiempoMinutosError,
    cantidadError,
  ]);

  const agregarProducto = () => {
    const error = validarCantidad(cantidad, unidadMedida);

    if (error) {
      setCantidadError(error); // Show the validation error message
      return; // Stop execution if there is an error
    }

    if (productoSeleccionado && cantidad > 0 && unidadMedida) {
      // Asegurarse de no duplicar productos seleccionados
      const productoExiste = productosSeleccionados.find(
        (p) => p.idProducto === productoSeleccionado.idProducto
      );

      if (productoExiste) {
        setMensajeError("El producto ya ha sido agregado.");
        onOpenError();
        return;
      }

      // Mantener los productos ya seleccionados
      setProductosSeleccionados((prevProductosSeleccionados) => [
        ...prevProductosSeleccionados,
        { ...productoSeleccionado, cantidad, unidadMedida },
      ]);
      setProductoSeleccionado(null);
      setCantidad(0);
      setUnidadMedida("");
      setCantidadError("");
    } else {
      setMensajeError(
        "Seleccione un producto y complete todos los campos necesarios."
      );
      onOpenError();
    }
  };

  const eliminarProducto = (index: number) => {
    setProductosSeleccionados(
      productosSeleccionados.filter((_, i) => i !== index)
    );
  };

  const confirmarActualizacion = () => {
    setIsConfirmModalOpen(true); // Abrir el modal de confirmación
  };

  const actualizarServicio = async () => {
    if (isFormValid) {
      try {
        const servicioActualizado = {
          idServicio: idServicio,
          nombre,
          descripcion,
          tiempoMinutos,
          estado: "Activo",
          imagen,
        };

        const productosId = productosSeleccionados.map(
          (producto) => producto.idProducto
        );
        const cantidad = productosSeleccionados.map(
          (producto) => producto.cantidad
        );
        const unidadMedida = productosSeleccionados.map(
          (producto) => producto.unidadMedida
        );

        const response = await postWithAuth(
          `http://localhost:8080/servicio/${idServicio}`,
          {
            servicio: servicioActualizado,
            productosId,
            cantidad,
            unidadMedida,
          }
        );

        if (response.ok) {
          setIsConfirmModalOpen(false); // Cerrar el modal
          router.push("/admin/servicios");
        } else {
          const errorData = await response.json();
          setMensajeError(
            errorData.message || "Error al actualizar el servicio"
          );
          onOpenError();
        }
      } catch (error) {
        setMensajeError("Error en la comunicación con el servidor");
        onOpenError();
      }
    }
  };

  const cerrarConfirmacion = () => {
    setIsConfirmModalOpen(false); // Cerrar el modal de confirmación
  };

  const caracteresValidos = /^[a-zA-Z0-9\s]*$/;

  const validarNombre = (value: string) => {
    if (!caracteresValidos.test(nombre)) {
      return "El nombre no puede contener caracteres especiales.";
    } else if (!value) {
      setNombreError("El nombre no puede estar vacío.");
    } else if (value.length < 5) {
      setNombreError("El nombre debe tener al menos 5 caracteres.");
    } else {
      setNombreError(""); // Sin errores
    }
  };

  const validarDescripcion = (value: string) => {
    if (!caracteresValidos.test(descripcion)) {
      return "La descripcion no puede contener caracteres especiales";
    } else if (!value) {
      setDescripcionError("La descripción no puede estar vacía.");
    } else if (value.length < 10) {
      setDescripcionError("La descripción debe tener al menos 10 caracteres.");
    } else {
      setDescripcionError(""); // Sin errores
    }
  };

  const validarTiempo = (value: string) => {
    const tiempo = parseInt(value);
    if (!value) {
      setTiempoMinutosError("El tiempo en minutos no puede estar vacío.");
    } else if (isNaN(tiempo) || tiempo < 10) {
      setTiempoMinutosError("El tiempo debe ser al menos de 10 minutos.");
    } else if (tiempo > 120) {
      setTiempoMinutosError(
        "El tiempo no puede exceder de 120 minutos (2 horas)."
      );
    } else {
      setTiempoMinutosError(""); // Sin errores
    }
  };

  const validarCantidad = (cantidad: number, unidadMedida: string) => {
    if (!cantidad) {
      return "La cantidad no puede estar vacía.";
    }

    if (unidadMedida === "g") {
      if (cantidad < 100) {
        return "La cantidad mínima en gramos es 100g.";
      } else if (cantidad > 10000) {
        return "La cantidad máxima en gramos es 10000g.";
      }
    } else if (unidadMedida === "ml") {
      if (cantidad < 1000) {
        return "La cantidad mínima en mililitros es 1000ml.";
      } else if (cantidad > 10000) {
        return "La cantidad máxima en mililitros es 10000ml.";
      }
    } else {
      return "Seleccione una unidad de medida válida.";
    }

    return ""; // Si no hay errores, retornar cadena vacía.
  };

  const validarImagenes = (imagen: string) => {
    const url = /(jpg|jpeg|png|gif)/i;
    if (!url.test(imagen)) {
      return "La URL de la imagen debe terminar en .jpg, .jpeg, .png o .gif.";
    }
    if (imagen.length >= 500) {
      return "La URL de la imagen permite 500 careacteres";
    }
    return "";
  };

  const cancelarEdicion = () => {
    window.location.href = "/admin/servicios";
  };

  return (
    <>
      {acceso ? (
        <div className="w-full mx-auto space-y-8 lg:w-3/5">
          {/* Sección de Campos de Servicio */}
          <div className="p-6 rounded-lg shadow-md">
            <h1 className="mb-6 text-2xl font-bold">Editar Servicio</h1>
            <div className="grid gap-6">
              <div>
                <Input
                  isRequired
                  type="text"
                  label="Nombre"
                  value={nombre}
                  errorMessage={nombreError}
                  onValueChange={(value) => {
                    setNombre(value);
                    validarNombre(value); // Validar mientras el usuario escribe
                  }}
                  className="w-full"
                />
                {nombreError && (
                  <span className="text-red-500">{nombreError}</span>
                )}
              </div>
              <div>
                <Input
                  isRequired
                  type="number"
                  label="Tiempo en minutos"
                  value={tiempoMinutos}
                  errorMessage={tiempoMinutosError}
                  onValueChange={(value) => {
                    setTiempoMinutos(value);
                    validarTiempo(value); // Validar mientras el usuario escribe
                  }}
                  className="w-full"
                />
                {tiempoMinutosError && (
                  <span className="text-red-500">{tiempoMinutosError}</span>
                )}
              </div>
              <div>
                <Input
                  isRequired
                  type="text"
                  label="Descripción"
                  value={descripcion}
                  errorMessage={descripcionError}
                  onValueChange={(value) => {
                    setDescripcion(value);
                    validarDescripcion(value); // Validar mientras el usuario escribe
                  }}
                  className="w-full"
                />
                {descripcionError && (
                  <span className="text-red-500">{descripcionError}</span>
                )}
              </div>
              <div className="col-span-2">
                <Input
                  isRequired
                  type="text"
                  label="Imagenes"
                  value={imagen}
                  onValueChange={setImagen}
                />
              </div>
            </div>
          </div>

          <Divider className="h-1 my-4" />
          {/* Sección de Productos Seleccionados */}
          <div className="p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Productos Seleccionados</h2>
              <Button
                size="sm"
                className="bg-gradient-to-tr from-yellow-600 to-yellow-300"
                startContent={<PlusIcon className="text-white" />}
                onClick={() => {
                  onOpen();
                  fetchProductos();
                }}
              >
                Agregar Producto
              </Button>
            </div>
            <Table aria-label="Productos seleccionados">
              <TableHeader>
                <TableColumn>Producto</TableColumn>
                <TableColumn>Cantidad</TableColumn>
                <TableColumn>Unidad de Medida</TableColumn>
                <TableColumn>Acciones</TableColumn>
              </TableHeader>
              <TableBody>
                {productosSeleccionados.map((producto, index) => (
                  <TableRow key={index}>
                    <TableCell>{producto.nombre}</TableCell>
                    <TableCell>{producto.cantidad}</TableCell>
                    <TableCell>{producto.unidadMedida}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        color="danger"
                        variant="light"
                        onClick={() => eliminarProducto(index)}
                      >
                        <CircleX />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-center my-4">
              <Button
                disabled={currentPage === 1}
                onPress={() => handlePageChange(currentPage - 1)}
              >
                Anterior
              </Button>
              <span className="mx-2">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                disabled={currentPage === totalPages}
                onPress={() => handlePageChange(currentPage + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>

          {/* Botones Guardar y Cancelar */}
          <div className="flex justify-end space-x-4">
            <Button
              className="mr-2 bg-gradient-to-tr from-red-600 to-red-300"
              onClick={cancelarEdicion}
            >
              Cancelar
            </Button>
            <Button
              className="bg-gradient-to-tr from-yellow-600 to-yellow-300"
              onClick={confirmarActualizacion}
            >
              Actualizar Servicio
            </Button>
          </div>
        </div>
      ) : (
        <CircularProgress color="primary" size="lg" />
      )}

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>Seleccionar Producto</ModalHeader>
          <div>
            <span className="block font-semibold">Producto Seleccionado:</span>
            <span>{productoSeleccionado?.nombre}</span>
          </div>
          <ModalBody>
            <Select
              placeholder="Selecciona un producto"
              onChange={(event) => {
                const value = event.target.value;
                const producto = productos.find(
                  (producto) => producto.idProducto.toString() === value
                );
                if (producto) {
                  setProductoSeleccionado(producto);
                }
              }}
            >
              {productos.map((producto) => (
                <SelectItem
                  key={producto.idProducto}
                  value={producto.idProducto.toString()}
                >
                  {producto.nombre}
                </SelectItem>
              ))}
            </Select>
            <Input
              type="number"
              label="Cantidad"
              value={cantidad.toString()}
              errorMessage={cantidadError}
              onValueChange={(value) => {
                setCantidad(Number(value));
                setCantidadError(validarCantidad(Number(value), unidadMedida));
              }}
              className="mt-4"
            />
            {cantidadError && (
              <span className="text-red-500">{cantidadError}</span>
            )}
            <Select
              label="Unidad de Medida"
              placeholder="Selecciona la unidad de medida"
              value={unidadMedida}
              onChange={(e) => setUnidadMedida(e.target.value)}
              className="mt-4"
            >
              {unidadesMedida.map((unidad) => (
                <SelectItem key={unidad.key} value={unidad.key}>
                  {unidad.label}
                </SelectItem>
              ))}
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button
              className="mr-2 bg-gradient-to-tr from-red-600 to-red-300"
              onClick={() => onOpenChange()}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                agregarProducto();
                onOpenChange();
              }}
            >
              Agregar Producto
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de Confirmación */}
      <Modal isOpen={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col items-center gap-1">
                <CircleHelp color="#fef08a" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className="text-3xl ">¿Desea actualizar el servicio?</h1>
                <p>Esta acción actualizará la información del servicio.</p>
              </ModalBody>
              <ModalFooter>
                <Button
                  className="mr-2 bg-gradient-to-tr from-red-600 to-red-300"
                  onClick={cerrarConfirmacion}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-gradient-to-tr from-yellow-600 to-yellow-300"
                  onClick={actualizarServicio}
                >
                  Actualizar Servicio
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isOpenError} onClose={onCloseError}>
        <ModalContent>
          <ModalHeader>Error</ModalHeader>
          <ModalBody>
            <p>{mensajeError}</p>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onCloseError}>Cerrar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

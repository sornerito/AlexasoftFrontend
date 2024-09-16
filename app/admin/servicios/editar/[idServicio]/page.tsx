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
import { ChevronLeftIcon, ChevronRightIcon, CircleHelp, CircleX, EditIcon, Link, PlusIcon } from "lucide-react";
import {
  getWithAuth,
  postWithAuth,
  verificarAccesoPorPermiso,
} from "@/config/peticionesConfig";
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
  const itemsPerPage = 5; 

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


  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editCantidad, setEditCantidad] = useState<number | null>(null);
  const [editCantidadError, setEditCantidadError] = useState<string>("");

  const validarCantidadEditada = (cantidad: number, unidadMedida: string) => {
    const error = validarCantidad(cantidad, unidadMedida);
    setEditCantidadError(error);
    return error;
  };


  const guardarCantidadEditada = (index: number) => {
    if (editCantidad !== null && validarCantidadEditada(editCantidad, productosSeleccionados[index].unidadMedida) === "") {
      setProductosSeleccionados(prev => prev.slice());
      setProductosSeleccionados((prevProductosSeleccionados) =>
        prevProductosSeleccionados.map((producto, i) =>
          i === index ? { ...producto, cantidad: editCantidad } : producto
        )
      );


      setEditIndex(null); 
      setEditCantidad(null); 
      setEditCantidadError(""); 
    } else {
      setEditCantidadError("La cantidad no es válida o está vacía.");
    }
  };

  const [isFormValid, setIsFormValid] = useState(false);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const unidadesMedida = [
    { key: "ml", label: "ml" },
    { key: "g", label: "g" },
  ];

  useEffect(() => {
    validarTiempo(tiempoMinutos);
  }, [tiempoMinutos]);

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
        setTiempoMinutos(String(data.servicios.tiempoMinutos));
        setImagen(data.servicios.imagen);
        setEstado(data.estado);
        console.log(data);
        setProductosSeleccionados(
          data.productos.map((producto: any) => ({
            idProducto: producto.idProducto,
            nombre: producto.nombre,
            cantidad: producto.cantidad || 0,
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

    if (!productoSeleccionado) {
      setMensajeError("Seleccione un producto.");
      onOpenError();
      return;
    }

    if (cantidad === null || cantidad === undefined || cantidad.toString().trim() === "") {
      setMensajeError("La cantidad no puede estar vacía.");
      onOpenError();
      return;
    }

    if (cantidad <= 0) {
      setMensajeError("La cantidad debe ser mayor que cero.");
      onOpenError();
      return;
    }
    
    if (productoSeleccionado && cantidad > 0 && error === "") {
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
    setIsConfirmModalOpen(true); 
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

        // Utilizar los valores actualizados de productosSeleccionados
        const productosId = productosSeleccionados.map(p => p.idProducto);
        const cantidad = productosSeleccionados.map(p => p.cantidad || 0); 
        const unidadMedida = productosSeleccionados.map(p => p.unidadMedida);


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
          setIsConfirmModalOpen(false); 
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
      if (cantidad < 10) {
        return "La cantidad mínima en gramos es 10g.";
      } else if (cantidad > 10000) {
        return "La cantidad máxima en gramos es 10000g.";
      }
    } else if (unidadMedida === "ml") {
      if (cantidad < 10) {
        return "La cantidad mínima en mililitros es 10ml.";
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


  const opcionesTiempo = ["30", "60", "90"];
  const tiempoMinutosStr = String(tiempoMinutos); // Asegurar que es string

  const itemsTiempo = opcionesTiempo.map((opcion) => (
    <SelectItem value={opcion} key={opcion}>
      {`${opcion} minutos`}
    </SelectItem>
  ));

  if (!opcionesTiempo.includes(tiempoMinutosStr)) {
    itemsTiempo.push(
      <SelectItem value={tiempoMinutosStr} key={tiempoMinutosStr}>
        {` ${tiempoMinutosStr} minutos`}
      </SelectItem>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <>
        {acceso ? (
          <div className="flex gap-4">
            {/* Sección de Campos de Servicio (Izquierda) */}
            <div className="flex-1 p-4 rounded-lg shadow-md">
              <h1 className="text-xl font-semibold mb-4">Editar Servicio</h1>
              <Divider className="h-1 my-4" /> {/* Añade el divisor */}
              <div className="mt-4">
                {/* Campo Nombre */}
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
                    className="w-full mb-4"
                  />
                  {nombreError && (
                    <span className="text-red-500">{nombreError}</span>
                  )}
                </div>

                {/* Campo Tiempo en Minutos */}
                <div>
                  <span>Tiempo En Minutos: {tiempoMinutos} minutos</span>
                  <Select
                    isRequired
                    value={String(tiempoMinutos)} // Asegúrate de que sea un string
                    onChange={(event) => setTiempoMinutos(event.target.value)}
                    className="w-full mb-4"
                  >
                    {itemsTiempo}
                  </Select>
                  {tiempoMinutosError && (
                    <span className="text-red-500">{tiempoMinutosError}</span>
                  )}

                </div>

                {/* Campo Descripción */}
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
                    className="w-full mb-4"
                  />
                  {descripcionError && (
                    <span className="text-red-500">{descripcionError}</span>
                  )}
                </div>

                {/* Campo Imágenes */}
                <div className="col-span-2">
                  <Input
                    isRequired
                    type="text"
                    label="Imágenes"
                    value={imagen}
                    onValueChange={setImagen}
                    className="w-full mb-4"
                  />
                </div>
              </div>
            </div>

            {/* Sección de Productos Seleccionados (Derecha) */}
            <div className="flex-1 p-4 rounded-lg shadow-md">
              <div className="flex flex-col items-start mb-4"> {/* Cambia a flex-col */}
                <h2 className="text-lg font-bold">Productos Seleccionados</h2>
              </div>

              <Divider className="h-1 my-4" /> {/* Añade el divisor */}

              <div className="flex justify-end mb-4"> {/* Contenedor para el botón */}
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


              {/* Tabla de productos seleccionados */}
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

                      {/* Si estamos en modo edición para esta fila, mostramos un campo de entrada */}
                      <TableCell>
                        {editIndex === index ? (
                          <div>
                            <Input
                              type="number"
                              value={editCantidad?.toString() || producto.cantidad.toString()}
                              onChange={(e) => {
                                const nuevaCantidad = Number(e.target.value);
                                setEditCantidad(nuevaCantidad);
                                validarCantidadEditada(nuevaCantidad, producto.unidadMedida); // Validar mientras el usuario escribe
                              }}
                              className="w-full"
                            />
                            {editCantidadError && (
                              <span className="text-red-500">{editCantidadError}</span>
                            )}
                          </div>
                        ) : (
                          producto.cantidad
                        )}
                      </TableCell>

                      <TableCell>{producto.unidadMedida}</TableCell>

                      <TableCell>
                        {editIndex === index ? (
                          <>
                            {/* Botón Guardar para la cantidad editada */}
                            <Button
                              size="sm"
                              color="success"
                              variant="light"
                              onClick={() => guardarCantidadEditada(index)}
                            >
                              Guardar
                            </Button>
                            {/* Botón Cancelar edición */}
                            <Button
                              size="sm"
                              color="danger"
                              variant="light"
                              onClick={() => {
                                setEditIndex(null);
                                setEditCantidad(null);
                                setEditCantidadError("");
                              }}
                            >
                              Cancelar
                            </Button>
                          </>
                        ) : (
                          <>
                            {/* Botón Editar */}
                            <Button
                              size="sm"
                              color="primary"
                              variant="light"
                              onClick={() => {
                                setEditIndex(index);
                                setEditCantidad(producto.cantidad);
                              }}
                              startContent={<EditIcon />}
                            >
                            </Button>
                            {/* Botón Eliminar */}
                            <Button
                              size="sm"
                              color="danger"
                              variant="light"
                              onClick={() => eliminarProducto(index)}
                            >
                              <CircleX />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <Button
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  color="warning"
                  className="p-2 text-black"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>

                <span className="text-base">
                  Página {currentPage} de {totalPages}
                </span>

                <Button
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  color="warning"
                  className="p-2 text-black"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>



              {/* Botones Actualizar y Cancelar */}
              <div className="flex justify-end space-x-4 mt-10">
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
          </div>
        ) : (
          <CircularProgress color="primary" size="lg" />
        )}

        {/* Modales */}
        {/* Modal para seleccionar productos */}
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
          <ModalContent>
            <ModalHeader>Seleccionar Producto</ModalHeader>
            <div className="text-center mx-auto">
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
                  setCantidadError(validarCantidad(Number(value), productoSeleccionado?.unidadMedida || ""));
                }}
                className="mt-4"
              />
              {cantidadError && <span className="text-red-500">{cantidadError}</span>}

              <Input
                label="Unidad de Medida"
                value={productoSeleccionado?.unidadMedida || ""}
                isReadOnly // Hacer que sea solo lectura
                className="mt-4"
              />
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

         {/*Modal de error*/}
         <Modal isOpen={isOpenError} onOpenChange={onCloseError}>
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
      </>
    </div >
  );
}
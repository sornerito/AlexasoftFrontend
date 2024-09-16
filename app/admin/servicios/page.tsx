"use client";
import { title } from "@/components/primitives";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  PencilIcon,
  Ellipsis,
  Edit,
  CircleHelp,
  CircleX,
  Eye,
} from "lucide-react";
import {
  getWithAuth,
  postWithAuth,
  verificarAccesoPorPermiso,
} from "@/config/peticionesConfig";

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
  CircularProgress,
  useDisclosure,
  Card,
  CardBody,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
} from "@nextui-org/react";
import { useMediaQuery } from "react-responsive";
import { Toaster, toast } from "sonner";

// Definición de columnas
const columns = [
  { name: "ID", uid: "idServicio" },
  { name: "Nombre ", uid: "nombre" },
  { name: "Descripcion", uid: "descripcion" },
  { name: "TiempoMinutos", uid: "tiempoMinutos" },
  { name: "Estado", uid: "estado" },
  { name: "Acciones", uid: "acciones" },
];

// Definición del tipo Venta
interface Servicio {
  idServicio: string;
  nombre: string;
  descripcion: string;
  tiempoMinutos: string;
  estado: string;

}

export default function ServiciosPage() {
  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Servicios") == false) {
        window.location.href = "../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Servicios"));
    }
  }, []);
  const tamanoMovil = useMediaQuery({ maxWidth: 768 }); //Tamaño md de tailwind
  const [servicios, setServicios] = React.useState<Servicio[]>([]); // Hook para guardar ventas
  const [searchTerm, setSearchTerm] = React.useState(""); // Hook para buscar
  const [page, setPage] = React.useState(1); // Hook para paginación
  const [paginaCargada, setPaginaCargada] = React.useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure(); //Hook del modal para cambiar estado
  const {
    isOpen: isOpenError,
    onOpen: onOpenError,
    onOpenChange: onOpenChangeError,
  } = useDisclosure(); //Hook de modal error
  const [mensajeError, setMensajeError] = React.useState(""); //Mensaje de error
  const {
    isOpen: isOpenWarning,
    onOpen: onOpenWarning,
    onOpenChange: onOpenChangeWarning,
  } = useDisclosure();
  const [servicioSeleccionado, setServicioSeleccionado] = React.useState<
    any | null
  >(null);
  const {
    isOpen: isOpenDetalles,
    onOpen: onOpenDetalles,
    onOpenChange: onOpenChangeDetalles,
  } = useDisclosure(); //Hook de modal error

  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter(); // Hook para manejar la navegación

  // Hacer Fetch para obtener ventas y procesar datos
  React.useEffect(() => {
    getWithAuth("http://localhost:8080/servicio")
      .then((response) => response.json())
      .then((data) => {
        // Procesar los datos para que coincidan con la estructura de columnas
        const processedData: Servicio[] = data.map(
          (item: {
            servicios: {
              idServicio: any;
              nombre: any;
              descripcion: any;
              tiempoMinutos: any;
              estado: any;
            };
            productos: [
              {
                idProducto: any;
                nombre: any;
                marca: any;
                precio: any;
                unidades: any;
                estado: any;
                idCategoriaProducto: any;
                cantidad: any;
                unidadMedida: any;
              }
            ];
          }) => ({
            idServicio: item.servicios.idServicio,
            nombre: item.servicios.nombre,
            descripcion: item.servicios.descripcion,
            tiempoMinutos: item.servicios.tiempoMinutos,
            estado: item.servicios.estado,
            productos: item.productos,
          })
        );
        setServicios(processedData);
      })
      .catch((err: any) => {
        if (err.message === "Unexpected end of JSON input") {
          setMensajeError("No hay Servicios registradas aún.");
          onOpenWarning();
        } else {
          console.error("Error al obtener los servicios:", err);
          setMensajeError(
            "Error al obtener los servicios. Por favor, inténtalo de nuevo."
          );
          onOpenError();
        }
      });
  }, []);

  React.useEffect(() => {
    setPaginaCargada(true);
  }, []);

  const rowsPerPage = 10; // Número de registros por página

  // Filtra ventas según el valor del hook de buscar
  const serviciosFiltradas = React.useMemo(() => {
    return servicios.filter(
      (servicio) =>
        servicio.idServicio.toString().includes(searchTerm.toLowerCase()) ||
        servicio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        servicio.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        servicio.estado.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [servicios, searchTerm]);

  // Distribuye los registros según las ventas filtradas
  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return serviciosFiltradas.slice(start, end);
  }, [page, serviciosFiltradas]);

  const mostrarDetalleServicio = (idServicio: string) => {
    const servicio = servicios.find(
      (servicio) => servicio.idServicio === idServicio
    );
    setServicioSeleccionado(servicio || null);
    onOpenDetalles(); // Abre el modal
  };

  const [servicioId, setServicioId] = React.useState("");
  const [estadoActual, setEstadoActual] = React.useState("");

  const cambiarEstado = async (idServicio: any, estadoActual: any) => {
    const data = {
      estado: estadoActual,
    };
  
    const promise = new Promise<void>((resolve, reject) => {
      setTimeout(async () => {
        try {
          const response = await postWithAuth(
            "http://localhost:8080/servicio/cambiarEstadoServicio/" + idServicio,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            }
          );
  
          if (response.ok) {
            const nuevoEstado = estadoActual === "Activo" ? "Desactivado" : "Activo";
            setServicios((prevSrrvicio) =>
              prevSrrvicio.map((servicio) =>
                servicio.idServicio === idServicio
                  ? { ...servicio, estado: nuevoEstado }
                  : servicio
              )
            );
            resolve(); // Resuelve la promesa si el cambio de estado es exitoso
          } else {
            const errorResponse = await response.text();
            setMensajeError(errorResponse);
            onOpenError();
            console.error("Error al cambiar de estado: ", await response.text());
            reject(new Error(errorResponse)); // Rechaza la promesa si hay un error
          }
        } catch (error: any) {
          console.error("Error al cambiar de estado: ", error);
          reject(error); // Rechaza la promesa si hay un error en la solicitud
        }
      }, 500); // Simula un retraso de 500 ms para mostrar la promesa
    });
  
    toast.promise(promise, {
      loading: "Editando...",
      success: "El estado ha sido cambiado con éxito",
      error: (err) => err.message,
    });
  };

  const handleEstadoChange = async (idServicio: any, estado: any) => {
    setServicioId(idServicio);
    setEstadoActual(estado);
    onOpen();
  };

  if (!paginaCargada) {
    return null;
  }

  return (
    <>
      {acceso ? (
        <div>
          <h1 className={title()}>Servicios</h1>
          <Toaster position="bottom-right" />
          <div className="flex flex-col items-start sm:flex-row sm:items-center">
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
                placeholder="Buscar..."
                onChange={(e: any) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="basis-1/2"></div>
            <div className="flex items-center justify-end mb-4 space-x-2 basis-1/4 sm:my-4 text-end">
              <Link href="/admin/servicios/crear">
                <Button
                  className="bg-gradient-to-tr from-red-600 to-orange-300"
                  aria-label="Crear Servicio"
                >
                  <PlusIcon /> Crear Servicio
                </Button>
              </Link>
            </div>
          </div>

          {tamanoMovil ? (
            <div>
              {items.map((item) => (
                <div key={item.idServicio}>
                  <style></style>
                  <Card className="mb-4 group">
                    <CardBody>
                      {columns.map((column) => (
                        <div
                          key={column.uid}
                          className="truncate group-hover:whitespace-normal group-hover:overflow-visible "
                        >
                          <strong>
                            {column.uid === "acciones" ? "" : column.name + ":"}{" "}
                          </strong>
                          {column.uid === "acciones" &&
                            item.estado == "Activo" ? (
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
                              <DropdownMenu
                                onAction={(action) => console.log(action)}
                              >
                                <DropdownItem
                                  href={`/admin/servicios/editar/${item.idServicio}`}
                                >
                                  <Button className="w-full bg-transparent">
                                    <Edit />
                                    Editar Servicio
                                  </Button>
                                </DropdownItem>
                                <DropdownItem>
                                  <Button
                                  className="w-full bg-transparent"
                                    onClick={() =>
                                      mostrarDetalleServicio(item.idServicio)
                                    }
                                  >
                                    <Eye />
                                    Detalles
                                  </Button>
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          ) : column.uid === "estado" ? (
                            <Chip
                              color={
                                item.estado === "Activo" ? "success" : "danger"
                              }
                              variant="bordered"
                              className="align-middle transition-transform duration-100 ease-in-out cursor-pointer hover:scale-90"
                              onClick={() =>
                                handleEstadoChange(item.idServicio, item.estado)
                              }
                            >
                              {item.estado}
                            </Chip>
                          ) : (
                            <span>{item[column.uid as keyof Servicio]}</span>
                          )}
                        </div>
                      ))}
                    </CardBody>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
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
                  <TableRow key={item.idServicio}>
                    {columns.map((column) => (
                      <TableCell key={column.uid}>
                        {column.uid === "acciones" &&
                          item.estado == "Activo" ? (
                          <Dropdown>
                            <DropdownTrigger>
                              <Button
                                aria-label="Acciones"
                                className="bg-transparent"
                              >
                                <Ellipsis />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                              onAction={(action) => console.log(action)}
                            >
                              <DropdownItem
                                href={`/admin/servicios/editar/${item.idServicio}`}
                              >
                                <Button className="w-full bg-transparent">
                                  <Edit />
                                  Editar Servicio
                                </Button>
                              </DropdownItem>
                              <DropdownItem>
                                <Button
                                className="w-full bg-transparent"
                                  onClick={() =>
                                    mostrarDetalleServicio(item.idServicio)
                                  }
                                >
                                  <Eye />
                                  Ver Detalles
                                </Button>
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        ) : column.uid === "estado" ? (
                          <Chip
                            color={
                              item.estado === "Activo" ? "success" : "danger"
                            }
                            variant="bordered"
                            className="transition-transform duration-100 ease-in-out cursor-pointer hover:scale-110"
                            onClick={() =>
                              handleEstadoChange(item.idServicio, item.estado)
                            }
                          >
                            {item.estado}
                          </Chip>
                        ) : (
                          item[column.uid as keyof Servicio]
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          <div className="flex justify-center w-full mb-4">
            <Pagination
              showControls
              color="warning"
              page={page}
              total={Math.ceil(serviciosFiltradas.length / rowsPerPage)}
              onChange={(page) => setPage(page)}
            />
          </div>

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
                      Detalle Servicios
                    </h1>
                  </ModalHeader>
                  <ModalBody className="p-6 overflow-y-auto max-h-96">
                    {servicioSeleccionado ? (
                      <div className="flex flex-col gap-6 lg:flex-row">
                        <Table
                          aria-label="Detalles de la Venta"
                          className="flex-1"
                        >
                          <TableHeader>
                            <TableColumn>Informacion Servicios</TableColumn>
                            <TableColumn>Información</TableColumn>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>Nombre</TableCell>
                              <TableCell>
                                {servicioSeleccionado.nombre}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Descripcion</TableCell>
                              <TableCell>
                                {servicioSeleccionado.descripcion}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Tiempo (minutos)</TableCell>
                              <TableCell>
                                {servicioSeleccionado.tiempoMinutos}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Estado</TableCell>
                              <TableCell>
                               {servicioSeleccionado.estado}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>

                        <div style={{ width: "50%" }}>
                          {servicioSeleccionado.productos.length > 0 ? (
                            <Table aria-label="Productos" className="flex-1">
                              <TableHeader>
                                <TableColumn>Producto</TableColumn>
                                <TableColumn>Cantidad</TableColumn>
                                <TableColumn>Unidad</TableColumn>
                              </TableHeader>
                              <TableBody>
                                {servicioSeleccionado.productos.map((producto: any, index: number) => (
                                  <TableRow key={index}>
                                    <TableCell>{producto.nombre}</TableCell>
                                    <TableCell>{producto.cantidad}</TableCell>
                                    <TableCell>{producto.unidadMedida}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <p>No hay productos asociados a este servicio.</p>
                          )}
                        </div>
                      </div>
                    ) : isLoading ? (
                      <div className="flex items-center justify-center">
                        <Spinner color="warning" size="lg" />
                      </div>
                    ) : (
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


          {/*Modal Cambiar Estado*/}
          <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col items-center gap-1">
                    <CircleHelp color="#fef08a" size={100} />
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <h1 className="text-3xl ">
                      ¿Desea cambiar el estado del servicio?
                    </h1>
                  </ModalBody>
                  <ModalFooter>
                    <Button
                      color="danger"
                      variant="light"
                      onPress={onClose}
                    >
                      Cancelar
                    </Button>
                    <Button
                      color="warning"
                      variant="light"
                      onPress={() => {
                        cambiarEstado(servicioId, estadoActual);
                        onClose();
                      }}
                    >
                      Cambiar Estado
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

          {/*Modal de error*/}
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
        </div>
      ) : (
        <CircularProgress color="warning" aria-label="Cargando..." />
      )}
    </>
  );
}

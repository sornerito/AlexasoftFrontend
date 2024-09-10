"use client";
import { title } from "@/components/primitives";
import React from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, PencilIcon, Ellipsis, Edit, CircleHelp, CircleX } from "lucide-react";
import { getWithAuth, postWithAuth, verificarAccesoPorPermiso } from "@/config/peticionesConfig";

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
} from "@nextui-org/react";
import { useMediaQuery } from "react-responsive";

// Definición de columnas
const columns = [
  { name: "ID", uid: "idServicio" },
  { name: "NOMBRE ", uid: "nombre" },
  { name: "DESCRIPCION", uid: "descripcion" },
  { name: "TIEMPOMINUTOS", uid: "tiempoMinutos" },
  { name: "ESTADO", uid: "estado" },
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
        window.location.href = "../../../acceso/noAcceso"
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
  const { isOpen: isOpenWarning, onOpen: onOpenWarning, onOpenChange: onOpenChangeWarning } = useDisclosure();
  const [servicioSeleccionado, setServicioSeleccionado] = React.useState<any | null>(null);
  const {
    isOpen: isOpenDetalles,
    onOpen: onOpenDetalles,
    onOpenChange: onOpenChangeDetalles,
  } = useDisclosure(); //Hook de modal error

  const router = useRouter(); // Hook para manejar la navegación

  // Hacer Fetch para obtener ventas y procesar datos
  React.useEffect(() => {
    getWithAuth("http://localhost:8080/servicio")
      .then((response) => response.json())
      .then((data) => {
        // Procesar los datos para que coincidan con la estructura de columnas
        const processedData: Servicio[] = data.map(
          (item: {
            servicios: { idServicio: any; nombre: any; descripcion: any; tiempoMinutos: any; estado: any },
            productos: [{ idProducto: any; nombre: any; marca: any; precio: any; unidades: any; estado: any; idCategoriaProducto: any; cantidad: any; unidadMedida: any; }]
          }) => ({
            idServicio: item.servicios.idServicio,
            nombre: item.servicios.nombre,
            descripcion: item.servicios.descripcion,
            tiempoMinutos: item.servicios.tiempoMinutos,
            estado: item.servicios.estado,
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
          setMensajeError("Error al obtener los servicios. Por favor, inténtalo de nuevo.");
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
    const servicio = servicios.find(servicio => servicio.idServicio === idServicio);
    setServicioSeleccionado(servicio || null);
    onOpenDetalles(); // Abre el modal
  };


  const [servicioId, setServicioId] = React.useState("");
  const [estadoActual, setEstadoActual] = React.useState("");
  const cambiarEstado = async (idServicio: any, estadoActual: any) => {
    const data = {
      estado: estadoActual,
    };
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
        const nuevoEstado =
          estadoActual === "Activo" ? "Desactivado" : "Activo";
        setServicios((prevSrrvicio) =>
          prevSrrvicio.map((servicio) =>
            servicio.idServicio === idServicio ? { ...servicio, estado: nuevoEstado } : servicio
          )
        );
      } else {
        const errorResponse = await response.text();
        setMensajeError(errorResponse);
        onOpenError();
        console.error("Error al cambiar de estado: ", await response.text());
      }
    } catch (error) {
      console.error("Error al cambiar de estado: ", error);
    }
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
          <div className="flex flex-col items-start sm:flex-row sm:items-center">
            <div className="rounded-lg p-0 my-4 basis-1/4 bg-gradient-to-tr from-yellow-600 to-yellow-300">
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
            <div className="flex items-center basis-1/4 mb-4 sm:my-4 text-end space-x-2 justify-end">
              <Link href="/admin/servicios/crear">
                <Button className="bg-gradient-to-tr from-red-600 to-orange-300" aria-label="Crear Servicio">
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
                              <DropdownTrigger className="bg-transparent w-auto my-2">
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
                                <DropdownItem href={`/admin/servicios/editar/${item.idServicio}`}>
                                  <Button className="bg-transparent w-full">
                                    <Edit />
                                    Editar Servicio
                                  </Button>
                                </DropdownItem>
                                <DropdownItem>
                                    <Button onClick={() => mostrarDetalleServicio(item.idServicio)}>
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
                              className="hover:scale-90 cursor-pointer transition-transform duration-100 ease-in-out align-middle"
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
                              <DropdownItem href={`/admin/servicios/editar/${item.idServicio}`}>
                                <Button className="bg-transparent w-full">
                                  <Edit />
                                  Editar Servicio
                                </Button>
                              </DropdownItem>
                              <DropdownItem>
                                    <Button onClick={() => mostrarDetalleServicio(item.idServicio)}>
                                      Ver Detalles
                                    </Button>
                                </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        ) : column.uid === "estado" ? (
                          <Chip
                            color={item.estado === "Activo" ? "success" : "danger"}
                            variant="bordered"
                            className="hover:scale-110 cursor-pointer transition-transform duration-100 ease-in-out"
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

          <div className="flex w-full justify-center mb-4">
            <Pagination
              showControls
              color="warning"
              page={page}
              total={Math.ceil(serviciosFiltradas.length / rowsPerPage)}
              onChange={(page) => setPage(page)}
            />
          </div>


          <Modal isOpen={isOpenDetalles} onOpenChange={onOpenChangeDetalles}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col gap-1 items-center">
                    <CircleHelp color="#fef08a" size={100} />
                  </ModalHeader>
                  <ModalBody className="text-center">
                    {servicioSeleccionado ? (
                      <div>
                        <h1 className="text-2xl mb-4">Detalles del Servicio</h1>
                        <p><strong>ID:</strong> {servicioSeleccionado.idServicio}</p>
                        <p><strong>Nombre:</strong> {servicioSeleccionado.nombre}</p>
                        <p><strong>Descripción:</strong> {servicioSeleccionado.descripcion}</p>
                        <p><strong>Tiempo (minutos):</strong> {servicioSeleccionado.tiempoMinutos}</p>
                        <p><strong>Estado:</strong> {servicioSeleccionado.estado}</p>
                      </div>
                    ) : (
                      <p>No se encontró el servicio.</p>
                    )}
                  </ModalBody>
                  <ModalFooter>
                    <Button className="bg-gradient-to-tr from-red-600 to-red-300 mr-2" onPress={onClose}>
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
                  <ModalHeader className="flex flex-col gap-1 items-center">
                    <CircleHelp color="#fef08a" size={100} />
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <h1 className=" text-3xl">¿Desea cambiar el estado del servicio?</h1>
                  </ModalBody>
                  <ModalFooter>
                    <Button className="bg-gradient-to-tr from-red-600 to-red-300 mr-2" onPress={onClose}>
                      Cancelar
                    </Button>
                    <Button
                      className="bg-gradient-to-tr from-yellow-600 to-yellow-300"
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
                  <ModalHeader className="flex flex-col gap-1 items-center">
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
        </div>
      ) : (
        <CircularProgress color="warning" aria-label="Cargando..." />
      )}
    </>
  );
}

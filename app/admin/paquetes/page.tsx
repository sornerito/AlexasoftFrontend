"use client";
import { title } from "@/components/primitives";
import React, { useState } from "react";
import { useMediaQuery } from "react-responsive";
import { PlusIcon, Ellipsis, Edit, CircleHelp, CircleX, Eye } from "lucide-react";

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
  CardBody,
  Card,
  CircularProgress,
  Spinner,
} from "@nextui-org/react";
import {
  getWithAuth,
  postWithAuth,
  verificarAccesoPorPermiso,
} from "@/config/peticionesConfig";
import { Toaster, toast } from "sonner";

//Encabezado de la tabla, el uid debe coincidir con la forma en la que procesamos la data en el fetch
const columns = [
  { name: "ID", uid: "idPaquete" },
  { name: "Nombre", uid: "nombre" },
  { name: "Descripción", uid: "descripcion" },
  { name: "Tiempo", uid: "tiempoTotalServicio" },
  { name: "Servicios", uid: "servicios" },
  { name: "Estado", uid: "estado" },
  { name: "Acciones", uid: "acciones" },
];

//Molde con el que procesaremos los datos. ES DIFERENTE a como el json trae los datos
interface Paquete {
  idPaquete: string;
  nombre: string;
  descripcion: string;
  tiempoTotalServicio: string;
  estado: string;
  servicios: string;
}

export default function PaquetesPage() {
  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Paquetes") == false) {
        window.location.href = "../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Paquetes"));
    }
  }, []);
  const tamanoMovil = useMediaQuery({ maxWidth: 768 }); //Tamaño md de tailwind
  const [paginaCargada, setPaginaCargada] = React.useState(false);
  const [paquetes, setPaquetes] = React.useState<Paquete[]>([]); // Hook que guarda los roles procesados
  const [searchTerm, setSearchTerm] = React.useState(""); // Hook para buscar
  const [page, setPage] = React.useState(1); // Hook, dice la pagina que carga por defecto
  const { isOpen, onOpen, onOpenChange } = useDisclosure(); //Hook del modal para cambiar estado
  const {
    isOpen: isOpenError,
    onOpen: onOpenError,
    onOpenChange: onOpenChangeError,
  } = useDisclosure(); //Hook de modal error
  const [mensajeError, setMensajeError] = React.useState("");
  const [paquetesSeleccionado, setPaquetesSeleccionado] = React.useState<
    any | null
  >(null);
  const {
    isOpen: isOpenDetalles,
    onOpen: onOpenDetalles,
    onOpenChange: onOpenChangeDetalles,
  } = useDisclosure(); //Hook de modal error
  const [isLoading, setIsLoading] = useState(true);

  // Hacer Fetch para obtener roles y acomodarlos a conveniencia
  React.useEffect(() => {
    getWithAuth("http://192.168.56.1:8080/servicio/paquetes")
      .then((response) => response.json())
      .then((data) => {
        // Procesar los datos para que coincidan con la estructura de columnas
        const processedData: Paquete[] = data.map(
          (item: {
            paquete: {
              idPaquete: any;
              nombre: any;
              descripcion: any;
              estado: any;
              tiempoTotalServicio: any;
            };
            servicios: [
              {
                idServicio: any;
                nombre: any;
                descripcion: any;
                tiempoMinutos: any;
                estado: any;
                imagen: any;
              }
            ];
          }) => ({
            idPaquete: item.paquete.idPaquete,
            nombre: item.paquete.nombre,
            descripcion: item.paquete.descripcion,
            tiempoTotalServicio: item.paquete.tiempoTotalServicio + "m",
            estado: item.paquete.estado,
            servicios: item.servicios
              .map((servicio) => servicio.nombre)
              .join(", "),
          })
        );
        setPaquetes(processedData);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, []);

  React.useEffect(() => {
    setPaginaCargada(true);
  }, []);

  // CONFIGURACION DE PAGINACION Y BUSQUEDA(FILTRO)
  const rowsPerPage = 6; //Numero de registros por pagina

  // Filtra segun el value del hook de buscar
  const paquetesFiltrados = React.useMemo(() => {
    return paquetes.filter(
      (paquete) =>
        paquete.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paquete.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paquete.estado.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paquete.tiempoTotalServicio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paquete.idPaquete.toString().includes(searchTerm.toLowerCase()) ||
        paquete.servicios.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [paquetes, searchTerm]);

  // Distribuye los registros segun los paquetes filtrados (si no hay filtro muestra todos)
  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return paquetesFiltrados.slice(start, end);
  }, [page, paquetesFiltrados]);

  const [paqueteId, setPaqueteId] = React.useState("");
  const [estadoActual, setEstadoActual] = React.useState("");

  const cambiarEstado = async (idPaquete: any, estadoActual: any) => {
    const data = {
      estado: estadoActual,
    };
    const promise = new Promise<void>((resolve, reject) => {
      setTimeout(async () => {
        try {
          const response = await postWithAuth(
            "http://192.168.56.1:8080/servicio/cambiarEstado/" + idPaquete,
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
            setPaquetes((prevPaquete) =>
              prevPaquete.map((paquete) =>
                paquete.idPaquete === idPaquete
                  ? { ...paquete, estado: nuevoEstado }
                  : paquete
              )
            );
            resolve();
          } else {
            const errorResponse = await response.text();
            setMensajeError(errorResponse);
            onOpenError();
            console.error("Error al cambiar de estado: ", await response.text());
            reject(new Error(errorResponse));
          }
        } catch (error: any) {
          console.error("Error al cambiar de estado: ", error);
          reject(error);
        }
      }, 500);
    });

    toast.promise(promise, {
      loading: "Editando...",
      success: "El estado ha sido cambiado con éxito",
      error: (err) => err.message,
    });
  };

    const handleEstadoChange = async (idPaquete: any, estado: any) => {
      setPaqueteId(idPaquete);
      setEstadoActual(estado);
      onOpen();
    };

    if (!paginaCargada) {
      return null;
    }


    const mostrarDetallePaquete = (idPaquete: string) => {
      const paquete = paquetes.find(
        (paquete) => paquete.idPaquete === idPaquete
      );
      setPaquetesSeleccionado(paquete || null);
      onOpenDetalles(); // Abre el modal
    };

    return (
      <>
        {acceso ? (
          <div>
            <h1 className={title()}>Paquetes</h1>
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
                <Link href="/admin/paquetes/crear">
                  <Button
                    className="bg-gradient-to-tr from-red-600 to-orange-300"
                    aria-label="Crear Paquete"
                  >
                    <PlusIcon /> Crear Paquete
                  </Button>
                </Link>
              </div>
            </div>
            {tamanoMovil ? (
              <div>
                {items.map((item) => (
                  <div key={item.idPaquete}>
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
                                    href={`/admin/paquetes/editar/${item.idPaquete}`}
                                  >
                                    <Button className="w-full bg-transparent">
                                      <Edit />
                                      Editar Paquete
                                    </Button>
                                  </DropdownItem>
                                  <DropdownItem>
                                    <Button
                                      className="w-full bg-transparent"
                                      onClick={() =>
                                        mostrarDetallePaquete(item.idPaquete)
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
                                  handleEstadoChange(item.idPaquete, item.estado)
                                }
                              >
                                {item.estado}
                              </Chip>
                            ) : (
                              <span>{item[column.uid as keyof Paquete]}</span>
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
                    <TableRow key={item.idPaquete}>
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
                                  href={`/admin/paquetes/editar/${item.idPaquete}`}
                                >
                                  <Button className="w-full bg-transparent">
                                    <Edit />
                                    Editar Paquete
                                  </Button>
                                </DropdownItem>
                                <DropdownItem>
                                  <Button
                                    className="w-full bg-transparent"
                                    onClick={() =>
                                      mostrarDetallePaquete(item.idPaquete)
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
                                handleEstadoChange(item.idPaquete, item.estado)
                              }
                            >
                              {item.estado}
                            </Chip>
                          ) : (
                            item[column.uid as keyof Paquete]
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
                total={Math.ceil(paquetesFiltrados.length / rowsPerPage)}
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
                        Detalle Paquetes
                      </h1>
                    </ModalHeader>
                    <ModalBody className="p-6 overflow-y-auto max-h-96">
                      {paquetesSeleccionado ? (
                        <div className="flex flex-col gap-6 lg:flex-row">
                          <Table
                            aria-label="Detalles de la Venta"
                            className="flex-1"
                          >
                            <TableHeader>
                              <TableColumn>Informacion Paquetes</TableColumn>
                              <TableColumn>Información</TableColumn>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>
                                  {paquetesSeleccionado.nombre}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Descripcion</TableCell>
                                <TableCell>
                                  {paquetesSeleccionado.descripcion}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>TiempoTotalServicios</TableCell>
                                <TableCell>
                                  {paquetesSeleccionado.tiempoTotalServicio}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Estado</TableCell>
                                <TableCell>
                                  {paquetesSeleccionado.estado}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Servicios</TableCell>
                                <TableCell>{paquetesSeleccionado.servicios}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
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
                        ¿Desea cambiar el estado del paquete?
                      </h1>
                      <p>
                        Hacerlo inhabilitará estepaquete
                      </p>
                    </ModalBody>
                    <ModalFooter>
                      <Button color="danger" variant="light" onPress={onClose}>
                        Cancelar
                      </Button>
                      <Button
                        className="bg-[#609448]"
                        onPress={() => {
                          cambiarEstado(paqueteId, estadoActual);
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

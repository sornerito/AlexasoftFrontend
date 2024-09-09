"use client";

// Importar módulos necesarios
import { Toaster, toast } from "sonner";
import { title } from "@/components/primitives";
import { useMediaQuery } from "react-responsive";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { getWithAuth, postWithAuth, verificarAccesoPorPermiso } from "@/config/peticionesConfig";
import { PlusIcon, Ellipsis, Edit, CircleHelp, CircleX } from "lucide-react";
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
  Spinner,
  CircularProgress,
} from "@nextui-org/react";

// Definición de la interfaz Cliente
interface Cliente {
  idCliente: string;
  nombre: string;
  correo: string;
  telefono: string;
  instagram: string;
  contrasena: string;
  estado: string;
  fechaInteraccion: string;
  idRol: string;
}

// Definición de las columnas de la tabla
const columns = [
  { name: "ID", uid: "idCliente" },
  { name: "Nombre y Apellidos", uid: "nombre" },
  { name: "Correo", uid: "correo" },
  { name: "Teléfono", uid: "telefono" },
  { name: "Instagram", uid: "instagram" },
  { name: "Estado", uid: "estado" },
  { name: "Acciones", uid: "acciones" },
];

// Componente principal ClientesPage
export default function ClientesPage() {
  // Estado para controlar el acceso al componente
  const [acceso, setAcceso] = useState<boolean>(false);
  // Verifica el acceso al componente al cargar
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!verificarAccesoPorPermiso("Gestionar Clientes")) {
        window.location.href = "../../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Clientes"));
    }
  }, []);

  // Estados para la gestión de clientes
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(
    null
  ); // ID del cliente seleccionado para acciones
  const [mensajeError, setMensajeError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Hooks para controlar los modales
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isOpenError,
    onOpen: onOpenError,
    onOpenChange: onOpenChangeError,
  } = useDisclosure();

  // Constantes para la paginación y la visualización móvil
  const rowsPerPage = 6;
  const tamanoMovil = useMediaQuery({ maxWidth: 768 });

  // Obtiene los datos de los clientes al cargar el componente
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await getWithAuth("http://localhost:8080/cliente");
        const data = await response.json();
        // Mapear los datos de la respuesta a la interfaz Cliente
        setClientes(
          data.map((item: any) => ({
            idCliente: item.idCliente,
            nombre: item.nombre,
            correo: item.correo,
            telefono: item.telefono,
            instagram: item.instagram,
            contrasena: item.contrasena,
            estado: item.estado,
            fechaInteraccion: item.fechaInteraccion,
            idRol: item.idRol,
          }))
        );
      } catch (err) {
        console.error("Error al obtener clientes:", err);
        setMensajeError(
          "Error al obtener clientes. Por favor, inténtalo de nuevo."
        );
        onOpenError();
      } finally {
        setIsLoading(false);
      }
    };
    fetchClientes();
  }, []);

  // Filtra los clientes en función del término de búsqueda
  const clientesFiltrados = useMemo(() =>
    clientes.filter((cliente) =>
      Object.values(cliente).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    , [clientes, searchTerm]);

  // Calcula los elementos a mostrar en la página actual
  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return clientesFiltrados.slice(start, end);
  }, [page, clientesFiltrados]);

  // Maneja el cambio de estado de un cliente
  const handleToggleEstado = useCallback((idCliente: string) => {
    const cliente = clientes.find((cliente) => cliente.idCliente === idCliente);
    if (!cliente) return;

    const updatedEstado = cliente.estado === "Activo" ? "Desactivado" : "Activo";
    const updatedCliente = { ...cliente, estado: updatedEstado };

    const promise = new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        postWithAuth(`http://localhost:8080/cliente/${idCliente}`, updatedCliente)
          .then((response) => {
            if (response.ok) {
              setClientes((prevClientes) =>
                prevClientes.map((c) =>
                  c.idCliente === idCliente ? updatedCliente : c
                )
              );
              resolve();
              console.log("El estado ha sido cambiado con éxito");
            } else {
              reject(new Error("Error al cambiar el estado"));
            }
          })
          .catch((error) => {
            console.error("Error al cambiar el estado:", error);
            setMensajeError(
              "Error al cambiar el estado del cliente. Por favor, inténtalo de nuevo."
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
  }, [clientes]);

  // Abre el modal de cambio de estado
  const handleOpenModal = (idCliente: string) => {
    setSelectedClienteId(idCliente);
    onOpen();
  };

  // Formatea una fecha en el formato dd/mm/yyyy
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Renderiza el componente
  return (
    <>
      {acceso ? (
        <div>
          <h1 className={title()}>Clientes</h1>
          <Toaster position="top-left" />

          <div className="flex flex-col items-start sm:flex-row sm:items-center">
            {/* Input de búsqueda */}
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
            {/* Botón para crear nuevo cliente */}
            <div className="flex items-center basis-1/4 mb-4 sm:my-4 text-end space-x-2 justify-end">
              <Link href="/admin/clientes/crear">
                <Button
                  className="bg-gradient-to-tr from-red-600 to-orange-300"
                  aria-label="Crear Cliente"
                >
                  <PlusIcon /> Crear Cliente
                </Button>
              </Link>
            </div>
          </div>

          {/* Muestra un Spinner mientras carga los datos */}
          {isLoading ? (
            <div className="flex justify-center text-center h-screen">
              <div className="text-center">
                <Spinner color="warning" size="lg" />
              </div>
            </div>
          ) : (
            // Muestra la tabla de clientes o la vista móvil
            tamanoMovil ? (
              <div>
                {items.map((item) => (
                  <Card key={item.idCliente} className="mb-4">
                    <CardBody>
                      {columns.map((column) => (
                        <div key={column.uid}>
                          <strong>{column.name}: </strong>
                          {column.uid === "acciones" ? (
                            // Dropdown de acciones para cada cliente
                            <Dropdown>
                              <DropdownTrigger className="bg-transparent w-auto my-2">
                                <Button
                                  isIconOnly
                                  className="border"
                                  aria-label="Actions"
                                  isDisabled={item.estado === "Desactivado"}
                                >
                                  <Ellipsis />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu
                                onAction={(action) => console.log(action)}
                              >
                                <DropdownItem
                                  key="editar"
                                  href={`clientes/editar/${item.idCliente}`}
                                  isDisabled={item.estado === "Desactivado"}
                                >
                                  <Button
                                    className="bg-transparent w-full"
                                    disabled={item.estado === "Desactivado"}
                                  >
                                    <Edit />
                                    Editar
                                  </Button>
                                </DropdownItem>
                                <DropdownItem
                                  key="editarContrasena"
                                  href={`clientes/password/${item.idCliente}`}
                                  isDisabled={item.estado === "Desactivado"}
                                >
                                  <Button
                                    className="bg-transparent w-full"
                                    disabled={item.estado === "Desactivado"}
                                  >
                                    <Edit />
                                    Contraseña
                                  </Button>
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          ) : column.uid === "fechaInteraccion" ? (
                            <span>{formatDate(item.fechaInteraccion)}</span>
                          ) : column.uid === "estado" ? (
                            // Chip para mostrar el estado del cliente
                            <Chip
                              color={
                                item.estado === "Activo" ? "success" : "danger"
                              }
                              variant="bordered"
                              className="hover:scale-90 cursor-pointer transition-transform duration-100 ease-in-out align-middle"
                              onClick={() => handleOpenModal(item.idCliente)}
                            >
                              {item.estado}
                            </Chip>
                          ) : (
                            <span>
                              {item[column.uid as keyof Cliente]}
                            </span>
                          )}
                        </div>
                      ))}
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : (
              // Tabla para visualización de escritorio
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
                    <TableRow key={item.idCliente}>
                      {columns.map((column) => (
                        <TableCell key={column.uid}>
                          {column.uid === "acciones" ? (
                            // Dropdown de acciones para cada cliente
                            <Dropdown>
                              <DropdownTrigger>
                                <Button
                                  aria-label="Acciones"
                                  className="bg-transparent"
                                  isDisabled={item.estado === "Desactivado"}
                                >
                                  <Ellipsis />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu
                                onAction={(action) => console.log(action)}
                              >
                                <DropdownItem
                                  href={`clientes/editar/${item.idCliente}`}
                                  isDisabled={item.estado === "Desactivado"}
                                >
                                  <Button className="bg-transparent w-full">
                                    <Edit />
                                    Editar
                                  </Button>
                                </DropdownItem>
                                <DropdownItem
                                  href={`clientes/password/${item.idCliente}`}
                                  isDisabled={item.estado === "Desactivado"}
                                >
                                  <Button className="bg-transparent w-full">
                                    <Edit />
                                    Contraseña
                                  </Button>
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          ) : column.uid === "instagram" &&
                            item.instagram === null ? (
                            "N/A"
                          ) : column.uid === "fechaInteraccion" ? (
                            formatDate(item.fechaInteraccion)
                          ) : column.uid === "estado" ? (
                            // Chip para mostrar el estado del cliente
                            <Chip
                              color={
                                item.estado === "Activo" ? "success" : "danger"
                              }
                              variant="bordered"
                              className="hover:scale-110 cursor-pointer transition-transform duration-100 ease-in-out"
                              onClick={() => handleOpenModal(item.idCliente)}
                            >
                              {item.estado}
                            </Chip>
                          ) : (
                            item[column.uid as keyof Cliente]
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )
          )}

          {/* Paginación */}
          <div className="flex w-full justify-center mb-4">
            <Pagination
              showControls
              color="warning"
              page={page}
              total={Math.ceil(clientesFiltrados.length / rowsPerPage)}
              onChange={(page) => setPage(page)}
            />
          </div>

          {/* Modal de confirmación de cambio de estado */}
          <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col gap-1 items-center">
                    <CircleHelp color="#fef08a" size={100} />
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <h1 className="text-3xl">
                      ¿Desea cambiar el estado del cliente?
                    </h1>
                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                      Cancelar
                    </Button>
                    <Button
                      className="bg-[#609448]"
                      onPress={() => {
                        if (selectedClienteId) {
                          handleToggleEstado(selectedClienteId);
                        }
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

          {/* Modal de error */}
          <Modal isOpen={isOpenError} onOpenChange={onOpenChangeError}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col gap-1 items-center">
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
        </div>
      ) : (
        // Muestra un CircularProgress si no tiene acceso
        <CircularProgress color="warning" aria-label="Cargando..." />
      )}
    </>
  );
}
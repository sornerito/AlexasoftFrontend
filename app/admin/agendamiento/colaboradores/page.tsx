"use client";
import { title } from "@/components/primitives";
import React from "react";
import {
  getWithAuth,
  deleteWithAuth,
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
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  CircularProgress,
} from "@nextui-org/react";
import {
  PlusIcon,
  FileBarChart2,
  Ellipsis,
  Edit,
  Trash2Icon,
  CircleHelp,
  CircleX,
} from "lucide-react";

const columns = [
  { name: "ID", uid: "idColaborador" },
  { name: "Nombre y apellidos", uid: "nombre" },
  { name: "Cedula", uid: "cedula" },
  { name: "Correo", uid: "correo" },
  { name: "Telefono", uid: "telefono" },
  { name: "Estado", uid: "estado" },
  { name: "Rol", uid: "idRol" },
  { name: "Acciones", uid: "acciones" },
];

interface Colaborador {
  idColaborador: string;
  nombre: string;
  cedula: string;
  correo: string;
  telefono: string;
  contrasena: string;
  estado: string;
  idRol: number;
}

export default function ColaboradorPage() {
  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Colaboradores") == false) {
        window.location.href = "../../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Colaboradores"));
    }
  }, []);
  const [colaborador, setColaborador] = React.useState<Colaborador[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [selectedColaborador, setSelectedColaborador] =
    React.useState<Colaborador | null>(null);
  const [selectedEstado, setSelectedEstado] = React.useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isOpenEstado,
    onOpen: onOpenEstado,
    onClose: onCloseEstado,
  } = useDisclosure();
  const {
    isOpen: isOpenError,
    onOpen: onOpenError,
    onClose: onCloseError,
  } = useDisclosure();
  const [mensajeError, setMensajeError] = React.useState("");

  React.useEffect(() => {
    getWithAuth("http://10.170.83.243:8080/colaborador")
      .then((response) => response.json())
      .then((data) => {
        const processedData = data.map(
          (item: {
            idColaborador: any;
            nombre: any;
            cedula: any;
            correo: any;
            telefono: any;
            contrasena: any;
            estado: any;
            idRol: any;
          }) => ({
            idColaborador: item.idColaborador,
            nombre: item.nombre,
            cedula: item.cedula,
            correo: item.correo,
            telefono: item.telefono,
            contrasena: item.contrasena,
            estado: item.estado,
            idRol: item.idRol,
          })
        );
        setColaborador(processedData);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, []);

  const rowsPerPage = 6;

  const colaboradorFiltrado = React.useMemo(() => {
    return colaborador.filter(
      (col) =>
        col.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.estado.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.idColaborador.toString().includes(searchTerm.toLowerCase()) ||
        col.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.telefono.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.contrasena.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.idRol.toString().includes(searchTerm.toLowerCase())
    );
  }, [colaborador, searchTerm]);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return colaboradorFiltrado.slice(start, end);
  }, [page, colaboradorFiltrado]);

  const handleDelete = async (idColaborador: string) => {
    try {
      const response = await deleteWithAuth(
        `http://10.170.83.243:8080/colaborador/${idColaborador}`
      );
      if (response.ok) {
        setColaborador(
          colaborador.filter((col) => col.idColaborador !== idColaborador)
        );
      } else {
        setMensajeError("Error al eliminar el colaborador");
        onOpenError();
      }
    } catch (error) {
      setMensajeError("Error al enviar la solicitud");
      onOpenError();
    }
    onClose();
  };

  const confirmDelete = (colaborador: Colaborador) => {
    setSelectedColaborador(colaborador);
    onOpen();
  };

  const handleChangeEstado = async () => {
    if (!selectedColaborador) return;
    try {
      const response = await postWithAuth(
        `http://10.170.83.243:8080/colaborador/${selectedColaborador.idColaborador}/estado`,
        { estado: selectedEstado }
      );
      if (response.ok) {
        setColaborador(
          colaborador.map((col) =>
            col.idColaborador === selectedColaborador.idColaborador
              ? { ...col, estado: selectedEstado }
              : col
          )
        );
        onCloseEstado();
      } else {
        setMensajeError("Error al cambiar el estado del colaborador");
        onOpenError();
      }
    } catch (error) {
      setMensajeError("Error al enviar la solicitud");
      onOpenError();
    }
  };

  const openEstadoModal = (colaborador: Colaborador) => {
    setSelectedColaborador(colaborador);
    setSelectedEstado(
      colaborador.estado === "Activo" ? "Desactivado" : "Activo"
    );
    onOpenEstado();
  };

  return (
    <>
      {acceso ? (
        <div>
          <h1 className={title()}>Colaboradores</h1>

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
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="basis-1/2"></div>
            <div className="mb-4 basis-1/4 sm:my-4 text-end">
              <Button
                isIconOnly
                className="bg-gradient-to-tr from-red-600 to-red-100"
                aria-label="Crear Colaborador"
              >
                <FileBarChart2 />
              </Button>
              <Link href="/admin/agendamiento/colaboradores/crear">
                <Button
                  className="ml-2 bg-gradient-to-tr from-red-600 to-orange-300"
                  aria-label="Crear Colaborador"
                >
                  <PlusIcon />
                  Crear Colaborador
                </Button>
              </Link>
            </div>
          </div>

          <Table
            className="mb-8"
            isStriped
            bottomContent={
              <div className="flex justify-center w-full">
                <Pagination
                  showControls
                  color="warning"
                  page={page}
                  total={Math.ceil(colaboradorFiltrado.length / rowsPerPage)}
                  onChange={(page) => setPage(page)}
                />
              </div>
            }
          >
            <TableHeader
              columns={columns.filter((column) => column.uid !== "idRol")}
            >
              {(column) => (
                <TableColumn className="text-base" key={column.uid}>
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={items}>
              {items.map((item: Colaborador) => (
                <TableRow key={item.idColaborador}>
                  {columns
                    .filter((column) => column.uid !== "idRol")
                    .map((column) => (
                      <TableCell key={column.uid}>
                        {column.uid === "estado" ? (
                          <Chip
                            onClick={() => openEstadoModal(item)}
                            variant="bordered"
                            className="transition-transform duration-100 ease-in-out cursor-pointer hover:scale-110"
                            color={
                              item.estado === "Activo" ? "success" : "danger"
                            }
                          >
                            {item.estado}
                          </Chip>
                        ) : column.uid === "acciones" ? (
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
                                href={`/admin/agendamiento/colaboradores/editar/${item.idColaborador}`}
                              >
                                <Button className="w-full bg-transparent">
                                  <Edit />
                                  Editar Colaborador
                                </Button>
                              </DropdownItem>
                              <DropdownItem>
                                <Button
                                  className="w-full bg-transparent"
                                  onClick={() => confirmDelete(item)}
                                >
                                  <Trash2Icon />
                                  Eliminar Colaborador
                                </Button>
                              </DropdownItem>
                              <DropdownItem
                                href={`/admin/agendamiento/colaboradores/contrasena/${item.idColaborador}`}
                              >
                                <Button className="w-full bg-transparent">
                                  <Edit />
                                  Editar Contraseña
                                </Button>
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        ) : (
                          item[column.uid as keyof Colaborador]
                        )}
                      </TableCell>
                    ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent>
              <ModalHeader className="flex flex-col items-center gap-1">
                <CircleHelp color="#fef08a" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className="text-3xl">¿Desea eliminar el colaborador?</h1>
                <p>Esta acción no se puede deshacer.</p>
              </ModalBody>
              <ModalFooter>
                <Button color="warning" variant="light" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="danger"
                  variant="light"
                  onClick={() =>
                    handleDelete(selectedColaborador!.idColaborador)
                  }
                >
                  Eliminar
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Modal isOpen={isOpenEstado} onClose={onCloseEstado}>
            <ModalContent>
              <ModalHeader className="flex flex-col items-center gap-1">
                <CircleHelp color="#fef08a" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className="text-3xl">
                  ¿Desea cambiar el estado del colaborador?
                </h1>
                <p>El estado se cambiará a {selectedEstado}.</p>
              </ModalBody>
              <ModalFooter>
                <Button color="warning" variant="light" onClick={onCloseEstado}>
                  Cancelar
                </Button>
                <Button
                  color="danger"
                  variant="light"
                  onClick={handleChangeEstado}
                >
                  Cambiar Estado
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Modal isOpen={isOpenError} onClose={onCloseError}>
            <ModalContent>
              <ModalHeader className="flex flex-col items-center gap-1">
                <CircleX color="red" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className="text-3xl">Error</h1>
                <p>{mensajeError}</p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" onClick={onCloseError}>
                  Cerrar
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </div>
      ) : (
        <CircularProgress color="warning" aria-label="Cargando..." />
      )}
    </>
  );
}

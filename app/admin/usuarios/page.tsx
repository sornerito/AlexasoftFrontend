"use client";
import { title } from "@/components/primitives";
import React from "react";
import { PlusIcon, Ellipsis, Edit, CircleHelp, CircleX } from "lucide-react";
import { useMediaQuery } from "react-responsive";

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
} from "@nextui-org/react";
import {
  postWithAuth,
  getWithAuth,
  verificarAccesoPorPermiso,
} from "@/config/peticionesConfig";

//Encabezado de la tabla, el uid debe coincidir con la forma en la que procesamos la data en el fetch
const columns = [
  { name: "ID", uid: "idUsuario" },
  { name: "Nombres y Apellidos", uid: "nombre" },
  { name: "Correo", uid: "correo" },
  { name: "Teléfono", uid: "telefono" },
  { name: "Estado", uid: "estado" },
  { name: "Rol", uid: "rol" },
  { name: "Acciones", uid: "acciones" },
];

//Molde con el que procesaremos los datos. ES DIFERENTE a como el json trae los datos
interface Usuario {
  idUsuario: string;
  nombre: string;
  correo: string;
  telefono: string;
  estado: string;
  rol: string;
}

export default function UsuariosPage() {
  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Usuarios") == false) {
        window.location.href = "../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Usuarios"));
    }
  }, []);

  //Hooks generales/principales
  const tamanoMovil = useMediaQuery({ maxWidth: 768 }); //Tamaño md de tailwind
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]); // Hook que guarda los usuarios procesados
  const [searchTerm, setSearchTerm] = React.useState(""); // Hook para buscar
  const [page, setPage] = React.useState(1); // Hook, dice la pagina que carga por defecto
  const { isOpen, onOpen, onOpenChange } = useDisclosure(); //Hook del modal para cambiar estado
  const { isOpen: isOpenWarning, 
    onOpen: onOpenWarning, 
    onOpenChange: onOpenChangeWarning } = useDisclosure();
  const {
    isOpen: isOpenError,
    onOpen: onOpenError,
    onOpenChange: onOpenChangeError,
  } = useDisclosure(); //Hook de modal error
  const [mensajeError, setMensajeError] = React.useState(""); //Mensaje de error
  // Hacer Fetch para obtener usuarios y acomodarlos a conveniencia
  React.useEffect(() => {
      getWithAuth("http://localhost:8080/usuario")
        .then((response: any) => {
          if(response.status === 204){
            setMensajeError("No hay usuarios, ¡Crea uno nuevo!");
            onOpenWarning()
            return [];
          }else{
            return response.json();
          }
        })
        .then((data: any) => {
          const processedData: Usuario[] = data.map(
            (item: {
              usuario: {
                idUsuario: any;
                nombre: any;
                correo: any;
                telefono: any;
                contrasena: any;
                estado: any;
                idRol: any;
              };
              rolNombre: any;
            }) => ({
              idUsuario: item.usuario.idUsuario,
              nombre: item.usuario.nombre,
              correo: item.usuario.correo,
              telefono: item.usuario.telefono,
              estado: item.usuario.estado,
              rol: item.rolNombre,
            })
          );
          setUsuarios(processedData);
        })
        .catch((err: any) => {
          console.log(err.message);
        });
    
  }, []);

  // CONFIGURACION DE PAGINACION Y BUSQUEDA(FILTRO)
  const rowsPerPage = 6; //Numero de registros por pagina

  // Filtra segun el value del hook de buscar
  const usuariosFiltrados = React.useMemo(() => {
    return usuarios.filter(
      (usuario) =>
        usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.estado.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.idUsuario.includes(searchTerm.toLowerCase()) ||
        usuario.rol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.telefono.includes(searchTerm.toLowerCase())
    );
  }, [usuarios, searchTerm]);

  // Distribuye los registros segun los usuarios filtrados (si no hay filtro muestra todos)
  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return usuariosFiltrados.slice(start, end);
  }, [page, usuariosFiltrados]);

  const [usuarioId, setUsuarioId] = React.useState("");
  const [estadoActual, setEstadoActual] = React.useState("");
  const cambiarEstado = async (idUsuario: any, estadoActual: any) => {
    const data = {
      estado: estadoActual,
    };
    try {
      const response = await postWithAuth(
        "http://localhost:8080/usuario/cambiarEstado/" + idUsuario,
        data
      );

      if (response.ok) {
        const nuevoEstado =
          estadoActual === "Activo" ? "Desactivado" : "Activo";
        setUsuarios((prevUsuarios) =>
          prevUsuarios.map((usuario) =>
            usuario.idUsuario === idUsuario
              ? { ...usuario, estado: nuevoEstado }
              : usuario
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

  const handleEstadoChange = async (idUsuario: any, estado: any) => {
    setUsuarioId(idUsuario);
    setEstadoActual(estado);
    onOpen();
  };

  return (
    <>
      {acceso ? (
        <div>
          <h1 className={title()}>Usuarios</h1>
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
            <div className="basis-1/4 mb-4 sm:my-4 text-end">
              <Link href="/admin/usuarios/crear">
                <Button
                  className="bg-gradient-to-tr from-red-600 to-orange-300"
                  aria-label="Crear Usuario"
                >
                  <PlusIcon />
                  Crear Usuario
                </Button>
              </Link>
            </div>
          </div>

          {tamanoMovil ? (
            <div>
              {items.map((item) => (
                <div key={item.idUsuario}>
                  <Card className="mb-4 group" aria-label="Tarjeta de usuario">
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
                          item.estado == "Activo" &&
                          item.correo != "alexandraAdmin@gmail.com" ? (
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
                                <DropdownItem
                                  href={`usuarios/editar/${item.idUsuario}`}
                                >
                                  <Button className="bg-transparent w-full">
                                    <Edit />
                                    Editar Usuario
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
                                handleEstadoChange(item.idUsuario, item.estado)
                              }
                            >
                              {item.estado}
                            </Chip>
                          ) : (
                            <span>{item[column.uid as keyof Usuario]}</span>
                          )}
                        </div>
                      ))}
                    </CardBody>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <Table className="mb-8" isStriped aria-label="Tabla de usuarios">
              <TableHeader columns={columns}>
                {(column) => (
                  <TableColumn className="text-base" key={column.uid}>
                    {column.name}
                  </TableColumn>
                )}
              </TableHeader>
              <TableBody items={items}>
                {(item) => (
                  <TableRow key={item.idUsuario}>
                    {columns.map((column) => (
                      <TableCell key={column.uid}>
                        {column.uid === "acciones" &&
                        item.estado == "Activo" &&
                        item.correo != "alexandraAdmin@gmail.com" ? (
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
                                href={`usuarios/editar/${item.idUsuario}`}
                              >
                                <Button className="bg-transparent w-full">
                                  <Edit />
                                  Editar Usuario
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
                            className="hover:scale-110 cursor-pointer transition-transform duration-100 ease-in-out"
                            onClick={() =>
                              handleEstadoChange(item.idUsuario, item.estado)
                            }
                          >
                            {item.estado}
                          </Chip>
                        ) : (
                          item[column.uid as keyof Usuario]
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
              total={Math.ceil(usuariosFiltrados.length / rowsPerPage)}
              onChange={(page) => setPage(page)}
            />
          </div>
          {/*Modal Cambiar Estado*/}
          <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col gap-1 items-center">
                    <CircleHelp color="#fef08a" size={100} />
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <h1 className=" text-3xl">
                      ¿Desea cambiar el estado del usuario?
                    </h1>
                    <p>
                      Hacerlo inhabilitará al usuario, bloqueando así sus
                      acciones.
                    </p>
                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                      Cancelar
                    </Button>
                    <Button
                      className="bg-[#609448]"
                      onPress={() => {
                        cambiarEstado(usuarioId, estadoActual);
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

        </div>
      ) : (
        <CircularProgress color="warning" aria-label="Cargando..." />
      )}
    </>
  );
}

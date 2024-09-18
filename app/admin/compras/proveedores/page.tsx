"use client";
import { title } from "@/components/primitives";
import React, { useState, useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import {
  PlusIcon,
  Ellipsis,
  Edit,
  CircleHelp,
  CircleX,
  Delete,
} from "lucide-react";
import { Toaster, toast } from "sonner";
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
  CircularProgress,
} from "@nextui-org/react";
import {
  deleteWithAuth,
  getWithAuth,
  postWithAuth,
  verificarAccesoPorPermiso,
} from "@/config/peticionesConfig";

const columns = [
  { name: "Id", uid: "idProveedor" },
  { name: "Tipo Empresa", uid: "tipoEmpresa" },
  { name: "N° NIT", uid: "numeroIdentificacion" },
  { name: "Nombre Empresa", uid: "nombre" },
  { name: "Contacto", uid: "contacto" },
  { name: "Teléfono", uid: "telefono" },
  { name: "Correo", uid: "correo" },
  { name: "Descripción", uid: "descripcion" },
  { name: "Estado", uid: "estado" },
  { name: "Acciones", uid: "acciones" },
];

interface Proveedor {
  idProveedor: string;
  nombre: string;
  contacto: string;
  descripcion: string;
  telefono: string;
  estado: string;
}

export default function ProveedoresPage() {
  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Proveedores") == false) {
        window.location.href = "../../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Proveedores"));
    }
  }, []);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedProveedorId, setSelectedProveedorId] = useState<string | null>(
    null
  );
  const [mensajeError, setMensajeError] = useState("");
  const [isOpenEliminar, setIsOpenEliminar] = useState(false);
  const onCloseEliminar = () => setIsOpenEliminar(false);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isOpenError,
    onOpen: onOpenError,
    onOpenChange: onOpenChangeError,
  } = useDisclosure();
  const {
    isOpen: isOpenWarning,
    onOpen: onOpenWarning,
    onOpenChange: onOpenChangeWarning,
  } = useDisclosure();
  const rowsPerPage = 6;
  const tamanoMovil = useMediaQuery({ maxWidth: 768 });

  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const response = await getWithAuth(
          "http://10.170.83.243:8080/compras/proveedores"
        );
        const data = await response.json();
        setProveedores(
          data.map((item: any) => ({
            idProveedor: item.idProveedor,
            nombre: item.nombre,
            correo: item.correo,
            tipoEmpresa: item.tipoEmpresa,
            numeroIdentificacion: item.numeroIdentificacion,
            descripcion: item.descripcion,
            contacto: item.contacto,
            telefono: item.telefono,
            estado: item.estado,
          }))
        );
      } catch (err: any) {
        if (err.message === "Unexpected end of JSON input") {
          setMensajeError("No hay Categoria Proveedores registradas aún.");
          onOpenWarning();
        } else {
          console.error("Error al obtener categorías de producto:", err);
          setMensajeError(
            "Error al obtener categorías de producto. Por favor, inténtalo de nuevo."
          );
          onOpenError();
        }
      }
    };

    fetchProveedores();
  }, [onOpenWarning,onOpenError]);

  const proveedoresFiltrados = React.useMemo(
    () =>
      proveedores.filter((proveedor) =>
        Object.values(proveedor).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      ),
    [proveedores, searchTerm]
  );

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return proveedoresFiltrados.slice(start, end);
  }, [page, proveedoresFiltrados]);

  const handleToggleEstado = React.useCallback(
    (idProveedor: string) => {
      const proveedor = proveedores.find(
        (proveedor) => proveedor.idProveedor === idProveedor
      );
      if (!proveedor) return;

      const updatedEstado =
        proveedor.estado === "Activo" ? "Desactivado" : "Activo";
      const updatedProveedor = { ...proveedor, estado: updatedEstado };

      const promise = new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          postWithAuth(
            `http://10.170.83.243:8080/compras/proveedores/editar/${idProveedor}`,

            updatedProveedor
          )
            .then((response) => {
              if (response.ok) {
                setProveedores((prevProveedores) =>
                  prevProveedores.map((p) =>
                    p.idProveedor === idProveedor ? updatedProveedor : p
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
                "Error al cambiar el estado del proveedor. Por favor, inténtalo de nuevo."
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
    },
    [proveedores,onOpenError]
  );

  const handleOpenModal = (idProveedor: string) => {
    setSelectedProveedorId(idProveedor);
    onOpen();
  };

  const handleEliminarProveedor = (idProveedor: string) => {
    setSelectedProveedorId(idProveedor);
    setIsOpenEliminar(true);
  };

  const handleDeleteProveedorModalConfirm = () => {
    deleteWithAuth(
      `http://10.170.83.243:8080/compras/proveedores/eliminar/${selectedProveedorId}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Error al eliminar el proveedor. Tiene un relación con una compra"
          );
        }
        toast.success("Proveedor eliminado con éxito!");
        setProveedores((prevProveedores) =>
          prevProveedores.filter(
            (proveedor) => proveedor.idProveedor !== selectedProveedorId
          )
        );
        onCloseEliminar();
      })
      .catch((error) => {
        console.error(error);
        setMensajeError(error.message);
        onOpenError();
        onCloseEliminar();
      });
  };

  // Retorno del componente
  return (
    <>
      {acceso ? (
        <div>
          <h1 className={title()}>Proveedores</h1>
          {/* Toaster para notificaciones */}
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
              <Link href="/admin/compras/proveedores/crear">
                <Button
                  className="bg-gradient-to-tr from-red-600 to-orange-300"
                  aria-label="Crear Proveedor"
                >
                  <PlusIcon /> Crear Proveedor
                </Button>
              </Link>
            </div>
          </div>
          {tamanoMovil ? (
            <div>
              {items.map((item) => (
                <Card key={item.idProveedor} className="mb-4">
                  <CardBody>
                    {columns.map((column) => (
                      <div key={column.uid}>
                        <strong>{column.name}: </strong>
                        {column.uid === "acciones" ? (
                          <Dropdown>
                            <DropdownTrigger className="w-auto my-2 bg-transparent">
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
                                href={`proveedores/editar/${item.idProveedor}`}
                                isDisabled={item.estado === "Desactivado"}
                              >
                                <Button
                                  className="w-full bg-transparent"
                                  disabled={item.estado === "Desactivado"}
                                >
                                  <Edit />
                                  Editar
                                </Button>
                              </DropdownItem>
                              <DropdownItem>
                                <Button
                                  className="w-full bg-transparent"
                                  onClick={() =>
                                    handleEliminarProveedor(item.idProveedor)
                                  }
                                >
                                  <Delete />
                                  Eliminar
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
                            onClick={() => handleOpenModal(item.idProveedor)}
                          >
                            {item.estado}
                          </Chip>
                        ) : (
                          <span>{item[column.uid as keyof Proveedor] || "N/A"}</span>
                        )}
                      </div>
                    ))}
                  </CardBody>
                </Card>
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
                  <TableRow key={item.idProveedor}>
                    {columns.map((column) => (
                      <TableCell key={column.uid}>
                        {column.uid === "acciones" ? (
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
                                key="editar"
                                href={`proveedores/editar/${item.idProveedor}`}
                                isDisabled={item.estado === "Desactivado"}
                              >
                                <Button
                                  className="w-full bg-transparent"
                                  disabled={item.estado === "Desactivado"}
                                >
                                  <Edit />
                                  Editar
                                </Button>
                              </DropdownItem>
                              <DropdownItem>
                                <Button
                                  className="w-full bg-transparent"
                                  onClick={() =>
                                    handleEliminarProveedor(item.idProveedor)
                                  }
                                >
                                  <Delete />
                                  Eliminar
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
                            onClick={() => handleOpenModal(item.idProveedor)}
                          >
                            {item.estado}
                          </Chip>
                        ) : (
                          item[column.uid as keyof Proveedor] || "N/A"
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
              total={Math.ceil(proveedoresFiltrados.length / rowsPerPage)}
              onChange={(page) => setPage(page)}
            />
          </div>

          <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col items-center gap-1">
                    <CircleHelp color="#fef08a" size={100} />
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <h1 className="text-3xl">
                      ¿Desea cambiar el estado al proveedor?
                    </h1>
                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                      Cancelar
                    </Button>
                    <Button
                      color="warning"
                      variant="light"
                      onPress={() => {
                        if (selectedProveedorId) {
                          handleToggleEstado(selectedProveedorId);
                        }
                        onClose();
                      }}
                    >
                      Cambiar
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>
          <Modal isOpen={isOpenEliminar} onClose={onCloseEliminar}>
            <ModalContent>
              <ModalHeader className="flex flex-col items-center gap-1">
                <CircleHelp color="#fef08a" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className="text-3xl">¿Desea eliminar el proveedor?</h1>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="warning"
                  variant="light"
                  onClick={onCloseEliminar}
                >
                  Cancelar
                </Button>
                <Button
                  color="danger"
                  variant="light"
                  onClick={handleDeleteProveedorModalConfirm}
                >
                  Eliminar
                </Button>
              </ModalFooter>
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

          {/* Modal de error */}
          <Modal isOpen={isOpenError} onOpenChange={onOpenChangeError}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col items-center gap-1">
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
        <CircularProgress color="warning" aria-label="Cargando..." />
      )}
    </>
  );
}

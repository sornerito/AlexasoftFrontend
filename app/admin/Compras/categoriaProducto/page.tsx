"use client";
import { title } from "@/components/primitives";
import React, { useState, useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import { PlusIcon, Ellipsis, Edit, CircleHelp, CircleX, Delete } from "lucide-react";
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
import { deleteWithAuth, getWithAuth, postWithAuth, verificarAccesoPorPermiso } from "@/config/peticionesConfig";

const columns = [
  { name: "Id", uid: "idCategoriaProducto" },
  { name: "Nombre", uid: "nombre" },
  { name: "Estado", uid: "estado" },
  { name: "Acciones", uid: "acciones" }

];

interface CategoriaProducto {
  idCategoriaProducto: string;
  nombre: string;
  estado: string;
}

export default function CategoriasProductoPage() {
  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Categoria de Productos") == false) {
        window.location.href = "../../../../acceso/noAcceso"
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Categoria de Productos"));
    }
  }, []);

  const [categoriasProducto, setCategoriasProducto] = useState<CategoriaProducto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCategoriaProductoId, setSelectedCategoriaProductoId] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState("");
  const [isOpenEliminar, setIsOpenEliminar] = useState(false);
  const onCloseEliminar = () => setIsOpenEliminar(false);
  const [selectedProveedorId, setSelectedProveedorId] = useState<string | null>(null);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { isOpen: isOpenError, onOpen: onOpenError, onOpenChange: onOpenChangeError } = useDisclosure();
  const { isOpen: isOpenWarning, onOpen: onOpenWarning, onOpenChange: onOpenChangeWarning } = useDisclosure();
 

  const rowsPerPage = 6;
  const tamanoMovil = useMediaQuery({ maxWidth: 768 });

  useEffect(() => {
    const fetchCategoriasProducto = async () => {
      try {
        const response = await getWithAuth("http://localhost:8080/compras/categorias-producto");
        const data = await response.json();
        setCategoriasProducto(data.map((item: any) => ({
          idCategoriaProducto: item.idCategoriaProducto,
          nombre: item.nombre,
          estado: item.estado,
        })));
      } catch (err:any) {
        if (err.message === "Unexpected end of JSON input") {
          setMensajeError("No hay Categoria Producto registradas aún.");
          onOpenWarning();
        }else{
          console.error("Error al obtener categorías de producto:", err);
        setMensajeError("Error al obtener categorías de producto. Por favor, inténtalo de nuevo.");
        onOpenError();
        }
        
      }
    };

    fetchCategoriasProducto();
  }, []);

  const categoriasProductoFiltradas = React.useMemo(() =>
    categoriasProducto.filter((categoria) =>
      Object.values(categoria).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    ),
    [categoriasProducto, searchTerm]
  );

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return categoriasProductoFiltradas.slice(start, end);
  }, [page, categoriasProductoFiltradas]);

  const handleEliminarCategoriaProducto = (idCategoriaProducto: string) => {
    setSelectedCategoriaProductoId(idCategoriaProducto);
    setIsOpenEliminar(true);
  };

  const handleToggleEstado = React.useCallback((idCategoriaProducto: string) => {
    const categoria = categoriasProducto.find(categoria => categoria.idCategoriaProducto === idCategoriaProducto);
    if (!categoria) return;

    const updatedEstado = categoria.estado === "Activo" ? "Desactivado" : "Activo";
    const updatedCategoria = { ...categoria, estado: updatedEstado };

    const promise = new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        postWithAuth(`http://localhost:8080/compras/categorias-producto/${idCategoriaProducto}`,
          updatedCategoria
        ).then(response => {
          if (response.ok) {
            setCategoriasProducto(prevCategorias => prevCategorias.map(c => c.idCategoriaProducto === idCategoriaProducto ? updatedCategoria : c));
            resolve();
            console.log('El estado ha sido cambiado con éxito');
          } else {
            reject(new Error('Error al cambiar el estado'));
          }
        })
          .catch(error => {
            console.error("Error al cambiar el estado:", error);
            setMensajeError("Error al cambiar el estado de la categoría. Por favor, inténtalo de nuevo.");
            onOpenError();
            reject();
          })
      }, 1000);
    });
    toast.promise(promise, {
      loading: 'Editando...',
      success: 'El estado ha sido cambiado con éxito',
      error: (err) => err.message,
    });
  }, [categoriasProducto]);


  const handleDeleteCategoriaProductoModalConfirm = () => {
    deleteWithAuth(`http://localhost:8080/compras/categorias-producto/eliminar/${selectedCategoriaProductoId}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al eliminar la categoría de producto. (Puede que este relacionado con producto)');
        }

        setCategoriasProducto((prevCategorias) =>
          prevCategorias.filter((categoria) => categoria.idCategoriaProducto !== selectedCategoriaProductoId)
        );
        onCloseEliminar();
      })
      .catch((error) => {
        console.error(error);
        setMensajeError(error.message);
        onOpenError();
      });
  };


  const handleOpenModal = (idProveedor: string) => {
    setSelectedProveedorId(idProveedor);
    onOpen();
  };

  return (
    <>
      {acceso ? (

        <div>
          <h1 className={title()}>Categorías de Producto</h1>
          <Toaster position="top-left" />

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
              <Link href="/admin/compras/categoriaProducto/crear">
                <Button className="bg-gradient-to-tr from-red-600 to-orange-300" aria-label="Crear Categoría">
                  <PlusIcon /> Crear Categoría
                </Button>
              </Link>
            </div>
          </div>
          {tamanoMovil ? (
            <div>
              {items.map((item) => (
                <Card key={item.idCategoriaProducto} className="mb-4">
                  <CardBody>
                    {columns.map((column) => (
                      <div key={column.uid}>
                        <strong>{column.name}: </strong>
                        {column.uid === "acciones" ? (
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
                              <DropdownItem href={`categoriaProducto/editar/${item.idCategoriaProducto}`}>

                                <Button className="bg-transparent w-full">
                                  <Edit />
                                  Editar
                                </Button>
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        ) : (
                          <span>{item[column.uid as keyof CategoriaProducto]}</span>
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
                  <TableRow key={item.idCategoriaProducto}>
                    {columns.map((column) => (
                      <TableCell key={column.uid}>
                        {column.uid === "acciones" ? (
                          <Dropdown>
                            <DropdownTrigger>
                              <Button aria-label="Acciones" className="bg-transparent" isDisabled={item.estado === "Desactivado"}>
                                <Ellipsis />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                              onAction={(action) => console.log(action)}
                            >
                              <DropdownItem href={`categoriaProducto/editar/${item.idCategoriaProducto}`}>
                                <Button className="bg-transparent w-full">
                                  <Edit />
                                  Editar
                                </Button>
                              </DropdownItem>
                              <DropdownItem>
                                <Button className="bg-transparent w-full" onClick={() => handleEliminarCategoriaProducto(item.idCategoriaProducto)}>
                                  <Delete />
                                  Eliminar
                                </Button>
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        ) : column.uid === "estado" ? (
                          <Chip
                            color={item.estado === "Activo" ? "success" : "danger"}
                            variant="bordered"
                            className="hover:scale-90 cursor-pointer transition-transform duration-100 ease-in-out align-middle"
                            onClick={() =>
                              handleOpenModal(item.idCategoriaProducto)
                            }
                          >
                            {item.estado}
                          </Chip>
                        ) : (
                          item[column.uid as keyof CategoriaProducto]
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
              total={Math.ceil(categoriasProductoFiltradas.length / rowsPerPage)}
              onChange={(page) => setPage(page)}
            />
          </div>

          <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col gap-1 items-center">
                    <CircleHelp color="#fef08a" size={100} />
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <h1 className="text-3xl">¿Desea cambiar el estado de categoria producto?</h1>
                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                      Cancelar
                    </Button>
                    <Button
                      className="bg-[#609448]"
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

          {/* Modal Eliminar */}
          <Modal isOpen={isOpenEliminar} onClose={onCloseEliminar}>
            <ModalContent>
              <ModalHeader className="flex flex-col gap-1 items-center">
                <CircleHelp color="#fef08a" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className="text-3xl">¿Desea eliminar la categoría de producto?</h1>
              </ModalBody>
              <ModalFooter>
                <Button color="warning" variant="light" onClick={onCloseEliminar}>Cancelar</Button>
                <Button color="danger" variant="light" onClick={handleDeleteCategoriaProductoModalConfirm}>Eliminar</Button>
              </ModalFooter>
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
        <CircularProgress color="warning" aria-label="Cargando..." />
      )}
    </>
  );
}

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
import { getWithAuth, postWithAuth, verificarAccesoPorPermiso } from "@/config/peticionesConfig";

const columns = [
  { name: "ID", uid: "idProducto" },
  { name: "Nombre", uid: "nombre" },
  { name: "Marca", uid: "marca" },
  { name: "Precio Compra", uid: "precioporunidad" }, // Ahora se muestra "Precio Compra"
  { name: "Precio venta", uid: "precio" },
  { name: "Unidades", uid: "unidades" },
  { name: "Estado", uid: "estado" },
  { name: "Categoria", uid: "categoria" },
  { name: "Acciones", uid: "acciones" }
];

interface Producto {
  idProducto: number;
  nombre: string;
  marca: string;
  precio: number;
  unidades: number;
  estado: string;
  categoria: string;
  imangenes: string;
}

interface Compras {
  unidades: number,
  idCompra: number,
  idProducto: number,
  precioporunidad: number,
}

export default function ProductosPage() {
  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Productos") == false) {
        window.location.href = "../../../../acceso/noAcceso"
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Productos"));
    }
  }, []);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [compras, setCompras] = useState<Compras[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedProductoId, setSelectedProductoId] = useState<number | null>(null);
  const [mensajeError, setMensajeError] = useState("");
  const [isOpenEliminar, setIsOpenEliminar] = useState(false);
  const onCloseEliminar = () => setIsOpenEliminar(false);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { isOpen: isOpenError, onOpen: onOpenError, onOpenChange: onOpenChangeError } = useDisclosure();
  const { isOpen: isOpenWarning, onOpen: onOpenWarning, onOpenChange: onOpenChangeWarning } = useDisclosure();

  const rowsPerPage = 6;
  const tamanoMovil = useMediaQuery({ maxWidth: 768 });

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await getWithAuth("http://localhost:8080/compras/productos");
        const data = await response.json();
        setProductos(data.map((item: any) => ({
          idProducto: item.idProducto,
          nombre: item.nombre,
          marca: item.idMarca.nombre,
          precio: item.precio,
          unidades: item.unidades,
          estado: item.estado,
          categoria: item.idCategoriaProducto.nombre,
          imagenes: item.imagenes,
        })));
      } catch (err: any) {
        if (err.message === "Unexpected end of JSON input") {
          setMensajeError("No hay Categoria Producto registradas aún.");
          onOpenWarning();
        } else {
          console.error("Error al obtener Producto:", err);
          setMensajeError("Error al obtener Producto. Por favor, inténtalo de nuevo.");
          onOpenError();
        }

      }

    };

    fetchProductos();
  }, []);
  useEffect(() => {
    const fetchProductosCompra = async () => {
      try {
        const response = await getWithAuth("http://localhost:8080/compras/detalle-producto-compra-producto");
        const data = await response.json();
        setCompras(data
          .map((item: any) => ({
            unidades: item.unidades,
            idCompra: item.idCompra,
            idProducto: item.idProducto,
            precioporunidad: item.precioporunidad,
          }))
          .sort((a: { idCompra: number }, b: { idCompra: number }) => b.idCompra - a.idCompra)
        );
      } catch (err) {
        console.error("Error al obtener detalle de compras:", err);
        setMensajeError("Error al obtener detalle de compras. Por favor, inténtalo de nuevo.");
        onOpenError();
      }
    };

    fetchProductosCompra();
  }, []);

  const productosConPrecioCompra = React.useMemo(() => {
    return productos.map(producto => {
      const compra = compras.find(c => c.idProducto === producto.idProducto);
      return {
        ...producto,
        precioporunidad: compra ? compra.precioporunidad : 0
      };
    });
  }, [productos, compras]);

  const productosFiltrados = React.useMemo(() =>
    productosConPrecioCompra.filter((producto) =>
      Object.entries(producto).some(([key, value]) =>
        key === "precio" && typeof value === "number"
          ? value.toString().toLowerCase().includes(searchTerm.replace(/[$,.]/g, "").toLowerCase())
          : String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    ),
    [productosConPrecioCompra, searchTerm]
  );

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return productosFiltrados.slice(start, end);
  }, [page, productosFiltrados]);

  const handleToggleEstado = React.useCallback((idProducto: number) => {
    const producto = productos.find(producto => producto.idProducto === idProducto);
    if (!producto) return;

    const updatedEstado = producto.estado === "Activo" ? "Desactivado" : "Activo";

    const promise = new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        postWithAuth(`http://localhost:8080/compras/productos/${idProducto}`, { estado: updatedEstado })
          .then(response => {
            if (response.ok) {
              setProductos(prevProductos => prevProductos.map(p => p.idProducto === idProducto ? { ...p, estado: updatedEstado } : p));
              resolve();
            } else {
              response.text().then(text => reject(new Error(text)));
            }
          })
          .catch(error => {
            console.error("Error al cambiar el estado:", error);
            setMensajeError("Error al cambiar el estado del producto. Por favor, inténtalo de nuevo.");
            onOpenError();
            reject(error);
          });
      }, 1000);
    });

    toast.promise(promise, {
      loading: 'Editando...',
      success: 'El estado ha sido cambiado con éxito',
      error: (err) => err.message,
    });
  }, [productos, onOpenError]);
  ;

  const handleOpenModal = (idProducto: number) => {
    setSelectedProductoId(idProducto);
    onOpen();
  };

  // Función formatear el total de string a número con formato de moneda
  const formatCurrency = (valor: string | number, currencyCode: string = 'COP') => {
    let valorString = valor.toString();
    const valorNumerico = parseFloat(valorString.replace(/[^\d.,]/g, '').replace(',', '.'));

    if (isNaN(valorNumerico)) {
      console.error("Error al convertir el valor a número:", valorString);
      return 'N/A';
    }
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      notation: "standard",
    }).format(valorNumerico);
  };


  return (
    <>
      {acceso ? (


        <div>
          <h1 className={title()}>Productos</h1>
          {/* Toaster para notificaciones */}
          <Toaster position="bottom-right" />

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
              <Link href="/admin/compras/producto/crear">
                <Button className="bg-gradient-to-tr from-red-600 to-orange-300" aria-label="Crear Producto">
                  <PlusIcon /> Crear Producto
                </Button>
              </Link>
            </div>
          </div>
          {tamanoMovil ? (
            <div>
              {items.map((item) => (
                <Card key={item.idProducto} className="mb-4">
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
                                href={'producto/editar/${item.idProducto}'}
                                isDisabled={item.estado === "Desactivado"}
                              >
                                <Button className="bg-transparent w-full" disabled={item.estado === "Desactivado"}>
                                  <Edit />
                                  Editar
                                </Button>
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        ) : column.uid === "precio" ? (
                          formatCurrency(item.precio)
                        ) : column.uid === "estado" ? (
                          <Chip
                            color={item.estado === "Activo" ? "success" : "danger"}
                            variant="bordered"
                            className="hover:scale-90 cursor-pointer transition-transform duration-100 ease-in-out align-middle"
                            onClick={() =>
                              handleOpenModal(item.idProducto)
                            }
                          >
                            {item.estado}
                          </Chip>
                        ) : column.uid === "precio" ? (
                          formatCurrency(item.precio)
                        ) : column.uid === "precioporunidad" ? (
                          formatCurrency(item.precioporunidad)
                        ) : (
                          <span>{item[column.uid as keyof Producto]}</span>
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
                  <TableRow key={item.idProducto}>
                    {columns.map((column) => (
                      <TableCell key={column.uid}>
                        {column.uid === "acciones" ? (
                          <Dropdown>
                            <DropdownTrigger>
                              <Button aria-label="Acciones" className="bg-transparent" isDisabled={item.estado === "Desactivado"}
                              >
                                <Ellipsis />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                              onAction={(action) => console.log(action)}
                            >
                              <DropdownItem
                                key="editar"
                                href={`producto/editar/${item.idProducto}`}
                                isDisabled={item.estado === "Desactivado"}
                              >
                                <Button className="bg-transparent w-full">
                                  <Edit />
                                  Editar
                                </Button>
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        ) : column.uid === "precio" ? (
                          formatCurrency(item.precio)
                        ) : column.uid === "precioporunidad" ? (
                          formatCurrency(item.precioporunidad)
                        ) : column.uid === "estado" ? (
                          <Chip
                            color={item.estado === "Activo" ? "success" : "danger"}
                            variant="bordered"
                            className="hover:scale-110 cursor-pointer transition-transform duration-100 ease-in-out"
                            onClick={() =>
                              handleOpenModal(item.idProducto)
                            }
                          >
                            {item.estado}
                          </Chip>
                        ) : (
                          item[column.uid as keyof Producto]
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
              total={Math.ceil(productosFiltrados.length / rowsPerPage)}
              onChange={(page) => setPage(page)}
            />
          </div>

          {/* Modal Cambiar Estado */}
          <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col gap-1 items-center">
                    <CircleHelp color="#fef08a" size={100} />
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <h1 className="text-3xl">¿Desea cambiar el estado del producto?</h1>
                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                      Cancelar
                    </Button>
                    <Button
                      className="bg-[#609448]"
                      onPress={() => {
                        if (selectedProductoId) {
                          handleToggleEstado(selectedProductoId);
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
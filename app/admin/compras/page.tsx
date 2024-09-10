"use client";
import { title } from "@/components/primitives"
import React, { useState, useEffect, useRef } from "react";
import { useMediaQuery } from "react-responsive";
import { PlusIcon, Ellipsis, Edit, CircleHelp, CircleX, Eye } from "lucide-react";
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
  Spinner,
  SelectItem,
  Select,
  CircularProgress,
} from "@nextui-org/react";
import { getWithAuth, postWithAuth, verificarAccesoPorPermiso } from "@/config/peticionesConfig";

const columns = [
  { name: "ID", uid: "idCompra" },
  { name: "Proveedor", uid: "idProveedor" },
  { name: "Subtotal", uid: "subtotal" },
  { name: "Precio", uid: "precio" },
  { name: "Fecha", uid: "fecha" },
  { name: "Motivo Anulación", uid: "motivoAnular" },
  { name: "Acciones", uid: "acciones" }
];

interface Compra {
  idCompra: string;
  idProveedor: string;
  precio: number;
  fecha: string;
  subtotal: number;
  motivoAnular: string;
}

export default function ComprasPage() {
  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Compras") == false) {
        window.location.href = "../../../../acceso/noAcceso"
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Compras"));
    }
  }, []);

  const [compras, setCompras] = useState<Compra[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [compraDetalles, setCompraDetalles] = useState<any | null>([]);
  const [page, setPage] = useState(1);
  const [mensajeError, setMensajeError] = useState("");
  const { isOpen: isOpenDetalles, onOpen: onOpenDetalles, onOpenChange: onOpenChangeDetalles } = useDisclosure();
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen: isOpenEdit, onOpen: onOpenEdit, onOpenChange: onOpenChangeEdit } = useDisclosure();
  const [motivoAnular, setMotivoAnular] = useState("") || null;
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);
  const [agrupados, setAgrupados] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<Map<string, string>>(new Map());
  const { isOpen: isOpenWarning, onOpen: onOpenWarning, onOpenChange: onOpenChangeWarning } = useDisclosure();
  const { isOpen: isOpenError, onOpen: onOpenError, onOpenChange: onOpenChangeError } = useDisclosure();

  const rowsPerPage = 6;
  const tamanoMovil = useMediaQuery({ maxWidth: 768 });

  // Función para obtener los detalles de la venta
  const fetchCompraDetalles = async (idCompra: string) => {
    try {
      // Petición para obtener los detalles del producto (primera petición)
      const productosResponse = await getWithAuth(`http://localhost:8080/compras/detalle-producto-compra-producto`);
      const productosData = await productosResponse.json();

      // Verificamos si productosData es un array y tiene datos
      if (!Array.isArray(productosData) || productosData.length === 0) {
        throw new Error("No se encontraron detalles de productos.");
      }

      // Petición para obtener los detalles de la compra (segunda petición)
      const compraResponse = await getWithAuth(`http://localhost:8080/compras/detalle-producto-compra/${idCompra}`);
      const compraData = await compraResponse.json();
      console.log(compraData);

      // Filtramos los detalles de productos según la compra seleccionada (idCompra)
      const productosFiltrados = productosData.filter((detalle: any) => detalle.idCompra === idCompra);

      // Mapeamos las unidades por idProducto para la compra seleccionada
      const unidadesPorProducto: any = productosFiltrados.reduce((acc: any, detalle: any) => {
        acc[detalle.idProducto] = detalle.unidades;  
        return acc;
      }, {});

      console.log("Unidades por producto filtradas:", unidadesPorProducto); // Añadimos log para verificar las unidades

      // Actualizamos los productos con la cantidad obtenida en la primera petición
      const updatedProductos = compraData.productos.map((producto: any) => {
        return {
          ...producto,
          unidadesVendidas: unidadesPorProducto[producto.idProducto] || 0, 
        };
      });

      console.log("Productos actualizados:", updatedProductos);  

      // Agrupamos los productos por idProducto sin sumar, solo asignando la cantidad existente
      const productosAgrupados: any[] = updatedProductos.reduce((acc: any, producto: any) => {
        if (!acc[producto.idProducto]) {
          
          acc[producto.idProducto] = { ...producto, cantidad: producto.unidadesVendidas };
        }
        return acc;
      }, {});

      const productosAgrupadosArray: any[] = Object.values(productosAgrupados);
      setAgrupados(productosAgrupadosArray);

      // Combinamos la respuesta con los productos actualizados
      const mergedData = {
        ...compraData,
        productos: productosAgrupadosArray,
      };

      return mergedData;
    } catch (err: any) {
      console.error("Error al obtener Detalle de compras por producto:", err);
      setMensajeError("Error al obtener Detalle de compras por producto. Por favor, inténtalo de nuevo.");
      onOpenError();
    }
  };







  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const response = await getWithAuth("http://localhost:8080/compras/proveedores");
        const data = await response.json();
        const map = new Map();
        data.forEach((item: any) => {
          map.set(item.idProveedor, item.nombre);
        });
        setProveedores(map);
      } catch (err) {
        console.error("Error al obtener proveedores: No hay algun registro o la conexion esta dañada", err);
        setMensajeError("Error al obtener proveedores. Por favor, inténtalo de nuevo.");
        onOpenError();
      }
    };

    fetchProveedores();
  }, []);

  useEffect(() => {
    const fetchCompras = async () => {
      try {
        const response = await getWithAuth("http://localhost:8080/compras");
        const data = await response.json();
        setCompras(data.map((item: any) => {
          const idCompra = item.idCompra || {};
          const idProveedor = idCompra.idProveedor || {};

          return {
            idCompra: idCompra.idCompra || 0,
            idProveedor: idProveedor.idProveedor || 0,
            precio: idCompra.precio || 0,
            fecha: idCompra.fecha || "",
            subtotal: idCompra.subtotal || 0,
            motivoAnular: idCompra.motivoAnular || "",
          };
        }));
      } catch (err: any) {
        if (err.message === "Unexpected end of JSON input") {
          setMensajeError("No hay Categoria Compras registradas aún.");
          onOpenWarning();
        } else {
          console.error("Error al obtener Compras de producto:", err);
          setMensajeError("Error al obtener Compras de producto. Por favor, inténtalo de nuevo.");
          onOpenError();
        }

      }
    };

    fetchCompras();
  }, []);


  const comprasFiltradas = React.useMemo(() =>
    compras.filter((compra) =>
      Object.entries(compra).some(([key, value]) =>
        key === "precio" && typeof value === "number"
          ? value.toString().toLowerCase().includes(searchTerm.replace(/[$,.]/g, "").toLowerCase())
          : String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    ),
    [compras, searchTerm]
  );

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return comprasFiltradas.slice(start, end);
  }, [page, comprasFiltradas]);



  const handleOpenModal = (idCompra: string) => {
    open();
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

  const handleEditClick = (compra: Compra) => {
    console.log('Selected Compra:', compra);
    setSelectedCompra(compra);
    setMotivoAnular(compra.motivoAnular || "");
    onOpenEdit();
  };

  const MotivoAnular = [
    { key: "Eleccion de producto erronea", label: "Eleccion de producto erronea" },
    { key: "Cantidad equivocada", label: "Cantidad equivocada" },
    { key: "Anular la compra", label: "Anular la compra" },
    { key: "Proveedor erroneo", label: "Proveedor erroneo" },
  ];

  const handleSave = async () => {
    if (selectedCompra && validarMotivoAnular()) {
      const updatedInsumo = { ...selectedCompra, motivoAnular };

      try {
        const response = await postWithAuth(`http://localhost:8080/compras/${selectedCompra.idCompra}`,
          updatedInsumo
        );
        if (response.ok) {
          setCompras((prevCompras) =>
            prevCompras.map((compra) =>
              compra.idCompra === selectedCompra.idCompra ? updatedInsumo : compra
            )
          );
          toast.success("Insumo actualizado con éxito!");
        } else {
          console.error("Error al actualizar el insumo:", response.statusText);
          setMensajeError("Error al actualizar el insumo. Por favor, inténtalo de nuevo.");
          onOpenError();
        }
      } catch (err) {
        console.error("Error al enviar la solicitud:", err);
        setMensajeError("Error al enviar la solicitud. Por favor, inténtalo de nuevo.");
        onOpenError();
      }

      onOpenChangeEdit();
    };
  };
  const validarMotivoAnular = () => {
    if (!motivoAnular) {
      setMensajeError("Por favor, selecciona un motivo para anular la compra.");
      onOpenError();
      return false;
    }
    return true;
  };
  return (
    <>
      {acceso ? (
        <div>
          <h1 className={title()}>Compras</h1>
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
              <Link href="/admin/compras/crear">
                <Button className="bg-gradient-to-tr from-red-600 to-orange-300" aria-label="Crear Compra">
                  <PlusIcon /> Crear Compra
                </Button>
              </Link>
            </div>
          </div>
          {tamanoMovil ? (
            <div>
              {items.map((item) => (
                <Card key={item.idCompra} className="mb-4">
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
                            <DropdownMenu>
                              <DropdownItem key="editar" isDisabled={item.motivoAnular != ""} >
                                <Button className="bg-transparent w-full" onClick={() => handleEditClick(item)}>
                                  <Edit />
                                  Anular
                                </Button>
                              </DropdownItem>
                              <DropdownItem key={"detalles"}>
                                <Button
                                  className="bg-transparent w-full"
                                  onPress={async () => {
                                    const detalles = await fetchCompraDetalles(item.idCompra);
                                    setCompraDetalles(detalles);
                                    onOpenDetalles();
                                  }}
                                >
                                  <Eye />
                                  Detalles
                                </Button>
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        ) : column.uid === "precio" ? (
                          formatCurrency(item.precio)
                        ) : column.uid === "subtotal" ? (
                          formatCurrency(item.subtotal)
                        ) : column.uid === "idProveedor" ? (
                          <span>{proveedores.get(item.idProveedor) || item.idProveedor}</span>
                        ) : (
                          <span>{item[column.uid as keyof Compra]}</span>
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
                  <TableRow key={item.idCompra}>
                    {columns.map((column) => (
                      <TableCell key={column.uid}>
                        {column.uid === "acciones" ? (
                          <Dropdown>
                            <DropdownTrigger>
                              <Button aria-label="Acciones" className="bg-transparent">
                                <Ellipsis />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                              <DropdownItem key="editar" isDisabled={item.motivoAnular != ""} >
                                <Button className="bg-transparent w-full" onClick={() => handleEditClick(item)}>
                                  <Edit />
                                  Anular
                                </Button>
                              </DropdownItem>
                              <DropdownItem key={"detalles"}>
                                <Button
                                  className="bg-transparent w-full"
                                  onPress={async () => {
                                    const detalles = await fetchCompraDetalles(item.idCompra);
                                    setCompraDetalles(detalles);
                                    onOpenDetalles();
                                  }}
                                >
                                  <Eye />
                                  Detalles
                                </Button>
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        ) : column.uid === "precio" ? (
                          formatCurrency(item.precio)
                        ) : column.uid === "subtotal" ? (
                          formatCurrency(item.subtotal)
                        ) : column.uid === "idProveedor" ? (
                          <span>{proveedores.get(item.idProveedor) || item.idProveedor}</span>
                        ) : (
                          item[column.uid as keyof Compra]
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
              total={Math.ceil(comprasFiltradas.length / rowsPerPage)}
              onChange={(page) => setPage(page)}
            />
          </div>


          {/* Modal de Compra de la venta */}
          <Modal isOpen={isOpenDetalles} onOpenChange={onOpenChangeDetalles} className="max-w-5xl">
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col items-center border-b border-gray-200 pb-4">
                    <Eye color="#FFD700" size={100} />
                    <h1 className="text-3xl font-semibold mt-2">Detalle de la compra</h1>
                  </ModalHeader>
                  <ModalBody className="p-6 overflow-y-auto max-h-96">
                    {compraDetalles ? (
                      <div className="flex flex-col lg:flex-row gap-6">
                        <Table aria-label="Detalles de la Venta" className="flex-1">
                          <TableHeader>
                            <TableColumn>Compras AlexaSoft</TableColumn>
                            <TableColumn>Información</TableColumn>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>N° Fecha</TableCell>
                              <TableCell>{compraDetalles.compra.fecha}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Proveedor</TableCell>
                              <TableCell>{proveedores.get(compraDetalles.compra.idProveedor.idProveedor) || compraDetalles.idProveedor}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Motivo Anular</TableCell>
                              <TableCell>{compraDetalles.compra.motivoAnular}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                        <Table aria-label="Productos" className="flex-1">
                          <TableHeader>
                            <TableColumn>Nombre</TableColumn>
                            <TableColumn>Marca</TableColumn>
                            <TableColumn>Cantidad</TableColumn>
                            <TableColumn>Precio Venta</TableColumn>
                          </TableHeader>
                          <TableBody>
                            {agrupados.map((producto: any) => (
                              <TableRow key={producto.idProducto}>
                                <TableCell>{producto.nombre}</TableCell>
                                <TableCell>{producto.idMarca.nombre || "Marca no encontrada"}</TableCell>
                                <TableCell>{producto.cantidad}</TableCell>
                                <TableCell>{formatCurrency(producto.precio)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : isLoading ? (
                      <div className="flex justify-center items-center">
                        <Spinner color="warning" size="lg" />
                      </div>
                    ) : (
                      <p>No hay detalles para mostrar</p>
                    )}
                  </ModalBody>
                  <ModalFooter className="border-t border-gray-200 pt-4">
                    <Button color="danger" variant="light" onPress={onClose}>
                      Cerrar
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>



          {/* Modal de edición */}
          <Modal isOpen={isOpenEdit} onOpenChange={onOpenChangeEdit}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col gap-1 items-center">
                    <CircleHelp color="#fef08a" size={100} />
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <h1 className="text-3xl">Anular Insumo</h1>
                    <br />
                    <Select
                      isRequired
                      name="Motivo Anular"
                      label="Motivo Anular"
                      variant="bordered"
                      value={motivoAnular}
                      onChange={(e) => setMotivoAnular(e.target.value)}
                    >
                      {MotivoAnular.map((motivo) => (
                        <SelectItem key={motivo.key} value={motivo.key} textValue={motivo.label}>
                          {motivo.label}
                        </SelectItem>
                      ))}
                    </Select>
                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                      Cancelar
                    </Button>
                    <Button color="warning" variant="light" onPress={handleSave}>
                      Guardar
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
"use client";
import { Toaster } from "sonner";
import { title } from "@/components/primitives";
import { useMediaQuery } from "react-responsive";
import React, { useState, useEffect } from "react";
import { Ellipsis, Edit, CircleX, CircleHelp } from "lucide-react";
import { getWithAuth, verificarAccesoPorPermiso } from "@/config/peticionesConfig";

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
  Card,
  CardBody,
  Spinner,
  CircularProgress,
} from "@nextui-org/react";

// Definición de columnas para la tabla
const columns = [
  { name: "ID", uid: "idVentaDetalleProducto" },
  { name: "Venta", uid: "idVenta" },
  { name: "Producto", uid: "idProducto" },
  { name: "Cantidad", uid: "Cantidad" },
  { name: "Precio Unitario", uid: "PrecioUnitario" },
  { name: "Acciones", uid: "acciones" },
];

// Definición del tipo VentaProductos
interface VentaProductos {
  idVentaDetalleProducto: string;
  idVenta: string;
  idProducto: string;
  Cantidad: string;
  PrecioUnitario: string;
}

// Componente principal
export default function VentaProductosPage() {

  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if(typeof window !== "undefined"){
    if(verificarAccesoPorPermiso("Gestionar Ventas") == false){
      window.location.href = "../../../acceso/noAcceso"
    }
    setAcceso(verificarAccesoPorPermiso("Gestionar Ventas"));
  }
  }, []);

  // Estados y Hooks
  const [ventaProductos, setVentaProductos] = useState<VentaProductos[]>([]);
  const [productos] = useState<Map<string, string>>(new Map());
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [mensajeError, setMensajeError] = useState("");

  useDisclosure();
  const { isOpen: isOpenError, onOpen: onOpenError, onOpenChange: onOpenChangeError } = useDisclosure();
  const { isOpen: isOpenWarning, onOpen: onOpenWarning, onOpenChange: onOpenChangeWarning } = useDisclosure();

  const rowsPerPage = 6;
  const tamanoMovil = useMediaQuery({ maxWidth: 768 });

  // Fetch de datos Detalles Productos
  useEffect(() => {
    const fetchDP = async () => {
      try {
        const response = await getWithAuth("http://localhost:8080/venta/dp");
        const data = await response.json();
        // Agrupar las cantidades por ID de venta
        const groupedVentaProductos = data.reduce((acc: any, item: any) => {
          const idVenta = item.idVenta.idVenta.toString();
          if (!acc[idVenta]) {
            acc[idVenta] = {
              idVenta: idVenta,
              idProducto: item.idProducto.toString(),
              Cantidad: 0,
              PrecioUnitario: item.precioUnitario,
            };
          }
          acc[idVenta].Cantidad += parseInt(item.cantidad, 10);
          return acc;
        }, {});

        // Convertir el objeto a un array de objetos VentaProductos
        const ventaProductosArray = Object.values(groupedVentaProductos).map(
          (item: any) => ({
            idVentaDetalleProducto: item.idVenta, // Asignar el ID de la venta como ID de detalle
            idVenta: item.idVenta,
            idProducto: item.idProducto,
            Cantidad: item.Cantidad.toString(),
            PrecioUnitario: item.PrecioUnitario,
          })
        );

        setVentaProductos(ventaProductosArray);
      } catch (err: any) {
        if (err.message === "Unexpected end of JSON input") {
          setMensajeError("No hay detalles de ventas registrados aún.");
          onOpenWarning();
        } else {
          console.error("Error al obtener ventas:", err);
          setMensajeError("Error al obtener detalles de ventas. Problemas con la conexión del servidor.");
          onOpenError();
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDP();
    setIsLoading(false);
  }, []);

  // Filtrar productos 
  const ventaProductosFiltrados = React.useMemo(() => {
    const totalRegex = new RegExp(searchTerm.replace(/[$,.]/g, "").replace(",", "."), "i");
    return ventaProductos.filter((ventaProducto) => {
      const productoNombre = productos.get(ventaProducto.idProducto) || "";
      return (
        Object.values(ventaProducto).some((value) =>
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        productoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        totalRegex.test(ventaProducto.PrecioUnitario)
      );
    });
  }, [ventaProductos, searchTerm, productos]);

  // Calcular los elementos a mostrar en la página actual
  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return ventaProductosFiltrados.slice(start, end);
  }, [page, ventaProductosFiltrados]);

  const [isLoading, setIsLoading] = useState(true);

  // Retorno del componente
  return (
    <>
    {acceso? (
      <div>
      <h1 className={title()}>Ventas Detalles Productos</h1>
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
      </div>
      {isLoading ? (
        <div className="flex justify-center text-center h-screen">
          <div className="text-center">
            <Spinner color="warning" size="lg" />
          </div>
        </div>
      ) : (
        tamanoMovil ? (
          <div>
            {items.map((item) => (
              <Card key={item.idVentaDetalleProducto} className="mb-4">
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
                            <DropdownItem
                              key="editar"
                              href={`ventas/venta-producto/${item.idVentaDetalleProducto}`}
                            >
                              <Button className="bg-transparent w-full">
                                <Edit />
                                Editar
                              </Button>
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      ) : column.uid === "idProducto" ? (
                        <span>{productos.get(item.idProducto) || item.idProducto}</span>
                      ) : (
                        <span>{item[column.uid as keyof VentaProductos]}</span>
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
                <TableRow key={item.idVentaDetalleProducto}>
                  {columns.map((column) => (
                    <TableCell key={column.uid}>
                      {column.uid === "acciones" ? (
                        <Dropdown>
                          <DropdownTrigger>
                            <Button aria-label="Acciones" className="bg-transparent"
                            >
                              <Ellipsis />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu
                            onAction={(action) => console.log(action)}
                          >
                            <DropdownItem href={`ventas/venta-producto/${item.idVentaDetalleProducto}`}
                            >
                              <Button className="bg-transparent w-full">
                                <Edit />
                                Editar
                              </Button>
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      ) : (
                        item[column.uid as keyof VentaProductos]
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              )}
            </TableBody>
          </Table>
        )
      )}
      <div className="flex w-full justify-center mb-4">
        <Pagination
          showControls
          color="warning"
          page={page}
          total={Math.ceil(ventaProductosFiltrados.length / rowsPerPage)}
          onChange={(page) => setPage(page)}
        />
      </div>

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

      {/* Modal de advertencia */}
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
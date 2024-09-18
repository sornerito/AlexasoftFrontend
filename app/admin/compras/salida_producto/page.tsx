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
  Select, 
  SelectItem,
  CircularProgress,
} from "@nextui-org/react";
import { getWithAuth, postWithAuth, verificarAccesoPorPermiso } from "@/config/peticionesConfig";

const columns = [
  { name: "Id", uid: "idSalidaProducto" },
  { name: "Producto", uid: "idProducto" },
  { name: "Fecha Retiro", uid: "fechaRetiro" },
  { name: "Cantidad", uid: "cantidad" },
  { name: "Motivo Anular", uid: "motivoAnular" },
  { name: "Acciones", uid: "acciones" }
];

interface SalidaProducto {
  idSalidaProducto: string;
  idProducto: number;
  fechaRetiro: string;
  cantidad: number;
  motivoAnular: string | null;
}

interface Producto {
  idProducto: number;
  nombre: string;
}

export default function SalidaProductosPage() {
  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if(typeof window !== "undefined"){
    if(verificarAccesoPorPermiso("Gestionar Salida Producto") == false){
      window.location.href = "../../../../acceso/noAcceso"
    }
    setAcceso(verificarAccesoPorPermiso("Gestionar Salida Producto"));
  }
  }, []);
  const [SalidaProductos, setSalidaProductos] = useState<SalidaProducto[]>([]);
  const [productos, setProductos] = useState<Map<number, string>>(new Map());
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [mensajeError, setMensajeError] = useState("");
  const { isOpen: isOpenError, onOpen: onOpenError, onOpenChange: onOpenChangeError } = useDisclosure();
  const { isOpen: isOpenEdit, onOpen: onOpenEdit, onOpenChange: onOpenChangeEdit } = useDisclosure();
  const [selectedSalidaProducto, setSelectedSalidaProducto] = useState<SalidaProducto | null>(null);
  const [motivoAnular, setMotivoAnular] = useState("");
  const { isOpen: isOpenWarning, onOpen: onOpenWarning, onOpenChange: onOpenChangeWarning } = useDisclosure();
  const [errores, setErrores] = useState<any>({});
  const fecha = new Date();
  

  const rowsPerPage = 6;
  const tamanoMovil = useMediaQuery({ maxWidth: 768 });

  useEffect(() => {
    

    const fetchSalidaProductos = async () => {
      try {
        const response = await getWithAuth("http://localhost:8080/compras/salidas-producto", );
        const data = await response.json();
        setSalidaProductos(data.map((item: any) => ({
          idSalidaProducto: item.idSalidaProducto,
          idProducto: item.idProducto,
          fechaRetiro: item.fechaRetiro,
          cantidad: item.cantidad,
          motivoAnular: item.motivoAnular,
        })));
      } catch (err:any) {
        if (err.name === 'AbortError') {
          // La petición fue cancelada, no se hace nada
          return;
        }

        if (err.message === "Unexpected end of JSON input") {
          setMensajeError("No hay Categoria Salida SalidaProductos registradas aún.");
          onOpenWarning();
        }else{
          console.error("Error al obtener Salida SalidaProductos:", err);
          setMensajeError("Error al obtener Salida SalidaProductos. Por favor, inténtalo de nuevo.");
          onOpenError();
        }
      }
    };

    const fetchProductos = async () => {
      try {
        const response = await getWithAuth("http://localhost:8080/compras/productos", );
        const data = await response.json();
        const productosMap = new Map<number, string>();
        data.forEach((producto: Producto) => {
          productosMap.set(producto.idProducto, producto.nombre);
        });
        setProductos(productosMap);
      } catch (err) {
        console.error("Error al obtener productos:", err);
      }
    };

    fetchSalidaProductos();
    fetchProductos();

  // Cancelar la petición si el componente se desmonta o el efecto se vuelve a ejecutar
  }, [onOpenError, onOpenWarning]); 


  const SalidaProductosFiltrados = React.useMemo(() =>
    SalidaProductos.filter((SalidaProducto) =>
      Object.values(SalidaProducto).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      productos.get(SalidaProducto.idProducto)?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [SalidaProductos, searchTerm, productos]
  );

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return SalidaProductosFiltrados.slice(start, end);
  }, [page, SalidaProductosFiltrados]);

  const handleEditClick = (SalidaProducto: SalidaProducto) => {
    setSelectedSalidaProducto(SalidaProducto);
    setMotivoAnular(SalidaProducto.motivoAnular || "");
    onOpenEdit();
  };

  const handleSave = async () => {
    if (selectedSalidaProducto && validarMotivoAnular()) {
      const updatedSalidaProducto = { ...selectedSalidaProducto, motivoAnular };

      try {
        const response = await postWithAuth(`http://localhost:8080/compras/salidas-producto/${selectedSalidaProducto.idSalidaProducto}`, 
          updatedSalidaProducto
        );

        if (response.ok) {
          setSalidaProductos((prevSalidaProductos) =>
            prevSalidaProductos.map((SalidaProducto) =>
              SalidaProducto.idSalidaProducto === selectedSalidaProducto.idSalidaProducto ? updatedSalidaProducto : SalidaProducto
            )
          );
          toast.success("SalidaProducto actualizado con éxito!");
        } else {
          console.error("Error al actualizar el SalidaProducto:", response.statusText);
          setMensajeError("Error al actualizar el SalidaProducto. Por favor, inténtalo de nuevo.");
          onOpenError();
        }
      } catch (err) {
        console.error("Error al enviar la solicitud:", err);
        setMensajeError("Error al enviar la solicitud. Por favor, inténtalo de nuevo.");
        onOpenError();
      }

      onOpenChangeEdit();
    }		;

  };
  const MotivoAnular = [
    { key: "Eleccion_de_producto_erronea", label: "Eleccion de producto erronea" },
    { key: "Cantidad_equivocada", label: "Cantidad equivocada" },
];


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
      <h1 className={title()}>Salida de Producto</h1>
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
          <Link href="/admin/compras/salida_producto/crear">
            <Button className="bg-gradient-to-tr from-red-600 to-orange-300" aria-label="Crear SalidaProducto">
              <PlusIcon /> Crear SalidaProducto
            </Button>
          </Link>
        </div>
      </div>
      {tamanoMovil ? (
        <div>
          {items.map((item) => (
            <Card key={item.idSalidaProducto} className="mb-4">
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
                          >
                            <Ellipsis />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                          <DropdownItem key="editar" isDisabled={item.motivoAnular != null}>
                            <Button className="w-full bg-transparent" onClick={() => handleEditClick(item)}>
                              <Edit />
                              Anular
                            </Button>
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    ) : column.uid === "idProducto" ? (
                      <span>{productos.get(item.idProducto) || "Desconocido"}</span>
                    ) : (
                      item[column.uid as keyof SalidaProducto]
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
              <TableRow key={item.idSalidaProducto}>
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
                          <DropdownItem key="editar" isDisabled={item.motivoAnular != null}>
                            <Button className="w-full bg-transparent" onClick={() => handleEditClick(item)}>
                              <Edit />
                              Anular
                            </Button>
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    ) : column.uid === "idProducto" ? (
                      <span>{productos.get(item.idProducto) || "Desconocido"}</span>
                    ) : (
                      item[column.uid as keyof SalidaProducto]
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
          total={Math.ceil(SalidaProductosFiltrados.length / rowsPerPage)}
          onChange={(page) => setPage(page)}
        />
      </div>

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

      {/* Modal de edición */}
      <Modal isOpen={isOpenEdit} onOpenChange={onOpenChangeEdit}>
  <ModalContent>
    {(onClose) => (
      <>
        <ModalHeader className="flex flex-col items-center gap-1">
          <CircleHelp color="#fef08a" size={100} />
        </ModalHeader>
        <ModalBody className="text-center">
          <h1 className="text-3xl">Anular SalidaProducto</h1>
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
              <SelectItem key={motivo.key} value={motivo.key}>
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
    </div>
    ) :(
      <CircularProgress color="warning" aria-label="Cargando..." />
    )}
</>
  );
}

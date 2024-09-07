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
  { name: "Id", uid: "idInsumo" },
  { name: "Producto", uid: "idProducto" },
  { name: "Fecha Retiro", uid: "fechaRetiro" },
  { name: "Cantidad", uid: "cantidad" },
  { name: "Motivo Anular", uid: "motivoAnular" },
  { name: "Acciones", uid: "acciones" }
];

interface Insumo {
  idInsumo: string;
  idProducto: number;
  fechaRetiro: string;
  cantidad: number;
  motivoAnular: string | null;
}

interface Producto {
  idProducto: number;
  nombre: string;
}

export default function InsumosPage() {
  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if(typeof window !== "undefined"){
    if(verificarAccesoPorPermiso("Gestionar Insumos") == false){
      window.location.href = "../../../../acceso/noAcceso"
    }
    setAcceso(verificarAccesoPorPermiso("Gestionar Insumos"));
  }
  }, []);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [productos, setProductos] = useState<Map<number, string>>(new Map());
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [mensajeError, setMensajeError] = useState("");
  const { isOpen: isOpenError, onOpen: onOpenError, onOpenChange: onOpenChangeError } = useDisclosure();
  const { isOpen: isOpenEdit, onOpen: onOpenEdit, onOpenChange: onOpenChangeEdit } = useDisclosure();
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null);
  const [motivoAnular, setMotivoAnular] = useState("");
  const { isOpen: isOpenWarning, onOpen: onOpenWarning, onOpenChange: onOpenChangeWarning } = useDisclosure();
  const [errores, setErrores] = useState<any>({});
  const fecha = new Date();
  

  const rowsPerPage = 6;
  const tamanoMovil = useMediaQuery({ maxWidth: 768 });

  useEffect(() => {
    const fetchInsumos = async () => {
      try {
        const response = await getWithAuth("http://localhost:8080/compras/salidas-insumo");
        const data = await response.json();
        setInsumos(data.map((item: any) => ({
          idInsumo: item.idInsumo,
          idProducto: item.idProducto,
          fechaRetiro: item.fechaRetiro,
          cantidad: item.cantidad,
          motivoAnular: item.motivoAnular,
        })));
      } catch (err:any) {
        if (err.message === "Unexpected end of JSON input") {
          setMensajeError("No hay Categoria Salida insumos registradas aún.");
          onOpenWarning();
        }else{
          console.error("Error al obtener Salida insumos:", err);
        setMensajeError("Error al obtener Salida insumos. Por favor, inténtalo de nuevo.");
        onOpenError();
        }
       
      }

    };

    fetchInsumos();
  }, []);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await getWithAuth("http://localhost:8080/compras/productos");
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

    fetchProductos();
  }, []);

  const insumosFiltrados = React.useMemo(() =>
    insumos.filter((insumo) =>
      Object.values(insumo).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      productos.get(insumo.idProducto)?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [insumos, searchTerm, productos]
  );

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return insumosFiltrados.slice(start, end);
  }, [page, insumosFiltrados]);

  const handleEditClick = (insumo: Insumo) => {
    setSelectedInsumo(insumo);
    setMotivoAnular(insumo.motivoAnular || "");
    onOpenEdit();
  };

  const handleSave = async () => {
    if (selectedInsumo && validarMotivoAnular()) {
      const updatedInsumo = { ...selectedInsumo, motivoAnular };

      try {
        const response = await postWithAuth(`http://localhost:8080/compras/salidas-insumo/${selectedInsumo.idInsumo}`, 
          updatedInsumo
        );

        if (response.ok) {
          setInsumos((prevInsumos) =>
            prevInsumos.map((insumo) =>
              insumo.idInsumo === selectedInsumo.idInsumo ? updatedInsumo : insumo
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
    }		;

  };
  const MotivoAnular = [
    { key: "Eleccion_de_producto_erronea", label: "Eleccion_de_producto_erronea" },
    { key: "Cantidad_equivocada", label: "Cantidad_equivocada" },
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
      <h1 className={title()}>Salida de Insumos</h1>
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
          <Link href="/admin/compras/salida_inusmos/crear">
            <Button className="bg-gradient-to-tr from-red-600 to-orange-300" aria-label="Crear Insumo">
              <PlusIcon /> Crear Insumo
            </Button>
          </Link>
        </div>
      </div>
      {tamanoMovil ? (
        <div>
          {items.map((item) => (
            <Card key={item.idInsumo} className="mb-4">
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
                            onClick={() => handleEditClick(item)}
                          >
                            <Button className="bg-transparent w-full">
                              <Edit />
                              Anular
                            </Button>
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    ) : column.uid === "idProducto" ? (
                      <span>{productos.get(item.idProducto) || "Desconocido"}</span>
                    ) : (
                      item[column.uid as keyof Insumo]
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
              <TableRow key={item.idInsumo}>
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
                            <Button className="bg-transparent w-full" onClick={() => handleEditClick(item)}>
                              <Edit />
                              Anular
                            </Button>
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    ) : column.uid === "idProducto" ? (
                      <span>{productos.get(item.idProducto) || "Desconocido"}</span>
                    ) : (
                      item[column.uid as keyof Insumo]
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
          total={Math.ceil(insumosFiltrados.length / rowsPerPage)}
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

"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Input, Button, Modal, ModalContent, ModalHeader,  Link, ModalBody, ModalFooter, useDisclosure, Select, SelectItem,
    CircularProgress
} from "@nextui-org/react";
import { CircleHelp, CircleX } from "lucide-react";
import { title } from "@/components/primitives";
import { getWithAuth, postWithAuth, verificarAccesoPorPermiso } from "@/config/peticionesConfig";

// Interfaz para el producto
interface SalidaInusmos {
    idInsumos: number;
    idProducto: number;
    fechaRetiro: Date;
    cantidad: string;
    motivoAnular: null;
}

interface Producto {
    idProducto: number;
    nombre: string;
    unidades: number;
    estado: string;
}

// Función para obtener las categorías
const fetchCategorias = async () => {
    try {
        const response = await getWithAuth("http://localhost:8080/compras/productos");
        if (!response.ok) {
            throw new Error("Error al obtener los productos");
        }
        const data = await response.json();
        console.log(data);
        const productosActivos = data.filter((producto: Producto) => producto.estado == "Activo" && producto.unidades > 0);
        return productosActivos;
        
    } catch (error) {
        console.error("Error al obtener los productos:", error);
        return [];
    }
};
const fechaActual = new Date();

export default function CrearProductoPage() {
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
    const [salidaInsumos, setSalidaInusmos] = useState<SalidaInusmos>({
     

        idInsumos: 0,
        idProducto: 0,
        fechaRetiro: fechaActual,
        cantidad: "",
        motivoAnular: null,
    });
    const [productos, setProductos] = useState<Producto[]>([]);
    const [mensajeError, setMensajeError] = useState("");
    const [errores, setErrores] = useState<any>({});
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { isOpen: isOpenError, onOpen: onOpenError, onOpenChange: onOpenChangeError } = useDisclosure();
    const router = useRouter();

    // Validaciones
    const validarCantidad = (cantidad: string) => {
        if (isNaN(Number(cantidad)) || Number(cantidad) <= 0) {
            return "El precio debe ser un número mayor que 0.";
        }
        return "";
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSalidaInusmos({ ...salidaInsumos, [name]: value });

        let error = "";
        switch (name) {
            case "cantidad":
                error = validarCantidad(value);
                break;
            
        }
        setErrores({ ...errores, [name]: error });
    };

    const handleFormSubmit = (e: { preventDefault: () => void; }) => {
        e.preventDefault();

        const errorCantidad = validarCantidad(salidaInsumos.cantidad);

        if (errorCantidad) {
            setErrores({
                cantidad: errorCantidad,
            });
            setMensajeError("Por favor corrija los errores en el formulario.");
            onOpenError();
            return;
        }

        if (!salidaInsumos.idProducto) {
            setMensajeError("Por favor seleccione un producto.");
            onOpenError();
            return;
        }

        onOpen();
    };

    const handleConfirmSubmit = async () => {
        try {
            const response = await postWithAuth("http://localhost:8080/compras/salidas-insumo", {
                    ...salidaInsumos,
                    precio: Number(salidaInsumos.cantidad),
                    idProducto: Number(salidaInsumos.idProducto),
            });

            if (!response.ok) {
                const errorResponse = await response.text();
                setMensajeError("No hay producto disponibles!!");
                onOpenError();
                throw new Error("Error al intentar guardar la salida insumos");
            }

            router.push("/admin/compras/salida_insumos");
        } catch (error) {
            console.error("Error al enviar los datos:", error);
        }
        onOpenChange();
    };

    useEffect(() => {
        const loadCategorias = async () => {
            const data = await fetchCategorias();
            setProductos(data);
        };

        loadCategorias();
    }, []);

    const handleChangeCategoria = (e: React.ChangeEvent<HTMLSelectElement>) => {
        console.log(salidaInsumos.idProducto)
        setSalidaInusmos({ ...salidaInsumos, idProducto: Number(e.target.value) });
    };

    return (
        <>
{acceso ? (
      
        <div className="container">
            <h1 className={title()}>Crear salida de  Producto</h1>
            <br />
            <br />
            <form onSubmit={handleFormSubmit}>
                <div className="grid gap-3 sm:grid-cols-2">
                <Select
                        isRequired
                        name="idProducto"
                        label="Producto"
                        variant="bordered"
                        value={salidaInsumos.idProducto}
                        onChange={handleChangeCategoria}
                    >
                        {productos.map((producto) => (
                            <SelectItem 
                                key={producto.idProducto} 
                                value={producto.idProducto} 
                                textValue={`Producto: ${producto.nombre} - cantidad: ${producto.unidades}`}
                            >
                                Producto: {producto.nombre} - cantidad: {producto.unidades}
                            </SelectItem>
                        ))}
                    </Select>
                    <Input
                        isRequired
                        type="text"
                        label="Cantidad"
                        variant="bordered"
                        value={salidaInsumos.cantidad}
                        isInvalid={!!errores.cantidad}
                        color={errores.cantidad ? "danger" : "default"}
                        errorMessage={errores.cantidad}
                        onChange={handleChange}
                        name="cantidad"
                    />
                   
                </div>
                <div className="my-4 text-end">
                    <Link href="/admin/compras/salida_insumos">
                        <Button className="bg-gradient-to-tr from-red-600 to-red-300 mr-2" type="button">
                            Cancelar
                        </Button>
                    </Link>
                    <Button className="bg-gradient-to-tr from-yellow-600 to-yellow-300" type="submit">
                        Guardar
                    </Button>
                </div>
            </form>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 items-center">
                                <CircleHelp color="#fef08a" size={100} />
                            </ModalHeader>
                            <ModalBody className="text-center">
                                <h1 className="text-3xl">¿Desea crear la salida insumos?</h1>
                                <p>La salida de insumo se creará con la información proporcionada.</p>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cancelar
                                </Button>
                                <Button
                                    color="warning" variant="light"
                                    onPress={() => {
                                        handleConfirmSubmit();
                                        onClose();
                                    }}
                                >
                                    Crear
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

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
        ) :(
            <CircularProgress color="warning" aria-label="Cargando..." />
          )}
      </>
    );
}

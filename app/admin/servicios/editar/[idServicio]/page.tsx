"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    Input, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Table, TableColumn, TableHeader, TableBody, TableRow, TableCell, Select, SelectItem, CircularProgress
} from "@nextui-org/react";
import { CircleHelp, CircleX, Link, PlusIcon } from "lucide-react";
import { getWithAuth, postWithAuth, verificarAccesoPorPermiso } from "@/config/peticionesConfig";
import {
    validarCampoString, validarDescripcionModal, validarTiempoModal, validarCantidadModal
} from "@/config/validaciones2";
import React from "react";

// Interfaces de datos
interface Servicio {
    idServicio: string;
    nombre: string;
    descripcion: string;
    tiempoMinutos: string;
    estado: string;
}

interface Producto {
    idProducto: number;
    nombre: string;
    marca: number;
    precio: string;
    unidades: string;
    estado: string;
    idcategoriaproducto: number;
    unidadMedida: string;
}

interface ProductoSeleccionado extends Producto {
    idProducto: number;
    cantidad: number;
    unidadMedida: string;
}

export default function EditarServicioPage() {
    const [acceso, setAcceso] = useState<boolean>(false);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { isOpen: isOpenError, onOpen: onOpenError, onClose: onCloseError } = useDisclosure();
    const [mensajeError, setMensajeError] = useState("");
    const [productos, setProductos] = useState<Producto[]>([]);
    const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoSeleccionado[]>([]);

    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [tiempoMinutos, setTiempoMinutos] = useState("");
    const [estado, setEstado] = useState("Activo");
    const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
    const [cantidad, setCantidad] = useState<number>(0);
    const [unidadMedida, setUnidadMedida] = useState("");

    const unidadesMedida = [
        { key: "ml", label: "ml" },
        { key: "g", label: "g" },
    ];

    const router = useRouter();
    const { idServicio } = useParams();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (typeof window !== "undefined") {
            if (verificarAccesoPorPermiso("Gestionar Servicios") === false) {
                window.location.href = "../../../acceso/noAcceso";
            }
            setAcceso(verificarAccesoPorPermiso("Gestionar Servicios"));
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                await Promise.all([fetchProductos(), fetchServicio((idServicio as string))]);
            } catch (error) {
                console.error("Error al obtener datos:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [idServicio]);

    const fetchServicio = async (idServicio: string) => {
        try {
            const response = await getWithAuth(`http://localhost:8080/servicio/servicio/${idServicio}`);
            if (response.ok) {
                const data = await response.json();
                setNombre(data.servicios.nombre);
                setDescripcion(data.servicios.descripcion);
                setTiempoMinutos(data.servicios.tiempoMinutos);
                setEstado(data.estado)
                console.log(data)
                // Precargar los productos seleccionados
                setProductosSeleccionados(data.productos.map((producto: any) => ({
                    idProducto: producto.idProducto,
                    nombre: producto.nombre,
                    cantidad: producto.cantidad,
                    unidadMedida: producto.unidadMedida,
                })));
            } else {
                const errorData = await response.json();
                setMensajeError(errorData.error || "Hubo un problema al obtener el servicio.");
                onOpenError();
            }
        } catch (error) {
            setMensajeError("Error en la comunicación con el servidor");
            onOpenError();
        }
        setIsLoading(false);
    };

    const fetchProductos = async () => {
        try {
            const response = await getWithAuth("http://localhost:8080/compras/productos");
            if (response.ok) {
                const data = await response.json();
                setProductos(data);
            } else {
                const errorData = await response.json();
                setMensajeError(errorData.error || "Hubo un problema al obtener los productos.");
                onOpenError();
            }
        } catch (error) {
            setMensajeError("Error en la comunicación con el servidor");
            onOpenError();
        }
    };

    const agregarProducto = () => {
        if (productoSeleccionado && cantidad > 0 && unidadMedida) {
            setProductosSeleccionados((prevProductosSeleccionados) => [
                ...prevProductosSeleccionados,
                { ...productoSeleccionado, cantidad, unidadMedida },
            ]);
            setProductoSeleccionado(null);
            setCantidad(0);
            setUnidadMedida("");
        } else {
            setMensajeError("Seleccione un producto y complete todos los campos necesarios.");
            onOpenError();
        }
    };

    const eliminarProducto = (index: number) => {
        setProductosSeleccionados(productosSeleccionados.filter((_, i) => i !== index));
    };

    const actualizarServicio = async () => {


        try {
            const servicioActualizado =  {
                
                nombre,
                descripcion,
                tiempoMinutos,
                estado: "Activo",
            };

            const productosId = productosSeleccionados.map((producto) => producto.idProducto);
            const cantidad = productosSeleccionados.map((producto) => producto.cantidad);
            const unidadMedida = productosSeleccionados.map((producto) => producto.unidadMedida);

            console.log("Servicio Actualizado:", servicioActualizado);
            console.log("Productos Id:", productosId);
            console.log("Cantidad:", cantidad);
            console.log("Unidad de Medida:", unidadMedida);

            const response = await postWithAuth(`http://localhost:8080/servicio/servicioActualizar/${idServicio}`, {
                servicio: servicioActualizado,
                productosId,
                cantidad,
                unidadMedida
            });

            if (response.ok) {
                router.push("/admin/servicios");
            } else {
                const errorData = await response.json();
                setMensajeError(errorData.message || "Error al actualizar el servicio");
                onOpenError();
            }
        } catch (error) {
            setMensajeError("Error en la comunicación con el servidor");
            onOpenError();
        }
    };

    const errors = React.useMemo(() => {
        return {


        };
    }, [nombre, descripcion, tiempoMinutos]);

    const handleChangeNombre = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        switch (name) {
            case "nombre":
                setNombre(value);
                break;
        }
    };

    const handleChangeDescripcion = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        switch (name) {
            case "descripcion":
                setDescripcion(value);
                break;
        }
    };

    const handleChangeTiempoMinutos = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        switch (name) {
            case "tiempoMinutos":
                setTiempoMinutos(value);
                break;
        }
    };


    return (
        <>
            {acceso ? (
                <div className="flex flex-col lg:flex-row lg:mx-60 gap-4">
                    <div className="w-full lg:w-1/2 pr-4">
                        <h1 className="text-2xl font-bold mb-4">Editar Servicio</h1>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                isRequired
                                type="text"
                                label="Nombre"
                                variant="bordered"
                                value={nombre}
                                onChange={handleChangeNombre}
                                name="nombre"
                                className="w-full"
                            />
                            <Input
                                isRequired
                                type="number"
                                label="Tiempo en minutos"
                                variant="bordered"
                                value={tiempoMinutos}
                                onChange={handleChangeTiempoMinutos}
                                name="tiempoMinutos"
                                className="w-full"
                            />
                            <div className="col-span-2">
                                <Input
                                    isRequired
                                    type="text"
                                    label="Descripción"
                                    variant="bordered"
                                    value={descripcion}
                                    onChange={handleChangeDescripcion}
                                    name="descripcion"
                                    className="w-full h-32"
                                />
                            </div>
                            <div className="col-span-2">
                                <h2 className="text-xl font-semibold mb-2">Seleccionar Producto</h2>
                                <div className="flex flex-col gap-4">
                                    <div className="max-h-64 overflow-y-auto">
                                        {productos.map((producto) => (
                                            <div key={producto.idProducto} className="flex justify-between items-center mb-2">
                                                <span>{producto.nombre}</span>
                                                <Button size="sm" onPress={() => setProductoSeleccionado(producto)}>
                                                    Seleccionar
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    {productoSeleccionado && (
                                        <div className="flex flex-col gap-4">
                                            <div>
                                                <span className="block font-semibold">Producto Seleccionado:</span>
                                                <span>{productoSeleccionado.nombre}</span>
                                            </div>
                                            <div className="flex gap-4">
                                                <Input
                                                    isRequired
                                                    type="number"
                                                    label="Cantidad"
                                                    variant="bordered"
                                                    value={cantidad.toString()}
                                                    onValueChange={(value) => setCantidad(parseInt(value))}
                                                />
                                                <Select
                                                    label="Unidad de medida"
                                                    placeholder="Seleccione una unidad"
                                                    value={unidadMedida}
                                                    onChange={(e) => setUnidadMedida(e.target.value)}
                                                >
                                                    {unidadesMedida.map((unidad) => (
                                                        <SelectItem key={unidad.key} value={unidad.key}>
                                                            {unidad.label}
                                                        </SelectItem>
                                                    ))}
                                                </Select>
                                            </div>
                                            <Button onPress={agregarProducto}>Agregar Producto</Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:w-1/2">
                        <h2 className="text-xl font-semibold mb-2">Productos Seleccionados</h2>
                        <Table>
                            <TableHeader>
                                <TableColumn>Nombre</TableColumn>
                                <TableColumn>Cantidad</TableColumn>
                                <TableColumn>Unidad de Medida</TableColumn>
                                <TableColumn>Acciones</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {productosSeleccionados.map((producto, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{producto.nombre}</TableCell>
                                        <TableCell>{producto.cantidad}</TableCell>
                                        <TableCell>{producto.unidadMedida}</TableCell>
                                        <TableCell>
                                            <Button color="danger" onPress={() => eliminarProducto(index)}>
                                                Eliminar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Button onPress={actualizarServicio} className="mt-4">
                            Actualizar Servicio
                        </Button>
                    </div>

                    <Modal isOpen={isOpenError} onOpenChange={onCloseError}>
                        <ModalContent>
                            <ModalHeader>Error</ModalHeader>
                            <ModalBody>
                                {mensajeError && <p>{mensajeError}</p>}
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" onPress={onCloseError}>
                                    Cerrar
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    </Modal>
                </div>
            ) : (
                <CircularProgress />
            )}
        </>
    );
}
;
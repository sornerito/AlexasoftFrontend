"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
    const [servicioId, setServicioId] = useState<string>("");
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { isOpen: isOpenError, onOpen: onOpenError, onClose: onCloseError } = useDisclosure();
    const [mensajeError, setMensajeError] = useState("");
    const [productos, setProductos] = useState<Producto[]>([]);
    const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoSeleccionado[]>([]);

    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [tiempoMinutos, setTiempoMinutos] = useState("");
    const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
    const [cantidad, setCantidad] = useState<number>(0);
    const [unidadMedida, setUnidadMedida] = useState("");

    const unidadesMedida = [
        { key: "ml", label: "ml" },
        { key: "g", label: "g" },
    ];

    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (typeof window !== "undefined") {
            if (verificarAccesoPorPermiso("Gestionar Servicios") === false) {
                window.location.href = "../../../acceso/noAcceso";
            }
            setAcceso(verificarAccesoPorPermiso("Gestionar Servicios"));
        }
    }, []);

    useEffect(() => {
        const id = searchParams.get("idServicio");
        if (id) {
            setServicioId(id);
            fetchServicio(id);
        }
        fetchProductos();
    }, [searchParams]);

    const fetchServicio = async (id: string) => {
        try {
            const response = await getWithAuth(`http://localhost:8080/servicio/servicio/${id}`);
            if (response.ok) {
                const data = await response.json();
                setNombre(data.nombre);
                setDescripcion(data.descripcion);
                setTiempoMinutos(data.tiempoMinutos);
                setProductosSeleccionados(data.productos);
            } else {
                const errorData = await response.json();
                setMensajeError(errorData.error || "Hubo un problema al obtener el servicio.");
                onOpenError();
            }
        } catch (error) {
            setMensajeError("Error en la comunicación con el servidor");
            onOpenError();
        }
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
        const errorNombre = validarCampoString(nombre, "Nombre del servicio");
        const errorDescripcion = validarDescripcionModal(descripcion);
        const errorTiempoMinutos = validarTiempoModal(tiempoMinutos);

        if (errorNombre !== "") {
            setMensajeError(errorNombre);
            onOpenError();
            return;
        }
        if (errorDescripcion !== "") {
            setMensajeError(errorDescripcion);
            onOpenError();
            return;
        }
        if (errorTiempoMinutos) {
            setMensajeError(errorTiempoMinutos);
            onOpenError();
            return;
        }

        try {
            const servicioActualizado: Servicio = {
                idServicio: servicioId,
                nombre,
                descripcion,
                tiempoMinutos,
                estado: "Activo",
            };

            const productosId = productosSeleccionados.map((producto) => producto.idProducto);
            const cantidad = productosSeleccionados.map((producto) => producto.cantidad);
            const unidadMedida = productosSeleccionados.map((producto) => producto.unidadMedida);

            const response = await postWithAuth(`http://localhost:8080/servicio/servicio/${servicioId}`, {
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
            nombre: nombre !== "" && !validarCampoString(nombre, "Nombre"),
            descripcion: descripcion !== "" && !validarDescripcionModal(descripcion),
            tiempoMinutos: tiempoMinutos !== "" && !validarTiempoModal(tiempoMinutos),
        };
    }, [nombre, descripcion, tiempoMinutos]);

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
                                isInvalid={errors.nombre}
                                color={errors.nombre ? "danger" : "default"}
                                errorMessage="El nombre debe tener al menos 5 caracteres, no puede contener números ni caracteres especiales"
                                onValueChange={setNombre}
                                className="w-full"
                            />
                            <Input
                                isRequired
                                type="number"
                                label="Tiempo en minutos"
                                variant="bordered"
                                value={tiempoMinutos}
                                isInvalid={errors.tiempoMinutos}
                                color={errors.tiempoMinutos ? "danger" : "default"}
                                errorMessage={errors.tiempoMinutos ? "Error en el tiempo en minutos" : ""}
                                onValueChange={(value) => setTiempoMinutos(value)}
                                className="w-full"
                            />
                            <div className="col-span-2">
                                <Input
                                    isRequired
                                    type="text"
                                    label="Descripción"
                                    variant="bordered"
                                    value={descripcion}
                                    isInvalid={errors.descripcion}
                                    color={errors.descripcion ? "danger" : "default"}
                                    errorMessage={errors.descripcion}
                                    onValueChange={setDescripcion}
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

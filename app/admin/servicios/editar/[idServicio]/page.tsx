"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Table, TableColumn, TableHeader, TableBody, TableRow, TableCell, Select, SelectItem, CircularProgress } from "@nextui-org/react";
import { CircleHelp, CircleX, Link, PlusIcon } from "lucide-react";
import { getWithAuth, postWithAuth, verificarAccesoPorPermiso } from "@/config/peticionesConfig";
import { validarCampoString, validarDescripcionModal, validarTiempoModal, validarCantidadModal } from "@/config/validaciones2";
import React from "react";

// Interfaces de datos (las mismas que en la creación)
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
    // Valida permiso
    const [acceso, setAcceso] = React.useState<boolean>(false);
    const idServicio = useParams()?.idServicio as string;
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { isOpen: isOpenError, onOpen: onOpenError, onClose: onCloseError } = useDisclosure();
    const [mensajeError, setMensajeError] = useState("");
    const [productos, setProductos] = useState<Producto[]>([]);
    const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoSeleccionado[]>([]);

    // Datos del formulario
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [tiempoMinutos, setTiempoMinutos] = useState("");
    const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
    const [cantidad, setCantidad] = useState<number>(0);
    const [unidadMedida, setUnidadMedida] = useState("");

    // Unidades de medida disponibles
    const unidadesMedida = [
        { key: "ml", label: "ml" },
        { key: "g", label: "g" },
    ];

    const router = useRouter();

    // Verifica acceso y carga datos del servicio a editar
    useEffect(() => {
        if (typeof window !== "undefined") {
            if (!verificarAccesoPorPermiso("Gestionar Servicios")) {
                window.location.href = "../../../acceso/noAcceso";
            }
            setAcceso(verificarAccesoPorPermiso("Gestionar Servicios"));

            const fetchServicio = async () => {
                try {
                    const response = await getWithAuth(`http://localhost:8080/servicio/${idServicio}`);
                    if (response.ok) {
                        const data = await response.json();
                        setNombre(data.nombre);
                        setDescripcion(data.descripcion);
                        setTiempoMinutos(data.tiempoMinutos);
                        setProductosSeleccionados(data.productosSeleccionados);
                    } else {
                        const errorData = await response.json();
                        setMensajeError(errorData.error || "Hubo un problema al obtener los datos del servicio.");
                        onOpenError();
                    }
                } catch (error) {
                    setMensajeError("Error en la comunicación con el servidor");
                    onOpenError();
                }
            };

            fetchServicio();
        }
    }, [idServicio]);

    useEffect(() => {
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

        fetchProductos();
    }, []);

    // Función para agregar un producto
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

    // Función de validación y envío del formulario
    const actualizarServicio = async () => {
        const errorNombre = validarCampoString(nombre, "Nombre del servicio");
        const errorDescripcion = validarDescripcionModal(descripcion);
        const errorTiempoMinutos = validarTiempoModal(tiempoMinutos);

        if (errorNombre) {
            setMensajeError(errorNombre);
            onOpenError();
            return;
        }
        if (errorDescripcion) {
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
                idServicio: idServicio || "",
                nombre,
                descripcion,
                tiempoMinutos,
                estado: "Activo",
            };

            // Extraer los datos necesarios de productosSeleccionados
            const productosId = productosSeleccionados.map(producto => producto.idProducto).filter(id => id != null);
            const cantidad = productosSeleccionados.map(producto => producto.cantidad);
            const unidadMedida = productosSeleccionados.map(producto => producto.unidadMedida);

            const response = await postWithAuth(`http://localhost:8080/servicio/${idServicio}`, {
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

    // Validación en tiempo real
    const validarNombre = (nombre: any) => {
        return nombre.length >= 5 && validarCampoString(nombre, "Nombre") === "";
    };

    const validarDescripcion = (descripcion: any) => {
        return descripcion.length >= 10 && validarDescripcionModal(descripcion) === "";
    };

    const validarTiempo = (valor: string): boolean => {
        const tiempoNumerico = parseInt(valor, 10);
        return valor.trim() === "" || (!isNaN(tiempoNumerico) && tiempoNumerico > 0);
    };

    const errors = React.useMemo(() => {
        return {
            nombre: nombre !== "" && !validarNombre(nombre),
            descripcion: descripcion !== "" && !validarDescripcion(descripcion),
            tiempoMinutos: tiempoMinutos !== "" && !validarTiempo(tiempoMinutos),
        };
    }, [nombre, descripcion, tiempoMinutos]);

    // Componente principal
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
                                    errorMessage="La descripción debe tener al menos 10 caracteres y no debe incluir símbolos especiales"
                                    onValueChange={setDescripcion}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:w-1/2 mt-4 lg:mt-0">
                        <h2 className="text-xl font-bold mb-4">Productos Asociados</h2>
                        <div className="flex flex-col lg:flex-row gap-2 mb-4">
                            <Select
                                label="Producto"
                                placeholder="Seleccione un producto"
                                onChange={(event) => {
                                    const value = event.target.value;
                                    const producto = productos.find((p) => p.idProducto.toString() === value);
                                    setProductoSeleccionado(producto || null);
                                }}
                                className="w-full mb-4"
                            >
                                {productos.map((producto) => (
                                    <SelectItem key={producto.idProducto} value={producto.idProducto.toString()}>
                                        {producto.nombre}
                                    </SelectItem>
                                ))}
                            </Select>
                            <Input
                                isRequired
                                type="number"
                                label="Cantidad"
                                variant="bordered"
                                value={cantidad.toString()}
                                onValueChange={(value) => setCantidad(Number(value))}
                                className="w-full lg:w-1/4"
                            />
                            <Select
                                isRequired
                                name="UnidadMedida"
                                label="Unidad de Medida"
                                variant="bordered"
                                value={unidadMedida}
                                onChange={(e) => setUnidadMedida(e.target.value)}
                                className="w-full h-12" // Aumenta la altura del campo
                            >
                                {unidadesMedida.map((tipo) => (
                                    <SelectItem key={tipo.key} value={tipo.key}>
                                        {tipo.label}
                                    </SelectItem>
                                ))}
                            </Select>
                            <Button color="primary" onPress={agregarProducto} startContent={<PlusIcon />}>
                                Añadir
                            </Button>
                        </div>

                        {productosSeleccionados.length > 0 ? (
                            <Table
                                aria-label="Tabla de productos asociados"
                                selectionMode="multiple"
                                className="w-full"
                            >
                                <TableHeader>
                                    <TableColumn>Producto</TableColumn>
                                    <TableColumn>Cantidad</TableColumn>
                                    <TableColumn>Unidad</TableColumn>
                                    <TableColumn children={undefined}></TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {productosSeleccionados.map((producto, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{producto.nombre}</TableCell>
                                            <TableCell>{producto.cantidad}</TableCell>
                                            <TableCell>{producto.unidadMedida}</TableCell>
                                            <TableCell>
                                                <Button color="danger" onPress={() => eliminarProducto(index)} startContent={<CircleX />}>
                                                    Eliminar
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-gray-500">No se han agregado productos al servicio.</p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex justify-center items-center h-full">
                    <CircularProgress color="primary" label="Cargando..." />
                </div>
            )}

            <div className="mt-4 flex justify-end">
                <Button color="primary" onPress={actualizarServicio}>
                    Guardar Cambios
                </Button>
            </div>

            <Modal isOpen={isOpenError} onClose={onCloseError}>
                <ModalContent>
                    <ModalHeader>Error</ModalHeader>
                    <ModalBody>
                        <p>{mensajeError}</p>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" onPress={onCloseError}>
                            Cerrar
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}

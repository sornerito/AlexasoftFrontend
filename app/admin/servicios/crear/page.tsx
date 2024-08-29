"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Table, TableColumn, TableHeader, TableBody, TableRow, TableCell, Select, SelectItem, CircularProgress } from "@nextui-org/react";
import { CircleHelp, CircleX, Link, PlusIcon } from "lucide-react";
import { getWithAuth, postWithAuth, verificarAccesoPorPermiso } from "@/config/peticionesConfig";
import { validarCampoString, validarDescripcionModal, validarTiempoModal, validarCantidadModal } from "@/config/validaciones2";
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

export default function CrearServicioPage() {
    //Valida permiso
    const [acceso, setAcceso] = React.useState<boolean>(false);
    React.useEffect(() => {
        if (typeof window !== "undefined") {
            if (verificarAccesoPorPermiso("Gestionar Servicios") == false) {
                window.location.href = "../../../acceso/noAcceso"
            }
            setAcceso(verificarAccesoPorPermiso("Gestionar Servicios"));
        }
    }, []);

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
    const guardarServicio = async () => {
        console.log("Producto seleccionado antes de agregar:", productoSeleccionado);
        console.log("Productos seleccionados:", productosSeleccionados);
        const errorNombre = validarCampoString(nombre, "Nombre del servicio");
        const errorDescripcion = validarDescripcionModal(descripcion);
        const errorTiempoMinutos = validarTiempoModal(tiempoMinutos);
        const errorCantidad = validarCantidadModal(cantidad);

        if (errorNombre != "") {
            setMensajeError(errorNombre);
            onOpenError();
            return;
        }
        if (errorDescripcion != "") {
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
            const nuevoServicio: Servicio = {
                idServicio: "",
                nombre,
                descripcion,
                tiempoMinutos,
                estado: "Activo",
            };


            // Extraer los datos necesarios de productosSeleccionados
            const productosId = productosSeleccionados.map(producto => producto.idProducto).filter(id => id != null);
            const cantidad = productosSeleccionados.map(producto => producto.cantidad);
            const unidadMedida = productosSeleccionados.map(producto => producto.unidadMedida);

            console.log("Datos a enviar:", {
                servicio: nuevoServicio,
                productosId,
                cantidad,
                unidadMedida
            });


            const response = await postWithAuth("http://localhost:8080/servicio/servicio", {
                servicio: nuevoServicio,
                productosId,
                cantidad,
                unidadMedida
            });

            console.log("ProductosSeleccionados:", productosSeleccionados);
            console.log("Productos:", productosId);
            console.log("cantidad:", cantidad);
            console.log("unidaMedida:", unidadMedida);



            if (response.ok) {
                console.log("Servicio creado:", await response.json());
                router.push("/admin/servicios");
                console.log("ProductosSeleccionados:", productosSeleccionados);
                console.log("Productos:", productosId);
                console.log("cantidad:", cantidad);
                console.log("unidaMedida:", unidadMedida);
            } else {
                const errorData = await response.json();
                setMensajeError(errorData.message || "Error al crear el servicio");
                onOpenError();
            }
        } catch (error) {
            setMensajeError("Error en la comunicación con el servidor");
            onOpenError();
        }

    };

    // Validación en tiempo real
    const validarNombre = (nombre: any) => {
        if (validarCampoString(nombre, "Nombre") != "") {
            return false;
        }
        return nombre.length >= 5;
    };


    const validarDescripcion = (descripcion: any) => {
        if (validarDescripcionModal(descripcion) != "") {
            return false;
        }
        return descripcion.length >= 10;
    };

    const validarTiempo = (valor: string): boolean => {
        if (valor.trim() === "") {
            return true; // Permitir campo vacío
        }

        const tiempoNumerico = parseInt(valor, 10);

        return !isNaN(tiempoNumerico) && tiempoNumerico > 0;
    };



    const errors = React.useMemo(() => {
        return {
            nombre: nombre !== "" && !validarNombre(nombre),
            descripcion: descripcion !== "" && !validarDescripcion(descripcion),
            tiempoMinutos: tiempoMinutos !== "" && !validarTiempo(tiempoMinutos),

        };
    }, [nombre, descripcion, tiempoMinutos,]);


    // Componente principal
    return (
        <>
            {acceso ? (
                <div className="flex flex-col lg:flex-row lg:mx-60 gap-4">
                    <div className="w-full lg:w-1/2 pr-4">
                        <h1 className="text-2xl font-bold mb-4">Crear Servicio</h1>
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
                                    className="w-full h-32" // Aumenta la altura del campo
                                />
                            </div>
                            <div className="col-span-2">
                                <h2 className="text-xl font-semibold mb-2">Seleccionar Producto</h2>
                                <div className="flex flex-col gap-4">
                                    <div className="max-h-64 overflow-y-auto">
                                        {productos.map((producto) => (
                                            <div key={producto.idProducto} className="flex justify-between items-center border-b py-2">
                                                <span className="text-lg">{producto.nombre}</span>
                                                <Button
                                                    onPress={() => setProductoSeleccionado(producto)}
                                                    color={productoSeleccionado?.idProducto === producto.idProducto ? "primary" : "default"}
                                                    className="ml-2"
                                                >
                                                    Seleccionar
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    {productoSeleccionado && (
                                        <div className="flex flex-col gap-4">
                                            <Input
                                                isRequired
                                                type="number"
                                                label="Cantidad"
                                                variant="bordered"
                                                value={cantidad.toString()} // Convertir a string
                                                onValueChange={(value) => setCantidad(parseInt(value, 10) || 0)}
                                                className="w-full h-12" // Aumenta la altura del campo
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
                                            <Button color="warning" variant="light" onPress={agregarProducto} className="w-full">
                                                Agregar Producto
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:w-1/2 pl-4">
                        <h2 className="text-xl font-semibold mb-2">Productos Seleccionados</h2>
                        <Table aria-label="Tabla de productos seleccionados" className="min-w-full">
                            <TableHeader>
                                <TableColumn>Producto</TableColumn>
                                <TableColumn>Cantidad</TableColumn>
                                <TableColumn>Unidad</TableColumn>
                                <TableColumn>Acciones</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {productosSeleccionados.map((producto, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{producto.nombre}</TableCell>
                                        <TableCell>{producto.cantidad}</TableCell>
                                        <TableCell>{producto.unidadMedida}</TableCell>
                                        <TableCell>
                                            <Button color="danger" variant="light" onPress={() => eliminarProducto(index)}>
                                                Eliminar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            ) : (
                <CircularProgress color="warning" aria-label="Cargando..." />
            )}

            <div className="my-4 text-end">
                <Link href="/admin/servicios">
                    <Button className="bg-[#894242] mr-2" type="button">
                        Cancelar
                    </Button>
                </Link>
                <Button
                    className="bg-gradient-to-tr from-yellow-600 to-yellow-300"
                    type="button"
                    onPress={onOpen}  // Opens the confirmation modal when clicked
                >
                    Crear Servicio
                </Button>
            </div>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 items-center">
                                <CircleHelp color="#fef08a" size={100} />
                            </ModalHeader>
                            <ModalBody className="text-center">
                                <h1 className=" text-3xl">¿Desea crear el servicio?</h1>
                                <p>El servicio se creará con la información proporcionada.</p>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cancelar
                                </Button>
                                <Button
                                    color="warning"
                                    variant="light"
                                    onPress={() => {
                                        guardarServicio();
                                        onClose(); // Cierra el modal después de guardar el servicio
                                    }}
                                >
                                    Crear
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
            <Modal isOpen={isOpenError} onClose={onCloseError}>
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1 items-center">
                        <CircleX color="#894242" size={100} />
                    </ModalHeader>
                    <ModalBody className="text-center">
                        <h1 className="text-3xl font-semibold">Error</h1>
                        <p>{mensajeError}</p>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={onCloseError} className="w-full">
                            Cerrar
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
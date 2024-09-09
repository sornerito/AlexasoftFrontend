"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Table, TableColumn, TableHeader, TableBody, TableRow, TableCell, Select, SelectItem, CircularProgress, Divider } from "@nextui-org/react";
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

    // Modal de confirmación
    const { isOpen: isOpenConfirm, onOpen: onOpenConfirm, onClose: onCloseConfirm } = useDisclosure();

    // Datos del formulario
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [tiempoMinutos, setTiempoMinutos] = useState("");
    const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
    const [cantidad, setCantidad] = useState<number>(0);
    const [unidadMedida, setUnidadMedida] = useState("");
    const [cantidadError, setCantidadError] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5; // Número de productos por página

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = productosSeleccionados.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(productosSeleccionados.length / itemsPerPage);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const [isLoading, setIsLoading] = useState(true);

    // Unidades de medida disponibles
    const unidadesMedida = [
        { key: "ml", label: "ml" },
        { key: "g", label: "g" },
    ];

    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                await Promise.all([fetchProductos()]);
            } catch (error) {
                console.error("Error al obtener datos:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    },);


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


    const confirmarGuardarServicio = () => {
        const errorNombre = validarCampoString(nombre, "Nombre del servicio");
        const errorDescripcion = validarDescripcionModal(descripcion);
        const errorTiempoMinutos = validarTiempoModal(tiempoMinutos);
        const cantidadError = validarCantidad(cantidad, unidadMedida);

        if (cantidadError) {
            setCantidadError(cantidadError);
            onOpenError(); // Mostrar el error en un modal o donde prefieras
            return;
        }

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

        onOpenConfirm(); // Abrir modal de confirmación
    };

    // Función de validación y envío del formulario
    const guardarServicio = async () => {

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


            const response = await postWithAuth("http://localhost:8080/servicio", {
                servicio: nuevoServicio,
                productosId,
                cantidad,
                unidadMedida
            });



            if (response.ok) {
                console.log("Servicio creado:", await response.json());
                router.push("/admin/servicios");
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

    // Expresión regular para validar caracteres permitidos (alfanuméricos y espacios)
    const caracteresValidos = /^[a-zA-Z0-9\s]*$/;

    // Validación en tiempo real para el nombre
    const validarNombre = (nombre: any) => {
        // Verificar si hay caracteres especiales
        if (!caracteresValidos.test(nombre)) {
            return "El nombre no puede contener caracteres especiales.";
        }
        if (validarCampoString(nombre, "Nombre") != "") {
            return false;
        }
        return nombre.length >= 5;
    };

    // Validación en tiempo real para la descripción
    const validarDescripcion = (descripcion: any) => {
        // Verificar si hay caracteres especiales
        if (!caracteresValidos.test(descripcion)) {
            return "La descripción no puede contener caracteres especiales.";
        }
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

        return !isNaN(tiempoNumerico) && tiempoNumerico > 0 && tiempoNumerico <= 300; // Max 5 hours (300 minutes)
    };

    const validarCantidad = (cantidad: number, unidadMedida: string) => {
        if (!cantidad) {
            return "La cantidad no puede estar vacía.";
        }

        if (unidadMedida === "g") {
            if (cantidad < 100) {
                return "La cantidad mínima en gramos es 100g.";
            } else if (cantidad > 10000) {
                return "La cantidad máxima en gramos es 10000g.";
            }
        } else if (unidadMedida === "ml") {
            if (cantidad < 1000) {
                return "La cantidad mínima en mililitros es 1000ml.";
            } else if (cantidad > 10000) {
                return "La cantidad máxima en mililitros es 10000ml.";
            }
        } else {
            return "Seleccione una unidad de medida válida.";
        }

        return ""; // Si no hay errores, retornar cadena vacía.
    };



    const errors = React.useMemo(() => {
        return {
            nombre: nombre !== "" && !validarNombre(nombre),
            descripcion: descripcion !== "" && !validarDescripcion(descripcion),
            tiempoMinutos: tiempoMinutos !== "" && !validarTiempo(tiempoMinutos),

        };
    }, [nombre, descripcion, tiempoMinutos,]);




    // Componente principal
    const cancelarEdicion = () => {
        window.location.href = '/admin/servicios';
    };

    return (
        <>
            {acceso ? (
                <div className="mx-auto w-full lg:w-3/5 space-y-8">
                    {/* Sección de Campos de Servicio */}
                    <div className="p-6 shadow-md rounded-lg">
                        <h1 className="text-2xl font-bold mb-6">Crear Servicio</h1>
                        <div className="grid gap-6">
                            <Input
                                isRequired
                                type="text"
                                label="Nombre"
                                pattern="[A-Za-zñÑáéíóúÁÉÍÓÚ\s]+"
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
                                errorMessage={errors.tiempoMinutos ? "El tiempo en minutos debe ser positivo y no superar 300 minutos (5 horas)" : ""}
                                onValueChange={(value) => setTiempoMinutos(value)}
                                className="w-full"
                            />
                            <div className="col-span-2">
                                <Input
                                    isRequired
                                    type="text"
                                    label="Descripción"
                                    pattern="[A-Za-zñÑáéíóúÁÉÍÓÚ\s]+"
                                    variant="bordered"
                                    value={descripcion}
                                    isInvalid={errors.descripcion}
                                    color={errors.descripcion ? "danger" : "default"}
                                    errorMessage="La descripcion debe tener al menos 10 caracteres, no puede contener números ni caracteres especiales"
                                    onValueChange={setDescripcion}
                                    className="w-full h-32" // Aumenta la altura del campo
                                />
                            </div>
                        </div>
                    </div>

                    <Divider className="h-1 my-4" />
                    {/* Sección de Productos Seleccionados */}
                    <div className="p-6 shadow-md rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold">Productos Seleccionados</h2>
                            <Button
                                size="sm"
                                className="bg-gradient-to-tr from-yellow-600 to-yellow-300"
                                startContent={<PlusIcon className="text-white" />}
                                onClick={() => {
                                    onOpen();
                                    fetchProductos();
                                }}
                            >
                                Agregar Producto
                            </Button>
                        </div>
                        <Table aria-label="Productos seleccionados">
                            <TableHeader>
                                <TableColumn>Producto</TableColumn>
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
                                            <Button
                                                size="sm"
                                                color="danger"
                                                variant="light"
                                                onClick={() => eliminarProducto(index)}
                                            >
                                                <CircleX />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="flex justify-center my-4 ">
                            <Button disabled={currentPage === 1} onPress={() => handlePageChange(currentPage - 1)} color="primary">
                                Anterior
                            </Button>
                            <span className="mx-2">
                                Página {currentPage} de {totalPages}
                            </span>
                            <Button disabled={currentPage === totalPages} onPress={() => handlePageChange(currentPage + 1)} color="primary">
                                Siguiente
                            </Button>
                        </div>
                    </div>


                    {/* Botones Guardar y Cancelar */}
                    <div className="flex justify-end space-x-4">
                        <Button className="bg-gradient-to-tr from-red-600 to-red-300 mr-2" onClick={cancelarEdicion}>
                            Cancelar
                        </Button>
                        <Button className="bg-gradient-to-tr from-yellow-600 to-yellow-300" onClick={confirmarGuardarServicio}>
                            Crear Servicio
                        </Button>
                    </div>
                </div>
            ) : (
                <CircularProgress color="primary" size="lg" />
            )}

            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    <ModalHeader>Seleccionar Producto</ModalHeader>
                    <div>
                        <span className="block font-semibold">Producto Seleccionado:</span>
                        <span>{productoSeleccionado?.nombre}</span>
                    </div>
                    <ModalBody>
                        <Select
                            placeholder="Selecciona un producto"
                            onChange={(event) => {
                                const value = event.target.value;
                                const producto = productos.find((producto) => producto.idProducto.toString() === value);
                                if (producto) {
                                    setProductoSeleccionado(producto);
                                }
                            }}
                        >
                            {productos.map((producto) => (
                                <SelectItem key={producto.idProducto} value={producto.idProducto.toString()}>
                                    {producto.nombre}
                                </SelectItem>
                            ))}
                        </Select>
                        <Input
                            type="number"
                            label="Cantidad"
                            value={cantidad.toString()}
                            errorMessage={cantidadError}
                            onValueChange={(value) => {
                                setCantidad(Number(value));
                                setCantidadError(validarCantidad(Number(value), unidadMedida));
                            }}
                            className="mt-4"
                        />
                        {cantidadError && <span className="text-red-500">{cantidadError}</span>}
                        <Select
                            label="Unidad de Medida"
                            placeholder="Selecciona la unidad de medida"
                            value={unidadMedida}
                            onChange={(e) => setUnidadMedida(e.target.value)}
                            className="mt-4"
                        >
                            {unidadesMedida.map((unidad) => (
                                <SelectItem key={unidad.key} value={unidad.key}>
                                    {unidad.label}
                                </SelectItem>
                            ))}
                        </Select>
                    </ModalBody>
                    <ModalFooter>
                        <Button className="mr-2 bg-gradient-to-tr from-red-600 to-red-300" onClick={() => onOpenChange()}>Cancelar</Button>
                        <Button onClick={() => {
                            agregarProducto();
                            onOpenChange();
                        }}>
                            Agregar Producto
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal isOpen={isOpenError} onClose={onCloseError}>
                <ModalContent>
                    <ModalHeader>Error</ModalHeader>
                    <ModalBody>
                        <p>{mensajeError}</p>
                    </ModalBody>
                    <ModalFooter>
                        <Button onClick={onCloseError}>Cerrar</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Modal de confirmación */}
            <Modal isOpen={isOpenConfirm} onOpenChange={onCloseConfirm}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 items-center">
                                <CircleHelp color="#fef08a" size={100} />
                            </ModalHeader>
                            <ModalBody className="text-center">
                                <h1 className="text-3xl">¿Desea crear el servicio?</h1>
                                <p>El servicio no podrá eliminarse, pero podrá desactivarse.</p>
                            </ModalBody>
                            <ModalFooter>
                                <Button className="bg-gradient-to-tr from-red-600 to-red-300 mr-2" onPress={onClose}>
                                    Cancelar
                                </Button>
                                <Button
                                    className="bg-gradient-to-tr from-yellow-600 to-yellow-300"
                                    onPress={onClose}
                                    onClick={() => { guardarServicio(); onClose(); }}
                                >
                                    Crear
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}

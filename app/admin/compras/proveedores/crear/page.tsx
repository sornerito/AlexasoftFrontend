"use client";
import { title } from "@/components/primitives";
import React from "react";
import { useRouter } from "next/navigation";
import { Input, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Link, useDisclosure, Divider, Select, SelectItem, CircularProgress } from "@nextui-org/react";
import { CircleHelp, CircleX } from "lucide-react";
import { postWithAuth, verificarAccesoPorPermiso } from "@/config/peticionesConfig";
interface Proveedor {
    nombre: string;
    descripcion: string;
    contacto : string;
    telefono: string;
    estado: string;
    correo: string;
    tipoEmpresa: string;
    numeroIdentificacion: string;
}
export default function CrearProveedorPage() {
    //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if(typeof window !== "undefined"){
    if(verificarAccesoPorPermiso("Gestionar Proveedores") == false){
      window.location.href = "../../../../acceso/noAcceso"
    }
    setAcceso(verificarAccesoPorPermiso("Gestionar Proveedores"));
  }
  }, []);
    const [proveedor, setProveedor] = React.useState<Proveedor>({
        nombre: "",
        descripcion: "",
        contacto : "",
        telefono: "",
        estado: "Activo",
        correo: "",
        tipoEmpresa: "",
        numeroIdentificacion: "",
    });
    const [mensajeError, setMensajeError] = React.useState("");
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { isOpen: isOpenError, onOpen: onOpenError, onOpenChange: onOpenChangeError } = useDisclosure();
    const router = useRouter();
    
    const validarNombre = (nombre: string) => {
        if (!/^[A-Za-záéíóúÁÉÍÓÚ\s]+$/.test(nombre)) {
            return "El nombre no puede contener números ni caracteres especiales.";
        }
        if (nombre.length < 5) {
            return "El nombre debe tener al menos 5 caracteres.";
        }
        return "";
    };
    
    const validarCorreo = (correo: string) => {
        if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(correo)) {
            return "Ingresa un correo electrónico válido";
        }
        if (correo.length < 10) {
            return "El correo debe tener al menos 5 caracteres.";
        }
        return "";
    };
    const validarNumeroIdentificacion = (numeroIdentificacion: string) => {
        if (!/^[0-9]{10}$/.test(numeroIdentificacion)) {
            return "El numero Identificacion de la empresa debe tener 10 dígitos.";
        }
        return "";
    };
    const validarDescripcion = (descripcion: string) => {
        if (descripcion.length < 10) {
            return "La descripción debe tener al menos 10 caracteres.";
        }
        return "";
    };
    const validarTelefono = (telefono: string) => {
        if (!/^[0-9]{10}$/.test(telefono)) {
            return "El teléfono debe tener 10 dígitos.";
        }
        return "";
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProveedor({ ...proveedor, [name]: value });
        let error = "";
        switch (name) {
            case "nombre":
                error = validarNombre(value);
                break;
          
            case "descripcion":
                error = validarDescripcion(value);
                break;
            case "telefono":
                error = validarTelefono(value);
                break;
            case "correo":
                error = validarCorreo(value);
                break;  
            case "numeroIdentificacion":
                error = validarNumeroIdentificacion(value);
                break;  
        }
        setErrores({ ...errores, [name]: error });
    };
    const [errores, setErrores] = React.useState<any>({});
    const handleFormSubmit = (e: { preventDefault: () => void; }) => {
        e.preventDefault();

        const errorNombre = validarNombre(proveedor.nombre);
        const errorDescripcion = validarDescripcion(proveedor.descripcion);
        const errorTelefono = validarTelefono(proveedor.telefono);
        const errorCorreo = validarCorreo(proveedor.correo);
        const errorNumeroIdentificacion = validarNumeroIdentificacion(proveedor.numeroIdentificacion);


        if (errorNombre  || errorDescripcion || errorTelefono || errorCorreo || errorNumeroIdentificacion) {
            setErrores({
                nombre: errorNombre,
                
                descripcion: errorDescripcion,
                telefono: errorTelefono,
                correo: errorCorreo,
                errorNumeroIdentificacion: errorNumeroIdentificacion,
            });
            setMensajeError("Por favor corrija los errores en el formulario.");
            onOpenError();
            return;
        }
        onOpen();
    };
    const handleConfirmSubmit = async () => {
        try {
            const response = await postWithAuth("http://localhost:8080/compras/proveedores/", 
                proveedor
            );
            if (!response.ok) {
                const errorResponse = await response.text();    
                setMensajeError("No se puede crear el proveedor ya que hay un Nombre o Telefono o numero de identificaicon estan Repetido");
                onOpenError();
                throw new Error("Error al intentar guardar el proveedor");
            }
            router.push("/admin/compras/proveedores");
        } catch (error) {
            console.error("Error al enviar los datos:", error);
        }
        onOpenChange();
    };
    const TipoEmpresa = [
        { key: "Natural", label: "Natural" },
        { key: "Juridica", label: "Juridica" },
    ];

    const inhabilitarInput = proveedor.tipoEmpresa == "Juridica" ?(
        <Input
                        isRequired
                        type="text"
                        label="Contacto"
                        variant="bordered"
                        value={proveedor.contacto}
                        isInvalid={!!errores.contacto}
                        color={errores.contacto ? "danger" : "default"}
                        errorMessage={errores.contacto}
                        onChange={handleChange}
                        name="contacto"

                    />
    ) : (
""
    )

    return (
        <>
{acceso ? (
        <div className="lg:mx-60">
            <h1 className={title()}>Crear Proveedor</h1>
            <br />
            <br />
            <form onSubmit={handleFormSubmit}>
                <div className="grid gap-3 sm:grid-cols-1">
                <Select
                        isRequired
                        name="Tipo empresa"
                        label="Tipo empresa"
                        variant="bordered"
                        value={proveedor.tipoEmpresa}
                        onChange={(e) => setProveedor({ ...proveedor, tipoEmpresa: e.target.value })}
                        required
                        onError={errores.tipoEmpresa}
                    >
                        {TipoEmpresa.map((TipoEmpresa) => (
                            <SelectItem key={TipoEmpresa.key}>
                                {TipoEmpresa.label}
                            </SelectItem>
                        ))}
                    </Select>
                  
                    <Input
                        isRequired
                        type="text"
                        label="Numero Identificacion de la empresa"
                        variant="bordered"
                        value={proveedor.numeroIdentificacion}
                        isInvalid={!!errores.numeroIdentificacion}
                        color={errores.numeroIdentificacion ? "danger" : "default"}
                        errorMessage={errores.numeroIdentificacion}
                        onChange={handleChange}
                        name="numeroIdentificacion"
                    />
                    <Input
                        isRequired
                        type="text"
                        label="Nombre Empresa o Persona"
                        variant="bordered"
                        value={proveedor.nombre}
                        isInvalid={!!errores.nombre}
                        color={errores.nombre ? "danger" : "default"}
                        errorMessage={errores.nombre}
                        onChange={handleChange}
                        name="nombre"
                    />
                    {inhabilitarInput}
                    <Input
                        isRequired
                        type="text"
                        label="Correo"
                        variant="bordered"
                        value={proveedor.correo}
                        isInvalid={!!errores.correo}
                        color={errores.correo ? "danger" : "default"}
                        errorMessage={errores.correo}
                        onChange={handleChange}
                        name="correo"
                    />
                    <Input
                        isRequired
                        type="text"
                        label="Teléfono"
                        variant="bordered"
                        value={proveedor.telefono}
                        isInvalid={!!errores.telefono}
                        color={errores.telefono ? "danger" : "default"}
                        errorMessage={errores.telefono}
                        onChange={handleChange}
                        name="telefono"
                    />
                    <Input
                        isRequired
                        type="text"
                        label="Descripción"
                        variant="bordered"
                        value={proveedor.descripcion}
                        isInvalid={!!errores.descripcion}
                        color={errores.descripcion ? "danger" : "default"}
                        errorMessage={errores.descripcion}
                        onChange={handleChange}
                        name="descripcion"
                    />
                </div>
                <div className="my-4 text-end">
                    <Link href="/admin/compras/proveedores">
                        <Button className="bg-gradient-to-tr from-red-600 to-red-300 mr-2" type="button">
                            Cancelar
                        </Button>
                    </Link>
                    <Button className="bg-gradient-to-tr from-yellow-600 to-yellow-300" type="submit">
                        Crear Proveedor
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
                                <h1 className=" text-3xl">¿Desea crear el proveedor?</h1>
                                <p>El proveedor se creará con la información proporcionada.</p>
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
                                <h1 className=" text-3xl">Error</h1>
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
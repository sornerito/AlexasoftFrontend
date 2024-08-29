"use client";
import { Toaster, toast } from 'sonner';
import { useRouter } from "next/navigation";
import { title } from "@/components/primitives";
import React, { useEffect, useState } from "react";
import { CircleHelp, CircleX } from "lucide-react";
import { postWithAuth, verificarAccesoPorPermiso } from "@/config/peticionesConfig";
import {
  Input,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Link,
  Spinner,
  CircularProgress,
} from "@nextui-org/react";

// Definición del tipo Cliente
interface Cliente {
  nombre: string;
  correo: string;
  telefono: string;
  instagram: string;
  contrasena: string;
  estado: string;
  fechaInteraccion: Date;
  idRol: number;
  [key: string]: any;
}

// Componente principal
export default function ClientesPageCrear() {
     //Valida permiso
     const [acceso, setAcceso] = React.useState<boolean>(false);
     React.useEffect(() => {
       if(typeof window !== "undefined"){
       if(verificarAccesoPorPermiso("Gestionar Clientes") == false){
         window.location.href = "../../../../acceso/noAcceso"
       }
       setAcceso(verificarAccesoPorPermiso("Gestionar Clientes"));
     }
     }, []);
  const [cliente, setCliente] = useState<Cliente>({
    nombre: "",
    correo: "",
    telefono: "",
    instagram: "",
    contrasena: "",
    estado: "Activo",
    fechaInteraccion: new Date(),
    idRol: 3,
  });

  // Estados y Hooks
  const [errores] = useState<any>({});
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { isOpen: isOpenError, onOpen: onOpenError, onOpenChange: onOpenChangeError } = useDisclosure();
  const [mensajeError, setMensajeError] = useState("");
  const router = useRouter();

  // Cargar y desaparecer spinner
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Función para enviar el formulario
  const handleSubmit = async () => {
    try {

      const clienteData = {
        ...cliente,
        instagram: cliente.instagram.trim() === "" ? null : cliente.instagram,
      };

      const response = await postWithAuth("http://localhost:8080/cliente", clienteData);
      if (response.ok) {
        toast.success("Cliente creado con éxito!");
        setTimeout(() => {
          router.push("/admin/clientes");
        }, 1000);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Error al crear el cliente';
        setMensajeError(errorMessage);
        onOpenError();
      }
    } catch (error) {
      console.error("Error de red:", error);
      setMensajeError("Error de red. Inténtalo de nuevo.");
      onOpenError();
    }
  };

  // Función para manejar cambios en los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCliente({ ...cliente, [name]: value });
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      [name]: validateField(name, value),
    }));
  };

  // Función para manejar la presentación del formulario
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onOpen();
  };

  // Función para manejar la confirmación del envío del formulario
  const handleConfirmSubmit = () => {
    handleSubmit();
    onOpenChange();
  };

  // Validación en tiempo real
  const [validationErrors, setValidationErrors] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    instagram: "",
    contrasena: "",
  });

  // Función para validar un campo individual
  const validateField = (name: string, value: string) => {
    switch (name) {
      case "nombre":
        return /^[A-Za-z\u00C0-\u017F\s]{6,}$/.test(value)
          ? ""
          : "El nombre debe tener al menos 6 letras y espacios.";
      case "correo":
        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        return emailRegex.test(value)
          ? ""
          : "Ingresa un correo electrónico válido.";
      case "telefono":
        return /^\d{7,10}$/.test(value) && !value.includes('e')
          ? ""
          : "El teléfono debe tener entre 7 y 10 dígitos y no puede contener la letra 'e'.";
      case "instagram":
        return value.startsWith("@")
          ? ""
          : "El nombre de usuario de Instagram debe comenzar con '@'.";
      case "contrasena":
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(value)
          ? ""
          : "La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, un número y un carácter especial (@$!%*?&#).";
      default:
        return "";
    }
  };

  // Función para validar todo el formulario
  const e = () => {
    const errors = {};
    for (const field in cliente) {
      errores[field] = validateField(field, cliente[field]);
    }
    setValidationErrors(errores);
    return Object.keys(errors).length === 0;
  };

  const [isLoading, setIsLoading] = useState(true);

  // Retorno del componente
  return (
    <>
{acceso ? (

    <div className="lg:mx-60">
      <h1 className={title()}>Crear Cliente</h1>
      <br /><br />
      {isLoading ? (
        <div className="flex justify-center text-center h-screen">
          <div className="text-center">
            <Spinner color="warning" size="lg" />
          </div>
        </div>
      ) : (
        <form onSubmit={handleFormSubmit}>
          <div className="grid gap-4">
            <Input
              isRequired
              type="text"
              pattern="[A-Za-zñÑáéíóúÁÉÍÓÚ\s]+"
              name="nombre"
              label="Nombre y Apellidos"
              value={cliente.nombre}
              onChange={handleChange}
              required
              onError={errores.nombre}
              isInvalid={!!validationErrors.nombre}
              errorMessage={validationErrors.nombre}
            />
            <Input
              isRequired
              type="email"
              name="correo"
              label="Correo"
              value={cliente.correo}
              onChange={handleChange}
              required
              onError={errores.correo}
              isInvalid={!!validationErrors.correo}
              errorMessage={validationErrors.correo}
            />
            <Input
              isRequired
              type="number"
              pattern="/^[0-9]{10}$/"
              name="telefono"
              label="Teléfono"
              value={cliente.telefono}
              onChange={handleChange}
              required
              onError={errores.telefono}
              isInvalid={!!validationErrors.telefono}
              errorMessage={validationErrors.telefono}
            />
            <Input
              name="instagram"
              label="Instagram (Opcional)"
              value={cliente.instagram}
              onChange={handleChange}
              onError={errores.instagram}
              isInvalid={!!validationErrors.instagram}
              errorMessage={validationErrors.instagram}
            />
            <Input
              isRequired
              name="contrasena"
              label="Contraseña"
              type="password"
              value={cliente.contrasena}
              onChange={handleChange}
              required
              onError={errores.contrasena}
              isInvalid={!!validationErrors.contrasena}
              errorMessage={validationErrors.contrasena}
            />
          </div>
          <div className="flex justify-end mt-4">
            <Link href="/admin/clientes">
              <Button className="bg-gradient-to-tr from-red-600 to-red-300 mr-2" type="button">
                Cancelar
              </Button>
            </Link>
            <Button className="bg-gradient-to-tr from-yellow-600 to-yellow-300" type="submit">
              Enviar
            </Button>
          </div>
        </form>
      )}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 items-center">
                <CircleHelp color="#fef08a" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className=" text-3xl">¿Desea crear el cliente?</h1>
                <p>El cliente se creará con la información proporcionada.</p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="warning"
                  variant="light"
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

      <Toaster position="bottom-right" />
    </div>
          
        ) :(
          <CircularProgress color="warning" aria-label="Cargando..." />
        )}
    </>
  );
}

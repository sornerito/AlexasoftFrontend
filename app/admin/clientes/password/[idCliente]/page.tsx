"use client";
import { Toaster, toast } from 'sonner';
import { title } from "@/components/primitives";
import React, { useEffect, useState } from "react";
import { CircleHelp, CircleX } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { getWithAuth, postWithAuth, verificarAccesoPorPermiso } from "@/config/peticionesConfig";
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
  idCliente: string;
  contrasena: string;
}

// Componente principal
export default function EditarContrasenaPage() {
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
  // Estados y Hooks
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { isOpen: isOpenError, onOpen: onOpenError, onOpenChange: onOpenChangeError } = useDisclosure();
  const [mensajeError, setMensajeError] = useState("");
  const router = useRouter();
  const { idCliente } = useParams();
  const [validationErrors, setValidationErrors] = useState({
    nuevaContrasena: "",
    confirmarContrasena: "",
  });

  // Obtener los datos del cliente al montar el componente
  useEffect(() => {
    const fetchCliente = async () => {
      try {
        const response = await getWithAuth(`http://localhost:8080/cliente/${idCliente}`);
        const data = await response.json();
        setCliente({ idCliente: data.idCliente, contrasena: "" });
      } catch (error) {
        console.error("Error al obtener los datos del cliente:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCliente();
  }, [idCliente]);

  // Función para enviar el formulario
  const handleSubmit = async () => {
    if (!cliente) return;

    if (nuevaContrasena !== confirmarContrasena) {
      setMensajeError("Las contraseñas no coinciden.");
      onOpenError();
      return;
    }

    try {
      const response = await postWithAuth(`http://localhost:8080/cliente/password/${cliente.idCliente}`, nuevaContrasena);
      if (response.ok) {
        toast.success("Contraseña editada con éxito!");
        setTimeout(() => {
          router.push("/admin/clientes");
        }, 1000);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Error al editar la contraseña';
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
    if (name === 'nuevaContrasena') {
      setNuevaContrasena(value);
    } else if (name === 'confirmarContrasena') {
      setConfirmarContrasena(value);
    }
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      [name]: validateField(name, value),
      // Si se cambia la nueva contraseña, también validar la confirmación
      ...(name === "nuevaContrasena" ? { confirmarContrasena: validateField("confirmarContrasena", confirmarContrasena) } : {}),
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

  // Validación de campos individuales
  const validateField = (name: string, value: string) => {
    switch (name) {
      case "nuevaContrasena":
        const hasUpperCase = /[A-Z]/.test(value);
        const hasNumber = /\d/.test(value);
        const hasSpecialChar = /[@$!%*?&#]/.test(value);
        return value.length >= 8 && hasUpperCase && hasNumber && hasSpecialChar
          ? ""
          : "La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, un número y un carácter especial (@$!%*?&#).";
      case "confirmarContrasena":
        return nuevaContrasena === value
          ? ""
          : "Las contraseñas no coinciden.";
      default:
        return "";
    }
  };

  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
{acceso ? (

    <div className="lg:mx-60">
      <h1 className={title()}>Editar Contraseña</h1>
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
              name="nuevaContrasena"
              label="Nueva Contraseña"
              type="password"
              value={nuevaContrasena}
              onChange={handleChange}
              required
              isInvalid={!!validationErrors.nuevaContrasena}
              errorMessage={validationErrors.nuevaContrasena}
            />
            <Input
              isRequired
              name="confirmarContrasena"
              label="Confirmar Contraseña"
              type="password"
              value={confirmarContrasena}
              onChange={handleChange}
              required
              isInvalid={!!validationErrors.confirmarContrasena}
              errorMessage={validationErrors.confirmarContrasena}
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
                <h1 className=" text-3xl">¿Desea editar la contraseña?</h1>
                <p>La contreaseña se actualizará con la información proporcionada.</p>
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
                  Editar
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

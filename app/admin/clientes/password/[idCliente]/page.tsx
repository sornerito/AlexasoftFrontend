"use client";

// Importar módulos necesarios
import { Toaster, toast } from "sonner";
import { title } from "@/components/primitives";
import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { CircleHelp, CircleX } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import {
  getWithAuth,
  postWithAuth,
  verificarAccesoPorPermiso,
} from "@/config/peticionesConfig";
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
  Spinner
} from "@nextui-org/react";

// Definición de la interfaz Cliente
interface Cliente {
  idCliente: string;
  contrasena: string;
}

// Componente principal EditarContrasenaPage
export default function EditarContrasenaPage() {
  // Estado para controlar el acceso al componente
  const [acceso, setAcceso] = useState<boolean>(false);

  // Verifica el acceso al componente al cargar
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!verificarAccesoPorPermiso("Gestionar Clientes")) {
        window.location.href = "../../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Clientes"));
    }
  }, []);

  // Estados para la gestión de la contraseña
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [mensajeError, setMensajeError] = useState("");
  const [validationErrors, setValidationErrors] = useState({
    nuevaContrasena: "",
    confirmarContrasena: "",
  }); // Errores de validación de los campos del formulario

  // Hooks para controlar los modales
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isOpenError,
    onOpen: onOpenError,
    onOpenChange: onOpenChangeError,
  } = useDisclosure();

  // Router y parámetros de la URL
  const router = useRouter();
  const { idCliente } = useParams();

  // Obtiene los datos del cliente al cargar el componente
  useEffect(() => {
    const fetchCliente = async () => {
      try {
        const response = await getWithAuth(
          `http://localhost:8080/cliente/${idCliente}`
        );
        if (!response.ok) {
          if (response.status === 404) {
            setMensajeError("Cliente no encontrado.");
          } else {
            setMensajeError("Error al obtener los datos del cliente.");
          }
          onOpenError();
          return;
        }
        const data = await response.json();
        setCliente({ idCliente: data.idCliente, contrasena: "" });
      } catch (error) {
        console.error("Error al obtener los datos del cliente:", error);
        setMensajeError("Error al obtener los datos del cliente.");
        onOpenError();
      } finally {
        setIsLoading(false);
      }
    };

    fetchCliente();
  }, [idCliente, onOpenError]);

  // Envía la nueva contraseña al servidor
  const handleSubmit = async () => {
    if (!cliente) return;

    if (nuevaContrasena !== confirmarContrasena) {
      setMensajeError("Las contraseñas no coinciden.");
      onOpenError();
      return;
    }

    try {
      const response = await postWithAuth(
        `http://localhost:8080/cliente/password/${cliente.idCliente}`,
        nuevaContrasena
      );
      if (response.ok) {
        toast.success("Contraseña editada con éxito!");
        setTimeout(() => {
          router.push("/admin/clientes");
        }, 1000);
      } else {
        const errorData = await response.json();
        // Maneja los errores de validación del backend si los hay
        if (errorData.errors) {
          setValidationErrors(errorData.errors);
        } else {
          const errorMessage = errorData.error || "Error al editar la contraseña";
          setMensajeError(errorMessage);
        }
        onOpenError();
      }
    } catch (error) {
      console.error("Error de red:", error);
      setMensajeError("Error de red. Inténtalo de nuevo.");
      onOpenError();
    }
  };

  // Maneja los cambios en los campos del formulario
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "nuevaContrasena") {
      setNuevaContrasena(value);
    } else if (name === "confirmarContrasena") {
      setConfirmarContrasena(value);
    }
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      [name]: validateField(name, value),
      ...(name === "nuevaContrasena"
        ? { confirmarContrasena: validateField("confirmarContrasena", confirmarContrasena) }
        : {}),
    }));
  };

  // Maneja el envío del formulario (abre el modal de confirmación)
  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onOpen();
  };

  // Maneja la confirmación del envío del formulario (llama a handleSubmit)
  const handleConfirmSubmit = () => {
    handleSubmit();
    onOpenChange();
  };

  // Valida un campo del formulario 
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

  // Renderiza el componente
  return (
    <>
      {acceso ? (
        <div className="lg:mx-60">
          <h1 className={title()}>Editar Contraseña</h1>
          <br />
          <br />

          {/* Muestra un Spinner mientras carga los datos */}
          {isLoading ? (
            <div className="flex justify-center text-center h-screen">
              <div className="text-center">
                <Spinner color="warning" size="lg" />
              </div>
            </div>
          ) : (
            // Formulario para editar la contraseña
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
                  <Button
                    className="bg-gradient-to-tr from-red-600 to-red-300 mr-2"
                    type="button"
                  >
                    Cancelar
                  </Button>
                </Link>
                <Button
                  className="bg-gradient-to-tr from-yellow-600 to-yellow-300"
                  type="submit"
                >
                  Enviar
                </Button>
              </div>
            </form>
          )}

          {/* Modal de confirmación de edición */}
          <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col gap-1 items-center">
                    <CircleHelp color="#fef08a" size={100} />
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <h1 className=" text-3xl">¿Desea editar la contraseña?</h1>
                    <p>
                      La contreaseña se actualizará con la información
                      proporcionada.
                    </p>
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

          {/* Modal de error */}
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
      ) : (
        // Mostrar spinner si no tiene acceso
        <div className="flex justify-center text-center h-screen">
          <div className="text-center">
            <Spinner color="warning" size="lg" />
          </div>
        </div>
      )}
    </>
  );
}
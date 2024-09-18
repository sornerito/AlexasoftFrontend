"use client";

// Importar módulos necesarios
import { Toaster, toast } from "sonner";
import { title } from "@/components/primitives";
import { CircleHelp, CircleX } from "lucide-react";
import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
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
  nombre: string;
  correo: string;
  telefono: string;
  instagram: string;
  estado: string;
  fechaInteraccion: Date;
  idRol: number;
  [key: string]: any;
}

// Componente principal EditarClientePage
export default function EditarClientePage() {
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

  // Estados para la gestión del cliente
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [originalCliente, setOriginalCliente] = useState<Cliente | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mensajeError, setMensajeError] = useState("");
  const [validationErrors, setValidationErrors] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    instagram: "",
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
    getWithAuth(`http://10.170.83.243:8080/cliente/${idCliente}`)
      .then((response) => {
        if (!response.ok) {
          if (response.status === 404) {
            setMensajeError("Cliente no encontrado.");
          } else {
            setMensajeError("Error al obtener los datos del cliente.");
          }
          onOpenError();
          return Promise.reject();
        }
        return response.json();
      })
      .then((data) => {
        setCliente(data);
        setOriginalCliente(data);
      })
      .catch((error) => {
        setMensajeError("Error al obtener los datos del cliente. Intenta recargar la página.");
        onOpenError();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [idCliente, onOpenError]);

  // Envía el formulario al servidor
  const handleSubmit = async () => {
    try {
      const clienteData = {
        ...cliente,
        instagram: cliente?.instagram.trim() === "" ? null : cliente?.instagram,
      };
      const response = await postWithAuth(
        `http://10.170.83.243:8080/cliente/${cliente?.idCliente}`,
        clienteData
      );
      if (response.ok) {
        toast.success("Cliente editado con éxito!");
        setTimeout(() => {
          router.push("/admin/clientes");
        }, 1000);
      } else {
        const errorData = await response.json();
        if (errorData.errors) {
          setValidationErrors(errorData.errors);
        } else {
          setMensajeError("Error al editar el cliente.");
          onOpenError();
        }
      }
    } catch (error) {
      setMensajeError("Error al enviar el formulario.");
      onOpenError();
    }
  };

  // Maneja los cambios en los campos del formulario
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCliente({ ...cliente, [name]: value } as Cliente);
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      [name]: validateField(name, value),
    }));
  };

  // Maneja el envío del formulario (abre el modal de confirmación)
  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Verificar si se realizaron cambios en el cliente
    if (JSON.stringify(cliente) === JSON.stringify(originalCliente)) {
      toast.error("No se realizaron cambios.");
    } else {
      onOpen();
    }
  };

  // Maneja la confirmación del envío del formulario (llama a handleSubmit)
  const handleConfirmSubmit = () => {
    handleSubmit();
    onOpenChange();
  };

  // Valida un campo del formulario
  const validateField = (name: string, value: string) => {
    switch (name) {
      case "nombre":
        return /^[A-Za-z\u00C0-\u017F\s]{6,}$/.test(value)
          ? ""
          : "El nombre debe tener al menos 6 letras y espacios.";
      case "correo":
        const emailRegex =
          /^[A-Z0-9._%+-]+@(gmail|hotmail|outlook|yahoo)\.[A-Z]{2,}$/i;
        return emailRegex.test(value)
          ? ""
          : "Ingresa un correo electrónico válido (gmail, hotmail, outlook o yahoo).";
      case "telefono":
        return /^[0-9]{1,10}$/.test(value)
          ? ""
          : "El teléfono debe tener máximo 10 dígitos y no puede contener la letra 'e'.";
      case "instagram":
        return value.startsWith("@")
          ? ""
          : "El nombre de usuario de Instagram debe comenzar con '@'.";
      default:
        return "";
    }
  };

  // Renderiza el componente
  return (
    <>
      {acceso ? (
        <div className="container">
          <h1 className={title()}>Editar Cliente</h1>
          <br />
          <br />

          {/* Muestra un Spinner mientras carga los datos */}
          {isLoading ? (
            <div className="flex justify-center h-screen text-center">
              <div className="text-center">
                <Spinner color="warning" size="lg" />
              </div>
            </div>
          ) : (
            // Formulario para editar el cliente
            <form onSubmit={handleFormSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  isRequired
                  type="text"
                  pattern="[A-Za-zñÑáéíóúÁÉÍÓÚ\s]+"
                  name="nombre"
                  label="Nombre"
                  value={cliente?.nombre || ""}
                  onChange={handleChange}
                  required
                  isInvalid={!!validationErrors.nombre}
                  errorMessage={validationErrors.nombre}
                />
                <Input
                  isRequired
                  name="correo"
                  label="Correo"
                  value={cliente?.correo || ""}
                  onChange={handleChange}
                  required
                  isInvalid={!!validationErrors.correo}
                  errorMessage={validationErrors.correo}
                />
                <Input
                  isRequired
                  type="number"
                  pattern="/^[0-9]{10}$/"
                  name="telefono"
                  label="Teléfono"
                  value={cliente?.telefono || ""}
                  onChange={handleChange}
                  required
                  isInvalid={!!validationErrors.telefono}
                  errorMessage={validationErrors.telefono}
                />
                <Input
                  name="instagram"
                  label="Instagram (Opcional)"
                  value={cliente?.instagram || ""}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.instagram}
                  errorMessage={validationErrors.instagram}
                />
              </div>
              <div className="flex justify-end mt-4">
                <Link href="/admin/clientes">
                  <Button
                    className="mr-2 bg-gradient-to-tr from-red-600 to-red-300"
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
                  <ModalHeader className="flex flex-col items-center gap-1">
                    <CircleHelp color="#fef08a" size={100} />
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <h1 className="text-3xl ">¿Desea editar el cliente?</h1>
                    <p>
                      El cliente se actualizará con la información
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
                  <ModalHeader className="flex flex-col items-center gap-1">
                    <CircleX color="#894242" size={100} />
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <h1 className="text-3xl ">Error</h1>
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
        <div className="flex justify-center h-screen text-center">
          <div className="text-center">
            <Spinner color="warning" size="lg" />
          </div>
        </div>
      )}
    </>
  );
}
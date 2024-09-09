'use client';
import { title } from "@/components/primitives";
import React, { useEffect, useState } from "react";
import {
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  CircularProgress,
} from "@nextui-org/react";
import { CircleHelp, CircleX, Eye, EyeOff } from "lucide-react";
import { verificarAccesoPorPermiso, getWithAuth, postWithAuth } from "@/config/peticionesConfig";

export default function EditarContrasenaColaboradorPage({
  params,
}: {
  params: { idColaborador: string };
}) {
  // Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Colaboradores") === false) {
        window.location.href = "../../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Colaboradores"));
    }
  }, []);

  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [contrasenaVisible, setContrasenaVisible] = useState(false);
  const [mensajeError, setMensajeError] = useState("");
  const [colaborador, setColaborador] = useState<any>(null); // Estado para almacenar los datos del colaborador
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isOpenError, onOpen: onOpenError, onClose: onCloseError } = useDisclosure();
  const { isOpen: isOpenConfirm, onOpen: onOpenConfirm, onClose: onCloseConfirm } = useDisclosure(); // Modal de confirmación

  const toggleVisibility = () => setContrasenaVisible(!contrasenaVisible);

  // Función para obtener los datos del colaborador
  const obtenerDatosColaborador = async () => {
    try {
      const response = await getWithAuth(`http://localhost:8080/colaborador/${params.idColaborador}`);
      if (response.ok) {
        const data = await response.json();
        setColaborador(data);
      } else {
        console.error("Error al obtener los datos del colaborador:", response.statusText);
        setMensajeError("Error al obtener los datos del colaborador.");
        onOpenError();
      }
    } catch (error) {
      console.error("Error al enviar la solicitud:", error);
      setMensajeError("Error al enviar la solicitud.");
      onOpenError();
    }
  };

  useEffect(() => {
    obtenerDatosColaborador();
  }, []);

  const validarContrasena = (valor: string) => {
    const tieneMinuscula = /[a-z]/.test(valor);
    const tieneMayuscula = /[A-Z]/.test(valor);
    const tieneNumero = /[0-9]/.test(valor);
    const tieneCaracterEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(valor);
    const longitudValida = valor.length > 10 && valor.length < 15;
    return tieneMinuscula && tieneMayuscula && tieneNumero && tieneCaracterEspecial && longitudValida;
  };

  const handleActualizarContrasena = async () => {
    onOpenConfirm();
  };

  const confirmarActualizacion = async () => {
    try {
      const datosColaborador = colaborador;
      const response = await postWithAuth(`http://localhost:8080/colaborador/${params.idColaborador}`, { ...datosColaborador, contrasena: contrasena });

      if (response.ok) {
        onCloseConfirm(); // Cierra el modal de confirmación y redirige
        window.location.href = "/admin/Agendamiento/colaboradores";
      } else {
        console.error("Error al actualizar la contraseña:", response.statusText);
        setMensajeError("Error al actualizar la contraseña.");
        onOpenError();
      }
    } catch (error) {
      console.error("Error al enviar la solicitud:", error);
      setMensajeError("Error al enviar la solicitud.");
      onOpenError();
    }
  };

  const handleFormSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    handleActualizarContrasena();
  };

  if (!colaborador) {
    return <div>Cargando datos del colaborador...</div>;
  }

  return (
    <>
      {acceso ? (
        <div className="lg:mx-60">
          <h1 className={title()}>Actualizar Contraseña</h1>
          <br /><br />
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-3 sm">
              <Input
                isRequired
                label="Nueva Contraseña"
                endContent={
                  <button className="focus:outline-none" type="button" onClick={toggleVisibility}>
                    {contrasenaVisible ? (
                      <EyeOff className="text-2xl text-default-400 pointer-events-none" />
                    ) : (
                      <Eye className="text-2xl text-default-400 pointer-events-none" />
                    )}
                  </button>
                }
                type={contrasenaVisible ? "text" : "password"}
                variant="bordered"
                className="block w-full"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                isInvalid={!validarContrasena(contrasena)}
                color={!validarContrasena(contrasena) ? "danger" : "success"}
                errorMessage={!validarContrasena(contrasena) ? "La contraseña debe tener al menos 1 letra minúscula, 1 letra mayúscula, 1 número, 1 carácter especial y una longitud de entre 10 y 15 caracteres." : ""}
              />

              <Input
                isRequired
                label="Confirmar Contraseña"
                type={contrasenaVisible ? "text" : "password"}
                variant="bordered"
                className="block w-full"
                value={confirmarContrasena}
                onChange={(e) => setConfirmarContrasena(e.target.value)}
                isInvalid={confirmarContrasena !== contrasena}
                color={confirmarContrasena !== contrasena ? "danger" : "success"}
                errorMessage={confirmarContrasena !== contrasena ? "Las contraseñas no coinciden." : ""}
              />
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                type="submit"
                className="bg-gradient-to-tr from-yellow-600 to-yellow-300"
                disabled={!validarContrasena(contrasena)}
              >
                Editar Colaborador
              </Button>
            </div>
          </form>

          <Modal isOpen={isOpenConfirm} onClose={onCloseConfirm}>
            <ModalContent>
              <ModalHeader className="flex flex-col gap-1 items-center">
                <CircleHelp color="#fef08a" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className="text-3xl">¿Desea actualizar la contraseña?</h1>
                <p>La contraseña se actualizará con la información proporcionada.</p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onClick={() => { onCloseConfirm() }}>Cancelar</Button>
                <Button color="success" variant="light" onClick={confirmarActualizacion}>Aceptar</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Modal isOpen={isOpenError} onClose={onCloseError}>
            <ModalContent>
              <ModalHeader className="flex flex-col gap-1 items-center">
                <CircleX color="#894242" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className="text-3xl">Error</h1>
                <p>{mensajeError}</p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onClick={onCloseError}>Cerrar</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </div>
      ) : (
        <CircularProgress color="warning" aria-label="Cargando..." />
      )}
    </>
  );
}

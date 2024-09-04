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
  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if(typeof window !== "undefined"){
    if(verificarAccesoPorPermiso("Gestionar Colaboradores") == false){
      window.location.href = "../../../../acceso/noAcceso"
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

  const handleActualizarContrasena = async () => {
    if (contrasena !== confirmarContrasena) {
      setMensajeError("Las contraseñas no coinciden.");
      onOpenError();
      return;
    }
  
    try {

      const datosColaborador = colaborador;
  
      const response = await postWithAuth(`http://localhost:8080/colaborador/${params.idColaborador}`, {...datosColaborador, contrasena: contrasena});
  
      if (response.ok) {
        console.log("Contraseña actualizada exitosamente.");
        window.location.href = "/admin/Agendamiento/colaboradores";
        onClose();
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

    <div>
      <h1 className={title()}>Actualizar Contraseña del Colaborador</h1>
      <form onSubmit={handleFormSubmit}>
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
          className="max-w-xs mt-4"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
        />

        <Input
          isRequired
          label="Confirmar Contraseña"
          type={contrasenaVisible ? "text" : "password"}
          className="max-w-xs mt-4"
          value={confirmarContrasena}
          onChange={(e) => setConfirmarContrasena(e.target.value)}
        />
        <Button className="bg-gradient-to-tr from-yellow-600 to-yellow-300 mt-4" type="submit">
          Actualizar Contraseña
        </Button>
      </form>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 items-center">
            <CircleHelp color="#fef08a" size={100} />
          </ModalHeader>
          <ModalBody className="text-center">
            <h1 className="text-3xl">Contraseña actualizada</h1>
            <p>La contraseña del colaborador ha sido actualizada correctamente.</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onClick={onClose}>Cerrar</Button>
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
        ) :(
          <CircularProgress color="warning" aria-label="Cargando..." />
        )}
    </>
  );
}

"use client";
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
import { CircleHelp, CircleX} from "lucide-react";
import { getWithAuth, postWithAuth, verificarAccesoPorPermiso } from "@/config/peticionesConfig";

export default function EditarHorarioPage({
  params,
}: {
  params: { idHorario: string };
}) {
  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if(typeof window !== "undefined"){
    if(verificarAccesoPorPermiso("Gestionar Horario") == false){
      window.location.href = "../../../../acceso/noAcceso"
    }
    setAcceso(verificarAccesoPorPermiso("Gestionar Horario"));
  }
  }, []);

  const [numeroDia, setnumeroDia] = useState("");
  const [inicioJornada, setInicioJornada] = useState("");
  const [finJornada, setFinJornada] = useState("");
  const [estado, setEstado] = useState("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { isOpen: isOpenError, onOpen: onOpenError, onOpenChange: onOpenChangeError } = useDisclosure();
  const [mensajeError, setMensajeError] = useState("");

  useEffect(() => {
    getWithAuth(`http://localhost:8080/horario/${params.idHorario}`)
      .then((response) => response.json())
      .then((data) => {
        setnumeroDia(data.numeroDia);
        setInicioJornada(data.inicioJornada);
        setFinJornada(data.finJornada);
        setEstado(data.estado);
      })
      .catch((error) => {
        console.error("Error al cargar los datos de los horarios:", error);
      });
  }, [params.idHorario]);

  const validateTime = (time: string) => {
    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timePattern.test(time);
  };

  const handleEditarHorario = async () => {
    const horarioActualizado = {
      idHorario: params.idHorario,
      numeroDia,
      inicioJornada,
      finJornada,
      estado
    };

    try {
      const response = await postWithAuth(`http://localhost:8080/horario/${params.idHorario}`,(horarioActualizado));
      if (response.ok) {
        console.log("Horario editado exitosamente.");
        window.location.href = "/admin/Agendamiento/horario";
      } else {
        console.error("Error al editar el horario:", response.statusText);
        setMensajeError("Error al editar el horario.");
        onOpenError();
      }
    } catch (error) {
      console.error("Error al enviar la solicitud:", error);
      setMensajeError("Error al enviar la solicitud");
      onOpenError();
    }
  };

  const handleFormSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    if (!validateTime(inicioJornada) || !validateTime(finJornada)) {
      setMensajeError("Por favor, ingrese una hora válida en formato HH:MM.");
      onOpenError();
      return;
    }
    onOpen();
  };

  const handleConfirmSubmit = () => {
    handleEditarHorario();
    onOpenChange();
  };

  return (  
<>
{acceso ? (
      
    <div>
      <h1 className={title()}>Editar Horarios</h1>
      <form onSubmit={handleFormSubmit}>
        <Input
          isRequired
          type="time"
          label="Inicio Jornada"
          className="max-w-xs mt-4"
          value={inicioJornada}
          onChange={(e) => setInicioJornada(e.target.value)}
        />
        <Input
          isRequired
          type="time"
          label="Fin Jornada"
          className="max-w-xs mt-4"
          value={finJornada}
          onChange={(e) => setFinJornada(e.target.value)}
        />
        <Button type="submit">Editar Horario</Button>
      </form>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 items-center">
                <CircleHelp color="#fef08a" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className="text-3xl">¿Desea editar el horario?</h1>
                <p>El horario se actualizará con la información proporcionada.</p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  className="bg-[#609448]"
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
                <h1 className="text-3xl">Error</h1>
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

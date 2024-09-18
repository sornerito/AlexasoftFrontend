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
import { CircleHelp, CircleX } from "lucide-react";
import {
  getWithAuth,
  postWithAuth,
  verificarAccesoPorPermiso,
} from "@/config/peticionesConfig";

export default function EditarHorarioPage({
  params,
}: {
  params: { idHorario: string };
}) {
  // Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Horario") == false) {
        window.location.href = "../../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Horario"));
    }
  }, []);

  const [numeroDia, setnumeroDia] = useState("");
  const [inicioJornada, setInicioJornada] = useState("");
  const [finJornada, setFinJornada] = useState("");
  const [estado, setEstado] = useState("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isOpenError,
    onOpen: onOpenError,
    onOpenChange: onOpenChangeError,
  } = useDisclosure();
  const [mensajeError, setMensajeError] = useState("");

  useEffect(() => {
    getWithAuth(`http://192.168.56.1:8080/horario/${params.idHorario}`)
      .then((response) => response.json())
      .then((data) => {
        setnumeroDia(data.numeroDia);
        setInicioJornada(data.inicioJornada.slice(0, 5));
        setFinJornada(data.finJornada.slice(0, 5));
        setEstado(data.estado);
      })
      .catch((error) => {
        console.error("Error al cargar los datos de los horarios:", error);
      });
  }, [params.idHorario]);

  const validateTime = (time: string) => {
    // Valida solo horas y minutos en formato HH:MM
    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timePattern.test(time);
  };

  const isInvalid = React.useMemo(() => {
    return !validateTime(inicioJornada) || !validateTime(finJornada);
  }, [inicioJornada, finJornada]);

  const handleEditarHorario = async () => {
    const horarioActualizado = {
      idHorario: params.idHorario,
      numeroDia,
      inicioJornada,
      finJornada,
      estado,
    };

    try {
      const response = await postWithAuth(
        `http://192.168.56.1:8080/horario/${params.idHorario}`,
        horarioActualizado
      );
      if (response.ok) {
        console.log("Horario editado exitosamente.");
        window.location.href = "/admin/agendamiento/horario";
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

  const handleFormSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (isInvalid) {
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
        <div className="container">
          <h1 className={title()}>Editar Horarios</h1>
          <br />
          <br />
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                type="time"
                label="Inicio Jornada"
                placeholder="Seleccione una hora"
                className="block w-full"
                value={inicioJornada}
                isInvalid={!validateTime(inicioJornada)}
                errorMessage={
                  !validateTime(inicioJornada)
                    ? "Hora no válida. Formato HH:MM."
                    : ""
                }
                onChange={(e) => setInicioJornada(e.target.value)}
              />
              <Input
                type="time"
                label="Fin Jornada"
                placeholder="Seleccione una hora"
                className="block w-full"
                value={finJornada}
                isInvalid={!validateTime(finJornada)}
                errorMessage={
                  !validateTime(finJornada)
                    ? "Hora no válida. Formato HH:MM."
                    : ""
                }
                onChange={(e) => setFinJornada(e.target.value)}
              />
            </div>

            <div className="flex justify-end mt-6">
              <Button
                type="submit"
                className="bg-gradient-to-tr from-yellow-600 to-yellow-300"
                disabled={isInvalid}
              >
                Editar Horario
              </Button>
            </div>
          </form>

          <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col items-center gap-1">
                    <CircleHelp color="#fef08a" size={100} />
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <h1 className="text-3xl">¿Desea editar el horario?</h1>
                    <p>
                      El horario se actualizará con la información
                      proporcionada.
                    </p>
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
                  <ModalHeader className="flex flex-col items-center gap-1">
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
      ) : (
        <CircularProgress color="warning" aria-label="Cargando..." />
      )}
    </>
  );
}

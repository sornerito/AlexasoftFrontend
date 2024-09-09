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
import { CircleHelp, CircleX, PlusIcon } from "lucide-react";
import { getWithAuth, postWithAuth, verificarAccesoPorPermiso } from "@/config/peticionesConfig";

export default function EditarMotivosPage({
  params,
}: {
  params: { idMotivo: string };
}) {
  // Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Agendamiento") == false) {
        window.location.href = "../../../../acceso/noAcceso"
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Agendamiento"));
    }
  }, []);
  
  const [motivo, setMotivo] = useState("");
  const [estado, setEstado] = useState("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { isOpen: isOpenError, onOpen: onOpenError, onOpenChange: onOpenChangeError } = useDisclosure();
  const [mensajeError, setMensajeError] = useState("");

  useEffect(() => {
    getWithAuth(`http://localhost:8080/motivocancelacion/${params.idMotivo}`)
      .then((response) => response.json())
      .then((data) => {
        setMotivo(data.motivo);
        setEstado(data.estado);
      })
      .catch((error) => {
        console.error("Error al cargar los datos de los motivos:", error);
      });
  }, [params.idMotivo]);

  const validateMotivo = (value: string) => value.length > 3;

  const isInvalid = React.useMemo(() => {
    return !validateMotivo(motivo);
  }, [motivo]);

  const handleEditarMotivo = async () => {
    const motivoActualizado = {
      idMotivo: params.idMotivo,
      motivo,
      estado
    };

    try {
      const response = await postWithAuth(`http://localhost:8080/motivocancelacion/${params.idMotivo}`, motivoActualizado);
      if (response.ok) {
        console.log("Motivo editado exitosamente.");
        window.location.href = "/admin/agendamiento/motivo";
      } else {
        console.error("Error al editar el motivo:", response.statusText);
        setMensajeError("Error al editar el motivo.");
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
    
    if (isInvalid) {
      // Si el motivo es inválido, no abrir el modal de confirmación ni continuar
      return;
    }

    onOpen(); // Abre el modal si todo está correcto
  };

  const handleConfirmSubmit = () => {
    handleEditarMotivo();
    onOpenChange();
  };

  return (
    <>
      {acceso ? (
        <div className="lg:mx-60">
          <h1 className={title()}>Editar Motivo</h1>
          <br /> <br />
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-3 sm">
              <Input
                variant="bordered"
                isInvalid={isInvalid}
                color={isInvalid ? "danger" : "success"}
                errorMessage={isInvalid ? "El motivo debe tener más de 3 caracteres." : ""}
                isRequired
                type="text"
                label="Nombre Motivo"
                className="block w-full"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                type="submit"
                className="bg-gradient-to-tr from-yellow-600 to-yellow-300"
                disabled={isInvalid}
              >
                <PlusIcon /> Editar Motivo
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
                    <h1 className="text-3xl">¿Desea editar el motivo?</h1>
                    <p>El motivo se actualizará con la información proporcionada.</p>
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
      ) : (
        <CircularProgress color="warning" aria-label="Cargando..." />
      )}
    </>
  );
}

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
} from "@nextui-org/react";
import { CircleHelp, CircleX } from "lucide-react";
import { getWithAuth, postWithAuth } from "@/config/peticionesConfig";

export default function EditarColaboradorPage({
  params,
}: {
  params: { idColaborador: string };
}) {
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [estado, setEstado] = useState("");
  const [idRol, setIdRol] = useState("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isOpenError,
    onOpen: onOpenError,
    onOpenChange: onOpenChangeError,
  } = useDisclosure();
  const [mensajeError, setMensajeError] = useState("");

  useEffect(() => {
    getWithAuth(`http://192.168.56.1:8080/colaborador/${params.idColaborador}`)
      .then((response) => response.json())
      .then((data) => {
        setNombre(data.nombre);
        setCedula(data.cedula);
        setCorreo(data.correo);
        setTelefono(data.telefono);
        setContrasena(data.contrasena);
        setEstado(data.estado);
        setIdRol("2");
      })
      .catch((error) => {
        console.error("Error al cargar los datos del colaborador:", error);
      });
  }, [params.idColaborador]);

  const handleEditarColaborador = async () => {
    const colaboradorActualizado = {
      idColaborador: params.idColaborador,
      nombre,
      cedula,
      correo,
      telefono,
      contrasena,
      estado,
      idRol,
    };

    try {
      const response = await postWithAuth(
        `http://192.168.56.1:8080/colaborador/${params.idColaborador}`,
        colaboradorActualizado
      );
      if (response.ok) {
        console.log("Colaborador editado exitosamente.");
        window.location.href = "/admin/agendamiento/colaboradores";
      } else {
        console.error("Error al editar el colaborador:", response.statusText);
        setMensajeError("La cédula proporcionada ya está en uso.");
        onOpenError();
      }
    } catch (error) {
      console.error("Error al enviar la solicitud:", error);
      setMensajeError("Error al enviar la solicitud");
      onOpenError();
    }
  };

  const validarNombre = () => {
    return /^[A-Za-z\s]+$/.test(nombre);
  };

  const validarCedula = (valor: string) => {
    return /^[0-9]{8,13}$/.test(valor);
  };

  const validarTelefono = (valor: string) => {
    return /^[0-9]{10}$/.test(valor);
  };

  const validarCorreo = (valor: string) => {
    // Regex básica para validar el formato del correo electrónico
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  };

  const handleFormSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();

    onOpen();
  };

  const handleConfirmSubmit = () => {
    handleEditarColaborador();
    onOpenChange();
  };

  const isInvalid =
    !validarNombre() ||
    !validarCedula(cedula) ||
    !validarTelefono(telefono) ||
    !validarCorreo(correo);

  return (
    <div className="container">
      <h1 className={title()}>Editar Colaborador</h1>
      <br />
      <br />
      <form onSubmit={handleFormSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            isRequired
            type="text"
            label="Nombre"
            className="block w-full"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            isInvalid={!validarNombre()}
            color={!validarNombre() ? "danger" : "success"}
            errorMessage={
              !validarNombre() ? "El nombre no puede contener números." : ""
            }
          />
          <Input
            isRequired
            type="text"
            label="Cédula"
            className="block w-full"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            isInvalid={!validarCedula(cedula)}
            color={!validarCedula(cedula) ? "danger" : "success"}
            errorMessage={
              !validarCedula(cedula)
                ? "La cédula debe tener entre 8 y 13 dígitos."
                : ""
            }
          />
          <Input
            isRequired
            type="email"
            label="Correo"
            className="block w-full"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            isInvalid={!validarCorreo(correo)}
            color={!validarCorreo(correo) ? "danger" : "success"}
            errorMessage={
              !validarCorreo(correo)
                ? "El correo electrónico debe tener un formato válido."
                : ""
            }
          />
          <Input
            isRequired
            type="tel"
            label="Teléfono"
            className="block w-full"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            isInvalid={!validarTelefono(telefono)}
            color={!validarTelefono(telefono) ? "danger" : "success"}
            errorMessage={
              !validarTelefono(telefono)
                ? "El teléfono debe ser de 10 dígitos."
                : ""
            }
          />
        </div>

        <div className="flex justify-end mt-6">
          <Button
            type="submit"
            className="bg-gradient-to-tr from-yellow-600 to-yellow-300"
            disabled={isInvalid}
          >
            Editar Colaborador
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
                <h1 className="text-3xl">¿Desea editar el colaborador?</h1>
                <p>
                  El colaborador se actualizará con la información
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
  );
}

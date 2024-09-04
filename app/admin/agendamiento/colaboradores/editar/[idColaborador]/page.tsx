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
import { CircleHelp, CircleX, Eye, EyeOff } from "lucide-react";
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
  const { isOpen: isOpenError, onOpen: onOpenError, onOpenChange: onOpenChangeError } = useDisclosure();
  const [mensajeError, setMensajeError] = useState("");

  useEffect(() => {
    getWithAuth(`http://localhost:8080/colaborador/${params.idColaborador}`)
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
      idRol
    };

    try {
      const response = await postWithAuth(`http://localhost:8080/colaborador/${params.idColaborador}`,(colaboradorActualizado));
      if (response.ok) {
        console.log("Colaborador editado exitosamente.");
        window.location.href = "/admin/Agendamiento/colaboradores";
      } else {
        console.error("Error al editar el colaborador:", response.statusText);
        setMensajeError("La cedula proporcionada ya está en uso.");
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

  const handleFormSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();

    if (!validarNombre()) {
      setMensajeError("El nombre no puede contener números.");
      onOpenError();
      return;
    }

    if (!validarCedula(cedula)) {
      setMensajeError("La cédula solo puede contener números y debe ser entre 8 y 13 dígitos.");
      onOpenError();
      return;
    }

    if (!validarTelefono(telefono)) {
      setMensajeError("El teléfono solo puede contener números y debe ser de 10 dígitos.");
      onOpenError();
      return;
    }

    onOpen();
  };

  const handleConfirmSubmit = () => {
    handleEditarColaborador();
    onOpenChange();
  };

  return (
    <div>
      <h1 className={title()}>Editar Colaborador</h1>
      <form onSubmit={handleFormSubmit}>
        <Input
          isRequired
          type="text"
          label="Nombre"
          className="max-w-xs mt-4"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <Input
          isRequired
          type="text"
          label="Cédula"
          className="max-w-xs mt-4"
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
        />
        <Input
          isRequired
          type="email"
          label="Correo"
          className="max-w-xs mt-4"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
        <Input
          isRequired
          type="tel"
          label="Teléfono"
          className="max-w-xs mt-4"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
        <Button className="bg-gradient-to-tr from-yellow-600 to-yellow-300 mt-4" type="submit">
          Editar Colaborador
        </Button>
      </form>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 items-center">
                <CircleHelp color="#fef08a" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className="text-3xl">¿Desea editar el colaborador?</h1>
                <p>El colaborador se actualizará con la información proporcionada.</p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="warning" variant="light"
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
  );
}

'use client';
import React, { useState } from "react";
import { postWithAuth, verificarAccesoPorPermiso } from "@/config/peticionesConfig";
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
import { title } from "@/components/primitives";

export default function CrearColaboradorPage() {
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

  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [estado] = useState("Activo");
  const [idRol] = useState("2");
  const [contrasenaVisible, setContrasenaVisible] = useState(false);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { isOpen: isOpenError, onOpen: onOpenError, onOpenChange: onOpenChangeError } = useDisclosure();
  const [mensajeError, setMensajeError] = useState("");

  const handleCrearColaborador = async () => {
    const nuevoColaborador = {
      nombre,
      cedula,
      correo,
      telefono,
      contrasena,
      estado,
      idRol,
    };

    try {
      const response = await postWithAuth("http://localhost:8080/colaborador", nuevoColaborador);
      if (response.ok) {
        console.log("Colaborador creado exitosamente.");
        window.location.href = "/admin/Agendamiento/colaboradores";
      } else {
        const errorData = await response.json();
        console.error("Error al crear el colaborador:", errorData.message);
        setMensajeError(errorData.message || "Error al crear el colaborador");
        onOpenError();
      }
    } catch (error) {
      console.error("Error al enviar la solicitud:", error);
      setMensajeError("Error al enviar la solicitud");
      onOpenError();
    }
  };

  const validarNombre = () => /^[A-Za-z\s]+$/.test(nombre);
  const validarCedula = (valor: string) => /^[0-9]{8,13}$/.test(valor);
  const validarTelefono = (valor: string) => /^[0-9]{10}$/.test(valor);
  const validarCorreo = (valor: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  const validarContrasena = () => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{11,14}$/.test(contrasena);

  // Verifica si el formulario es válido
  const formIsValid = validarNombre() && validarCedula(cedula) && validarTelefono(telefono) && validarCorreo(correo) && validarContrasena();

  const handleFormSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();

    if (formIsValid) {
      onOpen();
    } else {
      setMensajeError("Por favor, complete todos los campos correctamente.");
      onOpenError();
    }
  };

  const handleConfirmSubmit = () => {
    handleCrearColaborador();
    onOpenChange();
  };

  const toggleVisibility = () => setContrasenaVisible(!contrasenaVisible);

  return (
    <>
      {acceso ? (
        <div className="lg:mx-60">
        <h1 className={title()}>Crear Colaborador</h1>
        <br /><br />
        <form onSubmit={handleFormSubmit}>
          <div className="grid gap-3 sm">
              <Input
              isRequired
              type="text"
              label="Nombre"
              variant="bordered"
              className="block w-full mt-4"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              isInvalid={!validarNombre()}
              color={!validarNombre() ? "danger" : "success"}
              errorMessage={!validarNombre() ? "El nombre no puede contener números." : ""}
            />
            <Input
              isRequired
              type="text"
              label="Cédula"
              variant="bordered"
              className="block w-full mt-4"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              isInvalid={!validarCedula(cedula)}
              color={!validarCedula(cedula) ? "danger" : "success"}
              errorMessage={!validarCedula(cedula) ? "La cédula solo puede contener números y debe ser entre 8 y 15 dígitos." : ""}
            />
            <Input
              isRequired
              type="email"
              label="Correo"
              variant="bordered"
              className="block w-full mt-4"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              isInvalid={!validarCorreo(correo)}
              color={!validarCorreo(correo) ? "danger" : "success"}
              errorMessage={!validarCorreo(correo) ? "El correo electrónico no es válido." : ""}
            />
            <Input
              isRequired
              type="tel"
              label="Teléfono"
              variant="bordered"
              className="block w-full mt-4"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              isInvalid={!validarTelefono(telefono)}
              color={!validarTelefono(telefono) ? "danger" : "success"}
              errorMessage={!validarTelefono(telefono) ? "El teléfono solo puede contener números y debe ser de 10 dígitos." : ""}
            />
            <Input
              isRequired
              label="Contraseña"
              variant="bordered"
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
              className="block w-full mt-4"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              isInvalid={!validarContrasena()}
              color={!validarContrasena() ? "danger" : "success"}
              errorMessage={!validarContrasena() ? "La contraseña debe tener entre 11 y 14 caracteres, y contener al menos una minúscula, una mayúscula, un número y un carácter especial." : ""}
            />
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button
                type="submit"
                className="bg-gradient-to-tr from-yellow-600 to-yellow-300"
                disabled={!formIsValid}
              >
                Crear Colaborador
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
                    <h1 className="text-3xl">¿Desea crear el colaborador?</h1>
                    <p>El colaborador se creará con la información proporcionada.</p>
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
                      Crear
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
        <div className="flex justify-center items-center h-screen">
          <CircularProgress size="lg" />
        </div>
      )}
    </>
  );
}

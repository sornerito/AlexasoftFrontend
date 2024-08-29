'use client'
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
  Select,
  SelectItem,
  CircularProgress,
} from "@nextui-org/react";
import { CircleHelp, CircleX, Eye, EyeOff } from "lucide-react";

export default function CrearColaboradorPage() {
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

  const validarNombre = () => {
    return /^[A-Za-z\s]+$/.test(nombre);
  };

  const validarCedula = (valor: string) => {
    return /^[0-9]{8,13}$/.test(valor);
  };

  const validarTelefono = (valor: string) => {
    return /^[0-9]{10}$/.test(valor);
  };

  const validarContrasena = () => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/.test(contrasena);
  };

  const handleFormSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();

    if (!validarNombre()) {
      setMensajeError("El nombre no puede contener números.");
      onOpenError();
      return;
    }

    if (!validarCedula(cedula)) {
      setMensajeError("La cédula solo puede contener números y debe ser entre 8 y 15 dígitos.");
      onOpenError();
      return;
    }

    if (!validarTelefono(telefono)) {
      setMensajeError("El teléfono solo puede contener números y debe ser de 10 dígitos.");
      onOpenError();
      return;
    }

    if (!validarContrasena()) {
      setMensajeError("La contraseña debe tener entre 8 y 15 caracteres, y contener al menos una minúscula, una mayúscula, un número y un carácter especial.");
      onOpenError();
      return;
    }

    onOpen();
  };

  const handleConfirmSubmit = () => {
    handleCrearColaborador();
    onOpenChange();
  };

  const [isVisible, setIsVisible] = React.useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);
  return (
    <>
{acceso ? (

    <div>
      <h1 className="title">Crear Colaborador</h1>
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
        <Input
          isRequired
          label="Contraseña"
          endContent={
            <button className="focus:outline-none" type="button" onClick={toggleVisibility}>
              {isVisible ? (
                <EyeOff className="text-2xl text-default-400 pointer-events-none" />
              ) : (
                <Eye className="text-2xl text-default-400 pointer-events-none" />
              )}
            </button>
          }
          type={isVisible ? "text" : "password"}
          className="max-w-xs mt-4"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
        />
        <br></br>
        <Button className="bg-gradient-to-tr from-yellow-600 to-yellow-300 mt-4" type="submit">
          Crear Colaborador
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
          
        ) :(
          <CircularProgress color="warning" aria-label="Cargando..." />
        )}
    </>
  );
}
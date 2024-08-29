"use client";
import { title } from "@/components/primitives";
import React from "react";
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
  Image
} from "@nextui-org/react";
import { CircleX, TriangleAlert } from "lucide-react";
import {
  validarCampoString,
  validarEmailModal,
  validarContrasenaModal,
  validarTelefonoModal,
  validarInstagramModal,
} from "@/config/validaciones";
import { getWithAuth } from "@/config/peticionesConfig";

export default function RegistroPage() {
  const [token, setToken] = React.useState<string | null>("token");
  React.useEffect(() => {
    setToken(
      typeof window !== "undefined" ? sessionStorage.getItem("token") : "null"
    );
    if (sessionStorage.getItem("token") != null) {
      window.location.href = "../acceso/perfil";
    }
  }, []);
  const {
    isOpen: isOpenError,
    onOpen: onOpenError,
    onOpenChange: onOpenChangeError,
  } = useDisclosure(); //Hook de modal error
  const {
    isOpen,
    onOpen,
    onOpenChange
  } = useDisclosure(); //Hook de modal error
  const {
    isOpen: isOpenAdvertencia,
    onOpen: onOpenAdvertencia,
    onOpenChange: onOpenChangeAdvertencia,
  } = useDisclosure(); //Hook de modal advertencia

  const reestablecerValidar= ()=>{
    setEnviando(false)
    setValidandoCodigo(false)
    setCodigo("")
  }

  const [nombreCliente, setNombreCliente] = React.useState("");
  const [correoCliente, setCorreoCliente] = React.useState("");
  const [telefonoCliente, setTelefonoCliente] = React.useState("");
  const [contrasenaCliente, setContrasenaCliente] = React.useState("");
  const [repetirContrasena, setRepetirContrasena] = React.useState("");
  const [instagram, setInstagram] = React.useState<any>("@");
  const [codigo, setCodigo] = React.useState("");
  const [mensajeError, setMensajeError] = React.useState("");

  //Metodo para validar registro y crear codigo
  const [enviando, setEnviando] = React.useState(false);
  const validarRegistro = async () => {
    setValidandoCodigo(false)
    setEnviando(true)
    const errorNombre = validarCampoString(nombreCliente, "El nombre ");
    const errorEmail = validarEmailModal(correoCliente);
    const errorTelefono = validarTelefonoModal(telefonoCliente);
    const errorContrasena = validarContrasenaModal(contrasenaCliente);
    const errorInstagram = validarInstagramModal(instagram);

    if (errorNombre != "") {
      setMensajeError(errorNombre);
      onOpenError();
      setEnviando(false)
      return;
    } else if (!/^[A-Za-z]+(?: [A-Za-z]+)+$/.test(nombreCliente)) {
      setMensajeError(
        "Debe registrar el nombre completo (Nombres y apellidos)."
      );
      onOpenError();
      setEnviando(false)
      return;
    }
    if (errorEmail != "") {
      setMensajeError(errorEmail);
      onOpenError();
      setEnviando(false)
      return;
    }
    if (instagram != "" && instagram != "@") {
      if (errorInstagram != "") {
        setMensajeError(errorInstagram);
        onOpenError();
        setEnviando(false)
        return;
      }
    }
    if (instagram == "" || instagram == "@") {
      setInstagram(null);
    }

    if (errorTelefono != "") {
      setMensajeError(errorTelefono);
      onOpenError();
      setEnviando(false)
      return;
    }
    if (errorContrasena != "") {
      setMensajeError(errorContrasena);
      onOpenError();
      setEnviando(false)
      return;
    }

    if (contrasenaCliente != repetirContrasena) {
      setMensajeError("Las contraseñas no coinciden");
      onOpenError();
      setEnviando(false)
      return;
    }

    let url =
      "http://localhost:8080/acceso/solicitarCambioContrasenaCorreo?correo=" +
      correoCliente + "&registro=true"
    try {
      const response = await getWithAuth(url);
      const responseText = await response.text();
      setMensajeError(responseText);
      if (!response.ok) {
        onOpenError();
        setEnviando(false)
        throw new Error("Error al solicitar el codigo");
      }
      onOpen()
    } catch (error) {
      setEnviando(false)
      console.error("Error al enviar los datos:", error);
    }
  };

  //VALIDAR CODIGO
  const [validandoCodigo, setValidandoCodigo] = React.useState<boolean>(false);
  const validarCodigo = async () => {
    setValidandoCodigo(true);
    if (!codigo?.match(/^[0-9]{4}$/) || codigo.length == 0) {
      setMensajeError("El codigo debe tener 4 dígitos")
      onOpenError()
      setValidandoCodigo(false)
      return;
    }

    let url =
      "http://localhost:8080/acceso/validarCodigo?correo=" + correoCliente + "&codigo=" + codigo
    try {
      const response = await getWithAuth(url);
      const responseText = await response.text();
      setMensajeError(responseText);
      if (!response.ok) {
        onOpenError();
        setValidandoCodigo(false)
        setEnviando(false)
        throw new Error("Error al solicitar el codigo");
      }
      guardarCliente()
    } catch (error) {
      setValidandoCodigo(false)
      console.error("Error al enviar los datos:", error);
    }
  };//FIN VALIDAR CODIGO
  
  const guardarCliente = async ()=>{
    const data = {
      nombre: nombreCliente,
      correo: correoCliente,
      telefono: telefonoCliente,
      instagram: instagram,
      contrasena: contrasenaCliente,
      estado: "Activo",
    };

    try {
      const response = await fetch("http://localhost:8080/acceso/registro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorResponse = await response.text();
        setMensajeError(errorResponse);
        onOpenError();
        setEnviando(false)
        setValidandoCodigo(false)
        throw new Error("Error al intentar el usuario");
      }
      window.location.href = "/acceso/iniciarsesion";
      setEnviando(false)
    } catch (error) {
      setEnviando(false)
      setValidandoCodigo(false)
      console.error("Error al enviar los datos:", error);
    }
  }

  //Validación en tiempo real
  const validarCorreo = (correo: any) => {
    return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(correo);
  };
  const validarTelefono = (telefono: any) => {
    return /^[0-9]{10}$/.test(telefono); // Ejemplo simple: número de teléfono de 10 dígitos
  };
  const validarContrasena = (contrasena: any) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      contrasena
    );
  };
  const validarNombre = (nombre: any) => {
    if (validarCampoString(nombre, "Nombre") != "") {
      return false;
    }
    return nombre.length >= 5;
  };
  const validarInstagram = (instagram: any) => {
    if(instagram == null){
      return true;
    }
    return /^@[a-zA-Z0-9._]{0,30}$/.test(instagram);
  };

  const errors = React.useMemo(() => {
    return {
      nombreCliente: nombreCliente !== "" && !validarNombre(nombreCliente),
      correoCliente: correoCliente !== "" && !validarCorreo(correoCliente),
      telefonoCliente:
        telefonoCliente !== "" && !validarTelefono(telefonoCliente),
      contrasenaCliente:
        contrasenaCliente !== "" && !validarContrasena(contrasenaCliente),
      instagram: instagram !== "" && !validarInstagram(instagram),
    };
  }, [
    nombreCliente,
    correoCliente,
    telefonoCliente,
    contrasenaCliente,
    instagram,
  ]);

  React.useEffect(() => {
    onOpenAdvertencia();
  }, [onOpenAdvertencia]);
  return (
    <div className="mb-10">  
      {token == null ? (
        <>
          <div className="flex h-screen">
            <div className=" w-1/2 hidden md:flex  items-center justify-center">
              <Image
                removeWrapper
                radius="lg"
                src="https://cdn.pixabay.com/photo/2023/05/08/11/18/hair-7978357_1280.jpg"
                alt="Imagen de registro"
                className="rounded-tr-none rounded-br-none w-full h-full object-cover "
              />
            </div>

            <div className=" border-amber-600 w-full md:w-1/2 flex flex-col items-center justify-center p-8 sm:border-3 md:border-l-0">
              <div className="text-center mb-6">
                <h1 className={title({ color: "yellow" })}>¡Regístrate!</h1>
              </div>

              <div className="w-full max-w-sm ">
                <div className="mb-4">
                  <Input
                    isRequired
                    type="text"
                    label="Nombre Completo"
                    variant="bordered"
                    value={nombreCliente}
                    isInvalid={errors.nombreCliente}
                    color={errors.nombreCliente ? "danger" : "default"}
                    errorMessage="El nombre debe tener al menos 5 caracteres, no puede contener números ni caracteres especiales"
                    onValueChange={setNombreCliente}
                  />
                </div>
                <div className="mb-4">
                  <Input
                    isRequired
                    type="email"
                    label="Email"
                    variant="bordered"
                    value={correoCliente}
                    isInvalid={errors.correoCliente}
                    color={errors.correoCliente ? "danger" : "default"}
                    errorMessage="Por favor ingrese un correo válido"
                    onValueChange={setCorreoCliente}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-2">
                  <div className="mb-4">
                    <Input
                      isRequired
                      type="number"
                      label="Teléfono"
                      variant="bordered"
                      value={telefonoCliente}
                      isInvalid={errors.telefonoCliente}
                      color={errors.telefonoCliente ? "danger" : "default"}
                      errorMessage="El teléfono debe tener 10 dígitos"
                      onValueChange={setTelefonoCliente}
                    />
                  </div>
                  <div className="mb-4">
                    <Input
                      type="text"
                      label="Instagram"
                      variant="bordered"
                      value={instagram}
                      isInvalid={errors.instagram}
                      color={errors.instagram ? "danger" : "default"}
                      errorMessage="El instagram debe iniciar con @; debe tener un maximo de 30 caracteres; puede tener los caracteres especiales '_' y '.'"
                      onValueChange={setInstagram}
                    />
                  </div>
                  <div className="mb-4">
                    <Input
                      isRequired
                      type="password"
                      label="Contraseña"
                      variant="bordered"
                      value={contrasenaCliente}
                      isInvalid={errors.contrasenaCliente}
                      color={errors.contrasenaCliente ? "danger" : "default"}
                      errorMessage="La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un caracter especial (@$!%*?&)"
                      onValueChange={setContrasenaCliente}
                    />
                  </div>

                  <div className="mb-6">
                    <Input
                      isRequired
                      type="password"
                      label="Confirmar Contraseña"
                      variant="bordered"
                      value={repetirContrasena}
                      onValueChange={setRepetirContrasena}
                    />
                  </div>

                  <div className="mb-6">
                    <Button isLoading={enviando ? true : false} className="bg-[#609448]" onPress={validarRegistro}>
                      Registrarse
                      
                    </Button>
                  </div>

                  <div className="flex justify-between">
                    <p>
                      ¿No tienes cuenta?{" "}
                      <Link href="/acceso/iniciarsesion">Iniciar sesión</Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        

      {/*Modal de error*/}
      <Modal isOpen={isOpenError} onOpenChange={onOpenChangeError}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 items-center">
                <CircleX color="#894242" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className=" text-3xl">Error</h1>
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
      {/*Modal de advertencia*/}
      <Modal isOpen={isOpenAdvertencia} onOpenChange={onOpenChangeAdvertencia} backdrop="blur">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 items-center">
                <TriangleAlert color="#E9C913" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className=" text-3xl">Ten en cuenta...</h1>
                <p>Por políticas de la empresa se recomienda utilizar una contraseña diferente a las que uses comunmente, para proteger sus datos personales.</p>
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

          {/*Modal recuperar Contraseña*/}
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        isDismissable={false}
        hideCloseButton={true}
        motionProps={{
          variants: {
            enter: {
              y: 0,
              opacity: 1,
              transition: {
                duration: 0.3,
                ease: "easeOut",
              },
            },
            exit: {
              y: -20,
              opacity: 0,
              transition: {
                duration: 0.2,
                ease: "easeIn",
              },
            },
          }
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Ingresa el código enviado al correo <b>{correoCliente}</b></ModalHeader>
        <ModalBody>
          <p>Es necesario para validar tu correo.</p>
          <Input
            isRequired
            type="number"
            label="Código"
            variant="bordered"
            value={codigo}
            color={"default"}
            onValueChange={setCodigo}
          />

        </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose} onClick={reestablecerValidar}>
                  Cancelar
                </Button>
                <Button className="bg-[#609448]" isLoading={validandoCodigo ? true : false} onPress={validarCodigo}>
        Siguiente
      </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      </>
      ) : (
        ""
      )}
    </div>
    
  );
}

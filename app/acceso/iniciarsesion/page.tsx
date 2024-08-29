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
import { CircleCheckBig, CircleX } from "lucide-react";
import {
  validarEmailModal,
  validarContrasenaModal
} from "@/config/validaciones";
import { getWithAuth } from "@/config/peticionesConfig";

export default function RegistroPage() {

  const [token, setToken] = React.useState<string | null>("token");
  React.useEffect(() => {
    setToken(typeof window !== "undefined" ? sessionStorage.getItem("token") : null);
    if (sessionStorage.getItem("token") != null) {
      window.location.href = "../acceso/perfil"
    }
  }, []);

  const {
    isOpen: isOpenError,
    onOpen: onOpenError,
    onOpenChange: onOpenChangeError,
    onClose: onCloseError
  } = useDisclosure(); //Hook de modal error
  const {
    isOpen,
    onOpen,
    onOpenChange,
    onClose
  } = useDisclosure(); //Hook de enviar correo
  const {
    isOpen: isOpenExito,
    onOpen: onOpenExito,
    onOpenChange: onOpenChangeExito,
    onClose: onCloseExito
  } = useDisclosure(); //Hook de modal Exito

  //FORMULARIO
  //FORMULARIO
  const [correoUsuario, setcorreoUsuario] = React.useState("");
  const [correoRecuperar, setCorreoRecuperar] = React.useState("");
  const [correoEnviado, setCorreoEnviado] = React.useState<boolean>(false);
  const [codigo, setCodigo] = React.useState("");
  const [codigoValidado, setCodigoValidado] = React.useState<boolean>(false);
  const [contrasenaCliente, setContrasenaCliente] = React.useState("");
  const [contrasenaRecuperar, setContrasenaRecuperar] = React.useState("");
  const [repetirContrasena, setRepetirContrasena] = React.useState("");
  const [mensajeError, setMensajeError] = React.useState("");

  const reestablecerRecuperarContrasena = () => {
    setCodigoValidado(false)
    setCorreoEnviado(false)
    setCorreoRecuperar("")
    setContrasenaRecuperar("")
    setRepetirContrasena("")
    setCodigo("")
  }

  //Metodo para guardar y validar inicio de sesión
  const [enviando, setEnviando] = React.useState(false);
  const sesionForm = async () => {
    setEnviando(true)
    const errorEmail = validarEmailModal(correoUsuario);
    const errorContrasena = validarContrasenaModal(contrasenaCliente);

    if (errorEmail != "") {
      setMensajeError(errorEmail);
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

    const data = {
      correo: correoUsuario,
      contrasena: contrasenaCliente
    };

    try {
      const response = await fetch("http://localhost:8080/acceso/iniciarSesion", {
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
        throw new Error("Error al intentar el usuario");
      }

      const responseData = await response.json();
      const { token, id, permisos, estado, rol } = responseData;

      sessionStorage.setItem("token", token);
      sessionStorage.setItem("idUsuario", id);
      sessionStorage.setItem("permisos", permisos);
      sessionStorage.setItem("rol", rol);
      window.location.href = "/";
    } catch (error) {
      setEnviando(false)
      console.error("Error al enviar los datos:", error);
    }
  };
  //FIN FORMULARIO
  //FIN FORMULARIO

  //RECUPERAR CONTRASEÑA
  const [enviandoContrasena, setEnviandoContrasena] = React.useState(false)
  const cambiarContrasena = async () => {
    setEnviandoContrasena(true);
    const errorContrasena = validarContrasenaModal(contrasenaRecuperar);
    if (errorContrasena != "") {
      setMensajeError(errorContrasena);
      setContrasenaRecuperar("")
      setRepetirContrasena("")
      onOpenError();
      setEnviandoContrasena(false);
      return;
    }
    if (contrasenaRecuperar != repetirContrasena) {
      setMensajeError("La contraseña ingresada no coincide");
      setContrasenaRecuperar("")
      setRepetirContrasena("")
      onOpenError();
      setEnviandoContrasena(false)
      return;
    }

    let url =
      "http://localhost:8080/acceso/cambiarRecuperarContrasena?correo=" +
      correoRecuperar +
      "&nuevaContrasena=" +
      contrasenaRecuperar;
    try {
      const response = await getWithAuth(url);
      const responseText = await response.text();
      setMensajeError(responseText);
      if (!response.ok) {
        onOpenError();
        setEnviandoContrasena(false)
        onClose()
        reestablecerRecuperarContrasena()
        throw new Error("Error al intentar cambiar la contraseña");
      }
      onOpenExito();
      onClose()
      reestablecerRecuperarContrasena()
      setEnviandoContrasena(false)
    } catch (error) {
      setEnviandoContrasena(false)
      console.error("Error al enviar los datos:", error);
    }
  };//FIN RECUPERAR CONTRASEÑA

  //SOLICITAR CODIGO CON CORREO
  const [solicitandoCorreo, setSolicitandoCorreo] = React.useState(false)
  const solicitarCodigo = async () => {
    setSolicitandoCorreo(true);

    const errorEmail = validarEmailModal(correoRecuperar);
    if (errorEmail != "") {
      setMensajeError(errorEmail);
      onOpenError();
      setSolicitandoCorreo(false)
      return;
    }

    let url =
      "http://localhost:8080/acceso/solicitarCambioContrasenaCorreo?correo=" +
      correoRecuperar+ "&registro=false"
    try {
      const response = await getWithAuth(url);
      const responseText = await response.text();
      setMensajeError(responseText);
      if (!response.ok) {
        onOpenError();
        setSolicitandoCorreo(false)
        onClose()
        reestablecerRecuperarContrasena()
        throw new Error("Error al solicitar el codigo");
      }
      setCorreoEnviado(true)
      setSolicitandoCorreo(false)
    } catch (error) {
      setSolicitandoCorreo(false)
      console.error("Error al enviar los datos:", error);
    }
  };//FIN SOLICITAR CODIGO CON CORREO

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
      "http://localhost:8080/acceso/validarCodigo?correo=" + correoRecuperar + "&codigo=" + codigo
    try {
      const response = await getWithAuth(url);
      const responseText = await response.text();
      setMensajeError(responseText);
      if (!response.ok) {
        onOpenError();
        setValidandoCodigo(false)
        throw new Error("Error al solicitar el codigo");
      }
      setValidandoCodigo(false)
      setCodigoValidado(true)
    } catch (error) {
      setValidandoCodigo(false)
      console.error("Error al enviar los datos:", error);
    }
  };//FIN VALIDAR CODIGO


  //Validación en tiempo real
  const validarCorreo = (correo: any) => {
    return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(correo);
  };
  const validarContrasena = (contrasena: any) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      contrasena
    );
  };
  const errors = React.useMemo(() => {
    return {
      correoUsuario: correoUsuario !== "" && !validarCorreo(correoUsuario),
      correoRecuperar: correoRecuperar !== "" && !validarCorreo(correoRecuperar),
      contrasenaCliente:
        contrasenaCliente !== "" && !validarContrasena(contrasenaCliente),
      contrasenaRecuperar:
        contrasenaRecuperar !== "" && !validarContrasena(contrasenaRecuperar)
    };
  }, [
    correoUsuario,
    contrasenaCliente,
    correoRecuperar,
    contrasenaRecuperar
  ]);//Fin Validación en tiempo real

  const etapaRecuperarContraseña =
    !correoEnviado && !codigoValidado ? (
      <>
        <ModalHeader className="flex flex-col gap-1">Ingresa tu correo</ModalHeader>
        <ModalBody>

          <Input
            isRequired
            type="email"
            label="Email"
            variant="bordered"
            value={correoRecuperar}
            isInvalid={errors.correoRecuperar}
            color={errors.correoRecuperar ? "danger" : "default"}
            errorMessage="Por favor ingrese un correo válido"
            onValueChange={setCorreoRecuperar}
          />

        </ModalBody>
      </>
    ) : !codigoValidado && correoEnviado ? (
      <>
        <ModalHeader className="flex flex-col gap-1">Ingresa el código enviado al correo <b>{correoRecuperar}</b></ModalHeader>
        <ModalBody>
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
      </>

    ) : (
      <>
        <ModalHeader className="flex flex-col gap-1">Ingresa tu nueva contraseña</ModalHeader>
        <ModalBody>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              isRequired
              type="password"
              label="Nueva Contraseña"
              variant="bordered"
              value={contrasenaRecuperar}
              isInvalid={errors.contrasenaRecuperar}
              color={errors.contrasenaRecuperar ? "danger" : "default"}
              errorMessage="La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un caracter especial (@$!%*?&)"
              onValueChange={setContrasenaRecuperar}
            />
            <Input
              isRequired
              type="password"
              label="Confirmar Contraseña"
              variant="bordered"
              value={repetirContrasena}
              color={"default"}
              onValueChange={setRepetirContrasena}
            />
          </div>
        </ModalBody>
      </>
    )
  const etapaBotonRecuperarContrasena =
    !codigoValidado && !correoEnviado ? (
      <Button className="bg-[#609448]" isLoading={solicitandoCorreo ? true : false} onPress={solicitarCodigo}>
        Siguiente
      </Button>
    ) : correoEnviado && !codigoValidado ? (
      <Button className="bg-[#609448]" isLoading={validandoCodigo ? true : false} onPress={validarCodigo}>
        Siguiente
      </Button>
    ) : (
      <Button className="bg-[#609448]" isLoading={enviandoContrasena ? true : false} onPress={cambiarContrasena}>
        Cambiar Contraseña
      </Button>
    )

  return (
    <div className="mb-10">
      {token == null ? (
        <div className="flex h-screen">
          <div className=" border-slate-4002 w-full sm:w-1/2 flex flex-col items-center justify-center p-8 sm:border-3 sm:border-r-0">
            <div className="text-center mb-6">
              <h1 className={title({ color: "yellow" })}>¡Inicia Sesión!</h1>
            </div>

            <div className="w-full max-w-sm">
              <div className="mb-4">
                <Input
                  isRequired
                  type="email"
                  label="Email"
                  variant="bordered"
                  value={correoUsuario}
                  isInvalid={errors.correoUsuario}
                  color={errors.correoUsuario ? "danger" : "default"}
                  errorMessage="Por favor ingrese un correo válido"
                  onValueChange={setcorreoUsuario}
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
                <Button isLoading={enviando ? true : false} className="bg-[#609448]" onPress={sesionForm}>
                  Iniciar Sesión
                </Button>
              </div>

              <div className="flex justify-between">
                <p>¿Olvidaste tu contraseña? <Link onPress={onOpen}>Recuperar Contraseña</Link></p>

              </div>
            </div>
          </div>
          <div className=" w-1/2 hidden sm:flex  items-center justify-center">
            <Image removeWrapper radius="lg" src="https://cdn.pixabay.com/photo/2022/05/10/10/19/woman-7186660_1280.jpg" alt="Imagen de registro" className="rounded-tl-none rounded-bl-none w-full h-full object-cover " />
          </div>
        </div>
      ) : ("")}


      {/*Modal de error*/}
      <Modal isOpen={isOpenError} onOpenChange={onOpenChangeError} backdrop="blur">
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
              {etapaRecuperarContraseña}
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose} onClick={reestablecerRecuperarContrasena}>
                  Cancelar
                </Button>
                {etapaBotonRecuperarContrasena}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/*Modal de exito*/}
      <Modal isOpen={isOpenExito} onOpenChange={onOpenChangeExito}>
        <ModalContent>
          {(onCloseExito) => (
            <>
              <ModalHeader className="flex flex-col gap-1 items-center">
                <CircleCheckBig color="#77C159" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className=" text-3xl">¡Perfecto!</h1>
                <p>{mensajeError}</p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onCloseExito}>
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

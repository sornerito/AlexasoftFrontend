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
  Divider,
  Card,
  CardBody,
  CardHeader,
  Image,
  CardFooter,
  CircularProgress,
} from "@nextui-org/react";
import {
  PencilLine,
  CircleHelp,
  CircleX,
  CircleCheckBig
} from "lucide-react";
import {
  validarCampoString,
  validarEmailModal,
  validarTelefonoModal,
  validarInstagramModal,
  validarContrasenaModal,
} from "@/config/validaciones";
import { getWithAuth, postWithAuth, verificarAccesoPorPermiso } from "@/config/peticionesConfig";


interface Usuario {
  nombre: string;
  correo: string;
  telefono: string;
  instagram: string;
  cedula: string;
}
export default function EditarUsuarioPage() {

  const [token, setToken] = React.useState<string | null>(null);
  React.useEffect(() => {
    setToken(typeof window !== "undefined" ? sessionStorage.getItem("token") : null);
    if (sessionStorage.getItem("token") == null) {
      window.location.href = "../acceso/iniciarsesion"
    }
  }, []);

  const rol = typeof window !== "undefined" ? sessionStorage.getItem("rol") : null;
  const idUsuario = typeof window !== "undefined" ? sessionStorage.getItem("idUsuario") : null;



  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure(); //Hook modal crear
  const {
    isOpen: isOpenError,
    onOpen: onOpenError,
    onOpenChange: onOpenChangeError,
  } = useDisclosure(); //Hook de modal error

  const {
    isOpen: isOpenExito,
    onOpen: onOpenExito,
    onOpenChange: onOpenChangeExito,
  } = useDisclosure(); //Hook de modal Exito
  const {
    isOpen: isOpenEditar,
    onOpen: onOpenEditar,
    onOpenChange: onOpenChangeEditar,
    onClose: onCloseEditar,
  } = useDisclosure(); //Hook de modal editar Informacion
  const {
    isOpen: isOpenContrasena,
    onOpen: onOpenContrasena,
    onOpenChange: onOpenChangeContrasena,
  } = useDisclosure(); //Hook de modal editar contraseña

  const cerrarModalesEditar = () => {
    onClose();
    onCloseEditar();
  };

  const [usuario, setUsuario] = React.useState<Usuario>();
  React.useEffect(() => {

    let url = "http://localhost:8080/usuario/" + idUsuario;
    if (rol == "Cliente") {
      url = "http://localhost:8080/cliente/" + idUsuario;
    } else if (rol == "Colaborador") {
      url = "http://localhost:8080/colaborador/" + idUsuario;
    }
    getWithAuth(url)
      .then((response) => response.json())
      .then((data) => {
        setUsuario(data);
      })
      .catch((err) => {
        console.log(err.message);
      });


  }, [idUsuario, rol]);

  const reestablecerDatosFormulario = () => {
    setNombreUsuario(usuario?.nombre);
    setCorreoUsuario(usuario?.correo);
    setTelefonoUsuario(usuario?.telefono);
    setCedula(usuario?.cedula);
    setInstagram(usuario?.instagram);
  };

  const reestablecerCamposContrasena = () => {
    setContrasenaUsuario("");
    setRepetirContrasena("");
    setContrasenaActual("");
  };


  const updateUser = (newData: any) => {
    setUsuario(prevState => ({
      ...prevState,
      ...newData
    }));
  };

  //FORMULARIO
  const [nombreUsuario, setNombreUsuario] = React.useState<string | undefined>("");
  const [correoUsuario, setCorreoUsuario] = React.useState<string | undefined>("");
  const [telefonoUsuario, setTelefonoUsuario] = React.useState<
    string | undefined
  >("");
  const [cedula, setCedula] = React.useState<string | undefined>("");
  const [instagram, setInstagram] = React.useState<string | undefined>("@");
  const [mensajeError, setMensajeError] = React.useState("");

  const [enviandoEditar, setEnviandoEditar] = React.useState(false);
  //Metodo para guardar y validar registro
  const guardarUsuario = async () => {
    setEnviandoEditar(true);
    const errorNombre = validarCampoString(nombreUsuario, "Nombre del usuario");
    const errorEmail = validarEmailModal(correoUsuario);
    const errorTelefono = validarTelefonoModal(telefonoUsuario);

    if (errorNombre != "") {
      setMensajeError(errorNombre);
      onOpenError();
      setEnviandoEditar(false);
      return;
    }
    if (errorEmail != "") {
      setMensajeError(errorEmail);
      onOpenError();
      setEnviandoEditar(false);
      return;
    }
    if (errorTelefono != "") {
      setMensajeError(errorTelefono);
      onOpenError();
      setEnviandoEditar(false);
      return;
    }
    if (rol == "Cliente") {
      if (instagram != "" && instagram != "@") {
        const errorInstagram = validarInstagramModal(instagram);
        if (errorInstagram !== "") {
          setMensajeError(errorInstagram);
          onOpenError();
          setEnviandoEditar(false);
          return;
        }
      }
      if (instagram == "" || instagram == "@") {
        setInstagram("");
      }
    } else {
      setInstagram("");
    }

    const data = {
      nombre: nombreUsuario,
      correo: correoUsuario,
      telefono: telefonoUsuario,
      instagram: instagram,
    };

    let url =
      "http://localhost:8080/acceso/actualizarInformacion?id=" +
      idUsuario +
      "&rol=" +
      rol;
    try {
      const response = await postWithAuth(url, data);
      const responseText = await response.text();
      setMensajeError(responseText);
      if (!response.ok) {
        setEnviandoEditar(false);
        onOpenError();
        throw new Error("Error al intentar modificar el usuario");
      }
      updateUser(data);
      onOpenExito();
      setEnviandoEditar(false);
    } catch (error) {
      setEnviandoEditar(false);
      console.error("Error al enviar los datos:", error);
    }
  };
  const [enviandoContrasena, setEnviandoContrasena] = React.useState(false)
  //Formulario Cambiar Contraseña
  const [contrasenaActual, setContrasenaActual] = React.useState("");
  const [contrasenaUsuario, setContrasenaUsuario] = React.useState("");
  const [repetirContrasena, setRepetirContrasena] = React.useState("");

  const cambiarContrasena = async () => {
    setEnviandoContrasena(true);
    const errorContrasena = validarContrasenaModal(contrasenaUsuario);
    if (errorContrasena != "") {
      setMensajeError(errorContrasena);
      reestablecerCamposContrasena();
      onOpenError();
      setEnviandoContrasena(false);
      return;
    }
    if (contrasenaUsuario != repetirContrasena) {
      setMensajeError("La contraseña ingresada no coincide");
      reestablecerCamposContrasena();
      onOpenError();
      setEnviandoContrasena(false)
      return;
    }

    let url =
      "http://localhost:8080/acceso/cambiarContrasena?id=" +idUsuario +"&rol=" +rol+"&contrasenaActual="+contrasenaActual;
    try {
      const response = await postWithAuth(url, contrasenaUsuario);
      const responseText = await response.text();
      setMensajeError(responseText);
      if (!response.ok) {
        onOpenError();
        setEnviandoContrasena(false)
        throw new Error("Error al intentar cambiar la contraseña");
      }
      onOpenExito();
      setEnviandoContrasena(false)
    } catch (error) {
      setEnviandoContrasena(false)
      console.error("Error al enviar los datos:", error);
    }
  };

  //Validación en tiempo real
  const validarCorreo = (correo: any) => {
    return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(correo);
  };
  const validarTelefono = (telefono: any) => {
    return /^[0-9]{10}$/.test(telefono);
  };
  const validarInstagram = (instagram: any) => {
    return /^@[a-zA-Z0-9._]{0,30}$/.test(instagram);
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

  const errors = React.useMemo(() => {
    return {
      nombreUsuario: nombreUsuario !== "" && !validarNombre(nombreUsuario),
      correoUsuario: correoUsuario !== "" && !validarCorreo(correoUsuario),
      contrasenaUsuario:
        contrasenaUsuario !== "" && !validarContrasena(contrasenaUsuario),
        contrasenaActual:
        contrasenaActual !== "" && !validarContrasena(contrasenaActual),
      instagram: instagram !== "" && !validarInstagram(instagram),
      telefonoUsuario:
        telefonoUsuario !== "" && !validarTelefono(telefonoUsuario),
    };
  }, [
    nombreUsuario,
    correoUsuario,
    telefonoUsuario,
    contrasenaUsuario,
    contrasenaActual,
    instagram,
  ]);

  return (
    <div className="lg:mx-40">

      {usuario != undefined && token != null ? (
        <>
          <h1 className={title()}>¡Bienvenid@, {usuario?.nombre}!</h1>
          <br />
          <Divider className="h-1 my-4" />
          <div className="grid gap-3 grid-flow-row-dense sm:grid-cols-2 mb-3 items-stretch">
            <Card isFooterBlurred className="text-black h-64  bg-slate-300 min-h-80 max-h-80">
              <CardHeader className="absolute z-10 top-1 flex-col items-start">
                <h1 className=" font-medium text-4xl">Tu Información</h1>
              </CardHeader>
              <Image
                removeWrapper
                alt="Relaxing app background"
                className="z-0 w-full h-full object-cover"
                src="https://cdn.pixabay.com/photo/2012/09/01/23/08/floor-55519_1280.jpg"
              />
              <CardBody className="absolute top-12 lg:text-lg mb-2">
                <p>
                  <b>Nombre:</b> {usuario?.nombre}
                </p>
                <p>
                  <b>Correo:</b> {usuario?.correo}
                </p>
                <p>
                  <b>Teléfono:</b> {usuario?.telefono}
                </p>
                {rol == "Cliente" && (usuario?.instagram != "" && usuario?.instagram != "@") && (
                  <p>
                    <b>Instagram:</b> {usuario?.instagram}
                  </p>
                )}
                {rol == "Colaborador" && (
                  <p>
                    <b>Cédula:</b> {usuario?.cedula}
                  </p>
                )}
              </CardBody>
              <CardFooter className="absolute bg-black/40 bottom-0 z-10 border-t-1 border-default-600 dark:border-default-100">
                <div className="flex justify-between gap-2 items-center w-full">
                  <Button
                    radius="sm"
                    className="w-full bg-black text-white"
                    onPress={onOpenEditar}
                    onClick={reestablecerDatosFormulario}
                    isLoading={enviandoEditar ? true : false}
                  >
                    Editar Información
                  </Button>
                  <Button
                    radius="sm"
                    className="w-full bg-black text-white"
                    onPress={onOpenContrasena}
                    onClick={reestablecerCamposContrasena}
                    isLoading={enviandoContrasena ? true : false}
                  >
                    Cambiar Contraseña
                  </Button>
                </div>
              </CardFooter>
            </Card>

            {verificarAccesoPorPermiso("Carrito de compras") ? (
              <a href="/carrito">
                <Card isFooterBlurred className="hover:scale-95 h-64 min-h-80 max-h-80">
                  <CardHeader className="absolute z-10 top-1 flex-col items-start">
                    <h4 className="text-white/90 font-medium text-4xl">
                      Carrito de compras
                    </h4>
                  </CardHeader>
                  <Image
                    removeWrapper
                    alt="Relaxing app background"
                    className="z-0 w-full h-full object-cover"
                    src="https://cdn.pixabay.com/photo/2019/10/08/21/33/shopping-cart-4536066_1280.jpg"
                  />
                  <CardFooter className="absolute bg-black/40 bottom-0 z-10 border-t-1 border-default-600 dark:border-default-100 ">
                    <div className="flex flex-grow gap-2 items-center">
                      <div className="flex flex-col">
                        <p className=" text-white/60">Haz un pedido, crea</p>
                        <p className=" text-white/60">tu carrito de compra.</p>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </a>
            ) : ("")}

            {verificarAccesoPorPermiso("Gestionar Citas") ? (
              <a href="#">
                <Card isFooterBlurred className="hover:scale-95 h-64 min-h-80 max-h-80">
                  <CardHeader className="absolute z-10 top-1 flex-col items-start">
                    <h4 className="text-white/90 font-medium text-4xl">
                      Citas
                    </h4>
                  </CardHeader>
                  <Image
                    removeWrapper
                    alt="Relaxing app background"
                    className="z-0 w-full h-full object-cover"
                    src="https://cdn.pixabay.com/photo/2016/07/14/08/39/hairdressing-1516352_1280.jpg"
                  />
                  <CardFooter className="absolute bg-black/40 bottom-0 z-10 border-t-1 border-default-600 dark:border-default-100 ">
                    <div className="flex flex-grow gap-2 items-center">
                      <div className="flex flex-col">
                        <p className=" text-white/60">Solicita una cita a</p>
                        <p className=" text-white/60">nuestro estudio de belleza.</p>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </a>
            ) : ("")}

          </div>
        </>
      ) : (
        <CircularProgress color="warning" aria-label="Cargando..." />
      )}

      {/*Modal de editar*/}
      <Modal isOpen={isOpenEditar} onOpenChange={onOpenChangeEditar}>
        <ModalContent>
          {(onCloseEditar) => (
            <>
              <ModalHeader className="flex flex-col gap-1 items-center">
                <PencilLine color="#fef08a" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className=" text-3xl">Modifica tus Datos</h1>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    isRequired
                    type="text"
                    label="Nombre"
                    variant="bordered"
                    value={nombreUsuario}
                    isInvalid={errors.nombreUsuario}
                    color={errors.nombreUsuario ? "danger" : "default"}
                    errorMessage="El nombre debe tener al menos 5 caracteres, no puede contener números ni caracteres especiales"
                    onValueChange={setNombreUsuario}
                  />
                  <Input
                    isRequired
                    type="email"
                    label="Email"
                    variant="bordered"
                    value={correoUsuario}
                    isInvalid={errors.correoUsuario}
                    color={errors.correoUsuario ? "danger" : "default"}
                    errorMessage="Por favor ingrese un correo válido"
                    onValueChange={setCorreoUsuario}
                  />
                  <Input
                    isRequired
                    type="number"
                    label="Teléfono"
                    variant="bordered"
                    value={telefonoUsuario}
                    isInvalid={errors.telefonoUsuario}
                    color={errors.telefonoUsuario ? "danger" : "default"}
                    errorMessage="El teléfono debe tener 10 dígitos"
                    onValueChange={setTelefonoUsuario}
                  />
                  {rol == "Cliente" && (
                    <Input
                      type="text"
                      label="Instagram (Opcional)"
                      variant="bordered"
                      value={instagram}
                      isInvalid={errors.instagram}
                      color={errors.instagram ? "danger" : "default"}
                      errorMessage="El instagram debe iniciar con @; debe tener un maximo de 30 caracteres; puede tener los caracteres especiales '_' y '.'"
                      onValueChange={setInstagram}
                    />
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={onCloseEditar}
                  onClick={reestablecerDatosFormulario}
                >
                  Cancelar
                </Button>
                <Button color="warning" variant="light" onClick={onOpen}>
                  Editar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/*Modal confirmar editar*/}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 items-center">
                <CircleHelp color="#fef08a" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className=" text-3xl">¿Desea editar el usuario?</h1>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="warning"
                  variant="light"
                  onPress={cerrarModalesEditar}
                  onClick={guardarUsuario}
                >
                  Editar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/*Modal de cambiar contraseña*/}
      <Modal isOpen={isOpenContrasena} onOpenChange={onOpenChangeContrasena}>
        <ModalContent>
          {(onCloseContrasena) => (
            <>
              <ModalHeader className="flex flex-col gap-1 items-center">
                <PencilLine color="#fef08a" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className=" text-3xl">Cambia tu Contraseña</h1>
                <Input
                    isRequired
                    type="password"
                    label="Contraseña Actual"
                    variant="bordered"
                    value={contrasenaActual}
                    isInvalid={errors.contrasenaActual}
                    color={errors.contrasenaActual ? "danger" : "default"}
                    errorMessage="La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un caracter especial (@$!%*?&)"
                    onValueChange={setContrasenaActual}
                  />
                  <Divider></Divider>
                <div className="grid gap-3 sm:grid-cols-2">
                   <Input
                    isRequired
                    type="password"
                    label="Nueva Contraseña"
                    variant="bordered"
                    value={contrasenaUsuario}
                    isInvalid={errors.contrasenaUsuario}
                    color={errors.contrasenaUsuario ? "danger" : "default"}
                    errorMessage="La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un caracter especial (@$!%*?&)"
                    onValueChange={setContrasenaUsuario}
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
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={onCloseContrasena}
                  onClick={reestablecerCamposContrasena}
                >
                  Cancelar
                </Button>
                <Button
                  color="warning"
                  variant="light"
                  onPress={onCloseContrasena}
                  onClick={cambiarContrasena}
                >
                  Cambiar Contraseña
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/*Modal de error*/}
      <Modal isOpen={isOpenError} onOpenChange={onOpenChangeError}>
        <ModalContent>
          {(onCloseError) => (
            <>
              <ModalHeader className="flex flex-col gap-1 items-center">
                <CircleX color="#894242" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className=" text-3xl">Error</h1>
                <p>{mensajeError}</p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onCloseError}>
                  Cerrar
                </Button>
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

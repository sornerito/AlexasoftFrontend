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
  Select,
  SelectItem,
  Divider,
  Card,
  CardHeader,
  CardBody,
  Spacer,
  Link,
  CircularProgress,
} from "@nextui-org/react";
import { PlusIcon, CircleHelp, CircleX, AlertCircle } from "lucide-react";
import {
  validarCampoString,
  validarEmailModal,
  validarContrasenaModal,
  validarTelefonoModal,
  validarCedulaModal,
  validarInstagramModal,
} from "@/config/validaciones";
import {
  getWithAuth,
  postWithAuth,
  verificarAccesoPorPermiso,
} from "@/config/peticionesConfig";

//Molde con el que procesaremos los datos. ES DIFERENTE a como el json trae los datos
interface Rol {
  idRol: string;
  nombre: string;
  estado: string;
  permisos: string;
}

export default function CrearUsuarioPage() {
  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Usuarios") == false) {
        window.location.href = "../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Usuarios"));
    }
  }, []);

  const [roles, setRoles] = React.useState<Rol[]>([]); // Hook que guarda los roles procesados
  const { isOpen, onOpen, onOpenChange } = useDisclosure(); //Hook modal crear
  const {
    isOpen: isOpenError,
    onOpen: onOpenError,
    onOpenChange: onOpenChangeError,
  } = useDisclosure(); //Hook de modal error

  React.useEffect(() => {
    getWithAuth("http://10.170.83.243:8080/configuracion/roles")
      .then((response) => response.json())
      .then((data) => {
        // Procesar los datos para que coincidan con la estructura de columnas
        const processedData: Rol[] = data.map(
          (item: {
            rol: { idRol: any; nombre: any; estado: any };
            permisosNombre: any[];
          }) => ({
            idRol: item.rol.idRol,
            nombre: item.rol.nombre,
            estado: item.rol.estado,
            permisos: item.permisosNombre.join(", "),
          })
        );
        setRoles(processedData);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, []);

  //FORMULARIO
  //FORMULARIO
  const [nombreUsuario, setNombreUsuario] = React.useState("");
  const [correoUsuario, setCorreoUsuario] = React.useState("");
  const [telefonoUsuario, setTelefonoUsuario] = React.useState("");
  const [contrasenaUsuario, setContrasenaUsuario] = React.useState("");
  const [idRolUsuario, setIdRolUsuario] = React.useState("");
  const [cedula, setCedula] = React.useState("");
  const [instagram, setInstagram] = React.useState("@");
  const [mensajeError, setMensajeError] = React.useState("");
  const manejarSelect = (e: any) => {
    setIdRolUsuario(e.target.value);
  };

  const [creandoUsuario, setEUsuario] = React.useState(false);
  //Metodo para guardar y validar registro
  const guardarUsuario = async () => {
    setEUsuario(true)
    const errorNombre = validarCampoString(nombreUsuario, "Nombre del usuario");
    const errorEmail = validarEmailModal(correoUsuario);
    const errorTelefono = validarTelefonoModal(telefonoUsuario);
    const errorContrasena = validarContrasenaModal(contrasenaUsuario);

    if (errorNombre != "") {
      setMensajeError(errorNombre);
      onOpenError();
      setEUsuario(false)
      return;
    }
    if (errorEmail != "") {
      setMensajeError(errorEmail);
      onOpenError();
      setEUsuario(false)
      return;
    }
    if (errorTelefono != "") {
      setMensajeError(errorTelefono);
      onOpenError();
      setEUsuario(false)
      return;
    }
    if (errorContrasena != "") {
      setMensajeError(errorContrasena);
      onOpenError();
      setEUsuario(false)
      return;
    }
    if (idRolUsuario == "") {
      setMensajeError("Debe seleccionar un rol para el usuario");
      onOpenError();
      setEUsuario(false)
      return;
    }

    const data = {
      nombre: nombreUsuario,
      correo: correoUsuario,
      telefono: telefonoUsuario,
      contrasena: contrasenaUsuario,
      estado: "Activo",
      idRol: idRolUsuario,
    };

    let url = "http://10.170.83.243:8080/usuario/";
    let dataFinal = {};
    dataFinal = data;
    if (
      idRolUsuario == roles.find((rol) => rol.nombre == "Colaborador")?.idRol
    ) {
      url = "http://10.170.83.243:8080/usuario/cambiarRol/0";
      const errorCedula = validarCedulaModal(cedula);
      if (errorCedula !== "") {
        setMensajeError(errorCedula);
        onOpenError();
        setEUsuario(false)
        return;
      }
      const colaboradorData = {
        usuario: {
          ...data,
        },
        cedula: cedula,
      };
      dataFinal = colaboradorData;
    } else if (
      idRolUsuario == roles.find((rol) => rol.nombre == "Cliente")?.idRol
    ) {
      url = "http://10.170.83.243:8080/usuario/cambiarRol/0";
      if (instagram != "" && instagram != "@") {
        const errorInstagram = validarInstagramModal(instagram);
        if (errorInstagram !== "") {
          setMensajeError(errorInstagram);
          onOpenError();
          setEUsuario(false)
          return;
        }
        const clienteData = {
          usuario: {
            ...data,
          },
          instagram: instagram,
        };
        dataFinal = clienteData;
      } else {
        const clienteData = {
          usuario: {
            ...data,
          },
        };
        dataFinal = clienteData;
      }
    }

    try {
      const response = await postWithAuth(url, dataFinal);

      if (!response.ok) {
        const errorResponse = await response.text();
        setMensajeError(errorResponse);
        onOpenError();
        setEUsuario(false)
        throw new Error("Error al intentar guardar el usuario");
      }

      window.location.href = "/admin/usuarios";
    } catch (error) {
      setEUsuario(false)
      console.error("Error al enviar los datos:", error);
    }
  };
  //FIN FORMULARIO
  //FIN FORMULARIO

  //Validación en tiempo real
  const validarCorreo = (correo: any) => {
    return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(correo);
  };
  const validarTelefono = (telefono: any) => {
    return /^[0-9]{10}$/.test(telefono);
  };
  const validarCedula = (cedula: any) => {
    return /^[0-9]{8,13}$/.test(cedula);
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
      telefonoUsuario:
        telefonoUsuario !== "" && !validarTelefono(telefonoUsuario),
      contrasenaUsuario:
        contrasenaUsuario !== "" && !validarContrasena(contrasenaUsuario),
      cedula: cedula !== "" && !validarCedula(cedula),
      instagram: instagram !== "" && !validarInstagram(instagram),
    };
  }, [
    nombreUsuario,
    correoUsuario,
    telefonoUsuario,
    contrasenaUsuario,
    cedula,
    instagram,
  ]);

  const permisosSeleccionados =
    roles.find((rol) => rol.idRol == idRolUsuario)?.permisos || "";

  const mensajeAlertaRol =
    idRolUsuario == roles.find((rol) => rol.nombre == "Colaborador")?.idRol ||
    idRolUsuario == roles.find((rol) => rol.nombre == "Cliente")?.idRol ? (
      <Card
        className="mb-4 font-bold text-center"
        aria-label="Tarjeta de alerta"
      >
        <CardHeader>
          <AlertCircle size={100} className="text-yellow-400 " />
          <Spacer></Spacer>
          El usuario 'Cliente' o 'Colaborador' se creará en sus respectivas
          tablas en vez de crearse en la tabla usuario.
        </CardHeader>
      </Card>
    ) : (
      ""
    );
  const mensajeAlertaRolAdmin =
    idRolUsuario ==
    roles.find((rol) => rol.nombre == "Administrador")?.idRol ? (
      <Card
        className="mb-4 font-bold text-center"
        aria-label="Tarjeta de alerta"
      >
        <CardHeader>
          <AlertCircle size={100} className=" text-danger-400" />
          <Spacer></Spacer>
          ¡ALERTA! Este usuario tendrá el rol "Administrador"; tendrá acceso a
          todo el aplicativo y no podrá eliminarse manualmente.
        </CardHeader>
      </Card>
    ) : (
      ""
    );

  return (
    <>
      {acceso ? (
        <div className="container">
          <h1 className={title()}>Crear Usuario</h1>
          <br />
          <br />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              isRequired
              type="text"
              label="Nombre"
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
              value={telefonoUsuario}
              isInvalid={errors.telefonoUsuario}
              color={errors.telefonoUsuario ? "danger" : "default"}
              errorMessage="El teléfono debe tener 10 dígitos"
              onValueChange={setTelefonoUsuario}
            />
            <Input
              isRequired
              type="password"
              label="Contraseña"
              value={contrasenaUsuario}
              isInvalid={errors.contrasenaUsuario}
              color={errors.contrasenaUsuario ? "danger" : "default"}
              errorMessage="La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un caracter especial (@$!%*?&)"
              onValueChange={setContrasenaUsuario}
            />
          </div>

          <Divider className="h-1 my-4" />
          {mensajeAlertaRol}
          {mensajeAlertaRolAdmin}
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              disallowEmptySelection
              label="Rol del usuario"
              isRequired
              placeholder="Selecciona un rol"
              selectedKeys={[idRolUsuario]}
              onChange={manejarSelect}
              size="lg"
            >
              {roles.map((rol) => (
                <SelectItem key={rol.idRol} value={rol.idRol}>
                  {rol.nombre}
                </SelectItem>
              ))}
            </Select>
            {idRolUsuario ==
              roles.find((rol) => rol.nombre == "Colaborador")?.idRol && (
              <Input
                isRequired
                type="number"
                label="Cédula"
                value={cedula}
                isInvalid={errors.cedula}
                color={errors.cedula ? "danger" : "default"}
                errorMessage="La cédula debe tener al menos 8 dígitos y máximo 13"
                onValueChange={setCedula}
              />
            )}
            {idRolUsuario ==
              roles.find((rol) => rol.nombre == "Cliente")?.idRol && (
              <Input
                type="text"
                label="Instagram (Opcional)"
                value={instagram}
                isInvalid={errors.instagram}
                color={errors.instagram ? "danger" : "default"}
                errorMessage="El instagram debe iniciar con @; debe tener un maximo de 30 caracteres; puede tener los caracteres especiales '_' y '.'"
                onValueChange={setInstagram}
              />
            )}
            <div>
              <Card>
                <CardHeader>
                  <h4 className="font-bold">Permisos: </h4>
                </CardHeader>
                <Divider />
                <CardBody>
                  <p>{permisosSeleccionados}</p>
                </CardBody>
              </Card>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Link href="/admin/usuarios">
              <Button
                className="mr-2 bg-gradient-to-tr from-red-600 to-red-300"
                type="button"
              >
                Cancelar
              </Button>
            </Link>
            <Button
              isLoading={creandoUsuario ? true : false}
              className="bg-gradient-to-tr from-yellow-600 to-yellow-300"
              onPress={onOpen}
            >
              <PlusIcon />
              Crear Usuario
            </Button>
          </div>

          <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col items-center gap-1">
                    <CircleHelp color="#fef08a" size={100} />
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <h1 className="text-3xl ">¿Desea crear el usuario?</h1>
                    <p>El usuario no podrá eliminarse.</p>
                    {mensajeAlertaRol}
                    {mensajeAlertaRolAdmin}
                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                      Cancelar
                    </Button>
                    <Button
                      color="warning"
                      variant="light"
                      onPress={onClose}
                      onClick={guardarUsuario}
                    >
                      Crear
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>

          {/*Modal de error*/}
          <Modal isOpen={isOpenError} onOpenChange={onOpenChangeError}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col items-center gap-1">
                    <CircleX color="#894242" size={100} />
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <h1 className="text-3xl ">Error</h1>
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

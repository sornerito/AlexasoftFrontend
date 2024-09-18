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
  CardBody,
  CardHeader,
  Spacer,
  Link,
  CircularProgress,
} from "@nextui-org/react";
import { PencilLine, CircleHelp, CircleX, AlertCircle } from "lucide-react";
import {
  validarCampoString,
  validarEmailModal,
  validarTelefonoModal,
  validarCedulaModal,
  validarInstagramModal,
} from "@/config/validaciones";
import {
  getWithAuth,
  postWithAuth,
  verificarAccesoPorPermiso,
} from "@/config/peticionesConfig";

interface Rol {
  idRol: string;
  nombre: string;
  estado: string;
  permisos: string;
}
interface Usuario {
  idUsuario: string;
  nombre: string;
  correo: string;
  telefono: string;
  contrasena: string;
  estado: string;
  idRol: string;
}

export default function EditarUsuarioPage({
  params,
}: {
  params: { idUsuario: string };
}) {
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
    getWithAuth("http://192.168.56.1:8080/configuracion/roles")
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
        console.log(data);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, []);

  React.useEffect(() => {
    getWithAuth("http://192.168.56.1:8080/usuario/" + params.idUsuario)
      .then((response) => response.json())
      .then((data) => {
        // Procesar los datos para que coincidan con la estructura de columnas
        const processedData: Usuario = {
          idUsuario: data.idUsuario,
          nombre: data.nombre,
          correo: data.correo,
          telefono: data.telefono,
          contrasena: data.contrasena,
          estado: data.estado,
          idRol: data.idRol,
        };
        setNombreUsuario(processedData.nombre);
        setCorreoUsuario(processedData.correo);
        setTelefonoUsuario(processedData.telefono);
        setContrasenaUsuario(processedData.contrasena);
        setIdRolUsuario(processedData.idRol.toString());
        setEstadoUsuario(processedData.estado);
        console.log(data);
      })

      .catch((err) => {
        console.log(err.message);
      });
  }, [params.idUsuario]);

  //FORMULARIO
  const [nombreUsuario, setNombreUsuario] = React.useState("");
  const [correoUsuario, setCorreoUsuario] = React.useState("");
  const [telefonoUsuario, setTelefonoUsuario] = React.useState("");
  const [contrasenaUsuario, setContrasenaUsuario] = React.useState("");
  const [idRolUsuario, setIdRolUsuario] = React.useState("");
  const [estadoUsuario, setEstadoUsuario] = React.useState("");
  const [cedula, setCedula] = React.useState("");
  const [instagram, setInstagram] = React.useState("@");
  const [mensajeError, setMensajeError] = React.useState("");
  const manejarSelect = (e: any) => {
    setIdRolUsuario(e.target.value);
  };

  const [editandoUsuario, setEUsuario] = React.useState(false);
  //Metodo para guardar y validar registro
  const guardarUsuario = async () => {
    setEUsuario(true)
    const errorNombre = validarCampoString(nombreUsuario, "Nombre del usuario");
    const errorEmail = validarEmailModal(correoUsuario);
    const errorTelefono = validarTelefonoModal(telefonoUsuario);

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
    if (idRolUsuario == "") {
      setMensajeError("Debe seleccionar un rol para el usuario");
      onOpenError();
      setEUsuario(false)
      return;
    }
    const data = {
      idUsuario: params.idUsuario,
      nombre: nombreUsuario,
      correo: correoUsuario,
      telefono: telefonoUsuario,
      contrasena: contrasenaUsuario,
      estado: estadoUsuario,
      idRol: idRolUsuario,
    };

    let url = "http://192.168.56.1:8080/usuario/" + params.idUsuario;
    let dataFinal = {};
    dataFinal = data;
    if (
      idRolUsuario == roles.find((rol) => rol.nombre == "Colaborador")?.idRol
    ) {
      url = "http://192.168.56.1:8080/usuario/cambiarRol/" + params.idUsuario;
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
      url = "http://192.168.56.1:8080/usuario/cambiarRol/" + params.idUsuario;
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
      cedula: cedula !== "" && !validarCedula(cedula),
      instagram: instagram !== "" && !validarInstagram(instagram),
      telefonoUsuario:
        telefonoUsuario !== "" && !validarTelefono(telefonoUsuario),
    };
  }, [nombreUsuario, correoUsuario, telefonoUsuario, cedula, instagram]);

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
          <AlertCircle size={100} className=" text-danger-400" />
          <Spacer></Spacer>
          ¡ALERTA! Cambiar el rol a 'Cliente' o 'Colaborador' trasladará al
          usuario a esa tabla, eliminandola de usuario.
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
    <div className="container">
      {acceso ? (
        <>
          <h1 className={title()}>Editar Usuario</h1>
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
            isLoading={editandoUsuario ? true : false}
              className="bg-gradient-to-tr from-yellow-600 to-yellow-300"
              onPress={onOpen}
            >
              <PencilLine />
              Editar Usuario
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
                    <h1 className="text-3xl ">¿Desea editar el usuario?</h1>
                    <p>Asegúrese de que la información es correcta.</p>
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
                      Editar
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
        </>
      ) : (
        <CircularProgress color="warning" aria-label="Cargando..." />
      )}
    </div>
  );
}

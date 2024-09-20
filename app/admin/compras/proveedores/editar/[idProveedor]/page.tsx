"use client";
import { title } from "@/components/primitives";
import React, { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import {
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Link,
  Select,
  SelectItem,
  CircularProgress,
} from "@nextui-org/react";
import { CircleHelp, CircleX } from "lucide-react";
import {
  getWithAuth,
  postWithAuth,
  verificarAccesoPorPermiso,
} from "@/config/peticionesConfig";

export default function EditarProveedorPage({
  params,
}: {
  params: { idProveedor: string };
}) {
  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Proveedores") == false) {
        window.location.href = "../../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Proveedores"));
    }
  }, []);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [contacto, setContacto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [estado, setEstado] = useState("Activo");
  const [correo, setCorreo] = useState("");
  const [tipoEmpresa, setTipoEmpresa] = useState("");
  const [numeroIdentificacion, setNumeroIdentificacion] = useState("");
  const [errores, setErrores] = useState<any>({});
  const [motivoAnular, setMotivoAnular] = useState("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isOpenError,
    onOpen: onOpenError,
    onOpenChange: onOpenChangeError,
  } = useDisclosure();
  const [mensajeError, setMensajeError] = useState("");
  const router = useRouter();

  useEffect(() => {
    getWithAuth(
      `http://localhost:8080/compras/proveedores/${params.idProveedor}`
    )
      .then((response) => response.json())
      .then((data) => {
        setNombre(data.nombre);
        setDescripcion(data.descripcion);
        setContacto(data.contacto);
        setTelefono(data.telefono);
        setEstado(data.estado);
        setCorreo(data.correo);
        setTipoEmpresa(data.tipoEmpresa);
        setNumeroIdentificacion(data.numeroIdentificacion);
      })
      .catch((error) => {
        console.error("Error al cargar los datos del proveedor:", error);
      });
  }, [params.idProveedor]);

  const validarCorreo = (correo: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo) ? "" : "Correo electrónico inválido.";
  };

  const validarTelefono = (telefono: string) => {
    const regex = /^[0-9]{10}$/;
    return regex.test(telefono) ? "" : "El teléfono debe tener 10 dígitos.";
  };

  const validarNumeroIdentificacion = (numeroIdentificacion: string) => {
    const regex = /^[0-9]{9,10}$/;
    return regex.test(numeroIdentificacion)
      ? ""
      : "El número de identificación debe tener entre 9 y 10 dígitos.";
  };

  const validarCampos = () => {
    const erroresTemp: any = {};

    if (!/^[A-Za-záéíóúÁÉÍÓÚ\s]+$/.test(nombre)) {
      erroresTemp.nombre =
        "El nombre no puede contener números ni caracteres especiales.";
    } else if (nombre.length < 3) {
      erroresTemp.nombre = "El nombre debe tener al menos 3 caracteres.";
    }

    if (!descripcion) erroresTemp.descripcion = "La descripción es requerida.";
    if (!tipoEmpresa)
      erroresTemp.tipoEmpresa = "El tipo de empresa es requerido.";
    if (!numeroIdentificacion)
      erroresTemp.numeroIdentificacion =
        "El número de identificación es requerido.";

    const errorNumeroIdentificacion =
      validarNumeroIdentificacion(numeroIdentificacion);
    if (errorNumeroIdentificacion)
      erroresTemp.numeroIdentificacion = errorNumeroIdentificacion;

    const errorCorreo = validarCorreo(correo);
    if (errorCorreo) erroresTemp.correo = errorCorreo;

    const errorTelefono = validarTelefono(telefono);
    if (errorTelefono) erroresTemp.telefono = errorTelefono;
    
    if (tipoEmpresa === "Juridica" && !contacto) {
      erroresTemp.contacto = "El contacto es requerido para empresas jurídicas.";
    }
    return erroresTemp;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    switch (name) {
      case "nombre":
        setNombre(value);
        setErrores({ ...errores, nombre: validarCampos().nombre });
        break;
      case "descripcion":
        setDescripcion(value);
        break;
      case "contacto":
        setContacto(value);
        break;
      case "telefono":
        setTelefono(value);
        setErrores({ ...errores, telefono: validarCampos().telefono });
        break;
      case "estado":
        setEstado(value);
        break;
      case "correo":
        setCorreo(value);
        setErrores({ ...errores, correo: validarCampos().correo });
        break;
      case "tipoEmpresa":
        setTipoEmpresa(value);
        break;
      case "numeroIdentificacion":
        setNumeroIdentificacion(value);
        setErrores({
          ...errores,
          numeroIdentificacion: validarCampos().numeroIdentificacion,
        });
        break;
    }
  };

  const handleFormSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();

    const erroresTemp = validarCampos();
    setErrores(erroresTemp);

    if (Object.keys(erroresTemp).length > 0) {
      setMensajeError("Por favor corrija los errores en el formulario.");
      onOpenError();
      return;
    }

    onOpen();
  };

  const handleConfirmSubmit = async () => {
    const proveedorActualizado = {
      idProveedor: params.idProveedor,
      nombre,
      descripcion,
      contacto: tipoEmpresa === "Natural" ? null : contacto,
      telefono,
      estado,
      correo,
      tipoEmpresa,
      numeroIdentificacion,
    };

    try {
      const response = await postWithAuth(
        `http://localhost:8080/compras/proveedores/editar/${params.idProveedor}`,
        proveedorActualizado
      );
      if (response.ok) {
        toast.success("Proveedor editado con éxito!");
        setTimeout(() => {
          router.push("/admin/compras/proveedores");
        }, 1000);
      } else {
        console.error("Error al editar el proveedor:", response.statusText);
        setMensajeError(
          "No se puede editar el proveedor. Verifique los datos."
        );
        onOpenError();
      }
    } catch (error) {
      console.error("Error al enviar la solicitud:", error);
      setMensajeError("Error al enviar la solicitud");
      onOpenError();
    }
    onOpenChange();
  };

  const TipoEmpresa = [
    { key: "Natural", label: "Natural" },
    { key: "Juridica", label: "Juridica" },
  ];

  const inhabilitarInput =
    tipoEmpresa == "Juridica" ? (
      <Input
        isRequired
        type="text"
        label="Contacto"
        value={contacto || ""}
        onChange={handleChange}
        name="contacto"
        isInvalid={!!errores.contacto}
        color={errores.contacto ? "danger" : "default"}
        errorMessage={errores.contacto}
      />
    ) : (
      ""
    );

  return (
    <>
      {acceso ? (
        <div className="container">
          <h1 className={title()}>Editar Proveedor</h1>
          <br />
          <br />
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                isRequired
                name="tipoEmpresa"
                label="Tipo empresa"
                value={tipoEmpresa}
                onChange={(e) => setTipoEmpresa(e.target.value)}
                selectedKeys={[tipoEmpresa]}
              >
                {TipoEmpresa.map((tipo) => (
                  <SelectItem key={tipo.key} value={tipo.key}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </Select>
              <Input
                isRequired
                type="number"
                label="Número de Identificación"
                value={numeroIdentificacion}
                onChange={handleChange}
                name="numeroIdentificacion"
                isInvalid={!!errores.numeroIdentificacion}
                color={errores.numeroIdentificacion ? "danger" : "default"}
                errorMessage={errores.numeroIdentificacion}
              />
              <Input
                isRequired
                type="text"
                label="Nombre Empresa o Persona"
                value={nombre}
                onChange={handleChange}
                name="nombre"
                isInvalid={!!errores.nombre}
                color={errores.nombre ? "danger" : "default"}
                errorMessage={errores.nombre}
              />
              {inhabilitarInput}
              <Input
                isRequired
                type="text"
                label="Descripción"
                value={descripcion}
                onChange={handleChange}
                name="descripcion"
                isInvalid={!!errores.descripcion}
                color={errores.descripcion ? "danger" : "default"}
                errorMessage={errores.descripcion}
              />
              <Input
                isRequired
                type="text"
                label="Teléfono"
                value={telefono}
                onChange={handleChange}
                name="telefono"
                isInvalid={!!errores.telefono}
                color={errores.telefono ? "danger" : "default"}
                errorMessage={errores.telefono}
              />
              <Input
                isRequired
                type="email"
                label="Correo"
                value={correo}
                onChange={handleChange}
                name="correo"
                isInvalid={!!errores.correo}
                color={errores.correo ? "danger" : "default"}
                errorMessage={errores.correo}
              />
            </div>
            <div className="flex justify-end mt-4">
              <Link href="/admin/compras/proveedores">
                <Button
                  className="mr-2 bg-gradient-to-tr from-red-600 to-red-300"
                  type="button"
                >
                  Cancelar
                </Button>
              </Link>
              <Button
                className="bg-gradient-to-tr from-yellow-600 to-yellow-300"
                type="submit"
              >
                Enviar
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
                    <h1 className="text-3xl">¿Desea editar el proveedor?</h1>
                    <p>
                      El proveedor se actualizará con la información
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
      ) : (
        <CircularProgress color="warning" aria-label="Cargando..." />
      )}
    </>
  );
}

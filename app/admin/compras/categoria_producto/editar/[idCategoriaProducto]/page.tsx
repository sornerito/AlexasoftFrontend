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
  CircularProgress,
} from "@nextui-org/react";
import { CircleHelp, CircleX } from "lucide-react";
import {
  getWithAuth,
  postWithAuth,
  verificarAccesoPorPermiso,
} from "@/config/peticionesConfig";

export default function EditarCategoriaProductoPage({
  params,
}: {
  params: { idCategoriaProducto: string };
}) {
  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (
        verificarAccesoPorPermiso("Gestionar Categoria de Productos") == false
      ) {
        window.location.href = "../../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Categoria de Productos"));
    }
  }, []);
  const [nombreOriginal, setNombreOriginal] = useState<String>("");
  const [nombre, setNombre] = useState<String>("");
  const [estado, setEstado] = useState("");
  const [errores, setErrores] = useState<any>({});

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
      `http://192.168.56.1:8080/compras/categorias-producto/${params.idCategoriaProducto}`
    )
      .then((response) => response.json())
      .then((data) => {
        setNombre(data.nombre);
        setNombreOriginal(data.nombre);
        setEstado(data.estado);
      })
      .catch((error) => {
        console.error(
          "Error al cargar los datos de la categoría producto:",
          error
        );
      });
  }, [params.idCategoriaProducto]);

  const validarNombre = (nombre: string) => {
    if (!/^[A-Za-záéíóúÁÉÍÓÚ\s]+$/.test(nombre)) {
      return "El nombre no puede contener números ni caracteres especiales.";
    }
    if (nombre.length < 3) {
      return "El nombre debe tener al menos 3 caracteres.";
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    switch (name) {
      case "nombre":
        setNombre(value);
        setErrores({ ...errores, nombre: validarNombre(value) });
        break;
    }
  };

  const handleFormSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();

    const errorNombre = validarNombre(nombre.toString());

    if (errorNombre) {
      setErrores({ nombre: errorNombre });
      setMensajeError("Por favor corrija los errores en el formulario.");
      onOpenError();
      return;
    }

    onOpen();
  };

  const handleConfirmSubmit = async () => {
    if (nombre === nombreOriginal) {
      console.error("Error al editar la categoría producto:");
      setMensajeError("No hubo cambios");
      onOpenError();
      return;
    }

    const categoriaProductoActualizado = {
      idCategoriaProducto: params.idCategoriaProducto,
      nombre,
      estado,
    };

    try {
      const response = await postWithAuth(
        `http://192.168.56.1:8080/compras/categorias-producto/${params.idCategoriaProducto}`,
        categoriaProductoActualizado
      );
      if (response.ok) {
        toast.success("Categoria editado con éxito!");
        setTimeout(() => {
          router.push("/admin/compras/categoria_producto");
        }, 1000);
      } else {
        console.error(
          "Error al editar la categoría producto:",
          response.statusText
        );
        setMensajeError("El nombre ingresado ya esta en uso");
        onOpenError();
      }
    } catch (error) {
      console.error("Error al enviar la solicitud:", error);
      setMensajeError("Error al enviar la solicitud");
      onOpenError();
    }
    onOpenChange();
  };

  return (
    <>
      {acceso ? (
        <div className="container">
          <h1 className={title()}>Editar Categoría Producto</h1>
          <br />
          <br />
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-4">
              <Input
                isRequired
                type="text"
                label="Nombre"
                value={nombre.toString()}
                onChange={handleChange}
                name="nombre"
                isInvalid={!!errores.nombre}
                color={errores.nombre ? "danger" : "default"}
                errorMessage={errores.nombre}
              />
              <div className="flex justify-end mt-4">
                <Link href="/admin/compras/categoria_producto">
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
                    <h1 className="text-3xl">
                      ¿Desea editar la categoría producto?
                    </h1>
                    <p>
                      La categoría producto se actualizará con la información
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

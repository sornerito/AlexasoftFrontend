"use client";
import { title } from "@/components/primitives";
import React from "react";
import { useRouter } from "next/navigation";
import {
  Input,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  Link,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Divider,
  CircularProgress,
} from "@nextui-org/react";
import { CircleHelp, CircleX } from "lucide-react";
import {
  postWithAuth,
  verificarAccesoPorPermiso,
} from "@/config/peticionesConfig";

interface CategoriaProducto {
  nombre: string;
  estado: string;
}

export default function CrearCategoriaProductoPage() {
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
  const [categoria, setCategoria] = React.useState<CategoriaProducto>({
    nombre: "",
    estado: "Activo",
  });
  const [mensajeError, setMensajeError] = React.useState("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isOpenError,
    onOpen: onOpenError,
    onOpenChange: onOpenChangeError,
  } = useDisclosure();
  const router = useRouter();

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
    setCategoria({ ...categoria, [name]: value });

    if (name === "nombre") {
      const error = validarNombre(value);
      setErrores({ ...errores, nombre: error });
    }
  };

  const [errores, setErrores] = React.useState<any>({});

  const handleFormSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();

    const errorNombre = validarNombre(categoria.nombre);
    if (errorNombre) {
      setMensajeError(errorNombre);
      onOpenError();
      return;
    }

    onOpen();
  };

  const handleConfirmSubmit = async () => {
    try {
      const response = await postWithAuth(
        "http://10.170.83.243:8080/compras/categorias-producto/",
        categoria
      );

      if (!response.ok) {
        const errorResponse = await response.text();
        setMensajeError(
          "No se puede crear el proveedor ya existe un nombre de la categoria "
        );
        onOpenError();
        throw new Error("Error al intentar guardar la categoría de producto");
      }

      router.push("/admin/compras/categoria_producto");
    } catch (error) {
      console.error("Error al enviar los datos:", error);
    }
    onOpenChange();
  };

  return (
    <>
      {acceso ? (
        <div className="container">
          <h1 className={title()}>Crear Categoria Producto</h1>
          <br />
          <br />
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-4">
              <Input
                isRequired
                type="text"
                label="Nombre"
                value={categoria.nombre}
                isInvalid={!!errores.nombre}
                color={errores.nombre ? "danger" : "default"}
                errorMessage={errores.nombre}
                onChange={handleChange}
                name="nombre"
              />
            </div>
            <div className="my-4 text-end">
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
                Crear Categoria
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
                    <h1 className="text-3xl ">
                      ¿Desea crear la categoría de producto?
                    </h1>
                    <p>
                      La categoría de producto se creará con la información
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

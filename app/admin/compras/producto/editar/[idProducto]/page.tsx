"use client";
import { title } from "@/components/primitives";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { CircleHelp, CircleX } from "lucide-react";
import { Toaster, toast } from "sonner";
import { Image } from "@nextui-org/react";
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
  Select,
  SelectItem,
  Spinner,
  CircularProgress,
} from "@nextui-org/react";
import {
  getWithAuth,
  postWithAuth,
  verificarAccesoPorPermiso,
} from "@/config/peticionesConfig";

interface Producto {
  idProducto: string;
  nombre: string;
  idMarca: string;
  precio: string;
  unidades: number;
  estado: string;
  idCategoriaProducto: string;
  imagenes: string;
  unidadMedida: string;
}

interface CategoriaProducto {
  idCategoriaProducto: number;
  nombre: string;
  estado: string;
}
interface Marca {
  idMarca: number;
  nombre: string;
  estado: string;
}

export default function ProductosEditarPage() {
  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Productos") == false) {
        window.location.href = "../../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Productos"));
    }
  }, []);
  const [producto, setProducto] = useState<Producto | null>(null);
  const [originalProducto, setOriginalProducto] = useState<Producto | null>(
    null
  );
  const [idCategoriaProducto, setIdCategoriaProducto] = useState<string>("");
  const [categoriasProducto, setCategoriasProducto] = useState<
    CategoriaProducto[]
  >([]);
  const [idMarca, setIdMarca] = useState<string>("");
  const [unidadMedida, SetUnidadMedida] = useState<string>("");
  const [marca, setMarca] = useState<Marca[]>([]);
  const [errores, setErrores] = useState<any>({});
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isOpenError,
    onOpen: onOpenError,
    onOpenChange: onOpenChangeError,
  } = useDisclosure();
  const [mensajeError, setMensajeError] = useState("");
  const router = useRouter();
  const { idProducto } = useParams();
  const [previewVisible, setPreviewVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriasProductoResponse] = await Promise.all([
          getWithAuth("http://localhost:8080/compras/categorias-producto"),
        ]);
        const categoriasProductoData = await categoriasProductoResponse.json();
        const categoriasActivos = categoriasProductoData.filter(
          (categoria: CategoriaProducto) => categoria.estado == "Activo"
        );
        setCategoriasProducto(categoriasActivos);
      } catch (error) {
        console.error("Error al obtener categorías de producto:", error);
      }
    };

    fetchData();
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriasProductoResponse] = await Promise.all([
          getWithAuth("http://localhost:8080/compras/categorias-producto"),
        ]);
        const categoriasProductoData = await categoriasProductoResponse.json();
        const categoriasActivos = categoriasProductoData.filter(
          (categoria: CategoriaProducto) => categoria.estado == "Activo"
        );
        setCategoriasProducto(categoriasActivos);
      } catch (error) {
        console.error("Error al obtener categorías de producto:", error);
      }
    };

    fetchData();
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [marcaResponse] = await Promise.all([
          getWithAuth("http://localhost:8080/compras/marcas"),
        ]);
        const marcaData = await marcaResponse.json();
        const marcasActivos = marcaData.filter(
          (marca: Marca) => marca.estado == "Activo"
        );
        setMarca(marcasActivos);
      } catch (error) {
        console.error("Error al obtener las marcas:", error);
      }
    };

    fetchData();
    setIsLoading(false);
  }, []);

  useEffect(() => {
    getWithAuth(`http://localhost:8080/compras/productos/${idProducto}`)
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setProducto({
          ...data,
          idMarca: data.idMarca.idMarca.toString(),
          idCategoriaProducto:
            data.idCategoriaProducto.idCategoriaProducto.toString(),
        });
        setOriginalProducto(data);
        setIdMarca(data.idMarca.idMarca.toString());
        setIdCategoriaProducto(
          data.idCategoriaProducto.idCategoriaProducto.toString()
        );
        SetUnidadMedida(data.unidadMedida);
      })
      .catch((err) => {
        console.error("Error al obtener producto:", err);
        setMensajeError(
          "Error al obtener producto. Por favor, inténtalo de nuevo."
        );
        onOpenError();
      });
    setIsLoading(false);
  }, [idProducto]);

  // Validaciones
  const validarNombre = (nombre: string) => {
    if (!/^[A-Za-záéíóúÁÉÍÓÚ\s]+$/.test(nombre)) {
      return "El nombre no puede contener números ni caracteres especiales.";
    }
    if (nombre.length < 5) {
      return "El nombre debe tener al menos 5 caracteres.";
    }
    return "";
  };

  const validarPrecio = (precio: string) => {
    if (isNaN(Number(precio)) || Number(precio) <= 0) {
      return "El precio debe ser un número mayor que 0.";
    }
    if (Number(precio) >= 1000000) {
      return "El precio debe ser menor a (1.000.000) ";
    }
    return "";
  };

  const validarUnidades = (unidades: string) => {
    if (isNaN(Number(unidades)) || Number(unidades) <= 0) {
      return "Las unidades deben ser un número mayor que 0.";
    }
    return "";
  };

  const validarImagenes = (imagenes: string) => {
    const url =
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})(\/[\w@.-]*)*(\?.*)?\.(jpg|jpeg|png|gif)/i;
    if (!url.test(imagenes)) {
      return "La URL de la imagen debe ser válida y contener una extensión .jpg, .jpeg, .png o .gif.";
    }
    if (imagenes.length >= 500) {
      return "La URL de la imagen permite 500 careacteres";
    }
    return "";
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProducto({ ...producto, [name]: value } as Producto);

    let error = "";
    switch (name) {
      case "nombre":
        error = validarNombre(value);
        break;
      case "imagenes":
        error = validarImagenes(value);
        break;
    }
    setErrores({ ...errores, [name]: error });
  };

  const handleFormSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();

    const errorNombre = validarNombre(producto?.nombre || "");
    const errorImagenes = validarImagenes(producto?.imagenes || "");

    if (errorNombre || errorImagenes) {
      setErrores({
        nombre: errorNombre,
        imagenes: errorImagenes,
      });
      setMensajeError("Por favor corrija los errores en el formulario.");
      onOpenError();
      return;
    }

    if (!producto?.idCategoriaProducto) {
      setMensajeError("Por favor seleccione una categoría.");
      onOpenError();
      return;
    }

    onOpen();
  };

  const handleSubmit = async () => {
    try {
      const response = await postWithAuth(
        `http://localhost:8080/compras/productos/${producto?.idProducto}`,
        {
          ...producto,
          idCategoriaProducto: producto?.idCategoriaProducto.toString(),
        }
      );

      if (response.ok) {
        toast.success("Producto editado con éxito!");
        setTimeout(() => {
          router.push("/admin/compras/producto");
        }, 1000);
      } else {
        const errores = await response.json();
        console.error("Errores de validación:", errores);
        setErrores(
          "El nombre está repetido con esta marca, por favor ingrese otro nombre"
        );
        setMensajeError(
          "Hay un nombre que tiene el mismo producto! Cambie el nombre del producto"
        );
        onOpenError();
      }
    } catch (error) {
      console.error("Error de red:", error);
      setMensajeError("Error de red. Inténtalo de nuevo.");
      onOpenError();
    }
  };

  // Función para manejar cambios en el selector de categoría de producto
  const handleChangeCategoria = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setIdCategoriaProducto(value);
    setProducto({ ...producto, idCategoriaProducto: value } as Producto);
  };

  // Función para manejar cambios en el selector de categoría de producto
  const handleChangeMarca = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setIdMarca(value);
    setProducto({ ...producto, idMarca: value } as Producto);
  };

  // Función para manejar la confirmación del envío del formulario
  const handleConfirmSubmit = () => {
    handleSubmit();
    onOpenChange();
  };

  const [isLoading, setIsLoading] = useState(true);

  const handleChangeUnidadMedida = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value;
    SetUnidadMedida(value);
    setProducto({ ...producto, unidadMedida: value } as Producto);
  };

  const UnidadMedida = [
    { key: "ml", label: "ml" },
    { key: "g", label: "g" },
  ];

  const handlePreviewClick = () => {
    setPreviewVisible(true);
  };
  
  
  // Retorno del componente
  return (
    <>
      {acceso ? (
        <div className="container">
          <h1 className={title()}>Editar Producto</h1>
          <br />
          <br />

          {isLoading ? (
            <div className="flex justify-center h-screen text-center">
              <div className="text-center">
                <Spinner color="warning" size="lg" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  isRequired
                  type="text"
                  label="Nombre"
                  value={producto?.nombre}
                  isInvalid={!!errores.nombre}
                  color={errores.nombre ? "danger" : "default"}
                  errorMessage={errores.nombre}
                  onChange={handleChange}
                  name="nombre"
                />
                <Select
                  isRequired
                  name="idMarca"
                  label="Marca"
                  value={idMarca}
                  onChange={handleChangeMarca}
                  selectedKeys={[idMarca]}
                  required
                >
                  {marca.map((marca) => (
                    <SelectItem
                      key={marca.idMarca}
                      value={marca.idMarca.toString()}
                    >
                      {marca.nombre}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  isRequired
                  name="idCategoriaProducto"
                  label="Categoría de Producto"
                  value={idCategoriaProducto}
                  onChange={handleChangeCategoria}
                  selectedKeys={[idCategoriaProducto]}
                  required
                >
                  {categoriasProducto.map((categoria) => (
                    <SelectItem
                      key={categoria.idCategoriaProducto}
                      value={categoria.idCategoriaProducto.toString()}
                    >
                      {categoria.nombre}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  isRequired
                  name="unidad Medida"
                  label="unidad Medida"
                  value={unidadMedida}
                  onChange={handleChangeUnidadMedida}
                  selectedKeys={[unidadMedida]}
                >
                  {UnidadMedida.map((unidadMedida) => (
                    <SelectItem key={unidadMedida.key} value={unidadMedida.key}>
                      {unidadMedida.label}
                    </SelectItem>
                  ))}
                </Select>
                <Input
                  isRequired
                  type="text"
                  label="Imagenes"
                  value={producto?.imagenes}
                  isInvalid={!!errores.imagenes}
                  color={errores.imagenes ? "danger" : "default"}
                  errorMessage={errores.imagenes}
                  onChange={handleChange}
                  name="imagenes"
                />
                 <Button
                className="mt-4"
                onClick={handlePreviewClick}
                disabled={!producto?.imagenes}
              >
                Ver Preview
              </Button>
              </div>
              <div className="flex justify-end mt-4">
                <Link href="/admin/compras/producto">
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
          )}
          <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col items-center gap-1">
                    <CircleHelp color="#fef08a" size={100} />
                  </ModalHeader>
                  <ModalBody className="text-center">
                    <h1 className="text-3xl">¿Desea editar el producto?</h1>
                    <p>
                      El producto se actualizará con la información
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

          <Modal isOpen={previewVisible} onOpenChange={setPreviewVisible}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader>Preview de la imagen</ModalHeader>
                  <ModalBody>
                    <div className="flex items-center justify-center">
                      {producto?.imagenes && (
                        <Image
                          src={producto.imagenes}
                          alt="Preview de la imagen"
                          className="full"
                          width={250}
                          height={250}
                        />
                      )}
                    </div>
                  </ModalBody>
                  <ModalFooter>
                    <Button color="primary" variant="light" onPress={onClose}>
                      Cerrar
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

          <Toaster position="bottom-right" />
        </div>
      ) : (
        <CircularProgress color="warning" aria-label="Cargando..." />
      )}
    </>
  );
}

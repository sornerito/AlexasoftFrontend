"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Image } from "@nextui-org/react";
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
  Select,
  SelectItem,
  CircularProgress,
} from "@nextui-org/react";
import { CircleHelp, CircleX } from "lucide-react";
import { title } from "@/components/primitives";
import {
  getWithAuth,
  postWithAuth,
  verificarAccesoPorPermiso,
} from "@/config/peticionesConfig";

// Interfaz para el producto
interface Producto {
  nombre: string;
  marca: number;
  precio: string;
  unidades: string;
  estado: string;
  idCategoriaProducto: number;
  imagenes: string;
  unidadMedida: string;
}

interface Categoria {
  idCategoriaProducto: number;
  nombre: string;
  estado: string;
}

interface Marca {
  idMarca: number;
  nombre: string;
  estado: string;
}

interface DetalleCompra {
  idDetalleProductoXCompra: number;
  unidades: number;
  precioporunidad: number;
  idCompra: number;
  idProducto: number;
}

// Función para obtener las categorías
const fetchCategorias = async () => {
  try {
    const response = await getWithAuth(
      "http://localhost:8080/compras/categorias-producto"
    );
    if (!response.ok) {
      throw new Error("Error al obtener las categorías");
    }
    const data = await response.json();
    console.log(data);
    const categoriasActivos = data.filter(
      (categoria: Categoria) => categoria.estado == "Activo"
    );

    return categoriasActivos;
  } catch (error) {
    console.error("Error al obtener las categorías:", error);
    return [];
  }
};

// Función para obtener las marcas
const fetchMarcas = async () => {
  try {
    const response = await getWithAuth("http://localhost:8080/compras/marcas");
    if (!response.ok) {
      throw new Error("Error al obtener las marcas");
    }
    const data = await response.json();
    console.log(data);
    const marcasActivos = data.filter(
      (marca: Marca) => marca.estado == "Activo"
    );

    return marcasActivos;
  } catch (error) {
    console.error("Error al obtener las marcas:", error);
    return [];
  }
};

// Función para obtener los detalle producto
const fetchDetalleCompra = async () => {
  try {
    const response = await getWithAuth(
      "http://localhost:8080/compras/detalle-producto-compra-producto"
    );
    if (!response.ok) {
      throw new Error("Error al obtener las detalle de compra producto ");
    }
    const data = await response.json();
    console.log(data);

    return data;
  } catch (error) {
    console.error("Error al obtener los detalle de compra productos:", error);
    return [];
  }
};

export default function CrearProductoPage() {
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

  const [producto, setProducto] = useState<Producto>({
    nombre: "",
    marca: 0,
    precio: "",
    unidades: "",
    estado: "Activo",
    idCategoriaProducto: 0,
    imagenes: "",
    unidadMedida: "",
  });
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [detalleCompra, setDetalleCompra] = useState<DetalleCompra[]>([]);
  const [mensajeError, setMensajeError] = useState("");
  const [errores, setErrores] = useState<any>({});
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isOpenError,
    onOpen: onOpenError,
    onOpenChange: onOpenChangeError,
  } = useDisclosure();
  const [previewVisible, setPreviewVisible] = useState(false);
  const router = useRouter();

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
    if (precio.trim() === "") {
      return "El precio no puede estar vacío.";
    }

    if (precio.includes(".")) {
      return "El precio no puede contener puntos (.) en ninguna posición.";
    }

    const numero = Number(precio);
    if (isNaN(numero) || numero <= 0) {
      return "El precio debe ser un número mayor que 0 y no puede contener puntos (.) en ninguna posición.";
    }
    if (numero >= 1000000) {
      return "El precio debe ser menor a (1.000.000) ";
    }
    return "";
  };

  const validarUnidades = (unidades: string) => {
    if (isNaN(Number(unidades)) || Number(unidades) <= 0) {
      return "Las unidades deben ser un número mayor que 0.";
    }
    if (unidades.includes(".")) {
      return "La unidades no puede contener puntos (.) en ninguna posición.";
    }
    return "";
  };

  const validarImagenes = (imagenes: string) => {
    const url =
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})(\/[\w.-]*)*(\?.*)?\.(jpg|jpeg|png|gif)/i;
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
    setProducto({ ...producto, [name]: value });

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

    const errorNombre = validarNombre(producto.nombre);

    const errorImagenes = validarImagenes(producto.imagenes);

    if (errorNombre || errorImagenes) {
      setErrores({
        nombre: errorNombre,
        imagenes: errorImagenes,
      });
      setMensajeError("Por favor corrija los errores en el formulario.");
      onOpenError();
      return;
    }

    if (!producto.idCategoriaProducto) {
      setMensajeError("Por favor seleccione una categoría.");
      onOpenError();
      return;
    }

    onOpen();
  };

  const handleConfirmSubmit = async () => {
    try {
      const response = await postWithAuth(
        "http://localhost:8080/compras/productos/",
        {
          ...producto,
          idMarca: Number(producto.marca),
          idCategoriaProducto: Number(producto.idCategoriaProducto),
        }
      );

      if (!response.ok) {
        const errorResponse = await response.json();
        const error = errorResponse.error;
        const error1 =
          "Ya existe un producto con la misma marca, Por favor cambiar el nombre o cancele la creacion del producto";
        setMensajeError(error);
        setMensajeError(error);
        onOpenError();
        throw new Error("Error al intentar guardar el producto");
      }

      router.push("/admin/compras/producto");
    } catch (error) {
      console.error("Error al enviar los datos:", error);
    }
    onOpenChange();
  };

  useEffect(() => {
    const loadCategorias = async () => {
      const data = await fetchCategorias();
      setCategorias(data);
    };

    loadCategorias();
  }, []);

  useEffect(() => {
    const loadMarcas = async () => {
      const data = await fetchMarcas();
      setMarcas(data);
    };

    loadMarcas();
  }, []);

  useEffect(() => {
    const loadDetalleCompra = async () => {
      const data = await fetchDetalleCompra();
      console.log(data);
      setDetalleCompra(data);
    };

    loadDetalleCompra();
  }, []);

  const handleChangeCategoria = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log(producto.idCategoriaProducto);
    setProducto({ ...producto, idCategoriaProducto: Number(e.target.value) });
  };

  const handleChangeMarca = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log(producto.marca);
    setProducto({ ...producto, marca: Number(e.target.value) });
  };
  const handleChangeUnidadMedida = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    console.log(producto.unidadMedida);
    setProducto({ ...producto, unidadMedida: String(e.target.value) });
  };

  const UnidadMedida = [
    { key: "ml", label: "ml" },
    { key: "g", label: "g" },
  ];

  const handlePreviewClick = () => {
    setPreviewVisible(true);
  };
  
  
  return (
    <>
      {acceso ? (
        <div className="container">
          <h1 className={title()}>Crear Producto</h1>
          <br />
          <br />
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                isRequired
                type="text"
                label="Nombre"
                value={producto.nombre}
                isInvalid={!!errores.nombre}
                color={errores.nombre ? "danger" : "default"}
                errorMessage={errores.nombre}
                onChange={handleChange}
                name="nombre"
              />
              <Select
                isRequired
                name="idMarca"
                label="Marca del producto"
                value={producto.marca}
                onChange={handleChangeMarca}
              >
                {marcas.map((marca) => (
                  <SelectItem key={marca.idMarca} value={marca.idMarca}>
                    {marca.nombre}
                  </SelectItem>
                ))}
              </Select>
              <Select
                isRequired
                name="idCategoriaProducto"
                label="Categoría Producto"
                value={producto.idCategoriaProducto}
                onChange={handleChangeCategoria}
              >
                {categorias.map((categoria) => (
                  <SelectItem
                    key={categoria.idCategoriaProducto}
                    value={categoria.idCategoriaProducto}
                  >
                    {categoria.nombre}
                  </SelectItem>
                ))}
              </Select>
              <Select
                isRequired
                name="unidad Medida"
                label="unidad Medida"
                value={producto.unidadMedida}
                onChange={handleChangeUnidadMedida}
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
                value={producto.imagenes}
                isInvalid={!!errores.imagenes}
                color={errores.imagenes ? "danger" : "default"}
                errorMessage={errores.imagenes}
                onChange={handleChange}
                name="imagenes"
              />

              
              <Button
                className="mt-4"
                onClick={handlePreviewClick}
                disabled={!producto.imagenes}
              >
                Ver Preview
              </Button>
            </div>
            <div className="my-4 text-end">
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
                Guardar
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
                    <h1 className="text-3xl ">¿Desea crear el producto?</h1>
                    <p>
                      El producto se creará con la información proporcionada.
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

          <Modal isOpen={previewVisible} onOpenChange={setPreviewVisible}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader>Preview de la imagen</ModalHeader>
                  <ModalBody>
                  <div className="flex items-center justify-center">
                  {producto.imagenes && (
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

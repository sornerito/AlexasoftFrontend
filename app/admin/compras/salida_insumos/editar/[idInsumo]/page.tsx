"use client";
import { title } from "@/components/primitives";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { CircleHelp, CircleX } from "lucide-react";
import { Toaster, toast } from 'sonner';
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
import { verificarAccesoPorPermiso } from "@/config/peticionesConfig";

interface SalidaInsumo {
  idInsumo: string;
  idProducto: string;
  fechaRetiro: string;
  cantidad: string;
  motivoAnuar: string;
}

interface Producto {
  idProducto: number;
  nombre: string;
}

export default function ProductosEditarPage() {
  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if(typeof window !== "undefined"){
    if(verificarAccesoPorPermiso("Gestionar Insumos") == false){
      window.location.href = "../../../../acceso/noAcceso"
    }
    setAcceso(verificarAccesoPorPermiso("Gestionar Insumos"));
  }
  }, []);
  const [salida, setSalida] = useState<SalidaInsumo | null>(null);
  const [originalSalida, setOriginalSalida] = useState<SalidaInsumo | null>(null);
  const [idProducto, setIdProducto] = useState<string>("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [errores, setErrores] = useState<any>({});
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { isOpen: isOpenError, onOpen: onOpenError, onOpenChange: onOpenChangeError } = useDisclosure();
  const [mensajeError, setMensajeError] = useState("");
  const router = useRouter();
  const { idInsumo } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productoResponse] = await Promise.all([
          fetch("http://localhost:8080/compras/productos"),
        ]);
        const productoData = await productoResponse.json();
        console.log(productoData)
        setProductos(productoData);
      } catch (error) {
        console.error("Error al obtener el producto:", error);
      }
    };

    fetchData();
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetch(`http://localhost:8080/compras/salidas-insumo/${idInsumo}`)
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setSalida({
          ...data,
          idProducto: data.idProducto.idProducto
        });
        setOriginalSalida(data);
        setIdProducto(data.idProducto.idProducto);
      })
      .catch(err => {
        console.error("Error al obtener Salida insumo:", err);
        setMensajeError("Error al obtener producto. Por favor, inténtalo de nuevo.");
        onOpenError();
      });
    setIsLoading(false);
  }, [idInsumo]);


  // Validaciones
  const validarCantidad = (cantidad: string) => {
    if (isNaN(Number(cantidad)) || Number(cantidad) <= 0) {
      return "La Cantidad deben ser un número mayor que 0.";
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSalida({ ...salida, [name]: value } as SalidaInsumo);

    let error = "";
    switch (name) {
      case "cantidad":
        error = validarCantidad(value);
        break;
    }
    setErrores({ ...errores, [name]: error });
  };

  const handleFormSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    const errorCantidad = validarCantidad(salida?.cantidad.toString() || "");

    if (errorCantidad) {
      setErrores({
        cantidad: errorCantidad,
      });
      setMensajeError("Por favor corrija los errores en el formulario.");
      onOpenError();
      return;
    }

   
    onOpen();
  };
  const handleSubmit = async () => {
    try {
      if (!salida) {
        console.error("La salida es null o undefined.");
        return;
      }
  
      const response = await fetch(`http://localhost:8080/compras/productos/${idInsumo}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...salida,
          idProducto: salida.idProducto.toString(),
        }),
      });
  
      if (response.ok) {
        toast.success("Producto editado con éxito!");
        setTimeout(() => {
          router.push("/admin/compras/producto");
        }, 1000);
      } else {
        const errores = await response.json();
        console.error("Errores de validación:", errores);
        setErrores(errores);
      }
    } catch (error) {
      console.error("Error de red:", error);
      setMensajeError("Error de red. Inténtalo de nuevo.");
      onOpenError();
    }
  };
  



  // Función para manejar cambios en el selector de categoría de producto
  const handleChangeProducto = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setIdProducto(value);
    setSalida({ ...salida, idProducto: value } as SalidaInsumo);
  };


  // Función para manejar la confirmación del envío del formulario
  const handleConfirmSubmit = () => {
    handleSubmit();
    onOpenChange();
  };



  const [isLoading, setIsLoading] = useState(true);

  // Retorno del componente
  return (
    <>
{acceso ? (

    <div className="container">
      <h1 className={title()}>Editar Salida Insumos</h1>
      <br /><br />

      {isLoading ? (
        <div className="flex justify-center text-center h-screen">
          <div className="text-center">
            <Spinner color="warning" size="lg" />
          </div>
        </div>
      ) : (
        <form onSubmit={handleFormSubmit}>
          <div className="grid gap-4">
            <Input
              isRequired
              type="text"
              label="Cantidad"
              variant="bordered"
              value={salida?.cantidad}
              isInvalid={!!errores.cantidad}
              color={errores.precio ? "danger" : "default"}
              errorMessage={errores.cantidad}
              onChange={handleChange}
              name="cantidad"
            />
          
          </div>
          <div className="flex justify-end mt-4">
            <Link href="/admin/compras/SalidaInsumos">
              <Button className="bg-[#894242] mr-2" type="button">
                Cancelar
              </Button>
            </Link>
            <Button className="bg-[#609448]" type="submit">
              Enviar
            </Button>
          </div>
        </form>
      )}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 items-center">
                <CircleHelp color="#fef08a" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className="text-3xl">¿Desea editar la salida Insumos?</h1>
                <p>La salida de insumo se actualizará con la información proporcionada.</p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  className="bg-[#609448]"
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
              <ModalHeader className="flex flex-col gap-1 items-center">
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
    ) :(
      <CircularProgress color="warning" aria-label="Cargando..." />
    )}
</>
  );
}

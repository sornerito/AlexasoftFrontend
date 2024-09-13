"use client";
import { title } from "@/components/primitives";
import React from "react";
import router from "next/router";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Input,
  Button,
  getKeyValue,
  Modal,
  Link,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  CircularProgress,
} from "@nextui-org/react";
import { PlusIcon, CircleHelp, CircleX } from "lucide-react";
import { validarCampoString } from "@/config/validaciones";
import {
  getWithAuth,
  postWithAuth,
  verificarAccesoPorPermiso,
} from "@/config/peticionesConfig";

//Encabezado de la tabla, el uid debe coincidir con la forma en la que procesamos la data en el fetch
const columns = [
  { name: "ID", uid: "idServicio" },
  { name: "Nombre", uid: "nombre" },
  { name: "Descripcion", uid: "descripcion" },
  { name: "Tiempo", uid: "tiempoMinutos" },
  { name: "Estado", uid: "estado" },
];

//Molde con el que procesaremos los datos. ES DIFERENTE a como el json trae los datos
interface Servicio {
  idServicio: string;
  nombre: string;
  descripcion: string;
  tiempoMinutos: string;
  estado: string;
}

export default function CrearPaquetePage() {
  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Paquetes") == false) {
        window.location.href = "../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Paquetes"));
    }
  }, []);
  const [servicios, setServicios] = React.useState<Servicio[]>([]); // Hook permisos procesados
  const [searchTerm, setSearchTerm] = React.useState(""); // Hook buscar
  const [page, setPage] = React.useState(1); // Hook pagina
  const { isOpen, onOpen, onOpenChange } = useDisclosure(); //Hook modal crear
  const {
    isOpen: isOpenError,
    onOpen: onOpenError,
    onOpenChange: onOpenChangeError,
  } = useDisclosure(); //Hook de modal error

  // Hacer Fetch para obtener permisos y acomodarlos a conveniencia
  React.useEffect(() => {
    getWithAuth("http://localhost:8080/servicio")
      .then((response) => response.json())
      .then((data) => {
        // Procesar los datos para que coincidan con la estructura de columnas
        const processedData: Servicio[] = data.map(
          (item: {
            servicios: {
              idServicio: any;
              nombre: any;
              descripcion: any;
              tiempoMinutos: any;
              estado: any;
            };
            productos: [
              {
                idProducto: any;
                nombre: any;
                marca: any;
                precio: any;
                unidades: any;
                estado: any;
                idCategoriaProducto: any;
              }
            ];
          }) => ({
            idServicio: item.servicios.idServicio,
            nombre: item.servicios.nombre,
            descripcion: item.servicios.descripcion,
            tiempoMinutos: item.servicios.tiempoMinutos,
            estado: item.servicios.estado,
          })
        );
        setServicios(processedData);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, []);

  // CONFIGURACION DE PAGINACION Y BUSQUEDA(FILTRO)
  // CONFIGURACION DE PAGINACION Y BUSQUEDA(FILTRO)
  const rowsPerPage = 6; //Numero de registros por pagina
  // Filtra segun el value del hook de buscar
  const serviciosFiltrados = React.useMemo(() => {
    return servicios.filter(
      (servicio) =>
        servicio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        servicio.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        servicio.estado.toLowerCase().includes(searchTerm.toLowerCase()) ||
        servicio.idServicio.toString().includes(searchTerm.toLowerCase())
    );
  }, [servicios, searchTerm]);
  // Distribuye los registros segun los permisos filtrados (si no hay filtro muestra todos)
  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return serviciosFiltrados.slice(start, end);
  }, [page, serviciosFiltrados]);
  //FIN CONFIGURACION DE PAGINACION Y BUSQUEDA(FILTRO)
  //FIN CONFIGURACION DE PAGINACION Y BUSQUEDA(FILTRO)

  //FORMULARIO
  //FORMULARIO
  const [nombrePaquete, setNombrePaquete] = React.useState(""); //Hook nombre
  const [descripcionPaquete, setDescripcionPaquete] = React.useState(""); //Hook nombre
  const [selectedKeys, setSelectedKeys] = React.useState<string[]>([]); //Hook servicios
  const [mensajeError, setMensajeError] = React.useState(""); //Mensaje de error
  //Metodo para guardar y validar registro
  const guardarPaquete = async () => {
    const errorNombre = validarCampoString(nombrePaquete, "Nombre de paquete");
    const errorDescripcion = validarCampoString(
      descripcionPaquete,
      "descripcion de paquete"
    );

    let arrayfinal;
    if (errorNombre != "" || errorDescripcion != "") {
      setMensajeError(errorNombre && errorDescripcion);
      onOpenError();
      return;
    }

    if (selectedKeys instanceof Set) {
      const arrayServicios = Array.from(selectedKeys.values());
      if (arrayServicios.length <= 0) {
        setMensajeError("Debe seleccionar al menos un servicio");
        onOpenError();
        return;
      }
      arrayfinal = arrayServicios;
    } else {
      const allServicios = servicios.map((servicio) => servicio.idServicio);
      arrayfinal = allServicios;
    }

    const data = {
      paquete: {
        nombre: nombrePaquete,
        descripcion: descripcionPaquete,
        estado: "Activo",
      },
      serviciosId: arrayfinal,
    };

    try {
      const response = await postWithAuth(
        "http://localhost:8080/servicio/paquete",
        data
      );

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || "Error al crear el paquete";
        setMensajeError(errorMessage);
        onOpenError();
      } else {
        //router.push("/admin/paquetes");
        window.location.href = "/admin/paquetes";
      }
    } catch (error) {
      console.error("Error al enviar los datos:", error);
    }
  };
  //FIN FORMULARIO
  //FIN FORMULARIO

  //VALIDACION TIEMPO REAL NOMBRE
  const validarNombre = (nombre: any) => {
    if (validarCampoString(nombre, "Nombre") != "") {
      return false;
    }
    return nombre.length >= 5;
  };

  const validarDescripcion = (descripcion: any) => {
    if (validarCampoString(descripcion, "Descripcion") != "") {
      return false;
    }
    return descripcion.length >= 5;
  };

  const errors = React.useMemo(() => {
    return {
      nombrePaquete: nombrePaquete !== "" && !validarNombre(nombrePaquete),
      descripcionPaquete:
        descripcionPaquete !== "" && !validarDescripcion(descripcionPaquete),
    };
  }, [nombrePaquete, descripcionPaquete]);

  return (
    <>
      {acceso ? (
        <div>
          <h1 className={title()}>Crear Paquete</h1>

          <Input
            isRequired
            type="text"
            label="Nombre"
            value={nombrePaquete}
            className="max-w-xs mt-4"
            isInvalid={errors.nombrePaquete}
            color={errors.nombrePaquete ? "danger" : "default"}
            errorMessage="El nombre debe tener al menos 5 caracteres, no puede contener números ni caracteres especiales"
            onValueChange={setNombrePaquete}
          />

          <Input
            isRequired
            type="text"
            label="Descripcion"
            value={descripcionPaquete}
            className="max-w-xs mt-4"
            isInvalid={errors.descripcionPaquete}
            color={errors.descripcionPaquete ? "danger" : "default"}
            errorMessage="La descripcion debe tener al menos 5 caracteres, no puede contener números ni caracteres especiales"
            onValueChange={setDescripcionPaquete}
          />

          <div className="flex flex-col items-start sm:flex-row sm:items-center">
            <div className="p-0 my-4 rounded-lg basis-1/4 bg-gradient-to-tr from-yellow-600 to-yellow-300">
              <Input
                classNames={{
                  label: "text-black/50 dark:text-white/90",
                  input: [
                    "bg-transparent",
                    "text-black/90 dark:text-white/90",
                    "placeholder:text-default-700/50 dark:placeholder:text-white/60",
                  ],
                  innerWrapper: "bg-transparent",
                  inputWrapper: [
                    "shadow-xl",
                    "rounded-lg",
                    "bg-default-200/50",
                    "dark:bg-default/60",
                    "backdrop-blur-xl",
                    "backdrop-saturate-200",
                    "hover:bg-default-200/70",
                    "dark:hover:bg-default/70",
                    "group-data-[focus=true]:bg-default-200/50",
                    "dark:group-data-[focus=true]:bg-default/60",
                    "!cursor-text",
                  ],
                }}
                placeholder="Buscar Servicios..."
                onChange={(e: any) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Table
            aria-label="Tabla de roles"
            selectionMode="multiple"
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys as any}
            isStriped
            bottomContent={
              <div className="flex justify-center w-full">
                <Pagination
                  showControls
                  color="warning"
                  page={page}
                  total={Math.ceil(serviciosFiltrados.length / rowsPerPage)}
                  onChange={(page) => setPage(page)}
                />
              </div>
            }
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn className="text-base" key={column.uid}>
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={items}>
              {(item: Servicio) => (
                <TableRow key={item.idServicio}>
                  {(columnKey) => (
                    <TableCell>{getKeyValue(item, columnKey)}</TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex justify-end my-4">
            <Link href="/admin/paquetes">
              <Button
                className="mr-2 bg-gradient-to-tr from-red-600 to-red-300"
                type="button"
              >
                Cancelar
              </Button>
            </Link>
            <Button
              className="bg-gradient-to-tr from-yellow-600 to-yellow-300"
              onPress={onOpen}
            >
              <PlusIcon />
              Crear Paquete
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
                    <h1 className="text-3xl ">¿Desea crear el paquete?</h1>
                    <p>
                      El paquete no podrá eliminarse, pero si podrá
                      desactivarse.
                    </p>
                  </ModalBody>
                  <ModalFooter>
                    <Button
                      className="mr-2 bg-gradient-to-tr from-red-600 to-red-300"
                      onPress={onClose}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="bg-gradient-to-tr from-yellow-600 to-yellow-300"
                      onPress={onClose}
                      onClick={guardarPaquete}
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

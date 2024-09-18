"use client";
import { title } from "@/components/primitives";
import React from "react";
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
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Link,
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
  { name: "ID", uid: "idPermiso" },
  { name: "Nombre", uid: "nombre" },
  { name: "Descripción", uid: "descripcion" },
];

//Molde con el que procesaremos los datos. ES DIFERENTE a como el json trae los datos
interface Permiso {
  idPermiso: string;
  nombre: string;
  descripcion: string;
}

export default function CrearRolPage() {
  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Roles") == false) {
        window.location.href = "../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Roles"));
    }
  }, []);
  const [permisos, setPermisos] = React.useState<Permiso[]>([]); // Hook permisos procesados
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
    getWithAuth("http://10.170.83.243:8080/configuracion/permisos")
      .then((response) => response.json())
      .then((data) => {
        // Procesar los datos para que coincidan con la estructura de columnas
        const processedData: Permiso[] = data.map(
          (item: { idPermiso: any; nombre: any; descripcion: any }) => ({
            idPermiso: item.idPermiso,
            nombre: item.nombre,
            descripcion: item.descripcion,
          })
        );
        setPermisos(processedData);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, []);

  // CONFIGURACION DE PAGINACION Y BUSQUEDA(FILTRO)
  // CONFIGURACION DE PAGINACION Y BUSQUEDA(FILTRO)
  const rowsPerPage = 6; //Numero de registros por pagina
  // Filtra segun el value del hook de buscar
  const permisosFiltrados = React.useMemo(() => {
    return permisos.filter(
      (permiso) =>
        permiso.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permiso.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permiso.idPermiso.toString().includes(searchTerm.toLowerCase())
    );
  }, [permisos, searchTerm]);
  // Distribuye los registros segun los permisos filtrados (si no hay filtro muestra todos)
  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return permisosFiltrados.slice(start, end);
  }, [page, permisosFiltrados]);
  //FIN CONFIGURACION DE PAGINACION Y BUSQUEDA(FILTRO)
  //FIN CONFIGURACION DE PAGINACION Y BUSQUEDA(FILTRO)

  //FORMULARIO
  //FORMULARIO
  const [nombreRol, setNombreRol] = React.useState(""); //Hook nombre
  const [selectedKeys, setSelectedKeys] = React.useState<string[]>([]);
  const [mensajeError, setMensajeError] = React.useState(""); //Mensaje de error
  //Metodo para guardar y validar registro
  const [creandoRol, setCreandoRol] = React.useState(false);
  const guardarRol = async () => {
    setCreandoRol(true);
    const errorNombre = validarCampoString(nombreRol, "Nombre de rol");

    let arrayfinal;
    if (errorNombre != "") {
      setMensajeError(errorNombre);
      onOpenError();
      setCreandoRol(false);
      return;
    }

    if (selectedKeys instanceof Set) {
      const arrayPermisos = Array.from(selectedKeys.values());
      if (arrayPermisos.length <= 0) {
        setMensajeError("Debe seleccionar al menos un permiso");
        onOpenError();
        setCreandoRol(false);
        return;
      }
      arrayfinal = arrayPermisos;
    } else {
      const allPermisos = permisos.map((permiso) => permiso.idPermiso);
      arrayfinal = allPermisos;
    }

    const data = {
      rol: {
        nombre: nombreRol,
        estado: "Activo",
      },
      permisosId: arrayfinal,
    };

    try {
      const response = await postWithAuth(
        "http://10.170.83.243:8080/configuracion/roles",
        data
      );

      if (!response.ok) {
        const errorResponse = await response.text();
        setMensajeError(errorResponse);
        setCreandoRol(false);
        onOpenError();
        throw new Error("Error al intentar guardar el rol");
      }
      //router.push("/admin/roles");
      window.location.href = "/admin/roles";
    } catch (error) {
      setCreandoRol(false);
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

  const errors = React.useMemo(() => {
    return {
      nombreRol: nombreRol !== "" && !validarNombre(nombreRol),
    };
  }, [nombreRol]);

  return (
    <>
      {acceso ? (
        <div>
          <h1 className={title()}>Crear Rol</h1>

          <Input
            isRequired
            type="text"
            label="Nombre"
            value={nombreRol}
            className="max-w-xs mt-4"
            isInvalid={errors.nombreRol}
            color={errors.nombreRol ? "danger" : "default"}
            errorMessage="El nombre debe tener al menos 5 caracteres, no puede contener números ni caracteres especiales"
            onValueChange={setNombreRol}
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
                placeholder="Buscar Permiso..."
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
                  total={Math.ceil(permisosFiltrados.length / rowsPerPage)}
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
              {(item: Permiso) => (
                <TableRow key={item.idPermiso}>
                  {(columnKey) => (
                    <TableCell>{getKeyValue(item, columnKey)}</TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex justify-end mt-4">
            <Link href="/admin/roles">
              <Button
                className="mr-2 bg-gradient-to-tr from-red-600 to-red-300"
                type="button"
              >
                Cancelar
              </Button>
            </Link>
            <Button
              isLoading={creandoRol ? true : false}
              className="bg-gradient-to-tr from-yellow-600 to-yellow-300"
              onPress={onOpen}
            >
              <PlusIcon />
              Crear Rol
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
                    <h1 className="text-3xl ">¿Desea crear el rol?</h1>
                    <p>
                      El rol no podrá eliminarse, pero si podrá desactivarse.
                    </p>
                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                      Cancelar
                    </Button>
                    <Button
                      color="warning"
                      variant="light"
                      onPress={onClose}
                      onClick={guardarRol}
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

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
  Link,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  CircularProgress,
} from "@nextui-org/react";
import { CircleHelp, CircleX, Ellipsis, Edit } from "lucide-react";
import {
  getWithAuth,
  postWithAuth,
  verificarAccesoPorPermiso,
} from "@/config/peticionesConfig";

const columns = [
  { name: "ID", uid: "idHorario" },
  { name: "Dia", uid: "numeroDia" },
  { name: "Inicio Jornada", uid: "inicioJornada" },
  { name: "Fin Jornada", uid: "finJornada" },
  { name: "Estado", uid: "estado" },
  { name: "Acciones", uid: "acciones" },
];

interface Horario {
  idHorario: string;
  numeroDia: string;
  inicioJornada: string;
  finJornada: string;
  estado: string;
}

export default function HorarioPage() {
  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Horario") == false) {
        window.location.href = "../../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Horario"));
    }
  }, []);
  const [horario, setHorario] = React.useState<Horario[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [selectedHorario, setSelectedHorario] = React.useState<Horario | null>(
    null
  );
  const [selectedEstado, setSelectedEstado] = React.useState("");
  const {
    isOpen: isOpenEstado,
    onOpen: onOpenEstado,
    onClose: onCloseEstado,
  } = useDisclosure();
  const {
    isOpen: isOpenError,
    onOpen: onOpenError,
    onClose: onCloseError,
  } = useDisclosure();
  const [mensajeError, setMensajeError] = React.useState("");

  const diasSemana = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  const getDiaNombre = (numeroDia: number) => {
    return diasSemana[numeroDia - 1];
  };

  React.useEffect(() => {
    getWithAuth("http://192.168.56.1:8080/horario")
      .then((response) => response.json())
      .then((data) => {
        const processedData = data.map(
          (item: {
            idHorario: any;
            numeroDia: any;
            inicioJornada: any;
            finJornada: any;
            estado: any;
          }) => ({
            idHorario: item.idHorario,
            numeroDia: getDiaNombre(item.numeroDia),
            inicioJornada: item.inicioJornada,
            finJornada: item.finJornada,
            estado: item.estado,
          })
        );
        setHorario(processedData);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, []);

  const rowsPerPage = 7;

  const horarioFiltrado = React.useMemo(() => {
    return horario.filter(
      (hora) =>
        hora.inicioJornada.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hora.estado.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hora.idHorario.toString().includes(searchTerm.toLowerCase()) ||
        hora.finJornada.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hora.numeroDia.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [horario, searchTerm]);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return horarioFiltrado.slice(start, end);
  }, [page, horarioFiltrado]);

  const handleChangeEstado = async () => {
    if (!selectedHorario) return;
    try {
      const response = await postWithAuth(
        `http://192.168.56.1:8080/horario/${selectedHorario.idHorario}/estado`,
        { estado: selectedEstado }
      );

      const data = await response.json();

      if (response.ok) {
        setHorario(
          horario.map((hora) =>
            hora.idHorario === selectedHorario.idHorario
              ? { ...hora, estado: selectedEstado }
              : hora
          )
        );
        onCloseEstado();
      } else {
        setMensajeError(
          data.message || "Error al cambiar el estado del horario"
        );
        onOpenError();
      }
    } catch (error) {
      setMensajeError("Error al enviar la solicitud");
      onOpenError();
    }
  };

  const openEstadoModal = (horario: Horario) => {
    setSelectedHorario(horario);
    setSelectedEstado(horario.estado === "Activo" ? "Desactivado" : "Activo");
    onOpenEstado();
  };

  return (
    <>
      {acceso ? (
        <div>
          <h1 className={title()}>Horario</h1>

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
                placeholder="Buscar..."
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <TableHeader columns={columns.filter((column) => column.uid)}>
              {(column) => (
                <TableColumn className="text-base" key={column.uid}>
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={items}>
              {items.map((item: Horario) => (
                <TableRow key={item.idHorario}>
                  {columns
                    .filter((column) => column.uid)
                    .map((column) => (
                      <TableCell key={column.uid}>
                        {column.uid === "estado" ? (
                          <Chip
                            onClick={() => openEstadoModal(item)}
                            variant="bordered"
                            className="transition-transform duration-100 ease-in-out cursor-pointer hover:scale-110"
                            color={
                              item.estado === "Activo" ? "success" : "danger"
                            }
                          >
                            {item.estado}
                          </Chip>
                        ) : column.uid === "acciones" ? (
                          <Dropdown>
                            <DropdownTrigger>
                              <Button
                                aria-label="Acciones"
                                className="bg-transparent"
                              >
                                <Ellipsis />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                              onAction={(action) => console.log(action)}
                            >
                              <DropdownItem
                                href={`/admin/agendamiento/horario/editar/${item.idHorario}`}
                              >
                                <Button className="w-full bg-transparent">
                                  <Edit />
                                  Editar Horario
                                </Button>
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        ) : (
                          item[column.uid as keyof Horario]
                        )}
                      </TableCell>
                    ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Modal isOpen={isOpenEstado} onClose={onCloseEstado}>
            <ModalContent>
              <ModalHeader className="flex flex-col items-center gap-1">
                <CircleHelp color="#fef08a" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className="text-3xl">
                  ¿Desea cambiar el estado del horario?
                </h1>
                <p>El estado se cambiará a {selectedEstado}.</p>
              </ModalBody>
              <ModalFooter>
                <Button color="default" onClick={onCloseEstado}>
                  Cancelar
                </Button>
                <Button color="warning" onClick={handleChangeEstado}>
                  Cambiar Estado
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Modal isOpen={isOpenError} onClose={onCloseError}>
            <ModalContent>
              <ModalHeader className="flex flex-col items-center gap-1">
                <CircleX color="red" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className="text-3xl">Error</h1>
                <p>{mensajeError}</p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" onClick={onCloseError}>
                  Cerrar
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </div>
      ) : (
        <CircularProgress color="warning" aria-label="Cargando..." />
      )}
    </>
  );
}

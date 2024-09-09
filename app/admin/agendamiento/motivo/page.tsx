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
  CircularProgress
} from "@nextui-org/react";
import { CircleX, Ellipsis, Edit, CircleHelp } from "lucide-react";
import { getWithAuth, postWithAuth, verificarAccesoPorPermiso } from "@/config/peticionesConfig";

const columns = [
  { name: "ID", uid: "idMotivo" },
  { name: "Motivo", uid: "motivo" },
  { name: "Estado", uid: "estado" },
  { name: "Acciones", uid: "acciones" }
];

interface Motivo {
    idMotivo: string;
    motivo: string;
    estado: string
}

export default function MotivoCancelacionPage() {
   //Valida permiso
   const [acceso, setAcceso] = React.useState<boolean>(false);
   React.useEffect(() => {
     if(typeof window !== "undefined"){
     if(verificarAccesoPorPermiso("Gestionar Agendamiento") == false){
       window.location.href = "../../../../acceso/noAcceso"
     }
     setAcceso(verificarAccesoPorPermiso("Gestionar Agendamiento"));
   }
   }, []);
  const [motivos, setMotivos] = React.useState<Motivo[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [selectedEstado, setSelectedEstado] = React.useState("");
  const [selectedMotivo, setSelectedMotivo] = React.useState<Motivo | null>(null);
  const { isOpen: isOpenEstado, onOpen: onOpenEstado, onClose: onCloseEstado } = useDisclosure();
  const { isOpen: isOpenError, onOpen: onOpenError, onClose: onCloseError } = useDisclosure();
  const [mensajeError, setMensajeError] = React.useState("");

  React.useEffect(() => {
    getWithAuth("http://localhost:8080/motivocancelacion")
        .then((response) => response.json())
        .then((data) => {
            setMotivos(data);
        })
        .catch((err) => {
            console.log(err.message);
        });
  }, []);

  const rowsPerPage = 6;

  const motivosFiltrados = React.useMemo(() => {
    return motivos.filter(
      (motivo) =>
        motivo.motivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        motivo.idMotivo.toString().includes(searchTerm.toLowerCase())
        
    );
  }, [motivos, searchTerm]);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return motivosFiltrados.slice(start, end);
  }, [page, motivosFiltrados]);

  const handleChangeEstado = async () => {
    if (!selectedMotivo) return;
    try {
      const updatedMotivo = { ...selectedMotivo, estado: selectedEstado };
      const response = await postWithAuth(`http://localhost:8080/motivocancelacion/${selectedMotivo.idMotivo}`, updatedMotivo);
      
      if (response.ok) {
        setMotivos(motivos.map(motivo => motivo.idMotivo === selectedMotivo.idMotivo ? updatedMotivo : motivo));
        setMensajeError("Exito");
        onCloseEstado();
      } else {
        setMensajeError("Error al cambiar el estado del motivo de cancelación");
        onOpenError();
      }
    } catch (error) {
      setMensajeError("Error al enviar la solicitud");
      onOpenError();
    }
  };

  const openEstadoModal = (motivo: Motivo) => {
    setSelectedMotivo(motivo);
    setSelectedEstado(motivo.estado === "Activo" ? "Desactivado" : "Activo");
    onOpenEstado();
  };

  return (
    <>
{acceso ? (
    <div>
        <h1 className={title()}>Motivos de Cancelación</h1>

        <div className="flex flex-col items-start sm:flex-row sm:items-center">
            <div className="rounded-lg p-0 my-4 basis-1/4 bg-gradient-to-tr from-yellow-600 to-yellow-300">
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

        <Table
          className="mb-8"
          isStriped
          bottomContent={
            <div className="flex w-full justify-center">
              <Pagination
                showControls
                color="warning"
                page={page}
                total={Math.ceil(motivosFiltrados.length / rowsPerPage)}
                onChange={(page) => setPage(page)}
              />
            </div>
          }
        >
          <TableHeader columns={columns.filter(column => column.uid)}>
            {(column) => (
              <TableColumn className="text-base" key={column.uid}>
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={items}>
            {items.map((item) => (
              <TableRow key={item.idMotivo}>
                {columns.filter(column => column.uid).map((column) => (
                  <TableCell key={column.uid}>
                    {column.uid === "estado" ? (
                      <Chip
                        onClick={() => openEstadoModal(item)}
                        variant="bordered"
                        className="hover:scale-110 cursor-pointer transition-transform duration-100 ease-in-out"
                        color={item.estado === "Activo" ? "success" : "danger"}
                      >
                        {item.estado}
                      </Chip>
                    ) : (
                      column.uid === "acciones" ? (
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
                            <DropdownItem href={`/admin/agendamiento/motivo/editar/${item.idMotivo}`}>
                              <Button className="bg-transparent w-full">
                                <Edit />
                                Editar Motivo
                              </Button>
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      ) : (
                        item[column.uid as keyof Motivo]
                      )
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Modal isOpen={isOpenError} onClose={onCloseError}>
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1 items-center">
                    <CircleX color="red" size={100} />
                </ModalHeader>
                <ModalBody className="text-center">
                    <h1 className="text-3xl">Error</h1>
                    <p>{mensajeError}</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={onCloseError}>Cerrar</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>

        <Modal isOpen={isOpenEstado} onClose={onCloseEstado}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 items-center">
            <CircleHelp color="#fef08a" size={100} />
          </ModalHeader>
          <ModalBody className="text-center">
            <h1 className="text-3xl">¿Desea cambiar el estado del motivo?</h1>
            <p>El estado se cambiará a {selectedEstado}.</p>
          </ModalBody>
          <ModalFooter>
            <Button color="default" onClick={onCloseEstado}>Cancelar</Button>
            <Button color="warning" onClick={handleChangeEstado}>Cambiar Estado</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
     ) :(
      <CircularProgress color="warning" aria-label="Cargando..." />
    )}
</>
  );
}

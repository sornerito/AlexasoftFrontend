"use client";
import { title } from "@/components/primitives";
import React, { useEffect, useState } from "react";
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
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Link,
  CircularProgress,
} from "@nextui-org/react";
import { PlusIcon, Ellipsis, Info } from "lucide-react";
import {
  getWithAuth,
  verificarAccesoPorPermiso,
} from "@/config/peticionesConfig";

const columns = [
  { name: "Cliente", uid: "idCliente" },
  { name: "Colaborador", uid: "idColaborador" },
  { name: "Fecha", uid: "fecha" },
  { name: "Estado", uid: "estado" },
  { name: "Ver detalles", uid: "detalles" },
];

interface Cita {
  idCita: string;
  fecha: string;
  hora: string;
  detalle: string | null;
  estado: string;
  idMotivo: number | null;
  idCliente: number;
  idPaquete: number;
  idColaborador: number;
}

export default function CitasPage() {
  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Cita") == false) {
        window.location.href = "../../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Cita"));
    }
  }, []);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [clientes, setClientes] = useState<{ [key: number]: string }>({});
  const [paquetes, setPaquetes] = useState<{ [key: number]: string }>({});
  const [colaboradores, setColaboradores] = useState<{ [key: number]: string }>(
    {}
  );
  const [motivos, setMotivos] = useState<{ [key: number]: string }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const {
    isOpen: isOpenError,
    onOpen: onOpenError,
    onClose: onCloseError,
  } = useDisclosure();
  const [mensajeError, setMensajeError] = useState("");
  const {
    isOpen: isOpenDetails,
    onOpen: onOpenDetails,
    onClose: onCloseDetails,
  } = useDisclosure();

  useEffect(() => {
    const idUsuario =
      typeof window !== "undefined"
        ? sessionStorage.getItem("idUsuario")
        : null;
    console.log(idUsuario);

    if (idUsuario) {
      getWithAuth(`http://10.170.83.243:8080/cita/cliente/${idUsuario}`)
        .then((response) => response.json())
        .then((data) => {
          // Filtrar solo las citas con estado 'aceptado' o 'En_espera'
          const citasFiltradas = data.filter(
            (item: Cita) =>
              item.estado === "Aceptado" ||
              item.estado === "En_espera" ||
              item.estado === "Finalizado"
          );

          const processedData = citasFiltradas.map((item: Cita) => ({
            ...item,
            fecha: new Date(item.fecha).toISOString().split("T")[0], // Formatear fecha a YYYY-MM-DD
          }));

          setCitas(processedData);
        })
        .catch((err) => {
          console.log(err.message);
        });
    } else {
      console.log("No se encontró el ID del usuario en sessionStorage.");
    }
  }, []);

  useEffect(() => {
    const fetchClientes = async () => {
      const ids = Array.from(new Set(citas.map((cita) => cita.idCliente)));
      const fetchedClientes: { [key: number]: string } = {};
      for (const id of ids) {
        const response = await getWithAuth(
          `http://10.170.83.243:8080/cliente/${id}`
        );
        const data = await response.json();
        fetchedClientes[id] = data.nombre;
      }
      setClientes(fetchedClientes);
    };

    const fetchPaquetes = async () => {
      const ids = Array.from(new Set(citas.map((cita) => cita.idPaquete)));
      const fetchedPaquetes: { [key: number]: string } = {};
      for (const id of ids) {
        const response = await getWithAuth(
          `http://10.170.83.243:8080/servicio/paquete/${id}`
        );
        const data = await response.json();
        if (data && data.paquete) {
          fetchedPaquetes[id] = data.paquete.nombre;
        }
      }
      setPaquetes(fetchedPaquetes);
    };

    const fetchColaboradores = async () => {
      const ids = Array.from(new Set(citas.map((cita) => cita.idColaborador)));
      const fetchedColaboradores: { [key: number]: string } = {};
      for (const id of ids) {
        const response = await getWithAuth(
          `http://10.170.83.243:8080/colaborador/${id}`
        );
        const data = await response.json();
        fetchedColaboradores[id] = data.nombre;
      }
      setColaboradores(fetchedColaboradores);
    };

    const fetchMotivos = async () => {
      const response = await getWithAuth(
        `http://10.170.83.243:8080/motivocancelacion`
      );
      const data = await response.json();
      const fetchedMotivos: { [key: number]: string } = {};
      data.forEach((motivo: { idMotivo: number; motivo: string }) => {
        fetchedMotivos[motivo.idMotivo] = motivo.motivo;
      });
      setMotivos(fetchedMotivos);
    };

    fetchClientes();
    fetchPaquetes();
    fetchColaboradores();
    fetchMotivos();
  }, [citas]);

  const rowsPerPage = 6;

  const citasFiltradas = React.useMemo(() => {
    return citas.filter(
      (cita) =>
        cita.fecha.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cita.hora.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cita.detalle &&
          cita.detalle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        cita.estado.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cita.idCita.toString().includes(searchTerm.toLowerCase()) ||
        (cita.idMotivo &&
          cita.idMotivo.toString().includes(searchTerm.toLowerCase())) ||
        clientes[cita.idCliente]
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        paquetes[cita.idPaquete]
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        colaboradores[cita.idColaborador]
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
  }, [citas, searchTerm, clientes, paquetes, colaboradores]);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return citasFiltradas.slice(start, end);
  }, [page, citasFiltradas]);

  const handleShowDetails = (cita: Cita) => {
    setSelectedCita(cita);
    onOpenDetails(); // Abre el modal de detalles
  };

  return (
    <>
      {acceso ? (
        <div>
          <h1 className={title()}>Mis Citas</h1>

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
            <div className="basis-1/2"></div>
            <div className="mb-4 basis-1/4 sm:my-4 text-end">
              <Link href="/cliente/crear">
                <Button
                  className="ml-2 bg-gradient-to-tr from-red-600 to-orange-300"
                  aria-label="Crear Cita"
                >
                  <PlusIcon />
                  Crear Cita
                </Button>
              </Link>
            </div>
          </div>
          <Table
            className="mb-8"
            isStriped
            bottomContent={
              <div className="flex justify-center w-full">
                <Pagination
                  showControls
                  color="warning"
                  page={page}
                  total={Math.ceil(citasFiltradas.length / rowsPerPage)}
                  onChange={(page) => setPage(page)}
                />
              </div>
            }
          >
            <TableHeader>
              {columns.map((column) => (
                <TableColumn key={column.uid}>{column.name}</TableColumn>
              ))}
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.idCita}>
                  {columns.map((column) => (
                    <TableCell key={column.uid}>
                      {column.uid === "estado" ? (
                        item.estado === "En_espera" ? (
                          "En espera"
                        ) : (
                          item.estado
                        )
                      ) : column.uid === "detalles" ? (
                        <Button
                          className="bg-transparent"
                          onClick={() => handleShowDetails(item)}
                        >
                          <Info className="mr-2" />
                          Detalles
                        </Button>
                      ) : column.uid === "idMotivo" ? (
                        item.idMotivo !== null ? (
                          motivos[item.idMotivo]
                        ) : (
                          "N/A"
                        )
                      ) : column.uid === "idCliente" ? (
                        clientes[item.idCliente] || item.idCliente.toString()
                      ) : column.uid === "idPaquete" ? (
                        paquetes[item.idPaquete] || item.idPaquete.toString()
                      ) : column.uid === "idColaborador" ? (
                        colaboradores[item.idColaborador] ||
                        "Colaborador no disponible"
                      ) : column.uid === "fecha" ? (
                        new Date(item.fecha).toISOString().split("T")[0]
                      ) : (
                        item[column.uid as keyof Cita]?.toString()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Modal de detalles */}
          <Modal isOpen={isOpenDetails} onClose={onCloseDetails}>
            <ModalContent>
              <ModalHeader>Detalles de la Cita</ModalHeader>
              <ModalBody>
                {selectedCita && (
                  <div>
                    <p>
                      <strong>Cliente:</strong>{" "}
                      {clientes[selectedCita.idCliente]}
                    </p>
                    <p>
                      <strong>Colaborador:</strong>{" "}
                      {colaboradores[selectedCita.idColaborador]}
                    </p>
                    <p>
                      <strong>Fecha:</strong> {selectedCita.fecha}
                    </p>
                    <p>
                      <strong>Hora:</strong> {selectedCita.hora}
                    </p>
                    <p>
                      <strong>Paquete:</strong>{" "}
                      {paquetes[selectedCita.idPaquete]}
                    </p>
                    <p>
                      <strong>Detalle:</strong> {selectedCita.detalle || "N/A"}
                    </p>
                    <p>
                      <strong>Estado:</strong> {selectedCita.estado}
                    </p>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button onClick={onCloseDetails}>Cerrar</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* Modal de error */}
          <Modal isOpen={isOpenError} onClose={onCloseError}>
            <ModalContent>
              <ModalHeader>Error</ModalHeader>
              <ModalBody>
                <p>{mensajeError}</p>
              </ModalBody>
              <ModalFooter>
                <Button onClick={onCloseError}>Cerrar</Button>
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

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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Link,
  CircularProgress,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { PlusIcon, Info, FileBarChart2 } from "lucide-react";
import {
  getWithAuth,
  postWithAuth,
  verificarAccesoPorPermiso,
} from "@/config/peticionesConfig";

const columns = [
  { name: "ID", uid: "idCita" },
  { name: "Cliente", uid: "idCliente" },
  { name: "Colaborador", uid: "idColaborador" },
  { name: "Fecha", uid: "fecha" },
  { name: "Estado", uid: "estado" },
  { name: "Motivo", uid: "idMotivo" },
  { name: "Acciones", uid: "acciones" },
];

const diasSemana: { [key: number]: string } = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

interface Cita {
  idCita: string;
  fecha: string;
  hora: string;
  detalle: string | null;
  estado: string;
  idMotivo: number | null;
  idCliente: number;
  idPaquete: number;
  idHorario: number;
  idColaborador: number;
}

interface Paquete {
  idPaquete: number;
  nombre: string;
  estado: string;
  tiempoTotalServicio: number;
}

const estadoColors: { [key: string]: string } = {
  En_espera: "yellow",
  Aceptado: "green",
  Cancelado: "red",
  Finalizado: "blue",
};

export default function CitasPage() {
  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Agendamiento") == false) {
        window.location.href = "../../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Agendamiento"));
    }
  }, []);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [clientes, setClientes] = useState<{ [key: number]: string }>({});
  const [paquetes, setPaquetes] = useState<{ [key: number]: Paquete }>({});
  const [colaboradores, setColaboradores] = useState<{ [key: number]: string }>(
    {}
  );
  const [motivos, setMotivos] = useState<{ [key: number]: string }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState("");
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
  const [mensajeError, setMensajeError] = useState("");
  const {
    isOpen: isOpenDetails,
    onOpen: onOpenDetails,
    onClose: onCloseDetails,
  } = useDisclosure();

  useEffect(() => {
    getWithAuth("http://localhost:8080/cita")
      .then((response) => response.json())
      .then((data) => {
        const processedData = data.map((item: Cita) => ({
          ...item,
          fecha: new Date(item.fecha).toISOString().split("T")[0], // Formatear fecha a YYYY-MM-DD
        }));
        setCitas(processedData);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, []);

  useEffect(() => {
    const fetchClientes = async () => {
      const ids = Array.from(new Set(citas.map((cita) => cita.idCliente)));
      const fetchedClientes: { [key: number]: string } = {};
      for (const id of ids) {
        const response = await getWithAuth(
          `http://localhost:8080/cliente/${id}`
        );
        const data = await response.json();
        fetchedClientes[id] = data.nombre;
      }
      setClientes(fetchedClientes);
    };

    const fetchPaquetes = async () => {
      const ids = Array.from(new Set(citas.map((cita) => cita.idPaquete)));
      const fetchedPaquetes: { [key: number]: Paquete } = {};
      for (const id of ids) {
        const response = await getWithAuth(
          `http://localhost:8080/servicio/paquete/${id}`
        );
        const data = await response.json();
        const { idPaquete, nombre, estado, tiempoTotalServicio } = data.paquete;
        fetchedPaquetes[idPaquete] = {
          idPaquete,
          nombre,
          estado,
          tiempoTotalServicio,
        };
      }
      setPaquetes(fetchedPaquetes);
    };

    const fetchColaboradores = async () => {
      const ids = Array.from(new Set(citas.map((cita) => cita.idColaborador)));
      const fetchedColaboradores: { [key: number]: string } = {};
      for (const id of ids) {
        const response = await getWithAuth(
          `http://localhost:8080/colaborador/${id}`
        );
        const data = await response.json();
        fetchedColaboradores[id] = data.nombre;
      }
      setColaboradores(fetchedColaboradores);
    };

    const fetchMotivos = async () => {
      const response = await getWithAuth(
        `http://localhost:8080/motivocancelacion`
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
        paquetes[cita.idPaquete].nombre
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        diasSemana[cita.idHorario]
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

  const handleChangeEstado = async () => {
    if (!selectedCita || !nuevoEstado) return;

    try {
      const response = await postWithAuth(
        `http://localhost:8080/cita/${selectedCita.idCita}/estado`,
        {
          estado: nuevoEstado,
          citasCancelar: idsCitasConflicto
        }
      );

      if (response.ok) {
        const updatedCita = await response.json();
        console.log("Cita después de cambiar estado:", updatedCita);

        // Actualiza solo el estado en el estado local
        setCitas(
          citas.map((cita) =>
            cita.idCita === selectedCita.idCita
              ? { ...cita, estado: nuevoEstado }
              : idsCitasConflicto.includes(Number(cita.idCita)) ? { ...cita, estado: "Cancelado" }
              : cita
          )
        );
        onCloseEstado();
      } else {
        setMensajeError("Error al cambiar el estado de la cita");
        onOpenError();
      }
    } catch (error) {
      setMensajeError("Error al enviar la solicitud");
      onOpenError();
    }
  };

  const [citasConConflicto, setCitasConConflicto] = useState<Cita[]>([]);
  const [idsCitasConflicto, setIdsCitasConflicto] = useState<number[]>([]);
  const handleEstadoSelect = (
    cita: Cita,
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const estadoSeleccionado = e.target.value;
    setSelectedCita(cita);
    setNuevoEstado(estadoSeleccionado);
    setCitasConConflicto(obtenerCitasEnConflicto());
    setIdsCitasConflicto(citasConConflicto.map((cita) => Number(cita.idCita)));
    onOpenEstado();
  };

  const handleShowDetails = (cita: Cita) => {
    setSelectedCita(cita);
    onOpenDetails();
  };

  const obtenerCitasEnConflicto = () => {
    return citas.filter(
      (c) =>
        c.estado === "En_espera" &&
        c.idCita != selectedCita?.idCita &&
        c.fecha === selectedCita?.fecha &&
        c.idColaborador === selectedCita.idColaborador && 
        (
        c.hora <
          calcularHoraFin(
            selectedCita.hora,
            paquetes[selectedCita.idPaquete].tiempoTotalServicio
          ) &&
        calcularHoraFin(c.hora, paquetes[c.idPaquete].tiempoTotalServicio) >
          selectedCita.hora 
        )
    );
  };

  const calcularHoraFin = (
    hora: string,
    tiempoTotalServicio: number
  ): string => {
    const [hours, minutes] = hora.split(":").map(Number);
    const fecha = new Date();
    fecha.setHours(hours);
    fecha.setMinutes(minutes);
    fecha.setMinutes(fecha.getMinutes() + tiempoTotalServicio);
    const horaFin = fecha.getHours().toString().padStart(2, "0");
    const minutosFin = fecha.getMinutes().toString().padStart(2, "0");
    return `${horaFin}:${minutosFin}`;
  };

  return (
    <>
      {acceso ? (
        <div>
          <h1 className={title()}>Citas</h1>

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
              <Button
                isIconOnly
                className="bg-gradient-to-tr from-red-600 to-red-100"
                aria-label="Crear Reporte"
              >
                <FileBarChart2 />
              </Button>
              <Link href="/admin/agendamiento/citas/crear">
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
                        <Select
                          value={item.estado}
                          variant="bordered"
                          placeholder={item.estado}
                          onChange={(e) => handleEstadoSelect(item, e)}
                          className="hover:scale-105 focus:outline-none"
                          style={{
                            backgroundColor: "transparent",
                            color: "white",
                            border: "2px solid",
                            borderColor: estadoColors[item.estado],
                            borderRadius: "9999px",
                            padding: "0.5rem 1rem",
                            cursor: "pointer",
                            transition: "transform 0.1s ease-in-out",
                          }}
                        >
                          <SelectItem
                            key="En_espera"
                            value="En_espera"
                            style={{
                              backgroundColor: "transparent",
                              color: "white",
                              border: "2px solid",
                              borderColor: estadoColors["En_espera"],
                              borderRadius: "9999px",
                            }}
                          >
                            En espera
                          </SelectItem>
                          <SelectItem
                            key="Aceptado"
                            value="Aceptado"
                            style={{
                              backgroundColor: "transparent",
                              color: "white",
                              border: "2px solid",
                              borderColor: estadoColors["Aceptado"],
                              borderRadius: "9999px",
                            }}
                          >
                            Aceptado
                          </SelectItem>
                          <SelectItem
                            key="Cancelado"
                            value="Cancelado"
                            style={{
                              backgroundColor: "transparent",
                              color: "white",
                              border: "2px solid",
                              borderColor: estadoColors["Cancelado"],
                              borderRadius: "9999px",
                            }}
                          >
                            Cancelado
                          </SelectItem>
                          <SelectItem
                            key="Finalizado"
                            value="Finalizado"
                            style={{
                              backgroundColor: "transparent",
                              color: "white",
                              border: "2px solid",
                              borderColor: estadoColors["Finalizado"],
                              borderRadius: "9999px",
                            }}
                          >
                            Finalizado
                          </SelectItem>
                        </Select>
                      ) : column.uid === "acciones" ? (
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
                        paquetes[item.idPaquete]?.nombre ||
                        item.idPaquete.toString()
                      ) : column.uid === "idHorario" ? (
                        diasSemana[item.idHorario] || "Día no disponible"
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
                      <strong>ID de Cita:</strong> {selectedCita.idCita}
                    </p>
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
                      {paquetes[selectedCita.idPaquete]?.nombre}
                    </p>
                    <p>
                      <strong>Detalle:</strong> {selectedCita.detalle || "N/A"}
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

          {/* Modal de cambio de estado */}
          <Modal
            scrollBehavior="inside"
            size="5xl"
            isOpen={isOpenEstado}
            onClose={onCloseEstado}
          >
            <ModalContent>
              <ModalHeader>Cambiar Estado de Cita</ModalHeader>
              <ModalBody>
                {citasConConflicto.length > 0 ? (
                  <ul>
                    {citasConConflicto.map((cita) => (
                      <li key={cita.idCita}>
                        Cliente: {cita.idCliente}, Fecha:
                        {new Date(cita.fecha).toLocaleDateString()}, Hora:
                        {cita.hora}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Ninguna cita tiene conflicto</p>
                )}
                <p>
                  ¿Está seguro de que desea cambiar el estado de esta cita a 
                  <strong>{nuevoEstado}</strong>?
                </p>
              </ModalBody>
              <ModalFooter>
                <Button onClick={onCloseEstado}>Cancelar</Button>
                <Button onClick={handleChangeEstado}>Confirmar</Button>
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

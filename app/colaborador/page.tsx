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
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    CircularProgress,
} from "@nextui-org/react";
import { getWithAuth, verificarAccesoPorPermiso } from "@/config/peticionesConfig";
import { Eye } from "lucide-react";

const columns = [
    { name: "Día", uid: "numeroDia" },
    { name: "Inicio Jornada", uid: "inicioJornada" },
    { name: "Fin Jornada", uid: "finJornada" },
    { name: "Estado", uid: "estado" },
    { name: "Ver Citas", uid: "acciones" },
];

interface Horario {
    idHorario: string;
    numeroDia: string;
    inicioJornada: string;
    finJornada: string;
    estado: string;
}

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

// Mapa para los días de la semana
const diasSemana: { [key: number]: string } = {
    1: "Lunes",
    2: "Martes",
    3: "Miércoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sábado",
    7: "Domingo",
};

export default function HorarioPage() {
    const [clientes, setClientes] = useState<{ [key: number]: string }>({});
    const [paquetes, setPaquetes] = useState<{ [key: number]: string }>({});
    const [colaboradores, setColaboradores] = useState<{ [key: number]: string }>({});
    const [motivos, setMotivos] = useState<{ [key: number]: string }>({});
    const [acceso, setAcceso] = useState<boolean>(false);
    const [horario, setHorario] = useState<Horario[]>([]);
    const [citas, setCitas] = useState<Cita[]>([]);
    const [selectedCitas, setSelectedCitas] = useState<Cita[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (!verificarAccesoPorPermiso("Gestionar C Horario")) {
            window.location.href = "../../../../acceso/noAcceso";
        } else {
            setAcceso(true);
        }
    }, []);

    useEffect(() => {
        getWithAuth("http://localhost:8080/horario")
            .then((response) => response.json())
            .then((data) => {
                const processedData = data.map((item: Horario) => ({
                    ...item,
                }));
                setHorario(processedData);
            })
            .catch((err) => {
                console.log(err.message);
            });
    }, []);

    useEffect(() => {
        const idUsuario = typeof window !== "undefined" ? sessionStorage.getItem("idUsuario") : null;
        console.log(idUsuario)
      
        if (idUsuario) {
          getWithAuth(`http://localhost:8080/cita/colaborador/${idUsuario}`)
            .then((response) => response.json())
            .then((data) => {
              const processedData = data.map((item: Cita) => ({
                ...item,
                fecha: new Date(item.fecha).toISOString().split('T')[0], // Formatear fecha a YYYY-MM-DD
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
                const response = await getWithAuth(`http://localhost:8080/cliente/${id}`);
                const data = await response.json();
                fetchedClientes[id] = data.nombre;
            }
            setClientes(fetchedClientes);
        };

        const fetchPaquetes = async () => {
            const ids = Array.from(new Set(citas.map((cita) => cita.idPaquete)));
            const fetchedPaquetes: { [key: number]: string } = {};
            for (const id of ids) {
                const response = await getWithAuth(`http://localhost:8080/servicio/paquete/${id}`);
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
                const response = await getWithAuth(`http://localhost:8080/colaborador/${id}`);
                const data = await response.json();
                fetchedColaboradores[id] = data.nombre;
            }
            setColaboradores(fetchedColaboradores);
        };

        const fetchMotivos = async () => {
            const response = await getWithAuth(`http://localhost:8080/motivocancelacion`);
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

    const getCitasForDia = (numeroDia: number) => {
        return citas.filter((cita) => {
            const fecha = new Date(cita.fecha);
            let diaSemana = fecha.getDay() + 1; // 0 = Domingo, 1 = Lunes, etc.

            // Ajustar el formato del día de la semana para que coincida con 1 = Lunes, ..., 7 = Domingo
            diaSemana = (diaSemana === 0 ? 7 : diaSemana); // Convertir Domingo (0) a 7

            return diaSemana === numeroDia;
        });
    };

    const handleShowCitas = (numeroDia: number) => {
        const citasForDia = getCitasForDia(numeroDia);
        setSelectedCitas(citasForDia);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            {acceso ? (
                <div>
                    <h1 className={title()}>Horario</h1>

                    <Table>
                        <TableHeader columns={columns}>
                            {(column) => (
                                <TableColumn key={column.uid}>
                                    {column.name}
                                </TableColumn>
                            )}
                        </TableHeader>
                        <TableBody items={horario}>
                            {(item: Horario) => (
                                <TableRow key={item.idHorario}>
                                    {(columnKey) => (
                                        <TableCell>
                                            {columnKey === "numeroDia" ? (
                                                diasSemana[parseInt(item.numeroDia) as keyof typeof diasSemana] || "Desconocido"
                                            ) : columnKey === "acciones" ? (

                                                <Button
                                                    onClick={() => handleShowCitas(parseInt(item.numeroDia))}
                                                >
                                                    <Eye className="mr-2"/>
                                                </Button>
                                            ) : (
                                                item[columnKey as keyof Horario]
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <Modal isOpen={isModalOpen} onClose={closeModal}>
                        <ModalContent>
                            <ModalHeader>Citas para el día seleccionado</ModalHeader>
                            <ModalBody>
                                {selectedCitas.length > 0 ? (
                                    selectedCitas.map((cita) => (
                                        <div key={cita.idCita}>
                                            <p><strong>Fecha:</strong> {cita.fecha}</p>
                                            <p><strong>Hora:</strong> {cita.hora}</p>
                                            <p><strong>Cliente:</strong> {clientes[cita.idCliente]}</p>
                                            <p><strong>Paquete:</strong> {paquetes[cita.idPaquete]}</p>
                                            <p><strong>Detalle:</strong> {cita.detalle || "N/A"}</p>
                                            <p><strong>Motivo:</strong> {cita.idMotivo !== null ? motivos[cita.idMotivo] : "N/A"}</p>
                                            <p><strong>Estado:</strong> {cita.estado}</p>
                                            <hr />
                                        </div>
                                    ))
                                ) : (
                                    <p>No hay citas para este día.</p>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button onClick={closeModal}>Cerrar</Button>
                            </ModalFooter>
                        </ModalContent>
                    </Modal>
                </div>
            ) : (
                <CircularProgress />
            )}
        </>
    );
}

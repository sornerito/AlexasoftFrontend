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
    Input,
    CircularProgress
} from "@nextui-org/react";
import { getWithAuth, verificarAccesoPorPermiso } from "@/config/peticionesConfig";

const columns = [
    { name: "Dia", uid: "numeroDia" },
    { name: "Inicio Jornada", uid: "inicioJornada" },
    { name: "Fin Jornada", uid: "finJornada" },
    { name: "Estado", uid: "estado" }
];

interface Horario {
    idHorario: string;
    numeroDia: string;
    inicioJornada: string;
    finJornada: string;
    estado: string
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
    idHorario: number;
    idColaborador: number;
  }

const idUsuario = typeof window !== "undefined" ? sessionStorage.getItem("idUsuario") : null;

export default function HorarioPage() {
    //Valida permiso
    const [acceso, setAcceso] = React.useState<boolean>(false);
    React.useEffect(() => {
        if (typeof window !== "undefined") {
            if (verificarAccesoPorPermiso("Gestionar Colaborador Horario") == false) {
                window.location.href = "../../../../acceso/noAcceso"
            }
            setAcceso(verificarAccesoPorPermiso("Gestionar Colaborador Horario"));
        }
    }, []);

    const [horario, setHorario] = React.useState<Horario[]>([]);
    const [citas, setCitas] = useState<Cita[]>([]);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [page] = React.useState(1);


    const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

    const getDiaNombre = (numeroDia: number) => {
        return diasSemana[numeroDia - 1];
    };

    React.useEffect(() => {
        getWithAuth("http://localhost:8080/horario")
            .then((response) => response.json())
            .then((data) => {
                const processedData = data.map((item: { idHorario: any; numeroDia: any; inicioJornada: any; finJornada: any; estado: any; }) => ({
                    idHorario: item.idHorario,
                    numeroDia: getDiaNombre(item.numeroDia),
                    inicioJornada: item.inicioJornada,
                    finJornada: item.finJornada,
                    estado: item.estado,
                }));
                setHorario(processedData);
            })
            .catch((err) => {
                console.log(err.message);
            });
    }, []);

    React.useEffect(() => {
        getWithAuth("http://localhost:8080/cita")
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

    return (
        <>
            {acceso ? (
                <div>
                    <h1 className={title()}>Horario</h1>

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

                    <Table>
                        <TableHeader columns={columns.filter(column => column.uid)}>
                            {(column) => (
                                <TableColumn className="text-base" key={column.uid}>
                                    {column.name}
                                </TableColumn>
                            )}
                        </TableHeader>
                        <TableBody items={items}>
                            {items.map((item: Horario) => (
                                <TableRow key={item.idHorario}>
                                    {columns.filter(column => column.uid).map((column) => (
                                        <TableCell key={column.uid}>
                                            {column.uid === "estado" ? (
                                                <span
                                                    className={`hover:scale-110 cursor-pointer transition-transform duration-100 ease-in-out ${item.estado === "Activo" ? "text-success" : "text-danger"}`}
                                                >
                                                    {item.estado}
                                                </span>
                                            ) :  (
                                                    item[column.uid as keyof Horario]
                                                )
                                            }
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <CircularProgress color="warning" aria-label="Cargando..." />
            )}
        </>
    );
}

//INSERT INTO `permisos` (`idPermiso`, `nombre`, `descripcion`) VALUES (NULL, 'Gestionar Horario C', 'El colaborador tendrá acceso a la vista del horario y las citas asignadas a su nombre');

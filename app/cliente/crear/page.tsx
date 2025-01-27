"use client";
import { useState, useEffect } from "react";
import {
  Input,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  CircularProgress,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { PlusIcon, CircleCheck, CircleX, CircleHelp } from "lucide-react";
import {
  getWithAuth,
  postWithAuth,
  verificarAccesoPorPermiso,
} from "@/config/peticionesConfig";
import { title } from "@/components/primitives";

interface Colaborador {
  idColaborador: number;
  nombre: string;
  estado: string;
}

interface Cita {
  idCliente: number;
  idColaborador: number;
  idPaquete: number;
  fecha: string;
  hora: string;
  detalle: string | null;
  estado: string;
}

interface Horario {
  idHorario: string;
  numeroDia: string;
  inicioJornada: string;
  finJornada: string;
  estado: string;
}

interface Paquete {
  nombrePaquete: string;
  idPaquete: number;
  estado: string;
  tiempoTotalServicio: number;
  servicios: string[];
}


export default function CrearCitaPage() {
  const idUsuario =
    typeof window !== "undefined" ? sessionStorage.getItem("idUsuario") : null;
  const idCliente = idUsuario !== null ? Number(idUsuario) : 0;
  const [acceso, setAcceso] = useState<boolean>(false);
  const [formData, setFormData] = useState<Cita>({
    idCliente: idCliente,
    idColaborador: 0,
    idPaquete: 0,
    fecha: "",
    hora: "",
    detalle: "",
    estado: "En_espera",
  });
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [colaboradorSeleccionado, setColaboradorSeleccionado] = useState<number | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [servicios, setServicios] = useState<string[]>([]);
  const [mensajeError, setMensajeError] = useState("");
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  const [minHora, setMinHora] = useState("");
  const [maxHora, setMaxHora] = useState("");
  const [opcionesHoras, setOpcionesHoras] = useState<string[]>([]);
  const [horasOcupadas, setHorasOcupadas] = useState<{ [key: number]: { [key: string]: string[] } }>({});

  const {
    isOpen: isOpenSuccess,
    onOpen: onOpenSuccess,
    onClose: onCloseSuccess,
  } = useDisclosure();
  const {
    isOpen: isOpenError,
    onOpen: onOpenError,
    onClose: onCloseError,
  } = useDisclosure();
  const {
    isOpen: isOpenConfirm,
    onOpen: onOpenConfirm,
    onClose: onCloseConfirm,
  } = useDisclosure();

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Cita") === false) {
        window.location.href = "../../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Cita"));
    }
  }, []);

  useEffect(() => {
    getWithAuth("http://localhost:8080/colaborador")
      .then((response) => response.json())
      .then((data) => setColaboradores(data))
      .catch((err) => console.log(err.message));

    getWithAuth("http://localhost:8080/cita")
      .then((response) => response.json())
      .then((data) => {
        const citasAceptadas = data.filter((cita: Cita) => cita.estado === 'Aceptado');

        const horasPorColaboradorYFecha = citasAceptadas.reduce((acc: any, cita: Cita) => {
          const idColaborador = cita.idColaborador;
          const fecha = cita.fecha; // Suponiendo que es una cadena en formato 'YYYY-MM-DD'
          const hora = convertToHourMinute(cita.hora);
        
          // Asegurarse de que exista el colaborador
          if (!acc[idColaborador]) {
            acc[idColaborador] = {};
          }
        
          // Asegurarse de que exista la fecha para el colaborador
          if (!acc[idColaborador][fecha]) {
            acc[idColaborador][fecha] = [];
          }
        
          // Agregar la hora ocupada
          acc[idColaborador][fecha].push(hora);
        
          return acc;
        }, {} as { [key: number]: { [key: string]: string[] } });
        
        setHorasOcupadas(horasPorColaboradorYFecha);
        
      })
      .catch((err) => console.log(err.message));

    getWithAuth("http://localhost:8080/servicio/paquetes")
      .then((response) => response.json())
      .then((data) => {
        const paquetesActivos = data
          .filter((item: { paquete: { estado: string } }) => item.paquete.estado === "Activo")
          .map((item: { paquete: { idPaquete: number; nombre: string; estado: string; tiempoTotalServicio: number; }; servicios: { nombre: string }[] }) => ({
            idPaquete: item.paquete.idPaquete,
            nombrePaquete: item.paquete.nombre,
            tiempoTotalServicio: item.paquete.tiempoTotalServicio,
            servicios: item.servicios.map((servicio) => servicio.nombre), // Esto es opcional, solo muestra los nombres
          }));
        setPaquetes(paquetesActivos);
      })
      .catch((err) => console.error("Error fetching paquetes:", err.message));


    getWithAuth("http://localhost:8080/horario")
      .then((response) => response.json())
      .then((data: Horario[]) => setHorarios(data))
      .catch((err) => console.log(err.message));

    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 7);
    const maxDate = new Date(today);
    maxDate.setFullYear(today.getFullYear() + 1);
    setMinDate(minDate.toISOString().split("T")[0]);
    setMaxDate(maxDate.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (formData.fecha) {
      getHorarioPorDia(formData.fecha);
    }
  }, [formData.fecha]);

  useEffect(() => {
    const generarHoras = (inicio: string, fin: string) => {
      const opciones: string[] = [];
      const [inicioHoras, inicioMinutos] = inicio.split(":").map(Number);
      const [finHoras, finMinutos] = fin.split(":").map(Number);

      let horaActual = new Date();
      horaActual.setHours(inicioHoras, inicioMinutos, 0, 0);

      const horaFin = new Date();
      horaFin.setHours(finHoras, finMinutos, 0, 0);

      while (horaActual <= horaFin) {
        const horas = horaActual.getHours().toString().padStart(2, "0");
        const minutos = horaActual.getMinutes().toString().padStart(2, "0");
        opciones.push(`${horas}:${minutos}`);
        horaActual.setMinutes(horaActual.getMinutes() + 30);
      }

      return opciones;
    };

    setOpcionesHoras(generarHoras(minHora, maxHora));
  }, [minHora, maxHora]);

  const handlePaqueteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPaqueteId = parseInt(e.target.value, 10);
    handleInputChange(e);
    const paqueteSeleccionado = paquetes.find(paquete => paquete.idPaquete === selectedPaqueteId);

    if (paqueteSeleccionado) {
      setServicios(paqueteSeleccionado.servicios);
    } else {
      setServicios([]);
    }
  };


  const getHorarioPorDia = (fecha: string) => {
    const diaSemana = new Date(fecha).getDay() + 1;
    const diaSemanaAjustado = diaSemana === 0 ? 7 : diaSemana;

    const horario = horarios.find(
      (h) => parseInt(h.numeroDia) === diaSemanaAjustado
    );
    if (horario) {
      setMinHora(horario.inicioJornada);
      setMaxHora(horario.finJornada);
    } else {
      console.log(`No se encontró horario para el día ${diaSemanaAjustado}`);
    }
  };

  const validarFecha = (fecha: string) =>
    !!fecha &&
    new Date(fecha) >= new Date(minDate) &&
    new Date(fecha) <= new Date(maxDate);
  const validarHora = (hora: string) => opcionesHoras.includes(hora);
  const validarPaquete = (idPaquete: number) => idPaquete > 0;
  const validarColaborador = (idColaborador: number) => idColaborador > 0;

  const formIsValid =
    validarFecha(formData.fecha) &&
    validarHora(formData.hora) &&
    validarPaquete(formData.idPaquete) &&
    validarColaborador(formData.idColaborador);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formIsValid) {
      setMensajeError("Por favor, complete todos los campos correctamente.");
      onOpenError();
      return;
    }

    onOpenConfirm(); // Abre el modal de confirmación
  };

  const handleConfirmSubmit = async () => {
    const horaConSegundos = `${formData.hora}:00`;
    const idPaqueteSeleccionado = Number(formData.idPaquete);
    const paqueteSeleccionado = paquetes.find(paquete => paquete.idPaquete === idPaqueteSeleccionado);
    if (paqueteSeleccionado) {
      console.log(paqueteSeleccionado);
      const duracion = paqueteSeleccionado.tiempoTotalServicio;
      try {
        const response = await postWithAuth(`http://localhost:8080/cita?duracion=${duracion}`, {
          ...formData,
          hora: horaConSegundos,
        });
        if (response.ok) {
          onOpenSuccess();
          window.location.href = "/cliente";
        } else {
          setMensajeError(await response.text());
          onOpenError();
        }
      } catch (error) {
        setMensajeError("Error al enviar la solicitud");
        onOpenError();
      }
    } else {
      console.error("Paquete no encontrado");
    }
  };

  const handleColaboradorChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Actualiza el colaborador seleccionado y el estado del formulario
    setColaboradorSeleccionado(parseInt(value, 10));
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Convierte el formato de hora de 'HH:MM:SS' a 'HH:MM'
  const convertToHourMinute = (hora: string) => {
    const [hours, minutes] = hora.split(':');
    return `${hours}:${minutes}`;
  };

// Obtener las horas ocupadas por colaborador y fecha
const horasOcupadasPorColaboradorYFecha = colaboradorSeleccionado && formData.fecha
  ? horasOcupadas[colaboradorSeleccionado]?.[formData.fecha] || []
  : [];

// Convertir las horas ocupadas al formato "HH:MM"
const horasOcupadasConvertidas = horasOcupadasPorColaboradorYFecha.map(convertToHourMinute);

// Filtrar las horas disponibles
const opcionesHorasDisponibles = opcionesHoras.filter(hora => !horasOcupadasConvertidas.includes(hora));


  return (
    <>
      {acceso ? (
        <div className="container">
          <h1 className={title()}>Crear Cita</h1>
          <br /> <br />
          <form onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Colaborador"
                name="idColaborador"
                placeholder="Seleccione un colaborador"
                onChange={handleColaboradorChange}
                size="lg"
                className="block w-full"
                isInvalid={!validarColaborador(formData.idColaborador)}
                errorMessage={
                  !validarColaborador(formData.idColaborador)
                    ? "Debe seleccionar un colaborador"
                    : ""
                }
              >
                {colaboradores
                  .filter((colaborador) => colaborador.estado === "Activo") // Filtrar por estado "Activo"
                  .map((colaborador) => (
                    <SelectItem
                      key={colaborador.idColaborador}
                      value={colaborador.idColaborador}
                    >
                      {colaborador.nombre}
                    </SelectItem>
                  ))}
              </Select>
              <Input
                type="date"
                name="fecha"
                label="Fecha"
                placeholder="Seleccione una fecha"
                onChange={handleInputChange}
                className="block w-full"
                min={minDate}
                max={maxDate}
                isInvalid={!validarFecha(formData.fecha)}
                errorMessage={
                  !validarFecha(formData.fecha)
                    ? "Fecha fuera del rango permitido"
                    : ""
                }
              />
              <Select
                label="Hora"
                name="hora"
                placeholder="Seleccione una hora"
                onChange={handleInputChange}
                size="lg"
                className="block w-full"
                isInvalid={!validarHora(formData.hora)}
                errorMessage={
                  !validarHora(formData.hora)
                    ? "La hora no está disponible"
                    : ""
                }
              >
                {opcionesHorasDisponibles.length > 0 ? (
                  opcionesHorasDisponibles.map((hora) => (
                    <SelectItem key={hora} value={hora}>
                      {hora}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" isDisabled key={""}>
                    No hay horas disponibles
                  </SelectItem>
                )}
              </Select>
              <Select
                label="Paquete"
                name="idPaquete"
                placeholder="Seleccione un paquete"
                onChange={handlePaqueteChange} // Cambiar a handlePaqueteChange
                size="lg"
                className="block w-full"
                isInvalid={!validarPaquete(formData.idPaquete)}
                errorMessage={
                  !validarPaquete(formData.idPaquete) ? "Debe seleccionar un paquete" : ""
                }
              >
                {paquetes.map((paquete) => (
                  <SelectItem key={paquete.idPaquete} value={paquete.idPaquete}>
                    {paquete.nombrePaquete}
                  </SelectItem>
                ))}
              </Select>
              <Input
                name="detalle"
                type="text"
                label="Detalle (opcional)"
                className="block w-full"
                value={formData.detalle || ""}
                onChange={handleInputChange}
              />
              <Input
                name="servicios"
                type="text"
                label="Servicios vinculado al paquete seleccionado"
                value={servicios.join(", ")} // Mostrar los servicios como una lista separada por comas
                className="block w-full"
                isReadOnly // Hacer el campo solo lectura si solo deseas mostrar los servicios
              />
            </div>
            <div className="flex justify-end mt-6">
              <Button
                type="submit"
                className="bg-gradient-to-tr from-yellow-600 to-yellow-300"
                disabled={!formIsValid}
              >
                Crear Cita
              </Button>
            </div>
          </form>
          <Modal isOpen={isOpenConfirm} onOpenChange={onCloseConfirm}>
            <ModalContent>
              <ModalHeader className="flex flex-col items-center gap-1">
                <CircleHelp color="#fef08a" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className="text-3xl">¿Desea crear la cita?</h1>
                <p>La cita se creará con la información proporcionada.</p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onCloseConfirm}>
                  Cancelar
                </Button>
                <Button
                  color="warning"
                  variant="light"
                  onPress={handleConfirmSubmit}
                >
                  Crear
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
          <Modal isOpen={isOpenSuccess} onOpenChange={onCloseSuccess}>
            <ModalContent>
              <ModalHeader className="flex flex-col items-center gap-1">
                <CircleCheck color="#4caf50" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className="text-3xl">Éxito</h1>
                <p>La cita se creó exitosamente.</p>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="success"
                  variant="light"
                  onPress={onCloseSuccess}
                >
                  Cerrar
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
          <Modal isOpen={isOpenError} onOpenChange={onCloseError}>
            <ModalContent>
              <ModalHeader className="flex flex-col items-center gap-1">
                <CircleX color="#894242" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className="text-3xl">Error</h1>
                <p>{mensajeError}</p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onCloseError}>
                  Cerrar
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </div>
      ) : (
        <div className="flex items-center justify-center h-screen">
          <CircularProgress size="lg" />
        </div>
      )}
    </>
  );
}
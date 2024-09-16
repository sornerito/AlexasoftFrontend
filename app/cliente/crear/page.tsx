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
  idPaquete: number;
  nombre: string;
  estado: string;
  tiempoTotalServicio: number;
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
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [paquetes, setPaquetes] = useState<{ [key: number]: Paquete }>({});
  const [mensajeError, setMensajeError] = useState("");
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  const [minHora, setMinHora] = useState("08:00");
  const [maxHora, setMaxHora] = useState("17:00");
  const [opcionesHoras, setOpcionesHoras] = useState<string[]>([]);
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

    getWithAuth("http://localhost:8080/servicio/paquetes")
      .then((response) => response.json())
      .then((data) => {
        const fetchedPaquetes: { [key: number]: Paquete } = {}; // Cambia el tipo a Paquete
        data.forEach(
          (item: {
            paquete: { idPaquete: number; nombre: string; estado: string; tiempoTotalServicio: number; };
          }) => {
            const { idPaquete, nombre, estado, tiempoTotalServicio } = item.paquete;
            fetchedPaquetes[idPaquete] = { idPaquete, nombre, estado, tiempoTotalServicio }; // Almacena un objeto Paquete completo
          }
        );
        setPaquetes(fetchedPaquetes); // Esto ahora debe coincidir con el tipo esperado
        
      })
      .catch((err) => console.log(err.message));

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
    console.log(formData);
    const duracion = paquetes[formData.idPaquete].tiempoTotalServicio;
    const url = `http://localhost:8080/cita?duracion=${duracion}`;

    try {
      const response = await postWithAuth(url, {
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
  };

  return (
    <>
      {acceso ? (
        <div className="container">
          <h1 className={title()}>Crear Cita</h1>
          <br /> <br />
          <form onSubmit={handleSubmit}>
            <div className="grid gap-3 sm">
              <Select
                label="Colaborador"
                name="idColaborador"
                placeholder="Seleccione un colaborador"
                onChange={handleInputChange}
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
                {opcionesHoras.map((hora) => (
                  <SelectItem key={hora} value={hora}>
                    {hora}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Paquete"
                name="idPaquete"
                placeholder="Seleccione un paquete"
                onChange={handleInputChange}
                size="lg"
                className="block w-full"
                isInvalid={!validarPaquete(formData.idPaquete)}
                errorMessage={
                  !validarPaquete(formData.idPaquete)
                    ? "Debe seleccionar un paquete"
                    : ""
                }
              >
                {Object.entries(paquetes)
                  .filter(([idPaquete, paquete]) => paquete.estado === "Activo") // Acceder a `estado` correctamente
                  .map(([idPaquete, paquete]) => (
                    <SelectItem key={idPaquete} value={idPaquete}>
                      {paquete.nombre} {/* Acceder a `nombre` correctamente */}
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

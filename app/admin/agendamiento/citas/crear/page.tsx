"use client";
import React, { useState, useEffect } from "react";
import { title } from "@/components/primitives";
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
import { PlusIcon, CircleHelp, CircleX } from "lucide-react";
import { getWithAuth, postWithAuth, verificarAccesoPorPermiso } from "@/config/peticionesConfig";

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

export default function CrearCitaPage() {
  // Valida permiso
  const [acceso, setAcceso] = useState<boolean>(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Agendamiento") === false) {
        window.location.href = "../../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Agendamiento"));
    }
  }, []);

  const [clientes, setClientes] = useState<{ [key: number]: string }>({});
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [paquetes, setPaquetes] = useState<{ [key: number]: string }>({});
  const [formData, setFormData] = useState<Cita>({
    idCliente: 0,
    idColaborador: 0,
    idPaquete: 0,
    fecha: "",
    hora: "",
    detalle: "",
    estado: "En_espera",
  });
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [mensajeError, setMensajeError] = useState("");
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  const [minHora, setMinHora] = useState("08:00");
  const [maxHora, setMaxHora] = useState("17:00");
  const [opcionesHoras, setOpcionesHoras] = useState<string[]>([]);
  const { isOpen: isOpenConfirm, onOpen: onOpenConfirm, onClose: onCloseConfirm } = useDisclosure();
  const { isOpen: isOpenError, onOpen: onOpenError, onClose: onCloseError } = useDisclosure();

  useEffect(() => {
    // Fetch clientes, colaboradores, paquetes
    getWithAuth("http://localhost:8080/cliente")
      .then((response) => response.json())
      .then((data) => {
        const fetchedClientes: { [key: number]: string } = {};
        data.forEach((cliente: { idCliente: number; nombre: string }) => {
          fetchedClientes[cliente.idCliente] = cliente.nombre;
        });
        setClientes(fetchedClientes);
      })
      .catch((err) => console.log(err.message));

    getWithAuth("http://localhost:8080/colaborador")
      .then((response) => response.json())
      .then((data) => setColaboradores(data))
      .catch((err) => console.log(err.message));

    getWithAuth("http://localhost:8080/servicio/paquetes")
      .then((response) => response.json())
      .then((data) => {
        const fetchedPaquetes: { [key: number]: string } = {};
        data.forEach((item: { paquete: { idPaquete: number; nombre: string } }) => {
          const { idPaquete, nombre } = item.paquete;
          fetchedPaquetes[idPaquete] = nombre;
        });
        setPaquetes(fetchedPaquetes);
      })
      .catch((err) => console.log(err.message));

      getWithAuth("http://localhost:8080/horario")
      .then((response) => response.json())
      .then((data: Horario[]) => setHorarios(data))
      .catch((err) => console.log(err.message));

    // Configurar fechas mínimas y máximas
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

    const horario = horarios.find((h) => parseInt(h.numeroDia) === diaSemanaAjustado);
    if (horario) {
      setMinHora(horario.inicioJornada);
      setMaxHora(horario.finJornada);
    } else {
      console.log(`No se encontró horario para el día ${diaSemanaAjustado}`);
    }
  };

    // Validaciones

    const validarCliente = (idCliente: number) => idCliente > 0;
    const validarFecha = (fecha: string) => !!fecha && new Date(fecha) >= new Date(minDate) && new Date(fecha) <= new Date(maxDate);
    const validarHora = (hora: string) => opcionesHoras.includes(hora);
    const validarPaquete = (idPaquete: number) => idPaquete > 0;
    const validarColaborador = (idColaborador: number) => idColaborador > 0;
  
    const formIsValid =
    validarCliente(formData.idCliente) &&
    validarFecha(formData.fecha) &&
    validarHora(formData.hora) &&
    validarPaquete(formData.idPaquete) &&
    validarColaborador(formData.idColaborador);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    const datosParaEnviar = {
      idCliente: formData.idCliente,
      idColaborador: formData.idColaborador,
      idPaquete: formData.idPaquete,
      fecha: formData.fecha,
      hora: horaConSegundos,
      detalle: formData.detalle,
      estado: formData.estado,
    };

    try {
      const response = await postWithAuth("http://localhost:8080/cita", datosParaEnviar);
      if (response.ok) {
        window.location.href = "/admin/agendamiento/citas";
      } else {
        setMensajeError("Error al crear la cita");
        onOpenError();
      }
    } catch (error) {
      setMensajeError("Error al enviar la solicitud");
      onOpenError();
    }
    onCloseConfirm();
  };

  return (
    <>
      {acceso ? (
        <div className="lg:mx-60">
          <h1 className={title()}>Crear Cita</h1>
          <br /> <br />
          <form onSubmit={handleSubmit}>
            <div className="grid gap-3 sm">
              <Select
                label="Cliente"
                name="idCliente"
                variant="bordered"
                placeholder="Seleccione un cliente"
                onChange={handleInputChange}
                size="lg"
                className="block w-full"
                isInvalid={!validarCliente(formData.idCliente)}
                errorMessage={!validarCliente(formData.idCliente) ? "Debe seleccionar un cliente" : ""}
              >
                {Object.entries(clientes).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="Colaborador"
                name="idColaborador"
                variant="bordered"
                placeholder="Seleccione un colaborador"
                onChange={handleInputChange}
                size="lg"
                className="block w-full"
                isInvalid={!validarColaborador(formData.idColaborador)}
                errorMessage={!validarColaborador(formData.idColaborador) ? "Debe seleccionar un colaborador" : ""}
              >
                {colaboradores.map((colaborador) => (
                  <SelectItem key={colaborador.idColaborador} value={colaborador.idColaborador}>
                    {colaborador.nombre}
                  </SelectItem>
                ))}
              </Select>
              <Input
                type="date"
                name="fecha"
                label="Fecha"
                variant="bordered"
                placeholder="Seleccione una fecha"
                onChange={handleInputChange}
                className="block w-full"
                min={minDate}
                max={maxDate}
                isInvalid={!validarFecha(formData.fecha)}
                errorMessage={!validarFecha(formData.fecha) ? "Fecha fuera del rango permitido" : ""}
              />
              <Select
                label="Hora"
                name="hora"
                variant="bordered"
                placeholder="Seleccione una hora"
                onChange={handleInputChange}
                size="lg"
                className="block w-full"
                isInvalid={!validarHora(formData.hora)}
                errorMessage={!validarHora(formData.hora) ? "La hora no está disponible" : ""}
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
                variant="bordered"
                placeholder="Seleccione un paquete"
                onChange={handleInputChange}
                size="lg"
                className="block w-full"
                isInvalid={!validarPaquete(formData.idPaquete)}
                errorMessage={!validarPaquete(formData.idPaquete) ? "Debe seleccionar un paquete" : ""}
              >
                {Object.entries(paquetes).map(([idPaquete, nombre]) => (
                  <SelectItem key={idPaquete} value={idPaquete}>
                    {nombre}
                  </SelectItem>
                ))}
              </Select>
              <Input
                name="detalle"
                type="text"
                label="Detalle (opcional)"
                variant="bordered"
                className="block w-full"
                value={formData.detalle || ""}
                onChange={handleInputChange}
              />
            </div>

            <div className="mt-6 flex justify-end">
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
              <ModalHeader className="flex flex-col gap-1 items-center">
                <CircleHelp color="#fef08a" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className="text-3xl">¿Desea crear la cita?</h1>
                <p>La cita se creará con la información proporcionada.</p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" onClick={onCloseConfirm}>
                  Cancelar
                </Button>
                <Button color="warning" onClick={handleConfirmSubmit}>
                  Crear
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Modal isOpen={isOpenError} onOpenChange={onCloseError}>
            <ModalContent>
              <ModalHeader className="flex flex-col gap-1 items-center">
                <CircleX color="#894242" size={100} />
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
        <CircularProgress aria-label="Loading..." />
      )}
    </>
  );

}

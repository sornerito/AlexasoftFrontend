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
  const { isOpen: isOpenConfirm, onOpen: onOpenConfirm, onClose: onCloseConfirm } = useDisclosure();
  const { isOpen: isOpenError, onOpen: onOpenError, onClose: onCloseError } = useDisclosure();
  const [mensajeError, setMensajeError] = useState("");
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");

  // Validaciones
  const validarCliente = () => formData.idCliente !== 0;
  const validarColaborador = () => formData.idColaborador !== 0;
  const validarPaquete = () => formData.idPaquete !== 0;
  const validarFecha = () => formData.fecha !== "";
  const validarHora = () => formData.hora !== "";

  const formIsValid =
    validarCliente() &&
    validarColaborador() &&
    validarPaquete() &&
    validarFecha() &&
    validarHora();

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

    // Configurar fechas mínimas y máximas
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 3);
    const maxDate = new Date(today);
    maxDate.setFullYear(today.getFullYear() + 1);
    setMinDate(minDate.toISOString().split("T")[0]);
    setMaxDate(maxDate.toISOString().split("T")[0]);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formIsValid) {
      onOpenConfirm();
    } else {
      setMensajeError("Por favor, complete todos los campos correctamente.");
      onOpenError();
    }
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
                isInvalid={!validarCliente()}
                color={!validarCliente() ? "danger" : "default"}
                errorMessage={!validarCliente() ? "Seleccione un cliente válido." : ""}
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
                isInvalid={!validarColaborador()}
                color={!validarColaborador() ? "danger" : "default"}
                errorMessage={!validarColaborador() ? "Seleccione un colaborador válido." : ""}
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
                isInvalid={!validarFecha()}
                color={!validarFecha() ? "danger" : "default"}
                errorMessage={!validarFecha() ? "Seleccione una fecha válida." : ""}
              />

              <Input
                type="time"
                name="hora"
                label="Hora"
                variant="bordered"
                placeholder="Seleccione una hora"
                onChange={handleInputChange}
                className="block w-full"
                disabled={!formData.fecha}
                isInvalid={!validarHora()}
                color={!validarHora() ? "danger" : "default"}
                errorMessage={!validarHora() ? "Seleccione una hora válida." : ""}
              />

              <Select
                label="Paquete"
                name="idPaquete"
                variant="bordered"
                placeholder="Seleccione un paquete"
                onChange={handleInputChange}
                size="lg"
                className="block w-full"
                isInvalid={!validarPaquete()}
                color={!validarPaquete() ? "danger" : "default"}
                errorMessage={!validarPaquete() ? "Seleccione un paquete válido." : ""}
              >
                {Object.entries(paquetes).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </Select>
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

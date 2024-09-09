"use client";
import { title } from "@/components/primitives";
import React, { useState, useEffect } from "react";
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
import { PlusIcon, CircleCheck, CircleX } from "lucide-react";
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
  //Valida permiso
  const [acceso, setAcceso] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (verificarAccesoPorPermiso("Gestionar Cita") === false) {
        window.location.href = "../../../../acceso/noAcceso";
      }
      setAcceso(verificarAccesoPorPermiso("Gestionar Cita"));
    }
  }, []);
  const idUsuario = typeof window !== "undefined" ? sessionStorage.getItem("idUsuario") : null;
  const idCliente = idUsuario !== null ? Number(idUsuario) : 0;
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [paquetes, setPaquetes] = useState<{ [key: number]: string }>({});
  const [horario, setHorarios] = useState<{ [key: number]: number }>({});
  const [formData, setFormData] = useState<Cita>({
    idCliente: idCliente,
    idColaborador: 0,
    idPaquete: 0,
    fecha: "",
    hora: "",
    detalle: "",
    estado: "En_espera",
  });
  const [mensajeError, setMensajeError] = useState("");
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  const { isOpen: isOpenSuccess, onOpen: onOpenSuccess, onClose: onCloseSuccess } = useDisclosure();
  const { isOpen: isOpenError, onOpen: onOpenError, onClose: onCloseError } = useDisclosure();

  useEffect(() => {
    // Fetch colaboradores, paquetes, motivos
    getWithAuth("http://localhost:8080/colaborador")
      .then((response) => response.json())
      .then((data) => setColaboradores(data))
      .catch((err) => {
        console.log(err.message);
      });

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
      .catch((err) => {
        console.log(err.message);
      });

    getWithAuth("http://localhost:8080/horario")
      .then((response) => response.json())
      .then((data) => {
        const fetchedHorario: { [key: number]: number } = {};
        data.forEach((horario: { idHorario: number; numeroDia: number }) => {
          fetchedHorario[horario.idHorario] = horario.numeroDia;
        });
        setHorarios(fetchedHorario);
      })
      .catch((err) => {
        console.log(err.message);
      });

    // Configura las fechas mínimas y máximas
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
    setFormData((prevState) => {
      const updatedFormData = { ...prevState, [name]: value };
      console.log('FormData en handleInputChange:', updatedFormData);
      return updatedFormData;
    });
  };
  

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const horaConSegundos = `${formData.hora}:00`;
    console.log('Datos del formulario:', formData);
    console.log(horaConSegundos)
    console.log(formData)

    const datosParaEnviar = {
      ...formData,
      hora: horaConSegundos,
    };

    try {
      const response = await postWithAuth("http://localhost:8080/cita", datosParaEnviar);
      if (response.ok) {
        onOpenSuccess();
        window.location.href = "/cliente";
      } else {
        setMensajeError("Error al crear la cita");
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
        <div className="lg:mx-60">
          <h1 className={title()}>Crear Cita</h1>
          <br /> <br />
          <form onSubmit={handleSubmit}>
            <div className="grid gap-3 sm">
              <Select
                label="Colaborador"
                name="idColaborador"
                variant="bordered"
                placeholder="Seleccione un colaborador"
                onChange={handleInputChange}
                size="lg"
                className="block w-full"
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
              />

              <Select
                label="Paquete"
                name="idPaquete"
                variant="bordered"
                placeholder="Seleccione un paquete"
                onChange={handleInputChange}
                size="lg"
                className="block w-full"
              >
                {Object.entries(paquetes).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </Select>

              <Input
                type="text"
                name="detalle"
                label="Detalle"
                variant="bordered"
                placeholder="Ingrese un detalle"
                onChange={handleInputChange}
                className="block w-full"
              />
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="submit" className="bg-gradient-to-tr from-yellow-600 to-yellow-300">
                <PlusIcon /> Crear Cita
              </Button>
            </div>
          </form>

          {/* Modal de éxito */}
          <Modal isOpen={isOpenSuccess} onClose={onCloseSuccess}>
            <ModalContent>
              <ModalHeader className="flex flex-col gap-1 items-center">
                <CircleCheck color="green" size={100} />
              </ModalHeader>
              <ModalBody className="text-center">
                <h1 className="text-3xl">Cita creada</h1>
                <p>La cita se ha creado exitosamente.</p>
              </ModalBody>
              <ModalFooter>
                <Button color="success" onClick={onCloseSuccess}>
                  Cerrar
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* Modal de error */}
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
                <Button color="danger" onClick={onCloseError}>
                  Cerrar
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </div>
      ) : (
        <div className="flex justify-center text-center h-screen">
          <CircularProgress color="warning" aria-label="Cargando..." />
        </div>
      )}
    </>
  );
}

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
  idHorario: number;
  fecha: string;
  hora: string;
  detalle: string | null;
  estado: string;
}

export default function CrearCitaPage() {
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
  const [clientes, setClientes] = useState<{ [key: number]: string }>({});
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [paquetes, setPaquetes] = useState<{ [key: number]: string }>({});
  const [horario, setHorarios] = useState<{ [key: number]: number }>({});
  const [formData, setFormData] = useState<Cita>({
    idCliente: 0,
    idColaborador: 0,
    idPaquete: 0,
    idHorario: 0,
    fecha: "",
    hora: "",
    detalle: "",
    estado: "En_espera",
  });
  const { isOpen: isOpenSuccess, onOpen: onOpenSuccess, onClose: onCloseSuccess } = useDisclosure();
  const { isOpen: isOpenError, onOpen: onOpenError, onClose: onCloseError } = useDisclosure();
  const [mensajeError, setMensajeError] = useState("");

  useEffect(() => {
    // Fetch clients, collaborators, packages and reasons
    getWithAuth("http://localhost:8080/cliente")
      .then((response) => response.json())
      .then((data) => {
        const fetchedClientes: { [key: number]: string } = {};
        data.forEach((cliente: { idCliente: number, nombre: string }) => {
          fetchedClientes[cliente.idCliente] = cliente.nombre;
        });
        setClientes(fetchedClientes);
      })
      .catch((err) => {
        console.log(err.message);
      });

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
        data.forEach((item: { paquete: { idPaquete: number, nombre: string } }) => {
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
        data.forEach((horario: { idHorario: number, numeroDia: number }) => {
          fetchedHorario[horario.idHorario] = horario.numeroDia;
        });
        setHorarios(fetchedHorario);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const horaConSegundos = `${formData.hora}:00`;

    const datosParaEnviar = {
      idCliente: formData.idCliente,
      idColaborador: formData.idColaborador,
      idPaquete: formData.idPaquete,
      idHorario: formData.idHorario,
      fecha: formData.fecha,
      hora: horaConSegundos,
      detalle: formData.detalle,
      estado: formData.estado,
    };

    try {
      const response = await postWithAuth("http://localhost:8080/cita",(datosParaEnviar));

      if (response.ok) {
        onOpenSuccess();
        window.location.href = "/admin/Agendamiento/citas";
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

    <div>
      <h1 className={title()}>Crear Cita</h1>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <label>
            Cliente
            <select name="idCliente" onChange={handleInputChange}>
              <option value="">Seleccione un cliente</option>
              {Object.entries(clientes).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            Colaborador
            <select name="idColaborador" onChange={handleInputChange}>
              <option value="">Seleccione un colaborador</option>
              {colaboradores.map((colaborador) => (
                <option key={colaborador.idColaborador} value={colaborador.idColaborador}>{colaborador.nombre}</option>
              ))}
            </select>
          </label>
          <Input
            type="date"
            name="fecha"
            label="Fecha"
            placeholder="Seleccione una fecha"
            onChange={handleInputChange}
          />
          <Input
            type="time"
            name="hora"
            label="Hora"
            placeholder="Seleccione una hora"
            onChange={handleInputChange}
          />
          <label>
            Horario
            <select name="idHorario" onChange={handleInputChange}>
              <option value="">Seleccione un Día</option>
              {Object.entries(horario).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            Paquete
            <select name="idPaquete" onChange={handleInputChange}>
              <option value="">Seleccione un paquete</option>
              {Object.entries(paquetes).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <Input
            type="text"
            name="detalle"
            label="Detalle"
            placeholder="Ingrese un detalle"
            onChange={handleInputChange}
          />
          <Button type="submit" className="bg-gradient-to-tr from-yellow-600 to-yellow-300">
            <PlusIcon /> Crear Cita
          </Button>
        </div>
      </form>

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
            <Button color="success" onClick={onCloseSuccess}>Cerrar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

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
    </div>
          
        ) :(
          <CircularProgress color="warning" aria-label="Cargando..." />
        )}
    </>
  );
}
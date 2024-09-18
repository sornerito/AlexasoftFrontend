"use client";
import React, { useEffect, useState } from "react";
import { getWithAuth } from "@/config/peticionesConfig";
import Image from "next/image"; 

interface Servicio {
  idServicio: string;
  nombre: string;
  descripcion: string;
  tiempoMinutos: string;
  estado: string;
  imagen: string; // Asegúrate de que tu interfaz tenga la propiedad "imagen"
}

export default function ServiciosCliente() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await getWithAuth("http://10.170.83.243:8080/servicio");
        if (response.ok) {
          const data = await response.json();
          setServicios(data);
        } else {
          console.error("Error al obtener los servicios");
        }
      } catch (error) {
        console.error("Error en la comunicación con el servidor", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return ( 
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div> 
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Nuestros Servicios</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {servicios.map((servicio) => (
          <div key={servicio.idServicio} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative h-48">
              <Image
                src={servicio.imagen || "/imagen_no_disponible.jpg"} 
                alt={servicio.nombre}
                layout="fill" 
                objectFit="cover" 
              />
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">{servicio.nombre}</h2>
              <p className="text-gray-600">{servicio.descripcion}</p>
              <p className="text-gray-500 text-sm mt-2">
                Duración: {servicio.tiempoMinutos} minutos
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
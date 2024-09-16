export function validarCampoString(valor: string | undefined, campo: string): string {
  if (!valor?.match(/^[A-Za-zñÑáéíóúÁÉÍÓÚ\s]*$/)) {
    return `${campo} solo debe contener letras.`;
  } else if (valor === "" || valor === null) {
    return `${campo} no puede estar vacío.`;
  } else if (valor.length <= 2) {
    return `${campo} debe contener como mínimo 2 caracteres.`;
  }
  return "";
}

export function validarDescripcionModal(
  descripcion: string,
  campo: string
): string {
  if (!descripcion?.match(/^[A-Za-zñÑáéíóúÁÉÍÓÚ\s]*$/)) {
    return "La descripcion solo debe contener letras";
  } else if (descripcion === "" || descripcion === null) {
    return `${campo} no puede estar vacio.`;
  } else if (descripcion.length <= 10) {
    return "La descripcion como minimo debe contener 10 caracteres"
  }
  return "";
};

export function validarTiempoModal(tiempoMinutos: string): string | undefined {
  if (tiempoMinutos.trim() === "") {
    return "El tiempo en minutos no puede estar vacío.";
  }

  const tiempoNumerico = parseInt(tiempoMinutos, 10);

  if (isNaN(tiempoNumerico) || tiempoNumerico <= 0) {
    return "El tiempo en minutos debe ser un número entero positivo.";
  }
  return undefined; // No hay errores
}

export function validarCantidadModal(cantidad: number): string | undefined {
  if (cantidad <= 0) {
    return "La cantidad debe ser un número entero positivo.";
  }
  if (!Number.isInteger(cantidad)) {
    return "La cantidad debe ser un número entero.";
  }
  return undefined; // No hay error
}

export function validarCampoString(
  valor: string | undefined,
  campo: string
): string {
  if (!valor?.match(/^[A-Za-zñÑáéíóúÁÉÍÓÚ\s]*$/)) {
    return campo + " solo debe contener letras.";
  } else if (valor == "" || valor == null) {
    return campo + " no puede estar vacio.";
  } else if (valor.length <= 2) {
    return campo + " debe contener como mínimo 2 caracteres.";
  }
  return "";
}

export function validarEmailModal(valor: string | undefined): string {
  if (!valor?.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i)) {
    return "El email no es válido.";
  } else if (valor == "" || valor == null) {
    return "El email no puede estar vacio.";
  }
  return "";
}
export function validarTelefonoModal(valor: string | undefined): string {
  if (!valor?.match(/^[0-9]{10}$/)) {
    return "EL teléfono no es válido.";
  } else if (valor == "" || valor == null) {
    return "El teléfono no puede estar vacio.";
  }
  return "";
}
export function validarContrasenaModal(valor: string | undefined): string {
  if (
    !valor?.match(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    )
  ) {
    return "La contraseña no es válida, debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un caracter especial (@$!%*?&).";
  } else if (valor == "" || valor == null) {
    return "El contraseña no puede estar vacia.";
  }
  return "";
}
export function validarCedulaModal(valor: string | undefined): string {
  if (!valor?.match(/^[0-9]{8,13}$/)) {
    return "La cédula no es válida, debe tener entre 8 y 13 caracteres.";
  } else if (valor == "" || valor == null) {
    return "La cédula no puede estar vacia.";
  }
  return "";
}
export function validarInstagramModal(usuario: string | undefined): string {
  if (!usuario?.match(/^@[a-zA-Z0-9._]{0,30}$/)) {
    return "El Instagram no es válido.";
  } else if (usuario == "" || usuario == null) {
    return "El Instagram no puede estar vacío.";
  }
  return "";
}
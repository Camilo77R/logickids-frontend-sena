/** Pure validation for tutor registration — RN fields reflected in messages. */
export function validateRegistroForm(form) {
  const errors = {};
  if (!form.nombre.trim()) errors.nombre = "El nombre es obligatorio.";
  if (!form.email.trim()) errors.email = "El correo es obligatorio.";
  else if (!/\S+@\S+\.\S+/.test(form.email))
    errors.email = "El correo no tiene un formato válido.";
  if (!form.contrasena) errors.contrasena = "La contraseña es obligatoria.";
  else if (form.contrasena.length < 6)
    errors.contrasena = "La contraseña debe tener al menos 6 caracteres.";
  if (!form.confirmarContrasena)
    errors.confirmarContrasena = "Debes confirmar tu contraseña.";
  else if (form.contrasena !== form.confirmarContrasena)
    errors.confirmarContrasena = "Las contraseñas no coinciden.";
  if (!form.institucion_id)
    errors.institucion_id = "Debes seleccionar tu institución.";
  return errors;
}

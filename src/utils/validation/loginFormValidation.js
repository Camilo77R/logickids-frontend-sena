/** Pure validation for login — easy to test, no React deps. */
export function validateLoginForm(form) {
  const errors = {};
  if (!form.email.trim()) errors.email = "El correo es obligatorio.";
  else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = "Correo inválido.";
  if (!form.contrasena) errors.contrasena = "La contraseña es obligatoria.";
  return errors;
}

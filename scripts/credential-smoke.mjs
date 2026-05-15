const BASE_URL = process.env.LK_SMOKE_BASE_URL || "http://localhost:3000/api";
const EMAIL = process.env.LK_SMOKE_EMAIL || "";
const PASSWORD = process.env.LK_SMOKE_PASSWORD || "";
const ENABLE_MUTATION = process.env.LK_SMOKE_MUTATION === "true";
const ENABLE_PASSWORD_ROTATION = process.env.LK_SMOKE_PASSWORD_ROTATION === "true";
const NEXT_PASSWORD = process.env.LK_SMOKE_PASSWORD_NEW || "";

const logStep = (message) => console.log(`[SMOKE] ${message}`);

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const jsonRequest = async (path, { method = "GET", token, body } = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    throw new Error(`${method} ${path} -> ${response.status}: ${payload?.message || "Error"}`);
  }

  return payload;
};

const runPublicChecks = async () => {
  logStep("Verificando endpoint público de instituciones...");
  const payload = await jsonRequest("/auth/instituciones", { method: "GET" });
  assert(payload?.success === true, "La respuesta pública no trae success=true");
  assert(Array.isArray(payload?.data), "La respuesta pública no trae un arreglo en data");
  logStep(`Instituciones visibles: ${payload.data.length}`);
};

const runAuthenticatedChecks = async () => {
  if (!EMAIL || !PASSWORD) {
    logStep("No se recibieron LK_SMOKE_EMAIL y LK_SMOKE_PASSWORD. Se omiten checks autenticados.");
    return;
  }

  logStep(`Probando login para ${EMAIL}...`);
  const loginPayload = await jsonRequest("/auth/login", {
    method: "POST",
    body: { email: EMAIL, contrasena: PASSWORD },
  });

  const token = loginPayload?.data?.token;
  const originalProfile = loginPayload?.data?.usuario;

  assert(token, "El login no devolvió token");
  assert(originalProfile?.email === EMAIL, "El login no devolvió el usuario esperado");

  logStep("Consultando perfil autenticado...");
  const profilePayload = await jsonRequest("/auth/perfil", { token });
  assert(profilePayload?.data?.email === EMAIL, "El perfil autenticado no coincide con el login");

  if (ENABLE_MUTATION) {
    const originalName = profilePayload?.data?.nombre || "Usuario Smoke";
    const temporaryName = `${originalName} Smoke`;

    logStep("Probando actualización temporal de perfil...");
    const updatePayload = await jsonRequest("/auth/perfil", {
      method: "PUT",
      token,
      body: { nombre: temporaryName },
    });

    assert(
      updatePayload?.data?.nombre === temporaryName,
      "La actualización temporal de perfil no se reflejó"
    );

    logStep("Restaurando nombre original...");
    const restorePayload = await jsonRequest("/auth/perfil", {
      method: "PUT",
      token,
      body: { nombre: originalName },
    });

    assert(
      restorePayload?.data?.nombre === originalName,
      "No fue posible restaurar el nombre original"
    );
  } else {
    logStep("Checks de mutación de perfil omitidos. Usa LK_SMOKE_MUTATION=true para habilitarlos.");
  }

  if (ENABLE_PASSWORD_ROTATION) {
    assert(NEXT_PASSWORD, "Debes pasar LK_SMOKE_PASSWORD_NEW para probar rotación de contraseña");

    logStep("Probando cambio de contraseña...");
    const passwordPayload = await jsonRequest("/auth/cambiar-contrasena", {
      method: "PUT",
      token,
      body: {
        contrasena_actual: PASSWORD,
        contrasena_nueva: NEXT_PASSWORD,
      },
    });

    assert(passwordPayload?.data?.actualizada === true, "El backend no confirmó la rotación");

    logStep("Validando login con la nueva contraseña...");
    const reloginPayload = await jsonRequest("/auth/login", {
      method: "POST",
      body: { email: EMAIL, contrasena: NEXT_PASSWORD },
    });

    const rotatedToken = reloginPayload?.data?.token;
    assert(rotatedToken, "No fue posible iniciar sesión con la nueva contraseña");

    logStep("Restaurando la contraseña original...");
    const restorePasswordPayload = await jsonRequest("/auth/cambiar-contrasena", {
      method: "PUT",
      token: rotatedToken,
      body: {
        contrasena_actual: NEXT_PASSWORD,
        contrasena_nueva: PASSWORD,
      },
    });

    assert(
      restorePasswordPayload?.data?.actualizada === true,
      "No fue posible restaurar la contraseña original"
    );
  } else {
    logStep(
      "Checks de rotación de contraseña omitidos. Usa LK_SMOKE_PASSWORD_ROTATION=true para habilitarlos."
    );
  }
};

const main = async () => {
  logStep(`Base URL: ${BASE_URL}`);
  await runPublicChecks();
  await runAuthenticatedChecks();
  logStep("Smoke de credenciales completado.");
};

main().catch((error) => {
  console.error(`[SMOKE] Falló la verificación: ${error.message}`);
  process.exit(1);
});

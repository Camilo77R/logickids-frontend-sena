import { expect, test } from "@playwright/test";
import { users } from "./fixtures/users";
import { loginByUi } from "./helpers/auth";

test.describe("autenticacion y rutas", () => {
  test("redirecciona la raiz publica hacia login", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("button", { name: /iniciar sesi/i })).toBeVisible();
  });

  test("valida campos obligatorios antes de enviar credenciales", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /iniciar sesi/i }).click();

    await expect(page.getByText("El correo es obligatorio.")).toBeVisible();
    await expect(page.getByText(/obligatoria/i)).toBeVisible();
  });

  test("inicia sesion como tutor y entra al dashboard correspondiente", async ({ page }) => {
    await loginByUi(page, users.tutor);

    await expect(page).toHaveURL(/\/tutor\/dashboard$/);
    await expect(page.getByRole("navigation", { name: /navegaci/i })).toContainText("Grupos");
  });

  test("redirige a login cuando una ruta protegida no tiene sesion", async ({ page }) => {
    await page.goto("/admin/dashboard", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/login$/);
  });
});

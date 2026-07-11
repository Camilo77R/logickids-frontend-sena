import { expect, test } from "@playwright/test";
import { users } from "./fixtures/users";
import { loginByUi } from "./helpers/auth";

test.describe("navegacion por rol", () => {
  test("superadmin navega entre resumen, instituciones y minijuegos", async ({ page }) => {
    await loginByUi(page, users.superadmin);

    await expect(page).toHaveURL(/\/superadmin\/dashboard$/);
    await expect(page.getByRole("heading", { name: /hola/i })).toBeVisible();

    await page.locator('a[href="/superadmin/instituciones"]').first().click();
    await expect(page).toHaveURL(/\/superadmin\/instituciones$/);
    await expect(page.locator("h1", { hasText: "Instituciones" })).toBeVisible();

    await page.locator('a[href="/superadmin/minijuegos"]').first().click();
    await expect(page).toHaveURL(/\/superadmin\/minijuegos$/);
    await expect(page.locator("h1", { hasText: "Minijuegos" })).toBeVisible();
  });

  test("admin navega por los modulos institucionales principales", async ({ page }) => {
    await loginByUi(page, users.admin);

    await expect(page).toHaveURL(/\/admin\/dashboard$/);
    await expect(page.getByRole("heading", { name: /hola/i })).toBeVisible();

    await page.locator('a[href="/admin/grupos"]').first().click();
    await expect(page).toHaveURL(/\/admin\/grupos$/);
    await expect(page.locator("h1", { hasText: "Grupos" })).toBeVisible();

    await page.locator('a[href="/admin/estudiantes"]').first().click();
    await expect(page).toHaveURL(/\/admin\/estudiantes$/);
    await expect(page.locator("h1", { hasText: "Estudiantes" })).toBeVisible();
  });

  test("tutor navega por grupos, estudiantes, sesiones y logros", async ({ page }) => {
    await loginByUi(page, users.tutor);

    await page.getByRole("link", { name: "Grupos" }).click();
    await expect(page).toHaveURL(/\/tutor\/grupos$/);
    await expect(
      page.getByRole("heading", { name: /mis grupos/i }).or(page.getByText(/aun no tienes grupos asignados|aún no tienes grupos asignados/i))
    ).toBeVisible();

    await page.getByRole("link", { name: "Estudiantes" }).click();
    await expect(page).toHaveURL(/\/tutor\/estudiantes$/);
    await expect(page.getByRole("heading", { name: "Estudiantes", exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Sesiones" }).click();
    await expect(page).toHaveURL(/\/tutor\/sesiones$/);
    await expect(page.getByText(/sesiones/i).first()).toBeVisible();

    await page.getByRole("link", { name: "Logros" }).click();
    await expect(page).toHaveURL(/\/tutor\/logros$/);
    await expect(page.locator("strong", { hasText: /selecciona un estudiante/i })).toBeVisible();
  });

  test("un tutor no puede permanecer en rutas de admin", async ({ page }) => {
    await loginByUi(page, users.tutor);

    await page.goto("/admin/dashboard", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/tutor\/dashboard$/);
  });
});

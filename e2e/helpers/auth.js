export async function loginByUi(page, user) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByLabel(/correo electronico|correo electr/i).fill(user.email);
  await page.getByRole("textbox", { name: /contrasena|contrase/i }).fill(user.password);
  await page.getByRole("button", { name: /iniciar sesi/i }).click();
  await page.waitForURL(`**${user.home}`);
}

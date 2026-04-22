import { test, expect } from "@playwright/test";
import { mockRegisterSuccess, mockRegisterConflict } from "../helpers/routes";
import { REGISTER_SUCCESS } from "../fixtures/auth";

const VALID_FORM = {
  firstName: "Andrea",
  lastName: "Castillo",
  email: "andrea@milacafe.mx",
  company: "Mila Cafe",
  password: "Str0ngP@ss1",
};

async function fillForm(page: Parameters<typeof mockRegisterSuccess>[0], data = VALID_FORM) {
  await page.locator('[data-testid=input-firstname]').fill(data.firstName);
  await page.locator('[data-testid=input-lastname]').fill(data.lastName);
  await page.locator('[data-testid=input-email]').fill(data.email);
  await page.locator('[data-testid=input-company]').fill(data.company);
  await page.locator('[data-testid=input-password]').fill(data.password);
}

async function checkTerms(page: Parameters<typeof mockRegisterSuccess>[0]) {
  // input[type=checkbox] has display:none — click the visible .box span inside the label
  await page.locator('label.checkbox .box').click();
}

const UNAUTH = { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } };

test.beforeEach(async ({ page }) => {
  // useAuth hook calls /auth/me on every admin page — return 401 silently on auth routes
  await page.route("**/api/auth/me", (route) => route.fulfill({ status: 401, json: UNAUTH }));
  await page.route("**/api/auth/refresh", (route) => route.fulfill({ status: 401, json: UNAUTH }));
  await page.goto("/admin/register");
});

test.describe("Render de la página de registro", () => {
  test("muestra todos los campos del formulario", async ({ page }) => {
    await expect(page.getByRole("heading")).toContainText("Empieza gratis");
    await expect(page.locator('[data-testid=input-firstname]')).toBeVisible();
    await expect(page.locator('[data-testid=input-lastname]')).toBeVisible();
    await expect(page.locator('[data-testid=input-email]')).toBeVisible();
    await expect(page.locator('[data-testid=input-company]')).toBeVisible();
    await expect(page.locator('[data-testid=input-password]')).toBeVisible();
    await expect(page.locator('label.checkbox')).toBeVisible();
    await expect(page.getByRole("button", { name: /crear cuenta/i })).toBeVisible();
  });

  test("link de login apunta a /admin/login", async ({ page }) => {
    await expect(page.getByRole("link", { name: /entra/i })).toHaveAttribute("href", /login/);
  });
});

test.describe("Indicador de fortaleza de contraseña", () => {
  test("muestra Débil para contraseña corta", async ({ page }) => {
    await page.locator('[data-testid=input-password]').fill("abc");
    await expect(page.locator('[data-testid=pw-strength]')).toContainText("Débil");
  });

  test("muestra Fuerte para contraseña robusta", async ({ page }) => {
    await page.locator('[data-testid=input-password]').fill("Str0ngP@ss123");
    await expect(page.locator('[data-testid=pw-strength]')).toContainText("Fuerte");
  });

  test("el indicador no es visible antes de escribir", async ({ page }) => {
    await expect(page.locator('[data-testid=pw-strength]')).not.toBeVisible();
  });
});

test.describe("Registro exitoso", () => {
  test("envía datos correctos al backend", async ({ page }) => {
    let capturedBody: Record<string, unknown> = {};
    await page.route("**/api/auth/register", async (route) => {
      capturedBody = JSON.parse(route.request().postData() ?? "{}");
      await route.fulfill({ status: 201, json: REGISTER_SUCCESS });
    });

    await fillForm(page);
    await checkTerms(page);
    await page.getByRole("button", { name: /crear cuenta/i }).click();

    expect(capturedBody.email).toBe("andrea@milacafe.mx");
    expect(capturedBody.tenantName).toBe("Mila Cafe");
    expect(capturedBody.tenantSlug).toBe("mila-cafe");
    expect(capturedBody.name).toBe("Andrea Castillo");
    expect(typeof capturedBody.password).toBe("string");
  });

  test("redirige a verificación de email tras registrarse", async ({ page }) => {
    await mockRegisterSuccess(page);

    await fillForm(page);
    await checkTerms(page);
    await page.getByRole("button", { name: /crear cuenta/i }).click();

    await expect(page).not.toHaveURL(/register/);
  });
});

test.describe("Errores de registro", () => {
  test("muestra error si la empresa ya está registrada", async ({ page }) => {
    await mockRegisterConflict(page);

    await fillForm(page);
    await checkTerms(page);
    await page.getByRole("button", { name: /crear cuenta/i }).click();

    await expect(page.locator('[data-testid=register-error]')).toBeVisible();
    await expect(page.locator('[data-testid=register-error]')).toContainText(/empresa/i);
  });

  test("el botón está deshabilitado si los términos no están aceptados", async ({ page }) => {
    await fillForm(page);
    // términos sin marcar
    await expect(page.getByRole("button", { name: /crear cuenta/i })).toBeDisabled();
  });

  test("el botón está deshabilitado si la contraseña es muy corta", async ({ page }) => {
    await fillForm(page, { ...VALID_FORM, password: "short" });
    await checkTerms(page);
    await expect(page.getByRole("button", { name: /crear cuenta/i })).toBeDisabled();
  });
});

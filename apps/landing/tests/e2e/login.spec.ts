import { test, expect } from "@playwright/test";
import {
  mockLoginSuccess,
  mockLoginUnauthorized,
  mockLoginEmailNotVerified,
} from "../helpers/routes";

const UNAUTH = { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } };

test.beforeEach(async ({ page }) => {
  // useAuth hook calls /auth/me on every admin page — return 401 silently on auth routes
  await page.route("**/api/auth/me", (route) => route.fulfill({ status: 401, json: UNAUTH }));
  await page.route("**/api/auth/refresh", (route) => route.fulfill({ status: 401, json: UNAUTH }));
  await page.goto("/admin/login");
});

test.describe("Render de la página de login", () => {
  test("muestra el formulario correctamente", async ({ page }) => {
    await expect(page.getByRole("heading")).toContainText("Bienvenido de vuelta");
    await expect(page.locator('input[type=email]')).toBeVisible();
    await expect(page.locator('input[type=password]')).toBeVisible();
    await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
  });

  test("link ¿Olvidaste? apunta a /admin/recover", async ({ page }) => {
    await expect(page.getByRole("link", { name: /olvidaste/i })).toHaveAttribute(
      "href",
      /recover/,
    );
  });

  test("link de registro apunta a /admin/register", async ({ page }) => {
    await expect(page.getByRole("link", { name: /regístrate/i })).toHaveAttribute(
      "href",
      /register/,
    );
  });
});

test.describe("Login exitoso", () => {
  test("guarda tokens en localStorage y redirige", async ({ page }) => {
    await mockLoginSuccess(page);

    await page.locator('input[type=email]').fill("andrea@milacafe.mx");
    await page.locator('input[type=password]').fill("supersecret");
    await page.getByRole("button", { name: /entrar/i }).click();

    await expect(page).not.toHaveURL(/login/);

    const accessToken = await page.evaluate(() =>
      localStorage.getItem("m2_access_token"),
    );
    expect(accessToken).toBe("test-access-token");
  });

  test("envía email y contraseña al backend", async ({ page }) => {
    let body: Record<string, unknown> = {};
    await page.route("**/api/auth/login", async (route) => {
      body = JSON.parse(route.request().postData() ?? "{}");
      await route.fulfill({ status: 200, json: { success: true, data: { accessToken: "t", refreshToken: "r", user: { id: "1", email: "andrea@milacafe.mx", role: "OWNER" } } } });
    });

    await page.locator('input[type=email]').fill("andrea@milacafe.mx");
    await page.locator('input[type=password]').fill("supersecret");
    await page.getByRole("button", { name: /entrar/i }).click();

    expect(body.email).toBe("andrea@milacafe.mx");
    expect(body.password).toBe("supersecret");
  });
});

test.describe("Errores de login", () => {
  test("muestra error con credenciales incorrectas", async ({ page }) => {
    await mockLoginUnauthorized(page);

    await page.locator('input[type=email]').fill("andrea@milacafe.mx");
    await page.locator('input[type=password]').fill("wrongpassword");
    await page.getByRole("button", { name: /entrar/i }).click();

    await expect(page.locator('[data-testid=login-error]')).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });

  test("muestra mensaje de verificación si el email no está verificado", async ({ page }) => {
    await mockLoginEmailNotVerified(page);

    await page.locator('input[type=email]').fill("andrea@milacafe.mx");
    await page.locator('input[type=password]').fill("supersecret");
    await page.getByRole("button", { name: /entrar/i }).click();

    await expect(page.locator('[data-testid=login-error]')).toContainText(/verif/i);
    await expect(page).toHaveURL(/login/);
  });

  test("el botón está deshabilitado con campos vacíos", async ({ page }) => {
    await expect(page.getByRole("button", { name: /entrar/i })).toBeDisabled();
  });
});

test.describe("Toggle de contraseña", () => {
  test("el botón de ojo alterna la visibilidad", async ({ page }) => {
    const pwInput = page.locator('[data-testid=input-password]');
    await expect(pwInput).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: /mostrar/i }).click();
    await expect(pwInput).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: /mostrar/i }).click();
    await expect(pwInput).toHaveAttribute("type", "password");
  });
});

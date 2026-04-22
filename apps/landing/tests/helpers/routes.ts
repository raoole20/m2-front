import type { Page } from "@playwright/test";
import {
  LOGIN_SUCCESS,
  REGISTER_SUCCESS,
  ERROR_UNAUTHORIZED,
  ERROR_EMAIL_NOT_VERIFIED,
  ERROR_CONFLICT,
} from "../fixtures/auth";

export async function mockLoginSuccess(page: Page) {
  await page.route("**/api/auth/login", (route) =>
    route.fulfill({ status: 200, json: LOGIN_SUCCESS }),
  );
}

export async function mockLoginUnauthorized(page: Page) {
  await page.route("**/api/auth/login", (route) =>
    route.fulfill({ status: 401, json: ERROR_UNAUTHORIZED }),
  );
}

export async function mockLoginEmailNotVerified(page: Page) {
  await page.route("**/api/auth/login", (route) =>
    route.fulfill({ status: 401, json: ERROR_EMAIL_NOT_VERIFIED }),
  );
}

export async function mockRegisterSuccess(page: Page) {
  await page.route("**/api/auth/register", (route) =>
    route.fulfill({ status: 201, json: REGISTER_SUCCESS }),
  );
}

export async function mockRegisterConflict(page: Page) {
  await page.route("**/api/auth/register", (route) =>
    route.fulfill({ status: 409, json: ERROR_CONFLICT }),
  );
}

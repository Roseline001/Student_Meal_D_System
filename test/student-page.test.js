// Tests for the student page (student.html + js/student.js).
// The API is replaced with fakes so the page can be tested without a server.
import * as api from "../js/api.js";
import { init } from "../js/student.js";
import { loadPage, submit, fill } from "./helpers.js";

jest.mock("../js/api.js");

const student = {
  id: 1, studentCode: "STU-1001", firstName: "Amina", dateOfBirth: "2012-03-14",
  schoolId: 1, enrolled: true, school: { name: "Riverside Primary School" },
};
const coupon = { id: 1, valuePerMeal: 150, mealsTotal: 60, mealsUsed: 2, dailyLimit: 1, expiresAt: "2099-12-04", status: "active" };

beforeEach(async () => {
  sessionStorage.clear();
  loadPage("student.html");
  api.findStudentByCode.mockResolvedValue(student);
  api.getActiveCoupon.mockResolvedValue(coupon);
  api.getStudentMeals.mockResolvedValue([]);
  api.getRestaurants.mockResolvedValue([]);
  await init();
});

test("an empty form shows an error message", async () => {
  await submit("#login-form");
  expect(document.querySelector('[data-error-for="studentCode"]').textContent).not.toBe("");
});

test("a correct sign in shows the dashboard", async () => {
  fill("#studentCode", "STU-1001");
  fill("#dateOfBirth", "2012-03-14");
  await submit("#login-form");
  expect(document.querySelector("#dashboard-view").hidden).toBe(false);
  expect(document.querySelector("#stat-left").textContent).toBe("58");
});

test("sign out goes back to the login form", async () => {
  fill("#studentCode", "STU-1001");
  fill("#dateOfBirth", "2012-03-14");
  await submit("#login-form");
  document.querySelector("#logout-button").click();
  expect(document.querySelector("#login-view").hidden).toBe(false);
});

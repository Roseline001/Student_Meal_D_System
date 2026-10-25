import * as api from "../js/api.js";
import { init, renderCoupon } from "../js/pages/student.js";
import { loadPage, flush, submit, fill } from "./helpers.js";

// Replace every API function with a Jest mock so no real server is needed.
jest.mock("../js/api.js");

const student = {
  id: 1, studentCode: "STU-1001", firstName: "Amina", lastName: "Otieno", dateOfBirth: "2012-03-14",
  schoolId: 1, grade: "Grade 6", enrolled: true, school: { name: "Riverside Primary School" },
};
const coupon = {
  id: 1, term: "2026 Term 3", valuePerMeal: 150, mealsTotal: 60, mealsUsed: 2,
  dailyLimit: 1, expiresAt: "2099-12-04", status: "active",
};
const restaurants = [
  { id: 1, name: "Mama Oliech Kitchen", address: "20 River Road", openingHours: "07:00 - 16:00", schoolIds: [1], active: true },
  { id: 2, name: "Green Bowl Cafe", address: "9 Campus Way", openingHours: "08:00 - 18:00", schoolIds: [3], active: true },
];
const meals = [
  { id: 1, couponId: 1, amount: 150, meal: "Rice and beans", redeemedAt: new Date().toISOString(), restaurant: restaurants[0] },
];

beforeEach(async () => {
  sessionStorage.clear();
  jest.resetAllMocks();
  loadPage("student.html");
  api.findStudentByCode.mockResolvedValue(student);
  api.getActiveCoupon.mockResolvedValue(coupon);
  api.getStudentMeals.mockResolvedValue(meals);
  api.getRestaurants.mockResolvedValue(restaurants);
  await init();
});

const text = (selector) => document.querySelector(selector).textContent;

test("shows validation errors and does not call the API for an empty form", async () => {
  await submit("#login-form");
  expect(text('[data-error-for="studentCode"]')).toContain("STU-1001");
  expect(api.findStudentByCode).not.toHaveBeenCalled();
});

test("refuses a wrong date of birth", async () => {
  fill("#studentCode", "STU-1001");
  fill("#dateOfBirth", "2010-01-01");
  await submit("#login-form");
  expect(document.querySelector("#dashboard-view").hidden).toBe(true);
  expect(text("#toast-region")).toContain("do not match");
});

test("signs in and shows coupon, stats, nearby restaurants and history", async () => {
  fill("#studentCode", "stu-1001");
  fill("#dateOfBirth", "2012-03-14");
  await submit("#login-form");
  await flush();

  expect(document.querySelector("#dashboard-view").hidden).toBe(false);
  expect(text("#student-name")).toBe("Hello, Amina");
  expect(text("#stat-left")).toBe("58");
  expect(text("#stat-today")).toBe("1 / 1");
  expect(document.querySelectorAll("#restaurant-list li")).toHaveLength(1);
  expect(text("#restaurant-list")).toContain("Mama Oliech Kitchen");
  expect(text("#history-body")).toContain("Rice and beans");
  expect(sessionStorage.getItem("fairplate.studentCode")).toBe("STU-1001");
});

test("sign out returns to the login form", async () => {
  fill("#studentCode", "STU-1001");
  fill("#dateOfBirth", "2012-03-14");
  await submit("#login-form");
  document.querySelector("#logout-button").click();
  expect(document.querySelector("#login-view").hidden).toBe(false);
  expect(sessionStorage.getItem("fairplate.studentCode")).toBeNull();
});

test("shows a server error as a message", async () => {
  api.findStudentByCode.mockRejectedValue(new Error("Cannot reach the server."));
  fill("#studentCode", "STU-1001");
  fill("#dateOfBirth", "2012-03-14");
  await submit("#login-form");
  expect(text("#toast-region")).toContain("Cannot reach the server.");
});

test("restores the session after a reload", async () => {
  sessionStorage.setItem("fairplate.studentCode", "STU-1001");
  await init();
  await flush();
  expect(document.querySelector("#dashboard-view").hidden).toBe(false);
});

test("an unverified student sees an empty coupon and no stats", async () => {
  api.findStudentByCode.mockResolvedValue({ ...student, enrolled: false });
  fill("#studentCode", "STU-1001");
  fill("#dateOfBirth", "2012-03-14");
  await submit("#login-form");
  await flush();
  expect(text("#coupon-ticket")).toContain("No active coupon");
  expect(text("#student-status")).toContain("Waiting");
  expect(api.getActiveCoupon).not.toHaveBeenCalled();
});

test("renderCoupon marks an expired coupon", () => {
  const ticket = document.querySelector("#coupon-ticket");
  renderCoupon(ticket, { ...coupon, expiresAt: "2020-01-01" });
  expect(ticket.className).toContain("ticket--expired");
  expect(ticket.textContent).toContain("Expired");
});

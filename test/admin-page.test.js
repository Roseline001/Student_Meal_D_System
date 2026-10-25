import * as api from "../js/api.js";
import { init, selectTab } from "../js/admin.js";
import { loadPage, flush, submit, fill } from "./helpers.js";

jest.mock("../js/api.js");

const schools = [{ id: 1, name: "Riverside Primary School", level: "primary", city: "Nairobi" }];
const students = [
  { id: 1, studentCode: "STU-1001", firstName: "Amina", lastName: "Otieno", dateOfBirth: "2012-03-14", schoolId: 1, grade: "Grade 6", enrolled: true, verifiedAt: "2026-09-01" },
  { id: 2, studentCode: "STU-1002", firstName: "Brian", lastName: "Mwangi", dateOfBirth: "2009-07-22", schoolId: 1, grade: "Form 2", enrolled: false, verifiedAt: null },
];
const restaurants = [{ id: 1, partnerCode: "RES-501", name: "Mama Oliech Kitchen", address: "20 River Road", schoolIds: [1], active: true }];
const coupons = [{ id: 1, studentId: 1, term: "2026 Term 3", valuePerMeal: 150, mealsTotal: 60, mealsUsed: 2, dailyLimit: 1, expiresAt: "2026-12-04", status: "active" }];

const text = (selector) => document.querySelector(selector).textContent;
const row = (code) => [...document.querySelectorAll("#students-body tr")].find((tr) => tr.textContent.includes(code));

beforeEach(async () => {
  jest.resetAllMocks();
  loadPage("admin.html");
  api.getSchools.mockResolvedValue(schools);
  api.getStudents.mockResolvedValue(students);
  api.getRestaurants.mockResolvedValue(restaurants);
  api.getCoupons.mockResolvedValue(coupons);
  window.confirm = jest.fn(() => true);
  Element.prototype.scrollIntoView = jest.fn(); // not available in jsdom
  await init();
  await flush();
});

test("loads every table and fills the school dropdown", () => {
  expect(document.querySelectorAll("#students-body tr")).toHaveLength(2);
  expect(text("#schools-body")).toContain("Riverside Primary School");
  expect(text("#restaurants-body")).toContain("RES-501");
  expect(text("#coupons-body")).toContain("Amina Otieno");
  expect(document.querySelectorAll("#s-school option")).toHaveLength(2);
  expect(document.querySelector("#c-value").value).toBe("150");
});

test("switches tabs", () => {
  selectTab(document.querySelector("#tab-coupons"));
  expect(document.querySelector("#panel-coupons").hidden).toBe(false);
  expect(document.querySelector("#panel-students").hidden).toBe(true);
});

test("registers a new student with POST, unverified", async () => {
  fill("#s-code", "stu-1004");
  fill("#s-first", "Daniel");
  fill("#s-last", "Kamau");
  fill("#s-dob", "2015-05-05");
  fill("#s-school", "1");
  fill("#s-grade", "Grade 3");
  await submit("#student-form");
  expect(api.createStudent).toHaveBeenCalledWith(expect.objectContaining({
    studentCode: "STU-1004", schoolId: 1, enrolled: false, verifiedAt: null,
  }));
});

test("blocks a duplicate student ID", async () => {
  fill("#s-code", "STU-1001");
  await submit("#student-form");
  expect(text('[data-error-for="studentCode"]')).toContain("already has this ID");
  expect(api.createStudent).not.toHaveBeenCalled();
});

test("edits a student with PUT and keeps their enrollment", async () => {
  row("STU-1001").querySelector('[data-action="edit-student"]').click();
  expect(document.querySelector("#s-first").value).toBe("Amina");
  fill("#s-grade", "Grade 7");
  await submit("#student-form");
  expect(api.replaceStudent).toHaveBeenCalledWith(1, expect.objectContaining({ grade: "Grade 7", enrolled: true }));
});

test("verifies enrollment with PATCH", async () => {
  row("STU-1002").querySelector('[data-action="toggle-enrollment"]').click();
  await flush();
  expect(api.setEnrollment).toHaveBeenCalledWith(2, true);
});

test("deletes a student after confirming", async () => {
  row("STU-1002").querySelector('[data-action="delete-student"]').click();
  await flush();
  expect(window.confirm).toHaveBeenCalled();
  expect(api.deleteStudent).toHaveBeenCalledWith(2);
});

test("issues coupons only to verified students without one", async () => {
  api.getStudents.mockResolvedValue([...students, { ...students[1], id: 3, studentCode: "STU-1003", enrolled: true }]);
  loadPage("admin.html");
  await init();
  await flush();
  fill("#c-term", "2026 Term 3");
  fill("#c-expires", "2026-12-04");
  await submit("#coupon-form");
  expect(api.createCoupon).toHaveBeenCalledTimes(1);
  expect(api.createCoupon).toHaveBeenCalledWith(expect.objectContaining({ studentId: 3, status: "active" }));
});

test("registers a restaurant with the checked schools", async () => {
  fill("#r-code", "RES-600");
  fill("#r-name", "Lake Cafe");
  fill("#r-address", "3 Lake Road");
  document.querySelector('#r-schools input[value="1"]').checked = true;
  await submit("#restaurant-form");
  expect(api.createRestaurant).toHaveBeenCalledWith(expect.objectContaining({ partnerCode: "RES-600", schoolIds: [1], active: true }));
});

test("shows an error message when the API fails", async () => {
  api.getSchools.mockRejectedValue(new Error("Cannot reach the server."));
  loadPage("admin.html");
  await init();
  await flush();
  expect(text("#toast-region")).toContain("Cannot reach the server.");
});

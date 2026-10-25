// Tests for the admin page (admin.html + js/admin.js).
// The API is replaced with fakes so the page can be tested without a server.
import * as api from "../js/api.js";
import { init, selectTab } from "../js/admin.js";
import { loadPage, submit, fill } from "./helpers.js";

jest.mock("../js/api.js");

const schools = [{ id: 1, name: "Riverside Primary School", level: "primary", city: "Nairobi" }];
const students = [
  { id: 1, studentCode: "STU-1001", firstName: "Amina", lastName: "Otieno", dateOfBirth: "2012-03-14", schoolId: 1, grade: "Grade 6", enrolled: true },
];

beforeEach(async () => {
  loadPage("admin.html");
  api.getSchools.mockResolvedValue(schools);
  api.getStudents.mockResolvedValue(students);
  api.getRestaurants.mockResolvedValue([]);
  api.getCoupons.mockResolvedValue([]);
  await init();
});

test("the students table is filled when the page loads", () => {
  expect(document.querySelector("#students-body").textContent).toContain("Amina Otieno");
});

test("clicking a tab shows its panel", () => {
  selectTab(document.querySelector("#tab-schools"));
  expect(document.querySelector("#panel-schools").hidden).toBe(false);
  expect(document.querySelector("#panel-students").hidden).toBe(true);
});

test("registering a new student sends it to the API", async () => {
  fill("#s-code", "STU-1004");
  fill("#s-first", "Daniel");
  fill("#s-last", "Kamau");
  fill("#s-dob", "2015-05-05");
  fill("#s-school", "1");
  fill("#s-grade", "Grade 3");
  await submit("#student-form");
  expect(api.createStudent).toHaveBeenCalled();
});

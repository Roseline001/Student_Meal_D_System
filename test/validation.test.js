// Tests for js/validation.js: checks form input before it is sent to the API.
import { isValidStudentCode, isValidDate, validateStudentLogin, validateStudent, validateSchool } from "../js/validation.js";

test("accepts a student ID like STU-1001", () => {
  expect(isValidStudentCode("STU-1001")).toBe(true);
});

test("rejects a badly formatted student ID", () => {
  expect(isValidStudentCode("1001")).toBe(false);
});

test("rejects a date that does not exist", () => {
  expect(isValidDate("2012-02-31")).toBe(false);
});

test("student login with empty fields gives two errors", () => {
  const errors = validateStudentLogin({ studentCode: "", dateOfBirth: "" });
  expect(errors.studentCode).toBeDefined();
  expect(errors.dateOfBirth).toBeDefined();
});

test("a complete student has no errors", () => {
  const student = {
    studentCode: "STU-1004", firstName: "Daniel", lastName: "Kamau",
    dateOfBirth: "2015-05-05", schoolId: 1, grade: "Grade 3",
  };
  expect(validateStudent(student)).toEqual({});
});

test("a school needs a name, a level and a city", () => {
  const errors = validateSchool({ name: "", level: "", city: "" });
  expect(Object.keys(errors)).toEqual(["name", "level", "city"]);
});

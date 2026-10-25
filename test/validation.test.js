import {
  isValidStudentCode, isValidPartnerCode, isValidDate, validateStudentLogin, validatePartnerLogin,
  validateStudent, validateSchool, validateRestaurant, validateCouponSettings, hasErrors,
} from "../js/validation.js";

describe("code formats", () => {
  test("accepts student IDs like STU-1001, in any letter case", () => {
    expect(isValidStudentCode("STU-1001")).toBe(true);
    expect(isValidStudentCode(" stu-1001 ")).toBe(true);
  });

  test("rejects badly formatted student IDs", () => {
    expect(isValidStudentCode("1001")).toBe(false);
    expect(isValidStudentCode("STU-12")).toBe(false);
    expect(isValidStudentCode(undefined)).toBe(false);
  });

  test("checks partner codes", () => {
    expect(isValidPartnerCode("res-501")).toBe(true);
    expect(isValidPartnerCode("RES-5")).toBe(false);
  });
});

describe("isValidDate", () => {
  test("accepts real dates", () => {
    expect(isValidDate("2012-03-14")).toBe(true);
  });

  test("rejects impossible or empty dates", () => {
    expect(isValidDate("2012-02-31")).toBe(false);
    expect(isValidDate("14/03/2012")).toBe(false);
    expect(isValidDate("")).toBe(false);
  });
});

describe("login forms", () => {
  test("student login needs an ID and a date of birth", () => {
    expect(validateStudentLogin({ studentCode: "STU-1001", dateOfBirth: "2012-03-14" })).toEqual({});
    const errors = validateStudentLogin({ studentCode: "", dateOfBirth: "" });
    expect(Object.keys(errors)).toEqual(["studentCode", "dateOfBirth"]);
  });

  test("partner login needs a partner code", () => {
    expect(validatePartnerLogin({ partnerCode: "RES-501" })).toEqual({});
    expect(validatePartnerLogin({ partnerCode: "nope" })).toHaveProperty("partnerCode");
  });
});

describe("validateStudent", () => {
  const valid = {
    studentCode: "STU-1004", firstName: "Daniel", lastName: "Kamau",
    dateOfBirth: "2015-05-05", schoolId: 1, grade: "Grade 3",
  };

  test("passes a complete student", () => {
    expect(hasErrors(validateStudent(valid))).toBe(false);
  });

  test("reports every missing field", () => {
    const errors = validateStudent({});
    expect(Object.keys(errors).sort()).toEqual(
      ["dateOfBirth", "firstName", "grade", "lastName", "schoolId", "studentCode"]
    );
  });

  test("rejects a birth date in the future", () => {
    expect(validateStudent({ ...valid, dateOfBirth: "2999-01-01" })).toHaveProperty("dateOfBirth");
  });
});

describe("validateSchool", () => {
  test("passes a complete school", () => {
    expect(validateSchool({ name: "Lake School", level: "primary", city: "Kisumu" })).toEqual({});
  });

  test("rejects short names and unknown levels", () => {
    const errors = validateSchool({ name: "AB", level: "college", city: "" });
    expect(Object.keys(errors)).toEqual(["name", "level", "city"]);
  });
});

describe("validateRestaurant", () => {
  test("needs at least one nearby school", () => {
    const restaurant = { partnerCode: "RES-600", name: "Cafe", address: "1 Road", schoolIds: [] };
    expect(validateRestaurant(restaurant)).toHaveProperty("schoolIds");
    expect(validateRestaurant({ ...restaurant, schoolIds: [1] })).toEqual({});
  });
});

describe("validateCouponSettings", () => {
  const valid = { term: "2027 Term 1", valuePerMeal: "150", mealsTotal: "60", dailyLimit: "1", expiresAt: "2027-04-01" };

  test("passes sensible settings", () => {
    expect(validateCouponSettings(valid)).toEqual({});
  });

  test("rejects zero, decimals and a missing date", () => {
    const errors = validateCouponSettings({ term: " ", valuePerMeal: "0", mealsTotal: "2.5", dailyLimit: "0", expiresAt: "" });
    expect(Object.keys(errors)).toEqual(["term", "valuePerMeal", "mealsTotal", "dailyLimit", "expiresAt"]);
  });
});

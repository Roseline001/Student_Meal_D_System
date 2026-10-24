// validation.js: checks form input before anything is sent to the API.
// Each validator returns an object of { fieldName: "error message" }.
// An empty object means the input is valid.

export const STUDENT_CODE_PATTERN = /^STU-\d{4,}$/;
export const PARTNER_CODE_PATTERN = /^RES-\d{3,}$/;

export const isBlank = (value) => String(value ?? "").trim() === "";

export function isValidStudentCode(code) {
  return STUDENT_CODE_PATTERN.test(String(code ?? "").trim().toUpperCase());
}

export function isValidPartnerCode(code) {
  return PARTNER_CODE_PATTERN.test(String(code ?? "").trim().toUpperCase());
}

// A real calendar date in YYYY-MM-DD format.
export function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function validateStudentLogin({ studentCode, dateOfBirth }) {
  const errors = {};
  if (!isValidStudentCode(studentCode)) errors.studentCode = "Enter a student ID like STU-1001.";
  if (!isValidDate(dateOfBirth)) errors.dateOfBirth = "Enter your date of birth.";
  return errors;
}

export function validatePartnerLogin({ partnerCode }) {
  return isValidPartnerCode(partnerCode) ? {} : { partnerCode: "Enter a partner code like RES-501." };
}

export function validateStudent(student) {
  const errors = {};
  if (!isValidStudentCode(student.studentCode)) errors.studentCode = "Use the format STU-1234.";
  if (isBlank(student.firstName)) errors.firstName = "First name is required.";
  if (isBlank(student.lastName)) errors.lastName = "Last name is required.";
  if (!isValidDate(student.dateOfBirth)) errors.dateOfBirth = "Enter a valid date of birth.";
  else if (new Date(student.dateOfBirth) > new Date()) errors.dateOfBirth = "Date of birth cannot be in the future.";
  if (!student.schoolId) errors.schoolId = "Choose a school.";
  if (isBlank(student.grade)) errors.grade = "Grade or year is required.";
  return errors;
}

export function validateSchool(school) {
  const errors = {};
  if (isBlank(school.name) || school.name.trim().length < 3) errors.name = "School name needs at least 3 characters.";
  if (!["preschool", "primary", "secondary", "university"].includes(school.level)) errors.level = "Choose a level.";
  if (isBlank(school.city)) errors.city = "City is required.";
  return errors;
}

export function validateRestaurant(restaurant) {
  const errors = {};
  if (!isValidPartnerCode(restaurant.partnerCode)) errors.partnerCode = "Use the format RES-123.";
  if (isBlank(restaurant.name)) errors.name = "Restaurant name is required.";
  if (isBlank(restaurant.address)) errors.address = "Address is required.";
  if (!Array.isArray(restaurant.schoolIds) || restaurant.schoolIds.length === 0) {
    errors.schoolIds = "Pick at least one nearby school.";
  }
  return errors;
}

export function validateCouponSettings(settings) {
  const errors = {};
  if (isBlank(settings.term)) errors.term = "Term name is required.";
  if (!(Number(settings.valuePerMeal) > 0)) errors.valuePerMeal = "Value must be more than 0.";
  if (!Number.isInteger(Number(settings.mealsTotal)) || Number(settings.mealsTotal) < 1) {
    errors.mealsTotal = "Meals must be a whole number of at least 1.";
  }
  if (!Number.isInteger(Number(settings.dailyLimit)) || Number(settings.dailyLimit) < 1) {
    errors.dailyLimit = "Daily limit must be at least 1.";
  }
  if (!isValidDate(settings.expiresAt)) errors.expiresAt = "Choose an expiry date.";
  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;

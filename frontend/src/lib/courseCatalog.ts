const COURSE_NAMES_BY_CODE: Record<string, string> = {
  R1UC403B: "Operating System",
  R1UC406B: "Data Communication & Networking",
  R1UC407B: "Design and Analysis of Algorithm",
  R1UC427B: "Python Programming",
  R1UC428T: "Theory of Computation",
  R1UC426T: "Cyber Security",
  R1UC425L: "Aptitude Proficiency",
};

export function getCourseName(courseCode?: string) {
  const normalizedCode = courseCode?.trim().toUpperCase();
  if (!normalizedCode) return "Course";

  return COURSE_NAMES_BY_CODE[normalizedCode] || "Course";
}

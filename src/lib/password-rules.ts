/** Password rules shared by the browser checklist and the server validation. */
export const PASSWORD_RULES = [
  { id: "length", label: "Al menos 8 caracteres", test: (p: string) => p.length >= 8 },
  { id: "upper", label: "Una letra mayúscula (A-Z)", test: (p: string) => /\p{Lu}/u.test(p) },
  { id: "lower", label: "Una letra minúscula (a-z)", test: (p: string) => /\p{Ll}/u.test(p) },
  { id: "number", label: "Un número (0-9)", test: (p: string) => /\d/.test(p) },
] as const;

/** Returns the first unmet rule as a Spanish message, or null when the password is valid. */
export function passwordProblem(p: string) {
  const failed = PASSWORD_RULES.find((r) => !r.test(p));
  return failed ? `La contraseña necesita: ${failed.label.toLowerCase()}.` : null;
}

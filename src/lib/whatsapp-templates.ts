/**
 * WhatsApp Cloud API message templates.
 * Meta only lets a business START a conversation with pre-approved templates, so every
 * automatic notice has one here. `npm run whatsapp:templates` submits them all to Meta.
 *
 * Rules Meta enforces: {{n}} placeholders in order, the body can't start or end with one,
 * and each needs an example value for the reviewer.
 */
export type TemplateDef = {
  name: string;
  body: string;
  examples: string[];
  /** URL button: "static" opens the app; "token" appends a variable (used for the reset link). */
  button?: { text: string; path: string; kind: "static" | "token" };
};

export const TEMPLATES = {
  newRequest: {
    name: "palapa_solicitud_nueva",
    body: "Nueva solicitud de la Palapa: {{1}} ({{2}}) la pidió para el {{3}}, de {{4}}. Motivo: {{5}}. Revísala en la app para aprobarla o rechazarla.",
    examples: ["Ana Pérez", "Casa 12", "sábado, 4 de octubre de 2026", "2:00 p. m. a 6:00 p. m.", "Cumpleaños de mi hija"],
    button: { text: "Revisar solicitud", path: "/dashboard/aprobador", kind: "static" },
  },
  approved: {
    name: "palapa_reserva_aprobada",
    body: "¡Hola {{1}}! Tu reservación de la Palapa para el {{2}}, de {{3}}, fue APROBADA. ¡Que disfrutes tu evento!",
    examples: ["Ana", "sábado, 4 de octubre de 2026", "2:00 p. m. a 6:00 p. m."],
    button: { text: "Ver mi reservación", path: "/dashboard", kind: "static" },
  },
  rejected: {
    name: "palapa_reserva_rechazada",
    body: "Hola {{1}}. Tu solicitud de la Palapa para el {{2}}, de {{3}}, no fue aprobada. Motivo: {{4}}. Puedes elegir otra fecha en la app.",
    examples: ["Ana", "sábado, 4 de octubre de 2026", "2:00 p. m. a 6:00 p. m.", "Ese día hay mantenimiento"],
    button: { text: "Elegir otra fecha", path: "/dashboard", kind: "static" },
  },
  cancelledByStaff: {
    name: "palapa_reserva_cancelada",
    body: "Hola {{1}}. Tu reservación de la Palapa para el {{2}}, de {{3}}, fue cancelada por la administración. Motivo: {{4}}. Puedes elegir otra fecha en la app.",
    examples: ["Ana", "sábado, 4 de octubre de 2026", "2:00 p. m. a 6:00 p. m.", "Reparación urgente del techo"],
    button: { text: "Elegir otra fecha", path: "/dashboard", kind: "static" },
  },
  slotFreed: {
    name: "palapa_horario_liberado",
    body: "Aviso de la Palapa: {{1}} ({{2}}) canceló su reservación del {{3}}, de {{4}}. El horario quedó libre.",
    examples: ["Ana Pérez", "Casa 12", "sábado, 4 de octubre de 2026", "2:00 p. m. a 6:00 p. m."],
  },
  newAccount: {
    name: "palapa_cuenta_nueva",
    body: "Nueva cuenta por aprobar en la app de la Palapa: {{1}} ({{2}}), teléfono {{3}}. Confirma que vive en el residencial y apruébala en la sección Vecinos.",
    examples: ["Luis Gómez", "Casa 27", "5533334444"],
    button: { text: "Revisar cuentas", path: "/dashboard/admin/usuarios", kind: "static" },
  },
  accountApproved: {
    name: "palapa_cuenta_aprobada",
    body: "¡Hola {{1}}! Tu cuenta de la app de la Palapa ya fue aprobada. Entra con tu correo {{2}} y tu contraseña.",
    examples: ["Luis", "luis@correo.com"],
    button: { text: "Entrar a la app", path: "/login", kind: "static" },
  },
  passwordReset: {
    name: "palapa_nueva_contrasena",
    body: "Hola {{1}}. Recibimos una solicitud para cambiar tu contraseña de la app de la Palapa. Toca el botón para crear una nueva; el enlace funciona una sola vez durante 24 horas.",
    examples: ["Ana"],
    button: { text: "Crear contraseña", path: "/restablecer?token=", kind: "token" },
  },
} satisfies Record<string, TemplateDef>;

export type TemplateKey = keyof typeof TEMPLATES;

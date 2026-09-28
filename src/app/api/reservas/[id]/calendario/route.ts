import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff } from "@/lib/session";
import { buildIcs } from "@/lib/calendar";

/** Downloads an approved reservation as an .ics file (Apple Calendar, Outlook, etc.). */
export async function GET(_req: Request, ctx: RouteContext<"/api/reservas/[id]/calendario">) {
  const user = await getCurrentUser();
  if (!user) return new Response("No autorizado", { status: 401 });

  const { id } = await ctx.params;
  const r = await prisma.reservation.findUnique({ where: { id } });
  if (!r || r.status !== "APPROVED" || (r.userId !== user.id && !isStaff(user.role)))
    return new Response("No encontrado", { status: 404 });

  return new Response(buildIcs(r), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="palapa-${r.date}.ics"`,
    },
  });
}

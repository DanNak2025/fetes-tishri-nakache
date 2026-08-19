import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { plannerState } from "../../../db/schema";

const defaultNames = ["Personne 1", "Personne 2", "Personne 3", "Personne 4", "Personne 5"];
const validStatuses = new Set(["yes", "maybe", "no"]);

function defaultPlanning() {
  return { names: defaultNames, attendance: {} as Record<string, "yes" | "maybe" | "no"> };
}

export async function GET() {
  const db = getDb();
  const [row] = await db.select().from(plannerState).where(eq(plannerState.id, 1)).limit(1);
  if (!row) return Response.json(defaultPlanning());
  return Response.json({ names: JSON.parse(row.names), attendance: JSON.parse(row.attendance) });
}

export async function POST(request: Request) {
  const data = await request.json() as { names?: unknown; attendance?: unknown };
  const names = Array.isArray(data.names) && data.names.length === 5
    ? data.names.map((name) => String(name).trim().slice(0, 40) || "Personne")
    : defaultNames;
  const attendance = Object.fromEntries(Object.entries((data.attendance ?? {}) as Record<string, unknown>)
    .filter(([key, value]) => /^[a-z0-9-]+-[0-4]$/.test(key) && typeof value === "string" && validStatuses.has(value)));
  const now = new Date();
  const db = getDb();
  await db.insert(plannerState).values({ id: 1, names: JSON.stringify(names), attendance: JSON.stringify(attendance), updatedAt: now })
    .onConflictDoUpdate({ target: plannerState.id, set: { names: JSON.stringify(names), attendance: JSON.stringify(attendance), updatedAt: now } });
  return Response.json({ names, attendance });
}

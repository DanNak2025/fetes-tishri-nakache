import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { plannerState } from "../../../db/schema";

const defaultNames = ["Personne 1", "Personne 2", "Personne 3", "Personne 4", "Personne 5"];
const validStatuses = new Set(["yes", "maybe", "no"]);

function defaultPlanning() {
  return { names: defaultNames, people: [1, 1, 1, 1, 1], menus: {} as Record<string, string>, attendance: {} as Record<string, "yes" | "maybe" | "no">, finished: [] as number[] };
}

export async function GET() {
  const db = getDb();
  const [row] = await db.select().from(plannerState).where(eq(plannerState.id, 1)).limit(1);
  if (!row) return Response.json(defaultPlanning());
  return Response.json({ names: JSON.parse(row.names), people: JSON.parse(row.people), menus: JSON.parse(row.menus), attendance: JSON.parse(row.attendance), finished: JSON.parse(row.finished) });
}

export async function POST(request: Request) {
  const data = await request.json() as { names?: unknown; people?: unknown; menus?: unknown; attendance?: unknown; finished?: unknown };
  const names = Array.isArray(data.names) && data.names.length === 5
    ? data.names.map((name) => String(name).trim().slice(0, 40) || "Personne")
    : defaultNames;
  const attendance = Object.fromEntries(Object.entries((data.attendance ?? {}) as Record<string, unknown>)
    .filter(([key, value]) => /^[a-z0-9-]+-[0-4]$/.test(key) && typeof value === "string" && validStatuses.has(value)));
  const people = Array.isArray(data.people) && data.people.length === 5
    ? data.people.map((count) => Math.max(1, Math.min(4, Number(count) || 1)))
    : [1, 1, 1, 1, 1];
  const menus = Object.fromEntries(Object.entries((data.menus ?? {}) as Record<string, unknown>)
    .filter(([key, value]) => /^[a-z0-9-]+$/.test(key) && typeof value === "string" && value.trim())
    .map(([key, value]) => [key, String(value).trim().slice(0, 500)]));
  const finished = Array.isArray(data.finished) ? [...new Set(data.finished.filter((index): index is number => Number.isInteger(index) && index >= 0 && index < 5))] : [];
  const now = new Date();
  const db = getDb();
  await db.insert(plannerState).values({ id: 1, names: JSON.stringify(names), people: JSON.stringify(people), menus: JSON.stringify(menus), attendance: JSON.stringify(attendance), finished: JSON.stringify(finished), updatedAt: now })
    .onConflictDoUpdate({ target: plannerState.id, set: { names: JSON.stringify(names), people: JSON.stringify(people), menus: JSON.stringify(menus), attendance: JSON.stringify(attendance), finished: JSON.stringify(finished), updatedAt: now } });
  return Response.json({ names, people, menus, attendance, finished });
}

import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const plannerState = sqliteTable("planner_state", {
  id: integer("id").primaryKey(),
  names: text("names").notNull(),
  people: text("people").notNull().default("[1,1,1,1,1]"),
  menus: text("menus").notNull().default("{}"),
  attendance: text("attendance").notNull(),
  finished: text("finished").notNull().default("[]"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

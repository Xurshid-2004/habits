import { supabase } from "@/lib/supabase";

export type HabitStatus = "not_done" | "in_progress" | "success";

export type HabitSelectionRow = {
  user_id: string;
  habit_id: number;
  created_at?: string;
};

export type HabitLogRow = {
  user_id: string;
  habit_id: number;
  date: string; // YYYY-MM-DD
  done?: boolean;
  status?: HabitStatus;
  created_at?: string;
  updated_at?: string;
};

export function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getSelectedHabitIds(userId: string): Promise<number[]> {
  const { data, error } = await supabase
    .from("habit_selections")
    .select("habit_id")
    .eq("user_id", userId);

  if (error) {
    // Table yo'q bo'lishi mumkin — fallback uchun errorni yuqoriga uzatmaymiz
    console.warn("getSelectedHabitIds error:", error.message);
    return [];
  }

  const ids: number[] = [];
  for (const row of data || []) {
    const raw = (row as { habit_id?: unknown }).habit_id;
    const n = Number(String(raw));
    if (Number.isFinite(n)) ids.push(n);
  }
  return ids;
}

export async function setHabitSelected(userId: string, habitId: number, selected: boolean) {
  if (selected) {
    const { error } = await supabase
      .from("habit_selections")
      .upsert({ user_id: userId, habit_id: habitId } satisfies HabitSelectionRow, {
        onConflict: "user_id,habit_id",
      });
    if (error) {
      console.warn("setHabitSelected(upsert) error:", error.message);
    }
    return;
  }

  const { error } = await supabase
    .from("habit_selections")
    .delete()
    .eq("user_id", userId)
    .eq("habit_id", habitId);

  if (error) {
    console.warn("setHabitSelected(delete) error:", error.message);
  }
}

function isMissingColumnError(message: string, column: string) {
  const m = message.toLowerCase();
  return m.includes("column") && m.includes(column.toLowerCase()) && m.includes("does not exist");
}

function doneToStatus(done: boolean): HabitStatus {
  return done ? "success" : "not_done";
}

export async function getHabitLogsByDate(userId: string, dateKey: string): Promise<Record<number, HabitStatus>> {
  // Prefer status column; fallback to done boolean if schema not migrated yet.
  const tryStatus = await supabase
    .from("habit_logs")
    .select("habit_id, status")
    .eq("user_id", userId)
    .eq("date", dateKey);

  if (!tryStatus.error) {
    const map: Record<number, HabitStatus> = {};
    for (const row of tryStatus.data || []) {
      const r = row as { habit_id: number; status: HabitStatus | null };
      map[r.habit_id] = r.status ?? "not_done";
    }
    return map;
  }

  if (!isMissingColumnError(tryStatus.error.message, "status")) {
    console.warn("getHabitLogsByDate error:", tryStatus.error.message);
    return {};
  }

  const fallback = await supabase
    .from("habit_logs")
    .select("habit_id, done")
    .eq("user_id", userId)
    .eq("date", dateKey);

  if (fallback.error) {
    console.warn("getHabitLogsByDate fallback error:", fallback.error.message);
    return {};
  }

  const map: Record<number, HabitStatus> = {};
  for (const row of fallback.data || []) {
    const r = row as { habit_id: number; done: boolean };
    map[r.habit_id] = doneToStatus(!!r.done);
  }
  return map;
}

export async function setHabitStatus(userId: string, habitId: number, dateKey: string, status: HabitStatus) {
  // If user sets status back to not_done, we store explicit row for now (so stats/history works).
  const tryStatus = await supabase
    .from("habit_logs")
    .upsert(
      { user_id: userId, habit_id: habitId, date: dateKey, status, done: status === "success" } satisfies HabitLogRow,
      { onConflict: "user_id,habit_id,date" },
    );

  if (!tryStatus.error) return;

  if (!isMissingColumnError(tryStatus.error.message, "status")) {
    console.warn("setHabitStatus error:", tryStatus.error.message);
    return;
  }

  // Fallback: old schema (done only)
  const { error } = await supabase
    .from("habit_logs")
    .upsert(
      { user_id: userId, habit_id: habitId, date: dateKey, done: status === "success" } satisfies HabitLogRow,
      { onConflict: "user_id,habit_id,date" },
    );

  if (error) console.warn("setHabitStatus fallback error:", error.message);
}

export async function getStatusCountsInRange(userId: string, start: string, end: string) {
  const tryStatus = await supabase
    .from("habit_logs")
    .select("status")
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end);

  if (!tryStatus.error) {
    const total = (tryStatus.data || []).length;
    const success = (tryStatus.data || []).filter((r: { status: HabitStatus | null }) => r.status === "success").length;
    const in_progress = (tryStatus.data || []).filter((r: { status: HabitStatus | null }) => r.status === "in_progress").length;
    const not_done = total - success - in_progress;
    return { total, success, in_progress, not_done };
  }

  if (!isMissingColumnError(tryStatus.error.message, "status")) {
    console.warn("getStatusCountsInRange error:", tryStatus.error.message);
    return { total: 0, success: 0, in_progress: 0, not_done: 0 };
  }

  const fallback = await supabase
    .from("habit_logs")
    .select("done")
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end);

  if (fallback.error) {
    console.warn("getStatusCountsInRange fallback error:", fallback.error.message);
    return { total: 0, success: 0, in_progress: 0, not_done: 0 };
  }

  const total = (fallback.data || []).length;
  const success = (fallback.data || []).filter((r: { done: boolean }) => !!r.done).length;
  const not_done = total - success;
  return { total, success, in_progress: 0, not_done };
}

export async function getDailyStatusSeries(userId: string, days: number) {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));

  const startKey = formatDateKey(start);
  const endKey = formatDateKey(end);

  const tryStatus = await supabase
    .from("habit_logs")
    .select("date, status")
    .eq("user_id", userId)
    .gte("date", startKey)
    .lte("date", endKey);

  const byDay: Record<string, { success: number; in_progress: number; not_done: number; total: number }> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = formatDateKey(d);
    byDay[key] = { success: 0, in_progress: 0, not_done: 0, total: 0 };
  }

  if (!tryStatus.error) {
    for (const row of tryStatus.data || []) {
      const r = row as { date: string; status: HabitStatus | null };
      const key = String(r.date);
      const bucket = byDay[key] ?? (byDay[key] = { success: 0, in_progress: 0, not_done: 0, total: 0 });
      bucket.total += 1;
      if (r.status === "success") bucket.success += 1;
      else if (r.status === "in_progress") bucket.in_progress += 1;
      else bucket.not_done += 1;
    }
    return Object.entries(byDay).map(([date, v]) => ({ date, ...v }));
  }

  if (!isMissingColumnError(tryStatus.error.message, "status")) {
    console.warn("getDailyStatusSeries error:", tryStatus.error.message);
    return Object.entries(byDay).map(([date, v]) => ({ date, ...v }));
  }

  const fallback = await supabase
    .from("habit_logs")
    .select("date, done")
    .eq("user_id", userId)
    .gte("date", startKey)
    .lte("date", endKey);

  if (fallback.error) {
    console.warn("getDailyStatusSeries fallback error:", fallback.error.message);
    return Object.entries(byDay).map(([date, v]) => ({ date, ...v }));
  }

  for (const row of fallback.data || []) {
    const r = row as { date: string; done: boolean };
    const key = String(r.date);
    const bucket = byDay[key] ?? (byDay[key] = { success: 0, in_progress: 0, not_done: 0, total: 0 });
    bucket.total += 1;
    if (r.done) bucket.success += 1;
    else bucket.not_done += 1;
  }

  return Object.entries(byDay).map(([date, v]) => ({ date, ...v }));
}

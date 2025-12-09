import fs from "fs";
import path from "path";
import { Task } from "./types";

const TASKS_FILE = path.join(__dirname, "..", "tasks.json");

export function loadTasksFromFile(): Task[] {
  try {
    if (!fs.existsSync(TASKS_FILE)) {
      return [];
    }

    const raw = fs.readFileSync(TASKS_FILE, "utf-8").trim();
    if (!raw) return [];

    const json = JSON.parse(raw) as any[];

    const tasks: Task[] = json.map((t) => ({
      id: String(t.id),
      text: String(t.text),
      done: Boolean(t.done),
      createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
    }));

    return tasks;
  } catch (err) {
    console.error("[storage] Failed to load tasks:", err);
    return [];
  }
}

export function saveTasksToFile(tasks: Task[]): void {
  try {
    const data = JSON.stringify(tasks, null, 2);
    fs.writeFileSync(TASKS_FILE, data, "utf-8");
  } catch (err) {
    console.error("[storage] Failed to save tasks:", err);
  }
}

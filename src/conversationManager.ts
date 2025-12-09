import { ConversationState } from "./types";
import {
  addTask,
  listTasks,
  completeTaskByIndex,
  deleteTaskByIndex,
  editTaskByIndex,
} from "./taskManager";
import { askGemini } from "./geminiClient";

import { getWeather, getDailyQuote } from "./apis";

import { loadTasksFromFile } from "./storage";

export function createInitialState(): ConversationState {
  const tasks = loadTasksFromFile();

  return {
    tasks,
    history: [],
  };
}

export async function handleUserInput(
  input: string,
  state: ConversationState
): Promise<string> {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  state.history.push({ role: "user", content: input });

  if (lower === "help") {
    const reply = [
      "Here are the available commands:",
      "  add task: <text>         - add a new task",
      "  list tasks               - show all tasks",
      "  done: <number>           - mark a task as done (by its number from list tasks)",
      "  delete: <number>         - delete a task by its number",
      "  edit: <number>: <text>   - edit the text of a task",
      "  stats                    - show task statistics (done vs total)",
      "  day summary: <your day>  - get a productivity-focused summary of your day",
      "  daily: <city>            - get a daily recommendation using real weather + quote",
      "  help                     - show this help message",
      "  exit                     - quit the app (handled in the CLI)",
    ].join("\n");

    state.history.push({ role: "assistant", content: reply });
    return reply;
  }


  if (lower === "stats") {
    const total = state.tasks.length;
    const done = state.tasks.filter((t) => t.done).length;
    const pending = total - done;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    const reply = [
      "📊 Task stats:",
      `- Total tasks: ${total}`,
      `- Done: ${done}`,
      `- Pending: ${pending}`,
      `- Completion rate: ${percent}%`,
    ].join("\n");

    state.history.push({ role: "assistant", content: reply });
    return reply;
  }

  if (lower.startsWith("add task:")) {
    const text = trimmed.slice("add task:".length).trim();
    if (!text) {
      const reply = "Please provide task text after 'add task:'.";
      state.history.push({ role: "assistant", content: reply });
      return reply;
    }

    const task = addTask(state, text);
    const reply = `Added task #${state.tasks.length}: "${task.text}"`;
    state.history.push({ role: "assistant", content: reply });
    return reply;
  }

  if (lower === "list tasks") {
    const tasks = listTasks(state);

    if (tasks.length === 0) {
      const reply = "You have no tasks yet 🎉";
      state.history.push({ role: "assistant", content: reply });
      return reply;
    }

    let lines = ["Here are your tasks:"];
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      const status = t.done ? "[x]" : "[ ]";
      lines.push(`  ${i + 1}. ${status} ${t.text}`);
    }
    const reply = lines.join("\n");
    state.history.push({ role: "assistant", content: reply });
    return reply;
  }

  if (lower.startsWith("done:")) {
    const numPart = trimmed.slice("done:".length).trim();
    const index = Number(numPart);

    if (Number.isNaN(index) || index <= 0) {
      const reply = "Please provide a valid task number after 'done:'.";
      state.history.push({ role: "assistant", content: reply });
      return reply;
    }

    const task = completeTaskByIndex(state, index);
    if (!task) {
      const reply = "Task not found. Use 'list tasks' to see numbers.";
      state.history.push({ role: "assistant", content: reply });
      return reply;
    }

    const reply = `Marked task #${index} as done ✓`;
    state.history.push({ role: "assistant", content: reply });
    return reply;
  }

  if (lower.startsWith("delete:")) {
    const numPart = trimmed.slice("delete:".length).trim();
    const index = Number(numPart);

    if (Number.isNaN(index) || index <= 0) {
      const reply =
        "Please provide a valid task number after 'delete:'. Example: delete: 2";
      state.history.push({ role: "assistant", content: reply });
      return reply;
    }

    const removed = deleteTaskByIndex(state, index);
    if (!removed) {
      const reply =
        "Task not found. Use 'list tasks' to see available task numbers.";
      state.history.push({ role: "assistant", content: reply });
      return reply;
    }

    const reply = `Deleted task #${index}: "${removed.text}"`;
    state.history.push({ role: "assistant", content: reply });
    return reply;
  }

  if (lower.startsWith("edit:")) {
    const rest = trimmed.slice("edit:".length).trim();

    const [indexPart, ...textParts] = rest.split(":");
    const index = Number(indexPart?.trim());
    const newText = textParts.join(":").trim();

    if (Number.isNaN(index) || index <= 0) {
      const reply =
        "Please provide a valid task number after 'edit:'. Example: edit: 1: new task text";
      state.history.push({ role: "assistant", content: reply });
      return reply;
    }

    if (!newText) {
      const reply =
        "Please provide new text after the task number. Example: edit: 1: finish my assignment today";
      state.history.push({ role: "assistant", content: reply });
      return reply;
    }

    const updated = editTaskByIndex(state, index, newText);
    if (!updated) {
      const reply =
        "Task not found. Use 'list tasks' to see available task numbers.";
      state.history.push({ role: "assistant", content: reply });
      return reply;
    }

    const reply = `Updated task #${index} to: "${updated.text}"`;
    state.history.push({ role: "assistant", content: reply });
    return reply;
  }

  if (
    lower.startsWith("day summary:") ||
    lower.startsWith("summarize my day:")
  ) {
    const reply = await askGemini({
      state,
      userInput: input,
      mode: "DAY_SUMMARY",
    });
    state.history.push({ role: "assistant", content: reply });
    return reply;
  }

  if (lower.startsWith("daily:") || lower.startsWith("daily recommendation:")) {
    const colonIndex = trimmed.indexOf(":");
    const cityRaw = colonIndex >= 0 ? trimmed.slice(colonIndex + 1).trim() : "";
    const city = cityRaw || "your area";

    const weather = await getWeather(city);
    const quote = await getDailyQuote();

    const reply = await askGemini({
      state,
      userInput: input,
      mode: "DAILY_RECOMMENDATION",
      weather,
      quote,
    });

    state.history.push({ role: "assistant", content: reply });
    return reply;
  }

  const reply = await askGemini({
    state,
    userInput: input,
    mode: "SMALL_TALK",
  });
  state.history.push({ role: "assistant", content: reply });
  return reply;
}

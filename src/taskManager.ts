
import { randomUUID } from "crypto";
import { ConversationState, Task } from "./types";
import { saveTasksToFile } from "./storage";

export function addTask(state: ConversationState, text: string): Task {
  const task: Task = {
    id: randomUUID(),
    text,
    done: false,
    createdAt: new Date(),
  };

  state.tasks.push(task);
  saveTasksToFile(state.tasks);

  return task;
}

export function editTaskByIndex(
  state: ConversationState,
  index: number,
  newText: string
): Task | null {
  const realIndex = index - 1;

  if (realIndex < 0 || realIndex >= state.tasks.length) {
    return null;
  }

  const task = state.tasks[realIndex];
  task.text = newText;
  saveTasksToFile(state.tasks);
  return task;
}



export function listTasks(state: ConversationState): Task[] {
  return state.tasks;
}

export function completeTaskByIndex(
  state: ConversationState,
  index: number
): Task | null {
  const realIndex = index - 1;

  if (realIndex < 0 || realIndex >= state.tasks.length) {
    return null;
  }

  const task = state.tasks[realIndex];
  task.done = true;

  saveTasksToFile(state.tasks);

  return task;
}

export function deleteTaskByIndex(
  state: ConversationState,
  index: number
): Task | null {
  const realIndex = index - 1;

  if (realIndex < 0 || realIndex >= state.tasks.length) {
    return null;
  }

  const [removed] = state.tasks.splice(realIndex, 1);
  saveTasksToFile(state.tasks);
  return removed;
}


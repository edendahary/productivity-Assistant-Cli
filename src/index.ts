import "dotenv/config";
import readline from "readline";
import { ConversationState } from "./types";
import { createInitialState, handleUserInput } from "./conversationManager";

function createCli() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function ask(question: string): Promise<string> {
    return new Promise((resolve) => {
      rl.question(question, (answer) => resolve(answer));
    });
  }

  return { rl, ask };
}

async function main() {
  const { rl, ask } = createCli();

  const state: ConversationState = createInitialState();

  console.log("Hello! I'm your Productivity Assistant 🙂");
  console.log("Here are the available commands:\n");
  console.log("  add task: <text>         - add a new task");
  console.log("  list tasks               - show all tasks");
  console.log("  done: <number>           - mark a task as done");
  console.log("  delete: <number>         - delete a task by its number");
  console.log("  edit: <number>: <text>   - edit a task's text");
  console.log(
    "  stats                    - show task statistics (done vs total)"
  );
  console.log("  day summary: <your day>  - summarize your day with Gemini");
  console.log(
    "  daily: <city>            - daily recommendations using real weather + quotes"
  );
  console.log("  help                     - show this help message again");
  console.log("  exit                     - quit the app\n");
  console.log("Type 'help' anytime to see the full list again.\n");

  while (true) {
    const input = await ask("You: ");

    if (input.trim().toLowerCase() === "exit") {
      console.log("Assistant: Bye 👋");
      break;
    }

    const reply = await handleUserInput(input, state);
    console.log("Assistant:", reply);
  }

  rl.close();
}

main().catch((err) => {
  console.error("Unexpected error:", err);
});

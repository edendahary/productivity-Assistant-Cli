
export interface Task {
  id: string;
  text: string;
  done: boolean;
  createdAt: Date;
}

export interface ConversationState {
  tasks: Task[];
  history: { role: "user" | "assistant"; content: string }[];
}

export interface WeatherInfo {
  city: string;
  description: string;
  temperatureC: number;
  isRaining: boolean;
}

export interface Quote {
  text: string;
  author?: string;
}

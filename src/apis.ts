import axios from "axios";
import { WeatherInfo, Quote } from "./types";

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

export async function getWeather(city: string): Promise<WeatherInfo | null> {
  if (!OPENWEATHER_API_KEY) {
    console.warn("getWeather OPENWEATHER_API_KEY is missing");
    return null;
  }

  try {
    const response = await axios.get(
      "https://api.openweathermap.org/data/2.5/weather",
      {
        params: {
          q: city,
          appid: OPENWEATHER_API_KEY,
          units: "metric",
        },
      }
    );

    

    const data = response.data;
    const description: string = data.weather?.[0]?.description ?? "unknown";
    const temperatureC: number = data.main?.temp ?? NaN;
    const isRaining: boolean = (data.weather?.[0]?.main ?? "")
      .toLowerCase()
      .includes("rain");

    return {
      city: data.name || city,
      description,
      temperatureC,
      isRaining,
    };
  } catch (err: any) {
    console.error(
      "getWeather Error calling OpenWeatherMap:",
      err?.message ?? err
    );
    return null;
  }
}

export async function getDailyQuote(): Promise<Quote | null> {
  try {
    const response = await axios.get("https://zenquotes.io/api/random", {
      timeout: 5000,
    });

    const data = response.data;

    if (!Array.isArray(data) || !data[0] || !data[0].q) {
      console.error("getDailyQuote Unexpected response:", data);
      return null;
    }

    return {
      text: data[0].q,
      author: data[0].a,
    };
  } catch (err: any) {
    console.error(
      "getDailyQuote Error calling ZenQuotes:",
      err?.response?.data ?? err?.message ?? err
    );
    return null;
  }
}

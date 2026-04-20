export async function getWeatherForecast(lat: number, lon: number) {
  return {
    lat,
    lon,
    summary: "Heat wave conditions expected with evening cooldown.",
    hourly: Array.from({ length: 12 }, (_, i) => ({
      hour: i,
      tempF: Number((76 + Math.sin(i / 12 * Math.PI) * 9).toFixed(1)),
      humidity: Number((40 + Math.random() * 25).toFixed(0))
    }))
  };
}

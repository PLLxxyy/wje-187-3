import { useWeather, WIND_SPEED_THRESHOLD } from '../store/useSkiResortStore';

export function WeatherPanel() {
  const weather = useWeather();
  const isHighWind = weather.windSpeed >= WIND_SPEED_THRESHOLD;

  return (
    <div className="weather-panel">
      <h3>实时天气</h3>
      <div className="weather-item">
        <span className="label">温度</span>
        <span className="value">{weather.temperature.toFixed(1)}°C</span>
      </div>
      <div className="weather-item wind-item">
        <span className="label">风速</span>
        <span className={`value ${isHighWind ? 'wind-high' : ''}`}>
          {weather.windSpeed.toFixed(1)} km/h
        </span>
      </div>
      {isHighWind && (
        <div className="wind-warning">
          ⚠️ 风速超过 {WIND_SPEED_THRESHOLD} km/h，山顶索道已自动停运
        </div>
      )}
      <div className="weather-item">
        <span className="label">降雪量</span>
        <span className="value">{weather.snowfall.toFixed(1)} mm/h</span>
      </div>
      <div className="weather-item">
        <span className="label">能见度</span>
        <span className="value">{weather.visibility}</span>
      </div>
      <div className="weather-item">
        <span className="label">湿度</span>
        <span className="value">{weather.humidity}%</span>
      </div>
    </div>
  );
}

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { lifts as initialLifts, Lift } from '../data/lifts';

export const WIND_SPEED_THRESHOLD = 40;
export const MOUNTAIN_TOP_ALTITUDE = 3000;

interface WeatherState {
  temperature: number;
  windSpeed: number;
  snowfall: number;
  visibility: string;
  humidity: number;
}

interface LiftState extends Lift {
  previousStatus?: 'running' | 'maintenance' | 'stopped';
  previousStatusText?: string;
}

interface SkiResortState {
  weather: WeatherState;
  lifts: LiftState[];
}

type Action =
  | { type: 'UPDATE_WEATHER'; payload: Partial<WeatherState> }
  | { type: 'UPDATE_LIFT_STATUS'; payload: { liftId: string; status: LiftState['status']; statusText: string } }
  | { type: 'APPLY_WIND_EFFECT' }
  | { type: 'RESET_LIFT_STATUS'; payload: { liftId: string } };

const initialWeather: WeatherState = {
  temperature: -8,
  windSpeed: 12,
  snowfall: 3.5,
  visibility: '良好',
  humidity: 78,
};

const initialState: SkiResortState = {
  weather: initialWeather,
  lifts: initialLifts.map(lift => ({ ...lift })),
};

function skiResortReducer(state: SkiResortState, action: Action): SkiResortState {
  switch (action.type) {
    case 'UPDATE_WEATHER': {
      return {
        ...state,
        weather: { ...state.weather, ...action.payload },
      };
    }

    case 'UPDATE_LIFT_STATUS': {
      return {
        ...state,
        lifts: state.lifts.map(lift =>
          lift.id === action.payload.liftId
            ? { ...lift, status: action.payload.status, statusText: action.payload.statusText }
            : lift
        ),
      };
    }

    case 'APPLY_WIND_EFFECT': {
      const isWindy = state.weather.windSpeed >= WIND_SPEED_THRESHOLD;
      const updatedLifts = state.lifts.map(lift => {
        const isMountainTopLift = lift.topAlt >= MOUNTAIN_TOP_ALTITUDE;
        if (isMountainTopLift) {
          if (isWindy && lift.status !== 'stopped') {
            return {
              ...lift,
              previousStatus: lift.status,
              previousStatusText: lift.statusText,
              status: 'stopped' as const,
              statusText: '大风停运',
              queue: 0,
            };
          } else if (!isWindy && lift.status === 'stopped' && lift.previousStatus && lift.previousStatusText && lift.statusText === '大风停运') {
            return {
              ...lift,
              status: lift.previousStatus,
              statusText: lift.previousStatusText,
              previousStatus: undefined,
              previousStatusText: undefined,
              queue: lift.previousStatus === 'running' ? Math.floor(Math.random() * 30) + 5 : 0,
            };
          }
        }
        return lift;
      });
      return { ...state, lifts: updatedLifts };
    }

    case 'RESET_LIFT_STATUS': {
      const lift = state.lifts.find(l => l.id === action.payload.liftId);
      if (!lift || !lift.previousStatus) return state;
      return {
        ...state,
        lifts: state.lifts.map(l =>
          l.id === action.payload.liftId
            ? {
                ...l,
                status: l.previousStatus!,
                statusText: l.previousStatusText!,
                previousStatus: undefined,
                previousStatusText: undefined,
              }
            : l
        ),
      };
    }

    default:
      return state;
  }
}

const SkiResortContext = createContext<{
  state: SkiResortState;
  updateWeather: (weather: Partial<WeatherState>) => void;
  updateLiftStatus: (liftId: string, status: LiftState['status'], statusText: string) => void;
} | null>(null);

export function SkiResortProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(skiResortReducer, initialState);

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({
        type: 'UPDATE_WEATHER',
        payload: {
          temperature: state.weather.temperature + (Math.random() - 0.5) * 0.5,
          windSpeed: Math.max(0, Math.min(60, state.weather.windSpeed + (Math.random() - 0.5) * 4)),
          snowfall: Math.max(0, state.weather.snowfall + (Math.random() - 0.5) * 0.3),
        },
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [state.weather]);

  useEffect(() => {
    dispatch({ type: 'APPLY_WIND_EFFECT' });
  }, [state.weather.windSpeed]);

  const updateWeather = (weather: Partial<WeatherState>) => {
    dispatch({ type: 'UPDATE_WEATHER', payload: weather });
  };

  const updateLiftStatus = (liftId: string, status: LiftState['status'], statusText: string) => {
    dispatch({ type: 'UPDATE_LIFT_STATUS', payload: { liftId, status, statusText } });
  };

  return (
    <SkiResortContext.Provider value={{ state, updateWeather, updateLiftStatus }}>
      {children}
    </SkiResortContext.Provider>
  );
}

export function useSkiResortStore() {
  const context = useContext(SkiResortContext);
  if (!context) {
    throw new Error('useSkiResortStore must be used within a SkiResortProvider');
  }
  return context;
}

export function useWeather() {
  const { state } = useSkiResortStore();
  return state.weather;
}

export function useLifts() {
  const { state } = useSkiResortStore();
  return state.lifts;
}

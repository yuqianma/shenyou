import { createContext, Dispatch } from "react";
import { TimeRange } from "./constants";
import { getFilteredRouteList, getNowAsBaseDay } from "./utils";

export const initialState = {
	time: TimeRange[0],
	playing: false,
	startingTime : 0,
	// timeLength: 1 * 3600 * 1000,
	timeLength: 0,
	routeList: [],
	stationMap: {},
	stationList: [],
	selectedStation: {},
	filteredRouteList: [],
	selectedRoute: [],
	// routeStationSet: new Set(),
};

export type State = {
	time: number;
	playing: boolean;
	startingTime: number;
	timeLength: number;
	routeList: any[];
	stationMap: Record<string, object>;
	stationList: any[];
	selectedStation: any;
	filteredRouteList: any[];
	selectedRoute: any[];
};
export type Action = { type: string, payload: any };

export function reducer(state: State, action: Action): State {
	if (action.type !== "setTime") {
		console.log(action.type, action.payload);
	}
  switch (action.type) {
		case "loadData": 
			const { routeList, stationMap } = action.payload;
			const stationList = Object.entries(stationMap as Record<string, object>).map(([key, value]) => {
				// FIXME
				(value as any).stationName = key;
				return { name: key, ...value };
			});
			// set coordinates in routes
			routeList.forEach((route: any) => {
				route.waypoints.forEach((waypoint: any) => {
					const station = stationMap[`${waypoint.station}站`];
					if (station) {
						waypoint.coords = station.location;
					}
				});
			});
			return {
				...state,
				routeList,
				stationMap,
				stationList,
				playing: true,
			};
		case "setTime":
			return {
				...state,
				time: action.payload,
			};
		// case "setPlaying":
		// 	return {
		// 		...state,
		// 		playing: action.payload,
		// 	};
		case "setTimeLength":
			return {
				...state,	
				timeLength: action.payload,
			};
		case "setSelectedStation":
			const stationName = action.payload;
			return {
				...state,
				selectedStation: state.stationMap[stationName],
				filteredRouteList: getFilteredRouteList(state.routeList, state.timeLength, stationName),
			};
		case "setSelectedRoute":
			return {
				...state,
				startingTime: +getNowAsBaseDay(),
				selectedRoute: action.payload,
			};
    default:
      throw new Error();
  }
}

export const StoreContext = createContext<Dispatch<Action>>({} as Dispatch<Action>);

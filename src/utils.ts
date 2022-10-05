import * as dayjs from "dayjs";
import { BaseDay } from "./constants";

const queryParams = new URLSearchParams(window.location.search);

const globalConfig = {
	isTimeShifting: false,
};
globalConfig.isTimeShifting = queryParams.has("time-shifting");

export function getNowAsBaseDay() {
	let now = dayjs();
	if (globalConfig.isTimeShifting) {
		now = now.subtract(12, "hour");
	}
	// join base time's date and now's time
	let nextTime = dayjs(BaseDay).hour(now.hour()).minute(now.minute()).second(now.second())
	console.log(nextTime.format("YYYY-MM-DD HH:mm:ss"));
	return nextTime;
}

export function getFilteredRouteList(routeListData: any[], timeLength: number, stationName: string) {
	stationName = stationName.replace(/站$/, "");
	// timeLength = 1 * 3600 * 1000;

	// console.time("filter");
	let filtered = routeListData.filter((route: any) => {
		const idx = route.waypoints.findIndex((waypoint: any) => waypoint.station === stationName);
		if (idx === -1) {
			return false;
		}
		// arrival time
		let departureWaypoint = route.waypoints[idx];
		if (departureWaypoint.station === route.waypoints[idx + 1]?.station) {
			// departure time
			departureWaypoint = route.waypoints[idx + 1];
		}

		if (departureWaypoint.timestamp > getNowAsBaseDay()) {
			// have to wait
			return false;
		}

		if (route.waypoints.at(-1).timestamp - departureWaypoint.timestamp < timeLength) {
			// too short
			return false;
		}

		return true;
	});
	// console.timeEnd("filter");
	// console.log(filtered);
	return filtered;
}

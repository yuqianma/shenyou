// import { useContext } from "react";
// import { StoreContext } from "../../store";
import { getCityEnWikipediaUrl } from "../../utils";
import dayjs from "dayjs/esm";

import "./index.css";

type Props = {
	time: number;
	startingTime: number;
	timeLength: number;
	selectedStation: any;
	filteredRouteList: any[];
	selectedRoute: any[];
};

export const InfoPane = ({
	time = 0,
	startingTime = 0,
	timeLength = 0,
	selectedStation = {},
	filteredRouteList = [],
	selectedRoute = [],
}: Props) => {
	// const dispatch = useContext(StoreContext);

	// const duration = dayjs.duration(dayjs(startingTime + timeLength).diff(dayjs(time)));

	// console.log(dayjs(startingTime + timeLength).format("YYYY-MM-DD HH:mm:ss"), dayjs(time).format("YYYY-MM-DD HH:mm:ss"));

	const isStationSelected = filteredRouteList.length !== 0;
	const isRouteSelected = selectedRoute.length !== 0;

	const { city } = selectedStation;
	const trainCode = selectedRoute[0]?.trainCode;

	const showDefault = !isStationSelected && !isRouteSelected;
	const showCityPane = isStationSelected && !isRouteSelected;
	const showRoutePane = isRouteSelected;

	return (<div className="info-pane">
		{showDefault && <div style={{ padding: "1rem" }}>pick a city</div>}
		{showCityPane && (
			<div className="text-info">
				<div className="text-secondary">Departure City:</div>
				<div className="text-primary">{ city }</div>
			</div>
		)}
		{showRoutePane && (
			<div className="text-info">
				<div className="text-secondary">Train:</div>
				<div className="text-primary">{ trainCode }</div>
				{/* <div className="countdown">{duration.format("HH:mm:ss")}</div> */}
			</div>
		)}
		<div style={{ height: "100%" }}>
			{showCityPane && (<iframe style={{ height: "100%", border: 0 }} src={getCityEnWikipediaUrl(city)}/>)}
			{showRoutePane && (<div style={{ height: "100%", border: 0 }}>Route</div>)}
		</div>
	</div>);
};

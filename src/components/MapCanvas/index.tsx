import { useState, useEffect, useRef, useCallback } from "react";
import { Map } from "react-map-gl";
import DeckGL from '@deck.gl/react/typed';
import { PickingInfo } from "@deck.gl/core/typed";
import { TripsLayer } from "@deck.gl/geo-layers/typed";
import { PathLayer, ScatterplotLayer } from "@deck.gl/layers/typed";
import { MapboxAccessToken, DEFAULT_THEME, INITIAL_VIEW_STATE, MAP_STYLE, filterLayers } from "./config";
import mapboxgl from "mapbox-gl";
import * as dayjs from "dayjs";
import "mapbox-gl/dist/mapbox-gl.css";

const BaseDay = dayjs("2022-07-31T00:00:00.000+08:00");
const TimeRange = [ 1659216960000, 1659282420000 ];

function getNowAsBaseDay() {
	let now = dayjs();
	now = now.subtract(12, "hour");
	// join base time's date and now's time
	let nextTime = dayjs(BaseDay).hour(now.hour()).minute(now.minute()).second(now.second())
	// console.log(nextTime.format("YYYY-MM-DD HH:mm:ss"));
	return nextTime;
}

function getFilteredRouteList(routeListData: any[], timeLength: number, stationName: string) {
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
	return filtered;
}

export function MapCanvas({
  trailLength = 5e6,
  initialViewState = INITIAL_VIEW_STATE,
  mapStyle = MAP_STYLE,
  theme = DEFAULT_THEME,
  animationSpeed = 1e5,
  timeRange = TimeRange,
}) {
  const [time, setTime] = useState(timeRange[0]);
	// const [animateTrailLength, setAnimateTrailLength] = useState(5e6);
	// const [, forceUpdate] = useState(0);
  const playing = useRef(false);
  const animation = useRef<number>(0);
  const mapRef = useRef<any>();
  const routeListDataRef = useRef<any>([]);
	const filteredRouteListDataRef = useRef<any>([]);
	const stationMapDataRef = useRef<any>({});
	const stationListDataRef = useRef<any>([]);
	const [selectedRoute, setSelectedRoute] = useState<any[]>([]);
	const routeStationSetRef = useRef(new Set());

	const isRouteSelected = selectedRoute.length !== 0;

  const onMapLoad = useCallback(() => {
    const map = mapRef.current!.getMap() as mapboxgl.Map;
    filterLayers(map);
  }, []);

	const onStationHover = (info: PickingInfo) => {
		if (!info.object?.name) {
			return;
		}
		console.log(info.object.name);
		const routeListData = routeListDataRef.current;
		const stationName = info.object.name;
		const timeLength = 1 * 3600 * 1000;

		filteredRouteListDataRef.current = getFilteredRouteList(routeListData, timeLength, stationName);
	};

	const onRouteClick = (info: PickingInfo) => {
		if (!info.object) {
			return;
		}
		console.log(info.object.trainCode);
		setSelectedRoute([info.object]);

		routeStationSetRef.current = new Set(info.object.waypoints.map((waypoint: any) => waypoint.station + "站"));
	};

  const animate = () => {
    if (playing.current) {
      setTime(t => {
				return Number(getNowAsBaseDay());
      });
			// setAnimateTrailLength(l => {
			// 	// console.log(l / 1e6);
			// 	return 5e6 + (Math.sin(Date.now() / 1000) + 1) / 2 * 2e6;
			// });
    }
    animation.current = window.requestAnimationFrame(animate);
  };

  useEffect(
    () => {
      setTime(timeRange[0]);
      animation.current = window.requestAnimationFrame(animate);
      return () => {
        window.cancelAnimationFrame(animation.current);
        animation.current = 0;
      }
    },
    [animation, timeRange[0], timeRange[1]]
  );

  useEffect(
    () => {
      (async () => {
        const p1 = fetch("routes.json").then(res => res.json()).then(data => routeListDataRef.current = data);
				const p2 = fetch("stations.json").then(res => res.json()).then((data: Record<string, object>) => {
					stationMapDataRef.current = data;
					stationListDataRef.current = Object.entries(data).map(([key, value]) => {
						return { name: key, ...value };
					})
				});
				await Promise.all([p1, p2]);
				const routes = routeListDataRef.current;
				const stationMap = stationMapDataRef.current;
				// set coordinates in routes
				routes.forEach((route: any) => {
					route.waypoints.forEach((waypoint: any) => {
						const station = stationMap[`${waypoint.station}站`];
						if (station) {
							waypoint.coords = station.location;
						}
					});
				});
				// console.log(routes);
        // TODO
        playing.current = true;
      })();
    },
    []
  );

  const layers = [
    // new TripsLayer({
    //   id: 'trips',
    //   data: filteredRouteListDataRef.current,
    //   getPath: d => d.waypoints.map((p: any) => p.coords),
    //   getTimestamps: d => d.waypoints.map((p: any) => p.timestamp),
    //   getColor: [0, 187, 221],
    //   opacity: 0.3,
    //   widthMinPixels: 2,
    //   capRounded: true,
		// 	jointRounded: true,
    //   fadeTrail: true,
    //   trailLength,
    //   currentTime: time,
    //   shadowEnabled: false
    // }),
		new PathLayer({
			id: "selectedRoutePathLayer",
			data: selectedRoute,
			pickable: true,
			visible: isRouteSelected,
			autoHighlight: true,
			highlightColor: [255, 235, 59],
			widthScale: 20,
			widthMinPixels: 1,
			getPath: d => d.waypoints.map((p: any) => p.coords),
			getColor: [255, 235, 59],
			opacity: 0.05,
		}),
		new TripsLayer({
      id: "selectedRouteTripsLayer",
      data: selectedRoute,
			visible: isRouteSelected,
      getPath: d => d.waypoints.map((p: any) => p.coords),
      getTimestamps: d => d.waypoints.map((p: any) => p.timestamp),
      getColor: [255, 200, 100],
      opacity: 1,
			widthMinPixels: 6,
      capRounded: true,
			jointRounded: true,
      fadeTrail: true,
      trailLength: 5e6,
      currentTime: time,
      shadowEnabled: false
    }),
		new PathLayer({
			id: "filteredRouteListLayer",
			data: filteredRouteListDataRef.current,
			pickable: true,
			visible: !isRouteSelected,
			autoHighlight: true,
			highlightColor: [255, 235, 59],
			widthScale: 20,
			widthMinPixels: 2,
			getPath: d => d.waypoints.map((p: any) => p.coords),
			getColor: [0, 187, 144],
			opacity: 0.3,
			onClick: onRouteClick
		}),
		new ScatterplotLayer({
			id: "stationLayer",
			data: stationListDataRef.current,
			pickable: true,
			autoHighlight: true,
			highlightColor: [255, 200, 100],
			opacity: 0.5,
			stroked: false,
			filled: true,
			radiusScale: 6,
			radiusMinPixels: 2,
			radiusMaxPixels: 10,
			lineWidthMinPixels: 1,
			getPosition: d => d.location,
			getRadius: 500,
			getFillColor: (d) => {
				if (!isRouteSelected) {
					return [255, 140, 0, 100];
				}
				if (routeStationSetRef.current.has(d.name)) {
					// console.log("highlight", d.name);
					return [255, 255, 0, 200];
				}
				return [255, 140, 0, 50];
			},
			// getLineColor: [255, 255, 255],
			onHover: onStationHover,
		})
  ];

	const getTooltip = (info: PickingInfo) => {
		const { layer, object } = info;
		if (!object) {
			return null;
		}
		const layerId = layer?.id;
		if (layerId === "stationLayer") {
			return object.name;
		}
		if (layerId === "filteredRouteListLayer" || layerId === "selectedRoutePathLayer") {
			const stations = object.waypoints.map((waypoint: any) => waypoint.station).join(" -> ");
			return `${object.trainCode}\n${stations}`;
		}
		return null;
	}

  return (
		<DeckGL
			layers={layers}
			effects={theme.effects}
			initialViewState={initialViewState}
			controller={true}
			getTooltip={getTooltip}
		>
			<Map reuseMaps ref={mapRef} onLoad={onMapLoad} mapStyle={mapStyle} mapboxAccessToken={MapboxAccessToken} />
		</DeckGL>
  );
}

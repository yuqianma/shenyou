import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { Map } from "react-map-gl";
import DeckGL from '@deck.gl/react/typed';
import { PickingInfo } from "@deck.gl/core/typed";
import { TripsLayer } from "@deck.gl/geo-layers/typed";
import { PathLayer, ScatterplotLayer } from "@deck.gl/layers/typed";
import { MapboxAccessToken, DEFAULT_THEME, INITIAL_VIEW_STATE, MAP_STYLE, filterLayers } from "./config";
import mapboxgl from "mapbox-gl";
import { TimeRange } from "../../constants";
import { getNowAsBaseDay, getFilteredRouteList } from "../../utils";
import { StoreContext } from "../../store";
import "mapbox-gl/dist/mapbox-gl.css";

type Props = {
	time: number;
	stationList: any[];
	filteredRouteList: any[];
	selectedRoute: any[];	
};

export function MapCanvas({
	time = TimeRange[0],
	stationList,
	filteredRouteList,
	selectedRoute,
}: Props) {
	const dispatch = useContext(StoreContext);
  const mapRef = useRef<any>();
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
		const stationName = info.object.name;

		dispatch({
			type: "setSelectedStation",
			payload: stationName,
		});
	};

	const onRouteClick = (info: PickingInfo) => {
		if (!info.object) {
			return;
		}
		console.log(info.object.trainCode);
		dispatch({
			type: "setSelectedRoute",
			payload: [info.object],
		});

		routeStationSetRef.current = new Set(info.object.waypoints.map((waypoint: any) => waypoint.station + "站"));
	};

  const layers = [
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
			data: filteredRouteList,
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
			data: stationList,
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
			effects={DEFAULT_THEME.effects}
			initialViewState={INITIAL_VIEW_STATE}
			controller={true}
			getTooltip={getTooltip}
		>
			<Map reuseMaps ref={mapRef} onLoad={onMapLoad} mapStyle={MAP_STYLE} mapboxAccessToken={MapboxAccessToken} />
		</DeckGL>
  );
}

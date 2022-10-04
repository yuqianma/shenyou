import { useState, useEffect, useRef, useCallback } from "react";
import { Map } from "react-map-gl";
import DeckGL from '@deck.gl/react/typed';
import { TripsLayer } from '@deck.gl/geo-layers/typed';
import { PathLayer, ScatterplotLayer } from "@deck.gl/layers/typed";
import { MapboxAccessToken, DEFAULT_THEME, INITIAL_VIEW_STATE, MAP_STYLE, filterLayers } from "./config";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const TimeRange = [ 1659216960000, 1659282420000 ];

export function MapCanvas({
  trailLength = 10_000_000,
  initialViewState = INITIAL_VIEW_STATE,
  mapStyle = MAP_STYLE,
  theme = DEFAULT_THEME,
  animationSpeed = 1000_00,
  timeRange = TimeRange,
}) {
  const [time, setTime] = useState(timeRange[0]);
	const [, forceUpdate] = useState(0);
  const playing = useRef(false);
  const animation = useRef<number>(0);
  const mapRef = useRef<any>();
  const routeDataRef = useRef<any>([]);
	const stationDataRef = useRef<any>([]);

  const onMapLoad = useCallback(() => {
    const map = mapRef.current!.getMap() as mapboxgl.Map;
    filterLayers(map);
  }, []);
  
  const animate = () => {
    if (playing.current) {
      setTime(t => {
        const nextTime = t + animationSpeed;
        if (nextTime > timeRange[1]) {
          return timeRange[0];
        }
        return nextTime;
      });
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
        const data = await fetch("trips.json").then(res => res.json());
        routeDataRef.current = data;
        // TODO
        playing.current = true;
      })();
    },
    []
  );

	useEffect(
		() => {
			(async () => {
				const data = await fetch("stations.json").then(res => res.json()) as Record<string, object>;
				stationDataRef.current = Object.entries(data).map(([key, value]) => {
					return { name: key, ...value };
				});
				forceUpdate(n => n + 1);
			})();
		}
	);

  const layers = [
		// new PathLayer({
		// 	id: 'path-layer',
		// 	data: routeDataRef.current,
		// 	pickable: true,
		// 	widthScale: 20,
		// 	widthMinPixels: 2,
		// 	getPath: d => d.waypoints.map((p: any) => p.coords),
		// 	getColor: [0, 187, 144],
		// 	opacity: 0.1
		// }),
    // new TripsLayer({
    //   id: 'trips',
    //   data: routeDataRef.current,
    //   getPath: d => d.waypoints.map((p: any) => p.coords),
    //   getTimestamps: d => d.waypoints.map((p: any) => p.timestamp),
    //   // getColor: d => (d.vendor === 0 ? theme.trailColor0 : theme.trailColor1),
    //   getColor: [0, 187, 221],
    //   opacity: 0.8,
    //   widthMinPixels: 2,
    //   rounded: true,
    //   fadeTrail: true,
    //   trailLength,
    //   currentTime: time,
    //   shadowEnabled: false
    // }),
		new ScatterplotLayer({
			id: 'scatterplot-layer',
			data: stationDataRef.current,
			pickable: true,
			autoHighlight: true,
			highlightColor: [255, 200, 100],
			opacity: 0.8,
			stroked: true,
			filled: true,
			radiusScale: 6,
			radiusMinPixels: 2,
			radiusMaxPixels: 10,
			lineWidthMinPixels: 1,
			getPosition: d => d.location,
			getRadius: 500,
			getFillColor: [255, 140, 0],
			getLineColor: [100, 100, 100]
		})
  ];

  return (
		<DeckGL
			layers={layers}
			effects={theme.effects}
			initialViewState={initialViewState}
			controller={true}
			getTooltip={({object}) => object && object.name}
		>
			<Map reuseMaps ref={mapRef} onLoad={onMapLoad} mapStyle={mapStyle} mapboxAccessToken={MapboxAccessToken} />
		</DeckGL>
  );
}

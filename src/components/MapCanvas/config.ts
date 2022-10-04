import { AmbientLight, PointLight, LightingEffect } from '@deck.gl/core/typed';

export const MapboxAccessToken = "pk.eyJ1IjoibWF5cTA0MjIiLCJhIjoiY2phamMwOHV4MjllajMzbnFyeTMwcmZvYiJ9.aFMw4Aws5zY9Y4NwYqFMlQ";

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0
});

const pointLight = new PointLight({
  color: [255, 255, 255],
  intensity: 2.0,
  position: [-74.05, 40.7, 8000]
});

const lightingEffect = new LightingEffect({ambientLight, pointLight});

const material = {
  ambient: 0.1,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [60, 64, 70]
};

export const DEFAULT_THEME = {
  buildingColor: [74, 80, 87],
  trailColor0: [253, 128, 93],
  trailColor1: [23, 184, 190],
  material,
  effects: [lightingEffect]
};

export const INITIAL_VIEW_STATE = {
  longitude: 104.392,
  latitude: 36.067,
  zoom: 4,
  pitch: 0,
  bearing: 0
};

export const MAP_STYLE = 'mapbox://styles/mapbox/dark-v10';

export function filterLayers(map: mapboxgl.Map, worldview: string = "CN") {
  // The "admin-0-boundary-disputed" layer shows boundaries
  // at this level that are known to be disputed.
  map.setFilter('admin-0-boundary-disputed', [
  'all',
  ['==', ['get', 'disputed'], 'true'],
  ['==', ['get', 'admin_level'], 0],
  ['==', ['get', 'maritime'], 'false'],
  ['match', ['get', 'worldview'], ['all', worldview], true, false]
  ]);
  // The "admin-0-boundary" layer shows all boundaries at
  // this level that are not disputed.
  map.setFilter('admin-0-boundary', [
  'all',
  ['==', ['get', 'admin_level'], 0],
  ['==', ['get', 'disputed'], 'false'],
  ['==', ['get', 'maritime'], 'false'],
  ['match', ['get', 'worldview'], ['all', worldview], true, false]
  ]);
  // The "admin-0-boundary-bg" layer helps features in both
  // "admin-0-boundary" and "admin-0-boundary-disputed" stand
  // out visually.
  map.setFilter('admin-0-boundary-bg', [
  'all',
  ['==', ['get', 'admin_level'], 0],
  ['==', ['get', 'maritime'], 'false'],
  ['match', ['get', 'worldview'], ['all', worldview], true, false]
  ]);
}

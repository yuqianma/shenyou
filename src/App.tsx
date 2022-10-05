import { useReducer, useEffect, useRef } from "react";
import { MapCanvas, StartDialog } from "./components";
import "./App.css";
import { reducer, initialState, StoreContext } from "./store";
import { getNowAsBaseDay } from "./utils";

function App() {
  const [rootState, dispatch] = useReducer(reducer, initialState);
  const fetchingRef = useRef(false);
  const animation = useRef<number>(0);

  useEffect(
    () => {
      (async () => {
        if (fetchingRef.current) {
          return;
        }
        fetchingRef.current = true;
        const p1 = fetch("routes.json").then(res => res.json());
				const p2 = fetch("stations.json").then(res => res.json());
				const [ routeList, stationMap ] = await Promise.all([p1, p2]);
        
        dispatch({
          type: "loadData",
          payload: {
            routeList,
            stationMap,
          }
        });
        fetchingRef.current = false;
      })();
    },
    []
  );

  const animate = () => {
    if (rootState.playing) {
      dispatch({
        type: "setTime",
        payload: Number(getNowAsBaseDay()),
      });
    }
    animation.current = window.requestAnimationFrame(animate);
  };

  useEffect(
    () => {
      animation.current = window.requestAnimationFrame(animate);
      return () => {
        window.cancelAnimationFrame(animation.current);
        animation.current = 0;
      }
    },
    [rootState.playing]
  );

  const { time, stationList, filteredRouteList, selectedRoute } = rootState;

  return (
    <StoreContext.Provider value={dispatch}>
      {rootState.timeLength === 0  ? (
        <StartDialog />
      ) : (
        <MapCanvas
          time={time}
          stationList={stationList}
          filteredRouteList={filteredRouteList}
          selectedRoute={selectedRoute}
        />
      )}
    </StoreContext.Provider>
  );
}

export default App;

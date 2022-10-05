import { useState, useEffect, useRef, useCallback, useContext } from "react";
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';
import { StoreContext } from "../../store";

import "./index.css";

export const StartDialog = () => {
	const dispatch = useContext(StoreContext);

	const [timeLength, setTimeLength] = useState(1.5);

	const handleChange = (event: Event, newValue: number | number[]) => {
    setTimeLength(newValue as number);
  };

	const onClick = () => {
		dispatch({
			type: "setTimeLength",
			payload: timeLength * 3600 * 1000,
		});
	}

	return (<div className="start-dialog">
		<div className="start-dialog-box">
			<div className="project-title">神游</div>
			{/* <div className="project-description">神游是一个基于地图的火车时刻表，可以让你在地图上查看火车的运行轨迹。</div> */}
			<div className="description1">Start a imagined wandering on ...train...</div>
			<div className="description2">How long would you like the journey to last?</div>
			<div className="time-length">
				{timeLength}
				<span style={{ color: "#aaa", fontSize: "1rem" }}> Hours</span>
			</div>
			<Slider
				min={0.5}
				max={6}
				step={0.1}
				value={timeLength}
				onChange={handleChange}
			/>
			<Button variant="outlined" size="large" style={{ marginTop: "3rem" }} onClick={onClick}>Select A City</Button>
		</div>
	</div>);
};

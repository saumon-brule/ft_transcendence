import { createContext, createEffect, JSX, splitProps } from "solid-js";

import "./DisplayThemeController.css";

export type ChoiceSliderContextValue = {

};

const choiceSliderContext = createContext<ChoiceSliderContextValue>();

export type ChoiceSliderProps = JSX.IntrinsicElements["fieldset"] & {
};

export default function ChoiceSlider(props: ChoiceSliderProps) {
	const [local, rest] = splitProps(props, ["onChange"]);
	const choiceSliderContextValue: ChoiceSliderContextValue = {

	};

	return <choiceSliderContext.Provider value={choiceSliderContextValue}>
		<fieldset {...rest} />;
	</choiceSliderContext.Provider>;
}

export default function DisplayThemeController(props: DisplayThemeProps) {

	const props = mergeProps({ id: "", className: "" }, _props);

	const sliderRef = useRef(null);
	const containerRef = useRef(null);
	const optionsRef = useRef([]);

	const tempSelected = useRef(undefined);

	/* sélectionne le 1er élément si rien n'est sélectionné */
	useEffect(() => {
		if (!props.selected) {
			props.onChange(displayThemes[0]);
		}gt

	function slideToElement(element) {
		if (!element) {
			return;
		}
		const bounds = getZoomedBoudingClientRect(element.getBoundingClientRect());
		sliderRef.current.style.top = element.offsetTop + "px ";
		sliderRef.current.style.left = element.offsetLeft + "px ";
		sliderRef.current.style.width = bounds.width + "px ";
		sliderRef.current.style.height = bounds.height + "px ";
	}

	const slideToSelectedElement = () => {
		const targetElement = document.querySelector(`.display-theme-controller[name=${props.fieldsetName}] .option.selected`);
		slideToElement(targetElement);
	};


	// user slide
	function selectOption(mouse) {
		// select the option based on mouse position
		let closestOption1 = { dist: undefined, el: undefined };
		let closestOption2 = { dist: undefined, el: undefined };
		for (let i = 0; i < optionsRef.current.length; i++) {
			const option = optionsRef.current[i];
			const optionBounds = getZoomedBoudingClientRect(option.getBoundingClientRect());
			let newDist = mouse.x - (optionBounds.left + optionBounds.width / 2);
			// if (i === 0 || i === optionsRef.current.length-1 && newDist < 0 )
			if ((i === 0 && newDist < 0) || (i === optionsRef.current.length - 1 && newDist > 0)) {
				// to prevent when the mouse go beyond the container
				newDist = 0;
			} else {
				newDist = Math.abs(newDist);
			}
			if (closestOption1.dist === undefined || newDist < closestOption1.dist) {
				if (closestOption1.dist !== undefined) {
					closestOption2 = {
						dist: closestOption1.dist,
						el: closestOption1.el,
					};
				}
				closestOption1 = {
					dist: newDist,
					el: option,
				};
			} else if (closestOption2.dist === undefined || newDist < closestOption2.dist) {
				closestOption2 = {
					dist: newDist,
					el: option,
				};
			}

		}

		const option1Width = parseFloat(getComputedStyle(closestOption1.el).width);
		const option2Width = parseFloat(getComputedStyle(closestOption2.el).width);
		const total = closestOption1.dist + closestOption2.dist;
		const newWidth = option1Width * (1 - (closestOption1.dist / total)) + option2Width * (1 - (closestOption2.dist / total));
		sliderRef.current.style.width = newWidth + "px ";
		// sliderRef.current.style.left = parseFloat(sliderRef.current.style.left) + newWidth/2 + "px ";

		tempSelected.current = closestOption1.el.dataset.value;
	}

	function moveSlider(sliderOrigin, mouseOrigin, mouse) {
		let newXPos = sliderOrigin.x + (mouse.x - mouseOrigin.x);
		const containerBounds = getZoomedBoudingClientRect(containerRef.current.getBoundingClientRect());
		const containerPadding = parseFloat(getComputedStyle(containerRef.current).padding);
		const sliderBounds = getZoomedBoudingClientRect(sliderRef.current.getBoundingClientRect());
		if (newXPos < 5) {
			newXPos = 5;
		} else if (newXPos + sliderBounds.width > containerBounds.width - containerPadding) {
			newXPos = containerBounds.width - sliderBounds.width - containerPadding;
		}

		sliderRef.current.style.left = newXPos + "px ";

		selectOption(mouse);
	}

	const handlePointerDown = (event) => {
		sliderRef.current.style.cssText += "transition: none !important;";
		disableBodyScroll(sliderRef.current);


		const mouseOrigin = {
			x: applyZoom(event.clientX ?? event.touches[0].clientX),
			y: applyZoom(event.clientY ?? event.touches[0].clientY),
		};

		const sliderComputedStyle = getComputedStyle(sliderRef.current);
		const sliderOrigin = {
			x: parseFloat(sliderComputedStyle.left),
			y: parseFloat(sliderComputedStyle.top),
		};

		const handlePointerMove = (event) => {
			const mouse = {
				x: applyZoom(event.clientX ?? event.touches[0].clientX),
				y: applyZoom(event.clientY ?? event.touches[0].clientY),
			};
			moveSlider(sliderOrigin, mouseOrigin, mouse);
		};

		document.addEventListener("mousemove", handlePointerMove);
		document.addEventListener("touchmove", handlePointerMove);

		const handlePointerUp = () => {
			sliderRef.current.style.removeProperty("transition");
			clearAllBodyScrollLocks();
			if (tempSelected.current !== undefined) {
				props.onChange(tempSelected.current);
			}
			slideToSelectedElement();
			document.removeEventListener("mousemove", handlePointerMove);
			document.removeEventListener("touchmove", handlePointerMove);
			document.removeEventListener("mouseup", handlePointerUp);
			document.removeEventListener("touchend", handlePointerUp);
		};

		document.addEventListener("mouseup", handlePointerUp);
		document.addEventListener("touchend", handlePointerUp);
	};

	createEffect(() => {
		window.addEventListener("resize", slideToSelectedElement);
		sliderRef.current.addEventListener("pointerdown", handlePointerDown);

		return () => {
			window.removeEventListener("resize", slideToSelectedElement);
			if (sliderRef.current) {
				sliderRef.current.removeEventListener("pointerdown", handlePointerDown);
			}
		};
	});

	createEffect(() => {
		slideToSelectedElement();
	});

	const handleClick = (event) => {
		props.onChange(event.target.value);
	};

	return <fieldset name={props.fieldsetName} class={`display-theme-controller ${props.className}`} id={props.id} ref={containerRef}>
		<div ref={sliderRef} class="slider" />
		{displayThemes.map((theme, index) => <label ref={(el) => (optionsRef.current[index] = el)} for={theme} data-value={theme} title={theme} class={"option " + "selected ".repeat(props.selected === theme)} onPointerDown={(event) => props.selected === theme ? handlePointerDown(event) : undefined}>
			<input name={props.fieldsetName} type="radio" id={theme} value={theme} onClick={handleClick} />
			{
				(() => {
					switch (theme) {
						case "light":
							return <SunIcon />;
						case "auto":
							return "AUTO";
						case "dark":
							return <MoonIcon />;
						default:
							return theme;
					}
				})()
			}
		</label>)}
	</fieldset>;
}

// IIFE wrapper for Tweakpane CSS

import TweakpaneCss from "./components/TweakpaneCss.svelte";
import elementReady from "element-ready";

// Preload script
if (typeof localStorage !== "undefined") {
  const cssVars = localStorage.getItem("css");
  cssVars &&
    Object.entries(JSON.parse(cssVars)).forEach(([variableName, value]) => {
      const units = ((val) =>
        isNaN(parseFloat(val))
          ? ""
          : val.match(/^-?[\d.]+\s?([a-z%]*)$/i)?.[1] || "")(
        window
          .getComputedStyle(document.documentElement)
          .getPropertyValue(variableName)
      );
      document.documentElement.style.setProperty(
        variableName,
        `${value}${units ? `${units}` : ""}`
      );
    });
}

elementReady("body").then((element) => {
  new TweakpaneCss({
    target: element as HTMLElement,
  });
});

import { semanticComponents as __doeFn_semanticComponents } from '../semantic-components/index.js';
import { componentElement as __doeFn_componentElement } from '../component-element/index.js';
import { boundsInPoints as __doeFn_boundsInPoints } from '../bounds-in-points/index.js';
// Origin: public/yrkie-doe/export-runtime/export-runtime.js:205
import { scope as __doeScope } from "../../../../../runtime/context/index.js";

export function nativeComponents(semanticSlide, slideElement) {
    const slideRect = slideElement.getBoundingClientRect();
    return (0, __doeFn_semanticComponents)(semanticSlide).map((component) => {
      const element = (0, __doeFn_componentElement)(slideElement, component.id);
      if (component.type === "math-formula") {
        const formulaRoot = element?.querySelector?.(".ppt-math-formula__root");
        const formulaBody = element?.querySelector?.(".ppt-math-formula__body");
        const computed = formulaBody && __doeScope.global.getComputedStyle
          ? __doeScope.global.getComputedStyle(formulaBody)
          : null;
        return {
          ...component,
          bounds_pt: (0, __doeFn_boundsInPoints)(formulaRoot || element, slideRect),
          mathml: formulaRoot?.outerHTML || "",
          font_size_pt: computed
            ? (Number.parseFloat(computed.fontSize || "0") * 72) / 96
            : 26,
          color: computed?.color || __doeScope.global.PPTTheme?.color?.("body") || "currentColor",
          align: component.props?.content?.align || "center",
        };
      }
      if (component.type.endsWith("-chart")) {
        const visualSelectors = {
          "grouped-bar-chart": ".ppt-grouped-bar-chart__plot",
          "line-chart": ".ppt-line-chart__plot",
          "stacked-bar-chart": ".ppt-stacked-bar-chart__svg",
          "radar-chart": ".ppt-business-chart__svg",
          "donut-chart": ".ppt-donut-chart__svg",
          "waterfall-chart": ".ppt-waterfall-chart__svg",
        };
        const chartVisual = element?.querySelector?.(
          visualSelectors[component.type] || "svg,canvas",
        );
        const legend = element?.querySelector?.('[class*="__legend"]');
        return {
          ...component,
          representation: "editable-vector",
          bounds_pt: (0, __doeFn_boundsInPoints)(chartVisual || element, slideRect),
          component_bounds_pt: (0, __doeFn_boundsInPoints)(element, slideRect),
          preserve_component_text: Boolean(chartVisual),
          legend_bounds_pt: (0, __doeFn_boundsInPoints)(legend, slideRect),
        };
      }
      return {
        ...component,
        bounds_pt: (0, __doeFn_boundsInPoints)(element, slideRect),
      };
    }).filter((component) => component.bounds_pt);
  }

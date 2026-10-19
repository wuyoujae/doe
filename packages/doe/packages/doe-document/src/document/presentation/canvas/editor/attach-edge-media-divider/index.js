import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from "../../../layout/is-edge-split-group/index.js";
import { element as __doeFn_element } from "../../../../../../../doe-core/src/runtime/element/index.js";
import { edgeMediaBounds as __doeFn_edgeMediaBounds } from "../../../layout/edge-media-bounds/index.js";
import { edgeMediaPosition as __doeFn_edgeMediaPosition } from "../../../layout/edge-media-position/index.js";
import { normalizeEdgeMediaRatio as __doeFn_normalizeEdgeMediaRatio } from "../../../schema/normalize-edge-media-ratio/index.js";
import { edgeBoundaryLabel as __doeFn_edgeBoundaryLabel } from "../../../layout/edge-boundary-label/index.js";
import { setEdgeDividerLimit as __doeFn_setEdgeDividerLimit } from "../../../layout/set-edge-divider-limit/index.js";
import { tryLiveEdgeMediaRatio as __doeFn_tryLiveEdgeMediaRatio } from "../../../layout/try-live-edge-media-ratio/index.js";
import { edgeMediaRatioFromPointer as __doeFn_edgeMediaRatioFromPointer } from "../../../layout/edge-media-ratio-from-pointer/index.js";
import { syncLiveEdgeReport as __doeFn_syncLiveEdgeReport } from "../../../layout/sync-live-edge-report/index.js";
import { solveLayout as __doeFn_solveLayout } from "../../../layout/solve-layout/index.js";
import { notify as __doeFn_notify } from "../../../../../../../doe-core/src/operation/notify/index.js";
import { updateSelection as __doeFn_updateSelection } from "../update-selection/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:6295
import { scope as __doeScope } from "../../../runtime/context/index.js";

export function attachEdgeMediaDivider(shell, node, state, record) {
    if (!state.slide.editor || !(0, __doeFn_isEdgeSplitGroup)(node)) return null;
    const divider = (0, __doeFn_element)("button", "edge-media-divider");
    divider.type = "button";
    divider.setAttribute("role", "separator");
    divider.setAttribute("aria-label", "调整贴边图片占比");
    divider.append(
      (0, __doeFn_element)("span", "edge-media-divider__line"),
      (0, __doeFn_element)("span", "edge-media-divider__readout"),
      (0, __doeFn_element)("span", "edge-media-divider__status"),
    );

    let session = null;

    const currentRecord = () =>
      state.groupRecords.find((item) => item.node.id === node.id) || record;

    const updateAriaBounds = () => {
      const bounds = (0, __doeFn_edgeMediaBounds)((0, __doeFn_edgeMediaPosition)(node));
      divider.setAttribute("aria-valuemin", String(Math.round(bounds.minimum * 100)));
      divider.setAttribute("aria-valuemax", String(Math.round(bounds.maximum * 100)));
      return bounds;
    };

    const evaluateCandidate = (rawRatio) => {
      if (!session) return;
      const bounds = updateAriaBounds();
      const candidate =
        Math.round((0, __doeFn_normalizeEdgeMediaRatio)(rawRatio, (0, __doeFn_edgeMediaPosition)(node)) * 1000) /
        1000;
      const boundaryLabel = (0, __doeFn_edgeBoundaryLabel)(rawRatio, bounds);

      if (
        session.contentLimit !== null &&
        candidate >= session.lastSafeRatio - 0.0005
      ) {
        (0, __doeFn_setEdgeDividerLimit)(divider, "内容已达安全边界");
        return;
      }
      if (candidate < session.lastSafeRatio - 0.0005) {
        session.contentLimit = null;
      }
      if (Math.abs(candidate - session.lastSafeRatio) < 0.0005) {
        (0, __doeFn_setEdgeDividerLimit)(divider, boundaryLabel);
        return;
      }

      const trial = (0, __doeFn_tryLiveEdgeMediaRatio)(
        state,
        node,
        candidate,
        session.lastSafeRatio,
      );
      session.lastReport = trial.report;
      if (!trial.accepted) {
        if (candidate > session.lastSafeRatio + 0.0005) {
          let lower = session.lastSafeRatio;
          let upper = candidate;
          for (let pass = 0; pass < 6 && upper - lower > 0.001; pass += 1) {
            const midpoint = Math.round(((lower + upper) / 2) * 1000) / 1000;
            if (midpoint <= lower + 0.0005) break;
            const midpointTrial = (0, __doeFn_tryLiveEdgeMediaRatio)(
              state,
              node,
              midpoint,
              lower,
            );
            if (midpointTrial.accepted) {
              lower = midpointTrial.ratio;
              session.lastSafeRatio = midpointTrial.ratio;
              session.lastReport = midpointTrial.report;
              session.changed =
                Math.abs(session.lastSafeRatio - session.startRatio) >= 0.0005;
            } else {
              upper = midpoint;
            }
          }
        }
        session.contentLimit = session.lastSafeRatio;
        (0, __doeFn_setEdgeDividerLimit)(divider, "内容已达安全边界");
        return;
      }

      session.lastSafeRatio = trial.ratio;
      session.changed =
        Math.abs(session.lastSafeRatio - session.startRatio) >= 0.0005;
      (0, __doeFn_setEdgeDividerLimit)(divider, boundaryLabel);
    };

    const schedulePointer = (event) => {
      if (!session || event.pointerId !== session.pointerId) return;
      session.pendingPointer = {
        clientX: event.clientX,
        clientY: event.clientY,
      };
      if (session.frame) return;
      session.frame = requestAnimationFrame(() => {
        if (!session) return;
        session.frame = 0;
        const pending = session.pendingPointer;
        session.pendingPointer = null;
        if (!pending) return;
        evaluateCandidate((0, __doeFn_edgeMediaRatioFromPointer)(currentRecord(), pending));
      });
    };

    const handlePointerMove = (event) => {
      if (!session) return;
      event.preventDefault();
      schedulePointer(event);
    };

    const removePointerListeners = () => {
      __doeScope.global.removeEventListener("pointermove", handlePointerMove, true);
      __doeScope.global.removeEventListener("pointerup", handlePointerUp, true);
      __doeScope.global.removeEventListener("pointercancel", handlePointerCancel, true);
    };

    const finishPointer = (event, cancelled = false) => {
      if (!session || event.pointerId !== session.pointerId) return;
      const finished = session;
      if (finished.frame) cancelAnimationFrame(finished.frame);
      if (!cancelled && finished.pendingPointer) {
        evaluateCandidate(
          (0, __doeFn_edgeMediaRatioFromPointer)(currentRecord(), finished.pendingPointer),
        );
      }
      session = null;
      removePointerListeners();
      divider.classList.remove("is-active");
      state.slideElement?.classList.remove("is-edge-media-resizing");
      if (divider.hasPointerCapture?.(event.pointerId)) {
        divider.releasePointerCapture(event.pointerId);
      }

      if (cancelled) {
        node.layout.mediaRatio = finished.startRatio;
        (0, __doeFn_syncLiveEdgeReport)(state, (0, __doeFn_solveLayout)(state));
        (0, __doeFn_setEdgeDividerLimit)(divider);
        return;
      }
      if (!finished.changed) return;
      const percentage = Math.round(finished.lastSafeRatio * 100);
      finished.lastReport.lastAction = `调整贴边图片占比至 ${percentage}%`;
      (0, __doeFn_syncLiveEdgeReport)(state, finished.lastReport);
      (0, __doeFn_notify)(state, {
        rejected: false,
        action: `调整贴边图片占比至 ${percentage}%`,
      });
    };

    function handlePointerUp(event) {
      finishPointer(event, false);
    }

    function handlePointerCancel(event) {
      finishPointer(event, true);
    }

    divider.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || session) return;
      event.preventDefault();
      event.stopPropagation();
      divider.focus({ preventScroll: true });
      state.selectedId = node.id;
      (0, __doeFn_updateSelection)(state);
      if (!state.report?.fits) {
        (0, __doeFn_setEdgeDividerLimit)(divider, "内容当前无法安全排版");
        return;
      }
      const startRatio = (0, __doeFn_normalizeEdgeMediaRatio)(
        node.layout.mediaRatio,
        (0, __doeFn_edgeMediaPosition)(node),
      );
      session = {
        pointerId: event.pointerId,
        startRatio,
        lastSafeRatio: startRatio,
        lastReport: state.report,
        contentLimit: null,
        pendingPointer: null,
        frame: 0,
        changed: false,
      };
      (0, __doeFn_setEdgeDividerLimit)(divider);
      divider.classList.add("is-active");
      state.slideElement?.classList.add("is-edge-media-resizing");
      divider.setPointerCapture?.(event.pointerId);
      __doeScope.global.addEventListener("pointermove", handlePointerMove, true);
      __doeScope.global.addEventListener("pointerup", handlePointerUp, true);
      __doeScope.global.addEventListener("pointercancel", handlePointerCancel, true);
    });

    divider.addEventListener("keydown", (event) => {
      const position = (0, __doeFn_edgeMediaPosition)(node);
      const keySigns = {
        left: { ArrowLeft: -1, ArrowRight: 1 },
        right: { ArrowLeft: 1, ArrowRight: -1 },
        top: { ArrowUp: -1, ArrowDown: 1 },
        bottom: { ArrowUp: 1, ArrowDown: -1 },
      };
      const sign = keySigns[position]?.[event.key];
      if (!sign || !state.report?.fits) return;
      event.preventDefault();
      event.stopPropagation();
      const currentRatio = (0, __doeFn_normalizeEdgeMediaRatio)(
        node.layout.mediaRatio,
        position,
      );
      const step = event.shiftKey ? 0.04 : 0.01;
      const rawRatio = currentRatio + sign * step;
      const bounds = updateAriaBounds();
      const trial = (0, __doeFn_tryLiveEdgeMediaRatio)(
        state,
        node,
        rawRatio,
        currentRatio,
      );
      if (!trial.accepted) {
        (0, __doeFn_setEdgeDividerLimit)(divider, "内容已达安全边界");
        return;
      }
      const boundaryLabel = (0, __doeFn_edgeBoundaryLabel)(rawRatio, bounds);
      (0, __doeFn_setEdgeDividerLimit)(divider, boundaryLabel);
      const percentage = Math.round(trial.ratio * 100);
      trial.report.lastAction = `调整贴边图片占比至 ${percentage}%`;
      (0, __doeFn_syncLiveEdgeReport)(state, trial.report);
      (0, __doeFn_notify)(state, {
        rejected: false,
        action: `调整贴边图片占比至 ${percentage}%`,
      });
    });

    updateAriaBounds();
    shell.append(divider);
    return divider;
  }

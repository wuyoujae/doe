import { defaultScheduleWork as __doeFn_defaultScheduleWork } from '../../default-schedule-work/index.js';
import { defaultCancelWork as __doeFn_defaultCancelWork } from '../../default-cancel-work/index.js';
import { defaultSourceSignature as __doeFn_defaultSourceSignature } from '../../default-source-signature/index.js';
import { isAbortError as __doeFn_isAbortError } from '../../is-abort-error/index.js';
// Origin: public/yrkie-doe/work-editor/thumbnail-coordinator.js:46
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.ThumbnailCoordinator = class ThumbnailCoordinator {
    constructor(options) {
      if (!options?.filmstrip || !options?.addElement) {
        throw new Error("ThumbnailCoordinator 需要 filmstrip 和 addElement");
      }
      if (
        typeof options.createCard !== "function"
        || typeof options.updateCard !== "function"
        || typeof options.getSlides !== "function"
        || typeof options.renderInactive !== "function"
      ) {
        throw new Error("ThumbnailCoordinator 缺少必要回调");
      }
      this.options = options;
      this.filmstrip = options.filmstrip;
      this.addElement = options.addElement;
      this.records = new Map();
      this.recordByElement = new Map();
      this.queue = [];
      this.queuedIds = new Set();
      this.deckEpoch = 0;
      this.activeSlideId = null;
      this.scheduledWork = null;
      this.running = null;
      this.disposed = false;
      this.scheduleWork = options.scheduleWork || __doeFn_defaultScheduleWork;
      this.cancelWork = options.cancelWork || __doeFn_defaultCancelWork;
      this.sourceSignature = options.sourceSignature || __doeFn_defaultSourceSignature;
      this.stagingHost = document.createElement("div");
      this.stagingHost.className = "work-editor__thumbnail-staging";
      this.stagingHost.setAttribute("aria-hidden", "true");
      document.body.append(this.stagingHost);
      this.observer = this.createObserver();
    }

    createObserver() {
      if (this.options.observeVisibility === false) return null;
      const Observer = this.options.IntersectionObserver || __doeScope.global.IntersectionObserver;
      if (typeof Observer !== "function") return null;
      return new Observer(
        (entries) => {
          entries.forEach((entry) => {
            const record = this.recordByElement.get(entry.target);
            if (!record) return;
            record.nearViewport = Boolean(entry.isIntersecting);
            if (record.nearViewport) {
              this.enqueue(record.slideId);
            } else {
              this.dequeue(record.slideId);
              if (this.running?.slideId === record.slideId) {
                this.running.controller.abort();
              }
            }
          });
          this.scheduleDrain();
        },
        {
          root: this.options.visibilityRoot || this.filmstrip,
          rootMargin: this.options.rootMargin || "0px 170px",
          threshold: 0,
        },
      );
    }

    invalidateDeck() {
      this.deckEpoch += 1;
      this.cancelBackground({ clearQueue: true });
      this.records.forEach((record) => {
        record.jobEpoch += 1;
        record.stale = true;
      });
    }

    reconcile(slides, activeIndex, pageNumber, { replaceDeck = false, logo = null } = {}) {
      if (this.disposed) return;
      if (replaceDeck) this.invalidateDeck();
      const total = slides.length;
      const activeSlide = slides[activeIndex] || null;
      this.activeSlideId = activeSlide?.id || null;
      const presentIds = new Set(slides.map((slide) => slide.id));

      this.records.forEach((record, slideId) => {
        if (presentIds.has(slideId)) return;
        this.observer?.unobserve(record.item);
        this.recordByElement.delete(record.item);
        record.item.remove();
        this.dequeue(slideId);
        if (this.running?.slideId === slideId) this.running.controller.abort();
        this.records.delete(slideId);
      });

      slides.forEach((slide, index) => {
        const slideId = slide.id;
        let record = this.records.get(slideId);
        if (!record) {
          const refs = this.options.createCard(slideId);
          record = {
            ...refs,
            slideId,
            signature: null,
            sourceEpoch: 0,
            jobEpoch: 0,
            renderEpoch: 0,
            stale: true,
            hasResult: false,
            nearViewport: !this.observer,
          };
          this.records.set(slideId, record);
          this.recordByElement.set(record.item, record);
          this.observer?.observe(record.item);
        }

        const signature = this.sourceSignature(slide, index, total, pageNumber, logo);
        if (record.signature !== signature) {
          record.signature = signature;
          record.sourceEpoch += 1;
          record.jobEpoch += 1;
          record.stale = true;
          if (this.running?.slideId === slideId) this.running.controller.abort();
        }
        this.options.updateCard(record, {
          index,
          total,
          active: slideId === this.activeSlideId,
        });
        this.filmstrip.insertBefore(record.item, this.addElement);
      });
      this.filmstrip.append(this.addElement);
      this.refreshNearViewport();

      if (this.running?.slideId === this.activeSlideId) {
        const activeRecord = this.records.get(this.activeSlideId);
        if (activeRecord) activeRecord.jobEpoch += 1;
        this.running.controller.abort();
      }

      this.records.forEach((record) => {
        if (record.nearViewport) this.enqueue(record.slideId);
      });
      this.scheduleDrain();
    }

    refreshNearViewport() {
      if (!this.observer) return;
      const rootRect = (this.options.visibilityRoot || this.filmstrip).getBoundingClientRect();
      if (!rootRect.width || !rootRect.height) return;
      const margin = 170;
      this.records.forEach((record) => {
        const rect = record.item.getBoundingClientRect();
        record.nearViewport = Boolean(
          rect.width
          && rect.height
          && rect.right >= rootRect.left - margin
          && rect.left <= rootRect.right + margin
          && rect.bottom >= rootRect.top
          && rect.top <= rootRect.bottom,
        );
        if (record.nearViewport) this.enqueue(record.slideId);
        else this.dequeue(record.slideId);
      });
    }

    publishActive(slideId, capture, { requireActive = true } = {}) {
      const record = this.records.get(slideId);
      if (!record || this.disposed) return Promise.resolve(false);
      if (this.running?.slideId === slideId) this.running.controller.abort();
      record.jobEpoch += 1;
      const gate = this.createGate(record);
      const snapshotPromise = typeof capture === "function" ? capture() : capture;
      return Promise.resolve(snapshotPromise)
        .then((snapshot) => {
          if (!this.gateIsCurrent(record, gate, { requireActive })) return false;
          return this.commitSnapshot(record, snapshot, gate);
        })
        .catch((error) => {
          if (!(0, __doeFn_isAbortError)(error)) this.options.onError?.(error, slideId, "active");
          return false;
        });
    }

    createGate(record) {
      return {
        deckEpoch: this.deckEpoch,
        slideId: record.slideId,
        sourceEpoch: record.sourceEpoch,
        jobEpoch: record.jobEpoch,
      };
    }

    gateIsCurrent(record, gate, { requireActive = false } = {}) {
      return Boolean(
        !this.disposed
        && record
        && this.records.get(gate.slideId) === record
        && gate.deckEpoch === this.deckEpoch
        && gate.sourceEpoch === record.sourceEpoch
        && gate.jobEpoch === record.jobEpoch
        && (!requireActive || gate.slideId === this.activeSlideId),
      );
    }

    commitSnapshot(record, snapshot, gate) {
      const element = snapshot?.element || snapshot;
      const renderEpoch = Number(snapshot?.renderEpoch) || 0;
      if (!element || typeof element.cloneNode !== "function") return false;
      if (!this.gateIsCurrent(record, gate)) return false;
      record.canvas.replaceChildren(element);
      record.canvas.dataset.thumbnailState = "ready";
      record.renderEpoch = renderEpoch;
      record.hasResult = true;
      record.stale = false;
      return true;
    }

    enqueue(slideId, { front = false } = {}) {
      const record = this.records.get(slideId);
      if (
        !record
        || !record.stale
        || !record.nearViewport
        || slideId === this.activeSlideId
        || this.queuedIds.has(slideId)
        || this.running?.slideId === slideId
      ) return;
      if (front) this.queue.unshift(slideId);
      else this.queue.push(slideId);
      this.queuedIds.add(slideId);
    }

    dequeue(slideId) {
      if (!this.queuedIds.delete(slideId)) return;
      this.queue = this.queue.filter((candidate) => candidate !== slideId);
    }

    scheduleDrain() {
      if (
        this.disposed
        || this.scheduledWork
        || this.running
        || !this.queue.length
        || this.options.canRunBackground?.() === false
      ) return;
      this.scheduledWork = this.scheduleWork(() => {
        this.scheduledWork = null;
        void this.runNext();
      });
    }

    async runNext() {
      if (
        this.disposed
        || this.running
        || this.options.canRunBackground?.() === false
      ) return;
      let record = null;
      while (this.queue.length && !record) {
        const slideId = this.queue.shift();
        this.queuedIds.delete(slideId);
        const candidate = this.records.get(slideId);
        if (
          candidate?.stale
          && candidate.nearViewport
          && slideId !== this.activeSlideId
        ) record = candidate;
      }
      if (!record) return;

      const slides = this.options.getSlides();
      const index = slides.findIndex((slide) => slide.id === record.slideId);
      if (index < 0) {
        this.scheduleDrain();
        return;
      }
      record.jobEpoch += 1;
      const gate = this.createGate(record);
      const controller = new AbortController();
      this.running = { slideId: record.slideId, controller, gate };
      this.stagingHost.replaceChildren();
      try {
        const snapshot = await this.options.renderInactive({
          slide: slides[index],
          slideId: record.slideId,
          index,
          total: slides.length,
          signal: controller.signal,
          stagingHost: this.stagingHost,
        });
        if (
          this.gateIsCurrent(record, gate)
          && record.slideId !== this.activeSlideId
        ) {
          this.commitSnapshot(record, snapshot, gate);
        }
      } catch (error) {
        if (!(0, __doeFn_isAbortError)(error) && this.gateIsCurrent(record, gate)) {
          record.stale = false;
          if (!record.hasResult) {
            record.canvas.replaceChildren();
            record.canvas.textContent = `第 ${index + 1} 页无法预览`;
            record.canvas.dataset.thumbnailState = "error";
          }
          this.options.onError?.(error, record.slideId, "inactive");
        }
      } finally {
        this.stagingHost.replaceChildren();
        if (this.running?.gate === gate) this.running = null;
        if (record.stale && record.nearViewport) this.enqueue(record.slideId);
        this.scheduleDrain();
      }
    }

    cancelBackground({ clearQueue = false } = {}) {
      if (this.scheduledWork) {
        this.cancelWork(this.scheduledWork);
        this.scheduledWork = null;
      }
      if (this.running) {
        const record = this.records.get(this.running.slideId);
        if (record) {
          record.jobEpoch += 1;
          record.stale = true;
        }
        this.running.controller.abort();
      }
      if (clearQueue) {
        this.queue = [];
        this.queuedIds.clear();
      }
    }

    interrupt() {
      this.cancelBackground();
      this.records.forEach((record) => {
        if (record.nearViewport) this.enqueue(record.slideId, { front: true });
      });
      this.scheduleDrain();
    }

    resume() {
      this.records.forEach((record) => {
        if (record.nearViewport) this.enqueue(record.slideId);
      });
      this.scheduleDrain();
    }

    debugState() {
      return {
        deckEpoch: this.deckEpoch,
        activeSlideId: this.activeSlideId,
        queuedSlideIds: [...this.queue],
        runningSlideId: this.running?.slideId || null,
        records: [...this.records.values()].map((record) => ({
          slideId: record.slideId,
          sourceEpoch: record.sourceEpoch,
          jobEpoch: record.jobEpoch,
          stale: record.stale,
          hasResult: record.hasResult,
        })),
      };
    }

    dispose() {
      if (this.disposed) return;
      this.cancelBackground({ clearQueue: true });
      this.disposed = true;
      this.observer?.disconnect();
      this.records.clear();
      this.recordByElement.clear();
      this.stagingHost.remove();
    }
  };
}

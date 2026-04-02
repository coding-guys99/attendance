import { state } from "../../core/state.js";

let timer = null;

export function startClock(onTick) {
  stopClock();

  timer = setInterval(() => {
    state.now = new Date();
    if (typeof onTick === "function") onTick(state.now);
  }, 1000);
}

export function stopClock() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
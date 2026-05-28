import type { Clock } from "../application/ports/Clock";

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class FrozenClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return this.current;
  }

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

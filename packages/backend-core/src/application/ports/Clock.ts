// Clock port. Use-cases that need "now" pull it from here so tests can
// supply a fixed time without mocking Date globally.

export interface Clock {
  now(): Date;
}

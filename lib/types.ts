import OT from '@opentok/client';

declare global {
  interface Window {
    OT?: typeof OT;
  }
}

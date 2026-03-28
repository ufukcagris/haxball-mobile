interface VendorDocument extends Document {
  webkitFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void>;
}

interface VendorElement extends HTMLElement {
  webkitRequestFullscreen?: (options?: FullscreenOptions) => Promise<void>;
  mozRequestFullScreen?: (options?: FullscreenOptions) => Promise<void>;
}

export function toggleFullscreen(): void {
  const el = document.documentElement as VendorElement;
  const doc = document as VendorDocument;
  const isFs = doc.fullscreenElement || doc.webkitFullscreenElement;

  if (!isFs) {
    const req =
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.mozRequestFullScreen;
    if (req) req.call(el, { navigationUI: 'hide' });
  } else {
    const ex = doc.exitFullscreen || doc.webkitExitFullscreen;
    if (ex) ex.call(doc);
  }
}

export function tryAutoFullscreen(): void {
  const el = document.documentElement as VendorElement;
  const doc = document as VendorDocument;
  const req =
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.mozRequestFullScreen;
  if (req && !doc.fullscreenElement && !doc.webkitFullscreenElement) {
    req.call(el, { navigationUI: 'hide' }).catch(() => {});
  }
}

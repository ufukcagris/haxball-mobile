export function toggleFullscreen(): void {
  const el = document.documentElement;
  const isFs =
    document.fullscreenElement || (document as any).webkitFullscreenElement;
  if (!isFs) {
    const req =
      el.requestFullscreen ||
      (el as any).webkitRequestFullscreen ||
      (el as any).mozRequestFullScreen;
    if (req) req.call(el, { navigationUI: 'hide' });
  } else {
    const ex =
      document.exitFullscreen || (document as any).webkitExitFullscreen;
    if (ex) ex.call(document);
  }
}

export function tryAutoFullscreen(): void {
  const el = document.documentElement;
  const req =
    el.requestFullscreen ||
    (el as any).webkitRequestFullscreen ||
    (el as any).mozRequestFullScreen;
  if (
    req &&
    !document.fullscreenElement &&
    !(document as any).webkitFullscreenElement
  ) {
    req.call(el, { navigationUI: 'hide' }).catch(() => {});
  }
}

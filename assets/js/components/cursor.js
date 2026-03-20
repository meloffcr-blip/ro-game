/**
 * ════════════════════════════════════════
 *  Cursor Component — Custom cursor + trail
 * ════════════════════════════════════════
 */

const CursorComponent = (() => {

  let cursor, trail;
  let mx = -100, my = -100;
  let tx = -100, ty = -100;
  let raf;

  function init() {
    cursor = document.getElementById('custom-cursor');
    trail  = document.getElementById('cursor-trail');
    if (!cursor || !trail) return;

    // لو تاتش (موبايل) — مش محتاج cursor
    if (window.matchMedia('(pointer: coarse)').matches) {
      cursor.style.display = 'none';
      trail.style.display  = 'none';
      return;
    }

    document.addEventListener('mousemove', _onMove);
    _animate();
    _bindHover();
  }

  function _onMove(e) {
    mx = e.clientX;
    my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  }

  function _animate() {
    tx += (mx - tx) * 0.14;
    ty += (my - ty) * 0.14;
    trail.style.left = tx + 'px';
    trail.style.top  = ty + 'px';
    raf = requestAnimationFrame(_animate);
  }

  function _bindHover() {
    document.addEventListener('mouseover', (e) => {
      const el = e.target.closest('a, button, [data-cursor-hover]');
      if (el) _grow(); else _shrink();
    });
  }

  function _grow() {
    cursor.style.width  = '26px';
    cursor.style.height = '26px';
    trail.style.width   = '52px';
    trail.style.height  = '52px';
  }

  function _shrink() {
    cursor.style.width  = '18px';
    cursor.style.height = '18px';
    trail.style.width   = '36px';
    trail.style.height  = '36px';
  }

  function destroy() {
    cancelAnimationFrame(raf);
    document.removeEventListener('mousemove', _onMove);
  }

  return { init, destroy };
})();

document.addEventListener('DOMContentLoaded', () => CursorComponent.init());

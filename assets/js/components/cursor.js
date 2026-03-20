/**
 * ════════════════════════════════════════
 *  cursor.js — Custom cursor + trail
 *  التحسينات:
 *   • CSS classes بدل inline styles (أسرع، مش بيعمل reflow)
 *   • State machine واضحة بدل if/else
 *   • Event delegation صح للـ hover
 *   • mousedown/mouseup للـ click state
 * ════════════════════════════════════════
 */

const CursorComponent = (() => {

  // ─── State Machine ───
  const STATES = { IDLE: 'idle', HOVER: 'hover', CLICK: 'click', TEXT: 'text', DRAG: 'drag' };

  const HOVER_SELECTORS = 'a, button, [data-cursor-hover], label, select, [role="button"]';
  const TEXT_SELECTORS  = 'input, textarea, [contenteditable]';

  let cursor, trail;
  let mx = -200, my = -200;
  let tx = -200, ty = -200;
  let raf = null;
  let currentState = STATES.IDLE;
  let isDragging = false;

  // ─── Init ───
  function init() {
    cursor = document.getElementById('custom-cursor');
    trail  = document.getElementById('cursor-trail');
    if (!cursor || !trail) return;

    // تاتش / موبايل — مش محتاج cursor
    if (window.matchMedia('(pointer: coarse)').matches) {
      cursor.style.display = 'none';
      trail.style.display  = 'none';
      return;
    }

    _bindEvents();
    _startLoop();
  }

  // ─── Event Binding ───
  function _bindEvents() {
    document.addEventListener('mousemove',  _onMove,     { passive: true });
    document.addEventListener('mouseover',  _onOver,     { passive: true });
    document.addEventListener('mousedown',  _onDown,     { passive: true });
    document.addEventListener('mouseup',    _onUp,       { passive: true });
    document.addEventListener('dragstart',  _onDragStart,{ passive: true });
    document.addEventListener('dragend',    _onDragEnd,  { passive: true });
    document.addEventListener('mouseleave', _onLeave,    { passive: true });
    document.addEventListener('mouseenter', _onEnter,    { passive: true });
  }

  function _onMove(e) {
    mx = e.clientX;
    my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  }

  function _onOver(e) {
    if (isDragging) return;
    if (e.target.closest(TEXT_SELECTORS)) {
      _setState(STATES.TEXT);
    } else if (e.target.closest(HOVER_SELECTORS)) {
      _setState(STATES.HOVER);
    } else {
      _setState(STATES.IDLE);
    }
  }

  function _onDown() {
    if (!isDragging) _setState(STATES.CLICK);
  }

  function _onUp() {
    isDragging = false;
    // revert للحالة الصح بناءً على العنصر الحالي
    const el = document.elementFromPoint(mx, my);
    if (el) {
      if (el.closest(TEXT_SELECTORS))  _setState(STATES.TEXT);
      else if (el.closest(HOVER_SELECTORS)) _setState(STATES.HOVER);
      else _setState(STATES.IDLE);
    }
  }

  function _onDragStart() { isDragging = true; _setState(STATES.DRAG); }
  function _onDragEnd()   { isDragging = false; _setState(STATES.IDLE); }
  function _onLeave()     { cursor.classList.add('hidden'); trail.classList.add('hidden'); }
  function _onEnter()     { cursor.classList.remove('hidden'); trail.classList.remove('hidden'); }

  // ─── State Machine ───
  function _setState(state) {
    if (state === currentState) return;
    cursor.classList.remove(`state-${currentState}`);
    trail.classList.remove(`state-${currentState}`);
    currentState = state;
    if (state !== STATES.IDLE) {
      cursor.classList.add(`state-${state}`);
      trail.classList.add(`state-${state}`);
    }
  }

  // ─── Animation Loop (trail فقط) ───
  function _startLoop() {
    function loop() {
      tx += (mx - tx) * 0.14;
      ty += (my - ty) * 0.14;
      trail.style.left = tx + 'px';
      trail.style.top  = ty + 'px';
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
  }

  // ─── Destroy ───
  function destroy() {
    if (raf) cancelAnimationFrame(raf);
    document.removeEventListener('mousemove',  _onMove);
    document.removeEventListener('mouseover',  _onOver);
    document.removeEventListener('mousedown',  _onDown);
    document.removeEventListener('mouseup',    _onUp);
    document.removeEventListener('dragstart',  _onDragStart);
    document.removeEventListener('dragend',    _onDragEnd);
    document.removeEventListener('mouseleave', _onLeave);
    document.removeEventListener('mouseenter', _onEnter);
  }

  return { init, destroy };
})();

document.addEventListener('DOMContentLoaded', () => CursorComponent.init());
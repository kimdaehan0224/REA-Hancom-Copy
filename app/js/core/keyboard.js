/*
 * 화상 키보드 (캡처 03/04의 아래쪽 키보드, 02의 단계 키 표시)
 * [확인] 손가락 이름: 좌-소지/약지/중지/검지, 우-검지/중지/약지/소지 (리소스 62046~62053)
 * [추정] 키 → 손가락 배정은 일반적인 표준 운지법
 */
(function (TT) {
  'use strict';

  const ROWS = [
    [['Backquote'], ['Digit1'], ['Digit2'], ['Digit3'], ['Digit4'], ['Digit5'], ['Digit6'], ['Digit7'], ['Digit8'], ['Digit9'], ['Digit0'], ['Minus'], ['Equal'], ['Backspace', 2]],
    [['Tab', 1.5], ['KeyQ'], ['KeyW'], ['KeyE'], ['KeyR'], ['KeyT'], ['KeyY'], ['KeyU'], ['KeyI'], ['KeyO'], ['KeyP'], ['BracketLeft'], ['BracketRight'], ['Backslash', 1.5]],
    [['CapsLock', 1.75], ['KeyA'], ['KeyS'], ['KeyD'], ['KeyF'], ['KeyG'], ['KeyH'], ['KeyJ'], ['KeyK'], ['KeyL'], ['Semicolon'], ['Quote'], ['Enter', 2.25]],
    [['ShiftLeft', 2.25], ['KeyZ'], ['KeyX'], ['KeyC'], ['KeyV'], ['KeyB'], ['KeyN'], ['KeyM'], ['Comma'], ['Period'], ['Slash'], ['ShiftRight', 2.75]],
    [['ControlLeft', 1.5], ['MetaLeft', 1.25], ['AltLeft', 1.25], ['Space', 7], ['AltRight', 1.25], ['Lang', 1.25], ['ControlRight', 1.5]]
  ];

  const SPECIAL = {
    Backspace: '←', Tab: 'Tab', CapsLock: 'Caps', Enter: 'Enter', ShiftLeft: 'Shift', ShiftRight: 'Shift',
    ControlLeft: 'Ctrl', ControlRight: 'Ctrl', MetaLeft: '', AltLeft: 'Alt', AltRight: '한/영', Lang: '한자', Space: ''
  };

  const FINGER_NAMES = ['좌-소지', '좌-약지', '좌-중지', '좌-검지', '우-검지', '우-중지', '우-약지', '우-소지', '엄지'];
  const F = {};
  const assign = (idx, codes) => codes.forEach(c => { F[c] = idx; });
  assign(0, ['Backquote', 'Digit1', 'Tab', 'KeyQ', 'CapsLock', 'KeyA', 'ShiftLeft', 'KeyZ', 'ControlLeft']);
  assign(1, ['Digit2', 'KeyW', 'KeyS', 'KeyX']);
  assign(2, ['Digit3', 'KeyE', 'KeyD', 'KeyC']);
  assign(3, ['Digit4', 'Digit5', 'KeyR', 'KeyT', 'KeyF', 'KeyG', 'KeyV', 'KeyB']);
  assign(4, ['Digit6', 'Digit7', 'KeyY', 'KeyU', 'KeyH', 'KeyJ', 'KeyN', 'KeyM']);
  assign(5, ['Digit8', 'KeyI', 'KeyK', 'Comma']);
  assign(6, ['Digit9', 'KeyO', 'KeyL', 'Period']);
  assign(7, ['Digit0', 'Minus', 'Equal', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash', 'Semicolon', 'Quote', 'Slash', 'Enter', 'ShiftRight', 'Backspace', 'ControlRight']);
  assign(8, ['Space', 'AltLeft', 'AltRight', 'MetaLeft', 'Lang']);
  const fingerOf = code => (F[code] === undefined ? 8 : F[code]);

  /**
   * @param {HTMLElement} container
   * @param {'ko2'|'en'} layout
   * @param {{mini?:boolean, plain?:boolean}} opts  mini: 단계 표시용 작은 키보드 / plain: 라벨 없음
   */
  function render(container, layout, opts) {
    opts = opts || {};
    const labels = TT.hangul.labels(layout);
    const root = document.createElement('div');
    root.className = 'kbd' + (opts.mini ? ' kbd-mini' : '') + (opts.plain ? ' kbd-plain' : '');
    const keyEls = {};
    ROWS.forEach(row => {
      const r = document.createElement('div');
      r.className = 'kbd-row';
      row.forEach(([code, w]) => {
        const k = document.createElement('div');
        k.className = 'key';
        k.dataset.code = code;
        k.style.flexGrow = w || 1;
        if (!opts.mini && !opts.plain) {
          const lab = labels[code];
          if (lab) {
            k.innerHTML = `<span class="k-shift">${esc(lab.shift)}</span><span class="k-base">${esc(lab.base)}</span>`;
          } else {
            k.innerHTML = `<span class="k-special">${SPECIAL[code] || ''}</span>`;
            k.classList.add('key-special');
          }
        }
        keyEls[code] = k;
        r.appendChild(k);
      });
      root.appendChild(r);
    });
    container.appendChild(root);

    return {
      el: root,
      /** 단계 키 강조 (캡처 02의 주황 키) */
      setHighlight(codes) {
        Object.values(keyEls).forEach(k => k.classList.remove('hl'));
        (codes || []).forEach(c => keyEls[c] && keyEls[c].classList.add('hl'));
      },
      /** 다음에 누를 키 표시 (캡처 03/04의 주황 점) */
      setNext(key) {
        Object.values(keyEls).forEach(k => k.classList.remove('next', 'next-shift'));
        if (!key) return;
        if (keyEls[key.code]) keyEls[key.code].classList.add('next');
        if (key.shift) {
          // 반대쪽 손의 Shift
          const sh = fingerOf(key.code) <= 3 ? 'ShiftRight' : 'ShiftLeft';
          keyEls[sh] && keyEls[sh].classList.add('next-shift');
        }
      },
      /** 누른 키 깜빡임 (맞음/틀림) */
      flash(code, ok) {
        const k = keyEls[code];
        if (!k) return;
        k.classList.remove('flash-ok', 'flash-bad');
        void k.offsetWidth;
        k.classList.add(ok ? 'flash-ok' : 'flash-bad');
        clearTimeout(k._flashTimer); // 키마다 따로 타이머 (빠르게 칠 때 색이 남지 않도록)
        k._flashTimer = setTimeout(() => k.classList.remove('flash-ok', 'flash-bad'), 180);
      }
    };
  }

  function esc(s) {
    return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  TT.keyboard = { render, fingerOf, FINGER_NAMES };
})(window.TT = window.TT || {});

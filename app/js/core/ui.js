/*
 * 화면 틀(셸), 화면 전환(라우터), 모달, 공통 위젯
 *
 * 화면 전환 흐름 [추정: 캡처 01~06 기준]
 *   시작 화면 → (시작) → 자리연습 안내 → (시작) → 자리연습
 *   상단 탭: 자리연습(안내) / 낱말연습 / 짧은글연습 / 긴글연습
 *   하단 오른쪽: 안내 화면에서는 [설정/통계], 연습 화면에서는 [돌아가기]
 * [확인] 연습이 끝나면 결과 창(FUN_00477c30)을 띄운 뒤 화면 상태를 바꾼다(FUN_00476880(3)).
 */
(function (TT) {
  'use strict';
  TT.screens = TT.screens || {};
  let stage = null, current = null, currentName = null, prevName = null;
  let modalDepth = 0;

  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const TABS = [['jari', '자리연습', 'jariIntro'], ['natmal', '낱말연습', 'natmal'], ['short', '짧은글연습', 'short'], ['long', '긴글연습', 'long']];

  function buildShell(meta) {
    const shell = el(`
      <div class="shell">
        <div class="userbadge">
          <div class="avatar"></div>
          <div class="uname"></div>
          <div class="uscore" title="평균타수"></div>
        </div>
        <div class="games">
          <button class="btn-game" data-game="케이크던지기">케이크던지기</button>
          <button class="btn-game" data-game="해상구조SOS">해상구조SOS</button>
        </div>
        <div class="tabs">${TABS.map(([k, label]) => `<button class="tab" data-tab="${k}">${label}</button>`).join('')}</div>
        <div class="content"></div>
        <div class="footer">
          <div class="brand"><span class="brand-dot"></span>타자 연습</div>
          <button class="btn-foot" id="footBtn"></button>
        </div>
      </div>`);
    shell.querySelectorAll('.tab').forEach(b => {
      if (b.dataset.tab === meta.tab) b.classList.add('active');
      b.addEventListener('click', () => {
        const t = TABS.find(x => x[0] === b.dataset.tab);
        go(t[2]);
      });
    });
    // [추정] 게임은 이번 범위에서 제외 — 버튼만 두고 안내
    shell.querySelectorAll('.btn-game').forEach(b => b.addEventListener('click', () => {
      alert(`${b.dataset.game}은(는) 준비 중입니다.`);
    }));
    const foot = shell.querySelector('#footBtn');
    if (meta.footer === 'back') {
      foot.textContent = '↩ 돌아가기';
      foot.addEventListener('click', () => go(meta.backTo === '@prev' ? (prevName || 'jariIntro') : (meta.backTo || 'jariIntro')));
    } else {
      foot.textContent = '설정/통계';
      foot.addEventListener('click', () => go('settings'));
    }
    return shell;
  }

  function refreshUserBadge() {
    const u = TT.store.user();
    const b = stage.querySelector('.userbadge');
    if (!b || !u) return;
    b.querySelector('.avatar').textContent = (u.name || '?').slice(0, 1);
    b.querySelector('.uname').textContent = u.name;
    b.querySelector('.uscore').textContent = u.avgSpeed; // [추정] 캡처의 숫자를 평균타수로 해석
  }

  function go(name, params) {
    const scr = TT.screens[name];
    if (!scr) throw new Error('unknown screen ' + name);
    if (current && current.unmount) current.unmount();
    if (currentName && currentName !== name && currentName !== 'settings') prevName = currentName;
    stage.querySelectorAll('.screen-root').forEach(n => n.remove());
    const meta = scr.meta || {};
    const root = document.createElement('div');
    root.className = 'screen-root screen-' + name;
    stage.appendChild(root);
    let content = root;
    if (meta.shell) {
      const shell = buildShell(meta);
      root.appendChild(shell);
      content = shell.querySelector('.content');
    }
    current = scr;
    currentName = name;
    refreshUserBadge();
    scr.mount(content, params || {});
    document.title = (meta.title ? meta.title + ' - ' : '') + '타자 연습';
  }

  /** 모달. buttons: [{label, value, primary}] → Promise<value> */
  function modal({ title, body, buttons, className }) {
    return new Promise(resolve => {
      modalDepth++;
      const ov = el(`<div class="modal-ov"><div class="modal ${className || ''}">
        ${title ? `<div class="modal-title">${esc(title)}</div>` : ''}
        <div class="modal-body"></div><div class="modal-btns"></div></div></div>`);
      const bodyEl = ov.querySelector('.modal-body');
      if (typeof body === 'string') bodyEl.innerHTML = body; else if (body) bodyEl.appendChild(body);
      const btnBox = ov.querySelector('.modal-btns');
      const list = buttons || [{ label: '확인', value: true, primary: true }];
      const close = v => {
        ov.remove();
        document.removeEventListener('keydown', onKey, true);
        modalDepth--;
        resolve(v);
      };
      list.forEach(b => {
        const btn = el(`<button class="btn ${b.primary ? 'btn-primary' : ''}">${esc(b.label)}</button>`);
        btn.addEventListener('click', () => close(typeof b.value === 'function' ? b.value(ov) : b.value));
        btnBox.appendChild(btn);
      });
      function onKey(e) {
        if (e.key === 'Escape') {
          e.stopPropagation(); e.preventDefault();
          const cancel = list.find(b => b.cancel) || (list.length === 1 ? list[0] : null);
          if (cancel) close(typeof cancel.value === 'function' ? cancel.value(ov) : cancel.value);
        } else if (e.key === 'Enter' && !e.isComposing) {
          const p = list.find(b => b.primary);
          if (p && !(e.target && e.target.tagName === 'TEXTAREA')) {
            e.stopPropagation(); e.preventDefault();
            const v = typeof p.value === 'function' ? p.value(ov) : p.value;
            if (v !== undefined) close(v);
          }
        }
      }
      document.addEventListener('keydown', onKey, true);
      stage.appendChild(ov);
      const first = ov.querySelector('input,select,button.btn-primary,button');
      first && first.focus();
    });
  }
  const alert = (msg, title) => modal({ title: title || '알림', body: `<p class="msg">${esc(msg).replace(/\n/g, '<br>')}</p>` });
  const confirm = (msg, title) => modal({
    title: title || '확인', body: `<p class="msg">${esc(msg)}</p>`,
    buttons: [{ label: '확인', value: true, primary: true }, { label: '취소', value: false, cancel: true }]
  });

  /**
   * 상단 수치 막대 (캡처 03~06의 "진행도 ▬▬ 0%")
   * items: [{id, label, unit, width}]
   */
  function statBar(items) {
    const bar = el(`<div class="statbar">${items.map(it => `
      <div class="stat" data-id="${it.id}">
        <span class="stat-label">${esc(it.label)}</span>
        <span class="gauge" style="width:${it.width || 70}px"><span class="gauge-fill"></span></span>
        <span class="stat-val">0${esc(it.unit || '')}</span>
      </div>`).join('')}</div>`);
    const units = {};
    items.forEach(it => { units[it.id] = it.unit || ''; });
    return {
      el: bar,
      set(id, value, ratio) {
        const s = bar.querySelector(`[data-id="${id}"]`);
        if (!s) return;
        s.querySelector('.stat-val').textContent = value + units[id];
        s.querySelector('.gauge-fill').style.width = Math.max(0, Math.min(1, ratio || 0)) * 100 + '%';
      },
      setText(id, text) {
        const s = bar.querySelector(`[data-id="${id}"]`);
        if (s) s.querySelector('.stat-val').textContent = text;
      }
    };
  }

  /** [확인] 연습시간 표시 "%d분 %d초" = ms/60000, (ms%60000)/1000 (FUN_00477c30) */
  const fmtTime = ms => `${Math.floor(ms / 60000)}분 ${Math.floor((ms % 60000) / 1000)}초`;

  function fit() {
    const s = Math.min(window.innerWidth / 1000, window.innerHeight / 740);
    stage.style.transform = `scale(${Math.max(0.2, s)})`;
  }

  TT.ui = {
    el, esc, modal, alert, confirm, statBar, fmtTime, refreshUserBadge,
    get modalOpen() { return modalDepth > 0; },
    init(stageEl) { stage = stageEl; fit(); window.addEventListener('resize', fit); }
  };
  TT.router = { go, get name() { return currentName; } };
})(window.TT = window.TT || {});

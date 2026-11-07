/*
 * 2. 자리연습 안내 (캡처 02)
 *  - 키보드 그림(단계 키 강조), 1~8단계 선택, 시작 버튼, 하단 상태줄
 * [확인] 상태줄 형식 "자판 : %s    자리연습 : %d단계    낱말 연습 : %d단계" (62198)
 * [확인] 좌우 화살표 키나 마우스로 단계를 바꿀 수 있다 (캡처 02 설명 문구)
 */
(function (TT) {
  'use strict';
  let onKey = null;

  /** 단계 선택 위젯 (안내 화면·연습 화면 공용) */
  TT.stageSelector = function (container, value, onChange, small) {
    const w = TT.ui.el(`<div class="stage-sel ${small ? 'small' : ''}">
      ${small ? '' : '<button class="arrow" data-d="-1">◀</button>'}
      <div class="dots">${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<button class="dot" data-n="${n}">${n}</button>`).join('')}</div>
      ${small ? '' : '<button class="arrow" data-d="1">▶</button>'}</div>`);
    const set = n => {
      value = Math.max(1, Math.min(8, n));
      w.querySelectorAll('.dot').forEach(d => d.classList.toggle('on', +d.dataset.n === value));
    };
    w.querySelectorAll('.dot').forEach(d => d.addEventListener('click', () => { set(+d.dataset.n); onChange(value); }));
    w.querySelectorAll('.arrow').forEach(a => a.addEventListener('click', () => { set(value + +a.dataset.d); onChange(value); }));
    set(value);
    container.appendChild(w);
    return { set, get value() { return value; } };
  };

  TT.stageKeyCodes = function (layout, stage) {
    const st = TT.data.jari[layout === 'en' ? 'en' : 'ko2'][stage - 1];
    return st.keys.map(k => TT.hangul.charToKeys(k, layout)[0].code);
  };

  TT.statusLine = function () {
    const u = TT.store.user();
    return `자판 : ${TT.store.layoutName(TT.store.settings().layout)}    자리연습 : ${u.jariStage}단계    낱말 연습 : ${u.natmalStage}단계`;
  };

  TT.screens.jariIntro = {
    meta: { shell: true, tab: 'jari', footer: 'settings', title: '자리연습' },
    mount(el) {
      const u = TT.store.user();
      const layout = TT.store.settings().layout;
      const box = TT.ui.el(`<div>
        <div class="intro-head"><span class="arrow-ico"></span>글자판의 위치를 익히는 곳입니다.</div>
        <div class="intro-kbd"></div>
        <div class="intro-stage"></div>
        <div class="intro-desc">글자판의 위치를 익히는 곳입니다.<br>글자판이 아직 손에 익지 않았다면 자리 연습부터 시작하세요.<br>좌우 화살표 키나 마우스로 연습 단계를 바꿀 수 있습니다.</div>
        <button class="btn-round">시작</button>
        <div class="statusline"></div>
      </div>`);
      el.appendChild(box);
      const kb = TT.keyboard.render(box.querySelector('.intro-kbd'), layout, { plain: true });
      const status = box.querySelector('.statusline');
      const apply = n => {
        u.jariStage = n; // [추정] 안내 화면에서 고른 단계를 사용자 단계로 저장
        TT.store.save();
        kb.setHighlight(TT.stageKeyCodes(layout, n));
        status.textContent = TT.statusLine();
      };
      const sel = TT.stageSelector(box.querySelector('.intro-stage'), u.jariStage, apply);
      apply(u.jariStage);
      const start = () => TT.router.go('jari', { stage: sel.value });
      box.querySelector('.btn-round').addEventListener('click', start);
      onKey = e => {
        if (TT.ui.modalOpen) return;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          sel.set(sel.value + (e.key === 'ArrowRight' ? 1 : -1));
          apply(sel.value);
        } else if (e.key === 'Enter') { e.preventDefault(); start(); }
      };
      document.addEventListener('keydown', onKey);
    },
    unmount() { document.removeEventListener('keydown', onKey); }
  };
})(window.TT = window.TT || {});

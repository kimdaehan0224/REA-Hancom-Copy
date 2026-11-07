/*
 * 4. 낱말연습 (캡처 04)
 *  - 진행도·오타수·정확도, 이전/현재/다음 낱말, 화상 키보드, 단계 설정
 *
 * [확인] 클래스 CHTTWordPrac, 결과 창 호출 = vtable 슬롯 5 (0x43ee70) — analysis §7.2
 * [확인] 타수는 두벌식 키 입력 단위(CKor2Bul), 정확도는 글자 단위 — 원본에서는 짧은 글 경로에서 확인, 낱말 적용은 [추정]
 * [추정] 한 판 20낱말, Enter 또는 Space로 다음 낱말, 모자란/남는 글자도 오타로 셈
 * [추정] 정확도가 목표 이상이면 다음 단계로 (낱말연습 단계 규칙은 원본에서 확인하지 못함)
 * [원본에 없음] Esc: 현재 연습을 바로 끝내고 결과 창 표시 (데모용)
 */
(function (TT) {
  'use strict';
  const H = TT.hangul, M = TT.metrics;
  let S = null, onDocKey = null;

  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function newRound(stage) {
    S.stage = stage;
    const group = TT.data.words[S.layout === 'en' ? 'en' : 'ko'][stage - 1];
    let list = [];
    while (list.length < TT.data.NATMAL_COUNT) list = list.concat(shuffle(group));
    S.words = list.slice(0, TT.data.NATMAL_COUNT);
    S.idx = 0; S.correct = 0; S.total = 0; S.strokes = 0;
    S.first = 0; S.last = 0; S.prevHtml = '';
    S.sel.set(stage);
    S.mini.setHighlight(TT.stageKeyCodes(S.layout, stage));
    S.root.querySelector('.stage-name').textContent = `${stage}단계`;
    S.ti.reset();
    render('', false);
    S.input.focus();
  }

  function render(value, composing) {
    const w = S.words[S.idx] || '';
    S.word.innerHTML = TT.typingInput.paint(w, value, S.layout, composing);
    S.left.innerHTML = `<div class="stack"><span class="flow-arrow"></span><div class="word-done">${S.prevHtml}</div></div>`;
    S.right.innerHTML = `<div class="stack">${S.words.slice(S.idx + 1, S.idx + 3)
      .map((x, k) => `<div class="${k ? 'dim' : ''}">${TT.ui.esc(x)}</div>`).join('')}</div>`;
    const errors = S.total - S.correct;
    const acc = M.accuracy(S.correct, S.total);
    S.bar.set('progress', Math.floor(S.idx * 100 / S.words.length), S.idx / S.words.length);
    S.bar.set('errors', errors, Math.min(1, errors / 20));
    S.bar.set('acc', acc, acc / 100);
    S.kb.setNext(w ? M.nextKey(w, value, S.layout) : null);
  }

  function submit(value) {
    if (S.busy || !value) return;
    const w = S.words[S.idx];
    const W = Array.from(w), V = Array.from(value);
    const total = Math.max(W.length, V.length);
    let correct = 0, strokes = 0;
    for (let i = 0; i < total; i++) {
      if (V[i] !== undefined && V[i] === W[i]) { correct++; strokes += H.charToKeys(W[i], S.layout).length; }
    }
    S.total += total; S.correct += correct; S.strokes += strokes;
    S.last = performance.now();
    if (correct < total) TT.sound.error();
    S.prevHtml = V.map((c, i) => `<span class="${c === W[i] ? '' : 'bad'}">${TT.ui.esc(c)}</span>`).join('');
    S.idx++;
    S.ti.reset();
    if (S.idx >= S.words.length) { render('', false); finish(false); return; }
    render('', false);
  }

  async function finish(demo) {
    S.busy = true;
    const ms = S.first ? Math.round((S.last || performance.now()) - S.first) : 0;
    const acc = M.accuracy(S.correct, S.total);
    await TT.result.finish({
      type: 'natmal', stage: S.stage, demo,
      speed: M.speed(S.strokes, ms), acc, ms,
      strokes: S.strokes, errors: S.total - S.correct,
      saved: S.strokes > 0, saveRule: '1타 이상 입력 [추정]'
    });
    if (!S) return;
    const u = TT.store.user();
    let next = S.stage;
    if (!demo && S.total > 0 && acc >= u.targetAcc && S.stage < 8) next = S.stage + 1; // [추정]
    u.natmalStage = next;
    TT.store.save();
    S.busy = false;
    newRound(next);
  }

  TT.screens.natmal = {
    meta: { shell: true, tab: 'natmal', footer: 'back', backTo: 'jariIntro', title: '낱말연습' },
    mount(el) {
      const layout = TT.store.settings().layout;
      const root = TT.ui.el(`<div>
        <div class="bar-slot"></div>
        <div class="flow blue">
          <div class="flow-side flow-left"></div>
          <div class="flow-center natmal-center"><div class="cur">
            <div class="word painted"></div><input class="tinput" aria-label="낱말 입력">
          </div></div>
          <div class="flow-side flow-right"></div>
        </div>
        <div class="side-ctl">
          <div class="stage-head"><button class="arrow" data-d="-1">◀</button><span>단계 설정</span><button class="arrow" data-d="1">▶</button></div>
          <div class="mini-slot"></div><div class="dots-slot"></div><div class="stage-name"></div>
        </div>
        <div class="practice-kbd"></div>
        <div class="hint" style="bottom:-2px">Enter/Space: 다음 낱말 · Esc: 데모 종료(원본에 없음)</div>
      </div>`);
      el.appendChild(root);
      const bar = TT.ui.statBar([
        { id: 'progress', label: '진행도', unit: '%' },
        { id: 'errors', label: '오타수', unit: '' },
        { id: 'acc', label: '정확도', unit: '%' }
      ]);
      root.querySelector('.bar-slot').appendChild(bar.el);
      const input = root.querySelector('.tinput');
      S = {
        root, layout, bar, input, busy: false,
        word: root.querySelector('.word'),
        left: root.querySelector('.flow-left'), right: root.querySelector('.flow-right'),
        mini: TT.keyboard.render(root.querySelector('.mini-slot'), layout, { mini: true }),
        kb: TT.keyboard.render(root.querySelector('.practice-kbd'), layout)
      };
      S.ti = TT.typingInput.attach(input, {
        submitKeys: ['Enter', ' '],
        onChange: (v, composing) => { if (!S.busy) render(v, composing); },
        onSubmit: submit,
        onKey: e => {
          if (!S.first && e.key !== 'Enter' && e.code !== 'Space') S.first = performance.now();
          if (e.code && !/^(Shift|Control|Alt|Meta)/.test(e.code)) { S.kb.flash(e.code, true); TT.sound.key(); }
        }
      });
      const change = n => { const u = TT.store.user(); u.natmalStage = n; TT.store.save(); newRound(n); };
      S.sel = TT.stageSelector(root.querySelector('.dots-slot'), TT.store.user().natmalStage, change, true);
      root.querySelectorAll('.stage-head .arrow').forEach(a =>
        a.addEventListener('click', () => change(Math.max(1, Math.min(8, S.stage + +a.dataset.d)))));
      root.addEventListener('mouseup', () => setTimeout(() => S && !TT.ui.modalOpen && S.input.focus(), 0));
      onDocKey = e => {
        if (e.key === 'Escape' && !TT.ui.modalOpen && S && !S.busy) { e.preventDefault(); finish(true); } // [원본에 없음]
      };
      document.addEventListener('keydown', onDocKey);
      newRound(TT.store.user().natmalStage || 1);
    },
    unmount() { if (S) S.ti.detach(); document.removeEventListener('keydown', onDocKey); S = null; }
  };
})(window.TT = window.TT || {});

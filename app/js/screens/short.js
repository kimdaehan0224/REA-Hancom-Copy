/*
 * 5. 짧은글연습 (캡처 05)
 *  - 진행도, 현재타수, 최고타수, 목표타수, 정확도, 현재 문장 + 입력 줄, 다음 문장 목록
 *
 * 분석 근거 (모두 CHTTStrPrac, analysis §3.4 / §7)
 * [확인] 줄 시작 시각 = 그 줄의 첫 입력 시각 (+0xb8)               — FUN_0043bc10
 * [확인] 현재타수 = 타수×60000/(지금-줄 시작), 최대 999             — FUN_0043b7b0 (vtable 슬롯 4, 주기적 갱신)
 * [확인] 정확도 = 맞은 글자/입력 글자×100                          — FUN_0043b7b0
 * [확인] 타수/정확도 계산 대상 = FUN_0043cd40 (두벌식 키 입력 단위, 글자 단위 정오)
 * [확인] 문장을 마칠 때마다: 최고타수 갱신, count++, 진행도 = count×100/32,
 *        평균타수·평균정확도 = ((n-1)×평균 + 이번 값)/n            — FUN_0043c910
 * [확인] 게이지: 정확도/100, 진행도 count/32, 최고타수/800, 목표타수/800 — FUN_0043c910 / 0043b7b0
 * [확인] 32문장을 마치면 결과 창. 전체 시간(첫 입력~마지막 문장)이 11초 미만이면 기록하지 않음 — FUN_0043bc10
 * [확인] 결과 창 인자 = (32, 평균타수, 평균정확도, 시간, 저장여부)  — FUN_00477c30 호출부
 * [추정] 현재타수 게이지의 분모(800), 문장 제출 키(Enter), 이전 문장 표시
 * [미구현] 정확도 70% 이상일 때 타수 100~500 구간별 처리(FUN_0044fb90) — 의미 미확인
 * [원본에 없음] Esc: 현재 연습을 바로 끝내고 결과 창 표시 (데모용)
 */
(function (TT) {
  'use strict';
  const M = TT.metrics;
  let S = null, onDocKey = null, timer = null;

  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function newRound() {
    const pool = TT.data.sentences[S.layout === 'en' ? 'en' : 'ko'];
    S.list = shuffle(pool).slice(0, TT.data.SHORT_COUNT);
    S.count = 0; S.avgSpeed = 0; S.avgAcc = 0; S.best = 0;
    S.curSpeed = 0; S.curAcc = 0;
    S.sessionStart = 0; S.lastEnd = 0; S.lineStart = 0; S.lineActive = false;
    S.totStrokes = 0; S.totErrors = 0;
    S.prevHtml = '';
    S.ti.reset();
    renderLine('', false);
    updateBar();
    S.input.focus();
  }

  function renderLine(value, composing) {
    const target = S.list[S.count] || '';
    S.target.innerHTML = TT.typingInput.paint(target, value, S.layout, composing);
    S.next.innerHTML = S.list.slice(S.count + 1, S.count + 5).map(t => `<li>${TT.ui.esc(t)}</li>`).join('');
    S.prev.innerHTML = S.prevHtml;
  }

  function updateBar() {
    const u = TT.store.user();
    const n = TT.data.SHORT_COUNT;
    S.bar.set('progress', Math.floor(S.count * 100 / n), S.count / n);
    S.bar.set('cur', Math.floor(S.curSpeed), S.curSpeed / 800);
    S.bar.set('best', S.best, S.best / 800);
    S.bar.set('target', u.targetSpeed, u.targetSpeed / 800);
    S.bar.set('acc', Math.floor(S.curAcc), S.curAcc / 100);
  }

  /** [확인] FUN_0043b7b0: 줄이 진행 중이면 현재타수·정확도 갱신 */
  function tick() {
    if (!S || !S.lineActive) return;
    const r = M.compareLine(S.list[S.count], S.input.value, S.layout);
    if (r.total) S.curAcc = r.correct * 100 / r.total;
    const ms = performance.now() - S.lineStart;
    if (ms > 0) S.curSpeed = M.speed(r.strokes, ms);
    updateBar();
  }

  function onChange(value, composing) {
    if (S.busy) return;
    if (value && !S.lineActive) {
      S.lineActive = true;
      S.lineStart = performance.now();          // [확인] +0xb8
      if (!S.sessionStart) S.sessionStart = S.lineStart; // [확인] +0xb4
    }
    renderLine(value, composing);
    tick();
  }

  function submit(value) {
    if (S.busy || !value) return;
    const target = S.list[S.count];
    const r = M.compareLine(target, value, S.layout);
    const now = performance.now();
    S.curSpeed = M.speed(r.strokes, now - S.lineStart);
    S.curAcc = r.total ? r.correct * 100 / r.total : 0;
    // [확인] FUN_0043c910
    if (S.best < S.curSpeed) S.best = Math.floor(S.curSpeed);
    S.count++;
    S.avgSpeed = Math.floor(((S.count - 1) * S.avgSpeed + Math.floor(S.curSpeed)) / S.count);
    S.avgAcc = Math.floor(((S.count - 1) * S.avgAcc + Math.floor(S.curAcc)) / S.count);
    S.totStrokes += r.strokes;
    S.totErrors += r.total - r.correct + Math.max(0, Array.from(target).length - r.total);
    S.lineActive = false;
    S.lastEnd = now;
    if (r.correct < r.total) TT.sound.error(); else TT.sound.key();
    S.prevHtml = `<div class="painted">${TT.typingInput.paint(target, value, S.layout, false)}</div>
      <div class="res">타수 ${Math.floor(S.curSpeed)} · 정확도 ${Math.floor(S.curAcc)}%</div>`;
    S.ti.reset();
    updateBar();
    if (S.count >= TT.data.SHORT_COUNT) { renderLine('', false); finish(false); return; }
    renderLine('', false);
  }

  async function finish(demo) {
    S.busy = true;
    // 데모 종료 시 아직 제출하지 않은 줄도 한 문장으로 포함 [원본에 없음]
    if (demo && S.lineActive && S.input.value) {
      const target = S.list[S.count];
      const r = M.compareLine(target, S.input.value, S.layout);
      const now = performance.now();
      const sp = M.speed(r.strokes, now - S.lineStart), ac = r.total ? r.correct * 100 / r.total : 0;
      S.count++;
      S.avgSpeed = Math.floor(((S.count - 1) * S.avgSpeed + sp) / S.count);
      S.avgAcc = Math.floor(((S.count - 1) * S.avgAcc + Math.floor(ac)) / S.count);
      S.totStrokes += r.strokes; S.totErrors += r.total - r.correct;
      S.lastEnd = now;
    }
    const ms = S.sessionStart ? Math.round(S.lastEnd - S.sessionStart) : 0;
    await TT.result.finish({
      type: 'short', demo,
      speed: S.avgSpeed, acc: S.avgAcc, ms,
      strokes: S.totStrokes, errors: S.totErrors,
      saved: ms >= 11000 && S.count > 0, saveRule: '첫 입력부터 11초 이상 [확인]'
    });
    if (!S) return;
    S.busy = false;
    newRound();
  }

  TT.screens.short = {
    meta: { shell: true, tab: 'short', footer: 'back', backTo: 'jariIntro', title: '짧은글연습' },
    mount(el) {
      const layout = TT.store.settings().layout;
      const root = TT.ui.el(`<div>
        <div class="bar-slot"></div>
        <div class="short-prev"></div>
        <div class="short-band">
          <span class="ico t"></span><span class="ico i"></span>
          <div class="target painted"></div>
          <input class="tinput" aria-label="문장 입력">
        </div>
        <ul class="short-next"></ul>
        <div class="hint">Enter: 다음 문장 · Esc: 데모 종료(원본에 없음)</div>
      </div>`);
      el.appendChild(root);
      const bar = TT.ui.statBar([
        { id: 'progress', label: '진행도', unit: '%', width: 56 },
        { id: 'cur', label: '현재타수', unit: '', width: 56 },
        { id: 'best', label: '최고타수', unit: '', width: 56 },
        { id: 'target', label: '목표타수', unit: '', width: 56 },
        { id: 'acc', label: '정확도', unit: '%', width: 56 }
      ]);
      root.querySelector('.bar-slot').appendChild(bar.el);
      const input = root.querySelector('.tinput');
      S = {
        root, layout, bar, input, busy: false,
        target: root.querySelector('.target'), next: root.querySelector('.short-next'), prev: root.querySelector('.short-prev'),
        lastKey: 0
      };
      S.ti = TT.typingInput.attach(input, {
        onChange, onSubmit: submit,
        onKey: e => {
          // [확인] 키별 속도 누적 평균(46키 테이블) — FUN_0043bc10
          if (!/^(Key|Digit|Comma|Period|Slash|Semicolon|Quote)/.test(e.code)) return;
          const now = performance.now(), u = TT.store.user();
          if (S.lastKey) {
            const dt = now - S.lastKey, v = dt > 0 ? Math.floor(60000 / dt) : 600;
            const ks = u.keySpeed[e.code] || { avg: 0, n: 0 };
            ks.avg = Math.floor((ks.avg * ks.n + v) / (ks.n + 1)); ks.n++;
            u.keySpeed[e.code] = ks;
          }
          S.lastKey = now;
          u.fingers[TT.keyboard.fingerOf(e.code)]++;
        }
      });
      root.addEventListener('mouseup', () => setTimeout(() => S && !TT.ui.modalOpen && S.input.focus(), 0));
      onDocKey = e => {
        if (e.key === 'Escape' && !TT.ui.modalOpen && S && !S.busy) { e.preventDefault(); finish(true); } // [원본에 없음]
      };
      document.addEventListener('keydown', onDocKey);
      timer = setInterval(tick, 200);
      newRound();
    },
    unmount() {
      clearInterval(timer);
      if (S) S.ti.detach();
      document.removeEventListener('keydown', onDocKey);
      TT.store.save();
      S = null;
    }
  };
})(window.TT = window.TT || {});

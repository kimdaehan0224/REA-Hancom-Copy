/*
 * 6. 긴글연습 (캡처 06)
 *  - 정확도, 현재타수(타/분), "N쪽 / 총 M쪽", 타이머, 줄 단위 입력
 *
 * 분석 근거 (CHTTLngStrPrac, analysis §7.2)
 * [확인] 결과 창 호출 = FUN_00425590 (vtable 슬롯 4 0x4235e0가 호출)
 * [확인] 표시 문자열: "정확도 %d%%", "현재타수 %d타/분"(63001), "%d쪽 / 총 %d쪽"(63002)
 * [확인] 정확도 = (완료한 줄들의 맞은 글자 + 현재 줄 맞은 글자) / (완료 줄 입력 글자 + 현재 줄 입력 글자) × 100
 *        — FUN_00425590 의 ((+0x70)+(+0x6c)) / ((+0x74)+(+0x78)) × 100 을 이렇게 해석 [필드 의미는 추정]
 * [확인] 기록 저장 조건: 입력 타수 > 100 이고 시간 > 10초 — FUN_00425590
 * [확인] 사용자 평균타수를 누적 평균으로 갱신 — FUN_00425590 ((+0x11c)+0x18)
 * [추정] 한 쪽 = 5줄 (결과 인자 page*5-5+line, 캡처 06), 한 쪽을 다 치면 결과 창 (사용자 지시에 따른 추정)
 * [추정] 현재타수 = 쪽 시작 이후 누적 타수 × 60000 / 경과 ms, 줄 이동은 Enter
 * [원본에 없음] Esc: 현재 연습을 바로 끝내고 결과 창 표시 (데모용)
 */
(function (TT) {
  'use strict';
  const M = TT.metrics;
  const PER = () => TT.data.LONG_LINES_PER_PAGE;
  let S = null, onDocKey = null, timer = null;

  function loadText(i) {
    const list = TT.data.longTexts[S.layout === 'en' ? 'en' : 'ko'];
    S.textIdx = i;
    const t = list[i];
    const width = S.layout === 'en' ? 60 : 36;
    S.lines = [t.title].concat(TT.data.wrapText(t.body, width));
    S.pages = Math.ceil(S.lines.length / PER());
    startPage(0);
  }

  function startPage(p) {
    S.page = p;
    S.line = 0;
    S.start = 0; S.last = 0;
    S.done = { correct: 0, total: 0, strokes: 0, errors: 0 };
    S.cur = { correct: 0, total: 0, strokes: 0 };
    const lines = S.lines.slice(p * PER(), p * PER() + PER());
    S.box.innerHTML = lines.map((l, i) => `<div class="long-line" data-i="${i}">
      <div class="ltext painted">${TT.ui.esc(l)}</div><input class="tinput" readonly></div>`).join('');
    S.rows = Array.from(S.box.querySelectorAll('.long-line'));
    S.pageLines = lines;
    activate(0);
    update();
  }

  function activate(i) {
    if (S.ti) S.ti.detach();
    S.rows.forEach((r, k) => {
      r.classList.toggle('active', k === i);
      r.querySelector('input').readOnly = k !== i;
    });
    const row = S.rows[i];
    row.querySelector('.ltext').innerHTML = TT.typingInput.paint(S.pageLines[i], '', S.layout, false);
    const input = row.querySelector('input');
    S.input = input;
    S.ti = TT.typingInput.attach(input, {
      onChange: (v, composing) => {
        if (S.busy) return;
        if (v && !S.start) S.start = performance.now();
        S.last = performance.now();
        const r = M.compareLine(S.pageLines[S.line], v, S.layout);
        S.cur = r;
        row.querySelector('.ltext').innerHTML = TT.typingInput.paint(S.pageLines[S.line], v, S.layout, composing);
        update();
      },
      onSubmit: v => {
        if (S.busy || !v) return;
        const target = S.pageLines[S.line];
        const r = M.compareLine(target, v, S.layout);
        S.done.correct += r.correct; S.done.total += r.total; S.done.strokes += r.strokes;
        S.done.errors += r.total - r.correct + Math.max(0, Array.from(target).length - r.total);
        S.cur = { correct: 0, total: 0, strokes: 0 };
        S.last = performance.now();
        row.classList.add('done');
        if (S.line + 1 >= S.pageLines.length) { update(); finish(false); return; }
        S.line++;
        activate(S.line);
        update();
      }
    });
    input.focus();
  }

  /** live=true: 지금 시각 기준(화면 갱신용), false: 마지막 입력 시각 기준(결과용) */
  function stats(live) {
    const correct = S.done.correct + S.cur.correct, total = S.done.total + S.cur.total;
    const strokes = S.done.strokes + S.cur.strokes;
    const ms = S.start ? (live ? performance.now() : (S.last || performance.now())) - S.start : 0;
    return { acc: M.accuracy(correct, total), speed: M.speed(strokes, ms), strokes, ms, errors: S.done.errors + (S.cur.total - S.cur.correct) };
  }

  function update() {
    const s = stats(!S.busy);
    S.bar.set('acc', s.acc, s.acc / 100);
    S.bar.set('speed', s.speed, s.speed / 800);
    S.bar.setText('page', `${S.page + 1}쪽 / 총 ${S.pages}쪽`);
  }

  function tickTimer() {
    if (!S) return;
    const ms = S.start ? performance.now() - S.start : 0;
    S.timer.textContent = `${Math.floor(ms / 60000)} : ${Math.floor((ms % 60000) / 1000)}`;
    if (S.start && !S.busy) update(); // [추정] 원본처럼 주기적으로 현재타수 갱신
  }

  async function finish(demo) {
    S.busy = true;
    const s = stats(false);
    await TT.result.finish({
      type: 'long', demo,
      speed: s.speed, acc: s.acc, ms: Math.round(s.ms), strokes: s.strokes, errors: s.errors,
      saved: s.strokes > 100 && s.ms > 10000, saveRule: '100타 초과, 10초 초과 [확인]'
    });
    if (!S) return;
    S.busy = false;
    startPage(demo ? S.page : (S.page + 1) % S.pages); // [추정] 다음 쪽으로, 마지막 쪽이면 처음으로
  }

  TT.screens.long = {
    meta: { shell: true, tab: 'long', footer: 'back', backTo: 'jariIntro', title: '긴글연습' },
    mount(el) {
      const layout = TT.store.settings().layout;
      const list = TT.data.longTexts[layout === 'en' ? 'en' : 'ko'];
      const root = TT.ui.el(`<div>
        <div class="bar-slot"></div>
        <div class="long-top">글 선택 <select class="text-sel">${list.map((t, i) => `<option value="${i}">${TT.ui.esc(t.title)}</option>`).join('')}</select></div>
        <div class="timer">0 : 0</div>
        <div class="long-lines"></div>
        <div class="hint">Enter: 다음 줄 · Esc: 데모 종료(원본에 없음)</div>
      </div>`);
      el.appendChild(root);
      const bar = TT.ui.statBar([
        { id: 'acc', label: '정확도', unit: '%' },
        { id: 'speed', label: '현재타수', unit: '타/분' },
        { id: 'page', label: '', unit: '', width: 0 }
      ]);
      bar.el.querySelector('[data-id=page] .gauge').style.display = 'none';
      root.querySelector('.bar-slot').appendChild(bar.el);
      S = { root, layout, bar, busy: false, box: root.querySelector('.long-lines'), timer: root.querySelector('.timer') };
      root.querySelector('.text-sel').addEventListener('change', e => { loadText(+e.target.value); });
      root.addEventListener('mouseup', e => {
        if (e.target.tagName === 'SELECT') return;
        setTimeout(() => S && !TT.ui.modalOpen && S.input && S.input.focus(), 0);
      });
      onDocKey = e => {
        if (e.key === 'Escape' && !TT.ui.modalOpen && S && !S.busy) { e.preventDefault(); finish(true); } // [원본에 없음]
      };
      document.addEventListener('keydown', onDocKey);
      timer = setInterval(tickTimer, 250);
      loadText(0);
    },
    unmount() {
      clearInterval(timer);
      if (S && S.ti) S.ti.detach();
      document.removeEventListener('keydown', onDocKey);
      S = null;
    }
  };
})(window.TT = window.TT || {});

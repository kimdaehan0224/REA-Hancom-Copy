/*
 * 3. 자리연습 (캡처 03)
 *  - 진행도·오타수·정확도, 글자 흐름(이전/현재/다음), 화상 키보드와 다음 키 표시, 단계 설정
 *
 * [확인] 클래스 CHTTPosPrac, 결과 창 호출 = vtable 슬롯 5 (0x42c180) — analysis §7.2
 * [확인] 정확도 미달 시 "목표 정확도에 미달하여 현재 단계를 다시 연습합니다." (62171)
 * [확인] 키별 속도 = 60000 / (이번 키 시각 - 이전 키 시각)의 누적 평균, 간격 0이면 600 (FUN_0043bc10 의 46키 테이블)
 *        — 원본에서는 짧은 글 경로에서 확인. 자리연습에 적용한 것은 [추정]
 * [추정] 한 판 40글자, 맞는 키를 눌러야 다음 글자로 넘어감, 통과하면 다음 단계로 올라감
 * [추정] 평균타수 = 맞게 친 키 수 × 60000 / 경과 ms (원본 자리연습 결과의 타수 계산식은 미확인)
 * [원본에 없음] Esc: 현재 연습을 바로 끝내고 결과 창 표시 (데모용)
 */
(function (TT) {
  'use strict';
  const H = TT.hangul, M = TT.metrics;
  const MOD = /^(Shift|Control|Alt|Meta|CapsLock|Tab|Lang|HangulMode|HanjaMode|ContextMenu|OS)/;
  let S = null, onKey = null;

  function makeTargets(keys, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      let k;
      do { k = keys[Math.floor(Math.random() * keys.length)]; } while (keys.length > 1 && k === out[out.length - 1]);
      out.push(k);
    }
    return out;
  }

  function newRound(stage) {
    const layout = S.layout;
    S.stage = stage;
    const def = TT.data.jari[layout === 'en' ? 'en' : 'ko2'][stage - 1];
    S.targets = makeTargets(def.keys, TT.data.JARI_COUNT);
    S.idx = 0; S.correct = 0; S.errors = 0;
    S.first = 0; S.last = 0; S.lastKey = 0;
    S.mini.setHighlight(TT.stageKeyCodes(layout, stage));
    S.sel.set(stage);
    S.root.querySelector('.stage-name').textContent = `${stage}단계 · ${def.name}`;
    render();
  }

  function render() {
    const t = S.targets, i = S.idx;
    const prev = t.slice(Math.max(0, i - 2), i);
    const next = t.slice(i + 1, i + 4);
    S.left.innerHTML = prev.map(c => `<span>${TT.ui.esc(c)}</span>`).join('') + '<span class="flow-arrow"></span>';
    S.cur.textContent = t[i] || '';
    S.right.innerHTML = next.map((c, k) => `<span class="flow-arrow ${k === 0 ? 'big' : ''}"></span><span>${TT.ui.esc(c)}</span>`).join('');
    const total = S.correct + S.errors;
    const acc = M.accuracy(S.correct, total);
    S.bar.set('progress', Math.floor(i * 100 / t.length), i / t.length);
    S.bar.set('errors', S.errors, Math.min(1, S.errors / 20));
    S.bar.set('acc', acc, acc / 100);
    S.kb.setNext(t[i] ? H.charToKeys(t[i], S.layout)[0] : null);
  }

  function onKeyDown(e) {
    if (TT.ui.modalOpen || S.busy) return;
    if (e.key === 'Escape') { e.preventDefault(); finish(true); return; } // [원본에 없음] 데모 종료
    if (MOD.test(e.code) || MOD.test(e.key) || e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') return;
    e.preventDefault();
    if (e.repeat && !TT.store.settings().repeat) return; // [추정] 반복누르기 끔
    const ch = H.keyToChar(e.code, e.shiftKey, S.layout);
    if (ch == null) return;
    const now = performance.now();
    if (!S.first) S.first = now;
    S.last = now;
    const target = S.targets[S.idx];
    const tk = H.charToKeys(target, S.layout)[0];
    const finger = TT.keyboard.fingerOf(tk.code);
    const u = TT.store.user();
    if (ch === target) {
      S.correct++;
      u.fingers[finger]++;
      // [확인] 키별 속도 누적 평균 (간격 0이면 600)
      const v = S.lastKey ? (now - S.lastKey > 0 ? Math.floor(60000 / (now - S.lastKey)) : 600) : null;
      if (v !== null) {
        const ks = u.keySpeed[tk.code] || { avg: 0, n: 0 };
        ks.avg = Math.floor((ks.avg * ks.n + v) / (ks.n + 1));
        ks.n += 1;
        u.keySpeed[tk.code] = ks;
      }
      S.lastKey = now;
      S.kb.flash(e.code, true);
      TT.sound.key();
      S.idx++;
    } else {
      S.errors++;
      u.fingerErrors[finger]++;
      S.kb.flash(e.code, false);
      TT.sound.error();
    }
    if (S.idx >= S.targets.length) { render(); finish(false); return; }
    render();
  }

  async function finish(demo) {
    S.busy = true;
    const u = TT.store.user();
    const ms = S.first ? Math.round(S.last - S.first) : 0;
    const total = S.correct + S.errors;
    const acc = M.accuracy(S.correct, total);
    await TT.result.finish({
      type: 'jari', stage: S.stage, demo,
      speed: M.speed(S.correct, ms), acc, ms,
      strokes: S.correct, errors: S.errors,
      saved: S.correct > 0, saveRule: '1타 이상 입력 [추정]'
    });
    if (!S) return; // 결과 창 중 화면 이동
    let next = S.stage;
    if (!demo && total > 0) {
      if (acc < u.targetAcc) {
        await TT.ui.alert('목표 정확도에 미달하여 현재 단계를 다시 연습합니다.');
      } else if (S.stage < 8) {
        next = S.stage + 1; // [추정] 통과하면 다음 단계
      }
    }
    u.jariStage = next;
    TT.store.save();
    S.busy = false;
    newRound(next);
  }

  TT.screens.jari = {
    meta: { shell: true, tab: 'jari', footer: 'back', backTo: 'jariIntro', title: '자리연습' },
    mount(el, params) {
      const layout = TT.store.settings().layout;
      const root = TT.ui.el(`<div>
        <div class="bar-slot"></div>
        <div class="flow green">
          <div class="flow-side flow-left"></div>
          <div class="flow-center"><div class="cur"></div></div>
          <div class="flow-side flow-right"></div>
        </div>
        <div class="side-ctl">
          <div class="stage-head"><button class="arrow" data-d="-1">◀</button><span>단계 설정</span><button class="arrow" data-d="1">▶</button></div>
          <div class="mini-slot"></div>
          <div class="dots-slot"></div>
          <div class="stage-name"></div>
        </div>
        <div class="practice-kbd"></div>
        <div class="hint" style="bottom:-2px">Esc: 데모 종료(원본에 없음)</div>
      </div>`);
      el.appendChild(root);
      const bar = TT.ui.statBar([
        { id: 'progress', label: '진행도', unit: '%' },
        { id: 'errors', label: '오타수', unit: '' },
        { id: 'acc', label: '정확도', unit: '%' }
      ]);
      root.querySelector('.bar-slot').appendChild(bar.el);
      S = {
        root, layout, bar, busy: false,
        left: root.querySelector('.flow-left'), right: root.querySelector('.flow-right'), cur: root.querySelector('.cur'),
        mini: TT.keyboard.render(root.querySelector('.mini-slot'), layout, { mini: true }),
        kb: TT.keyboard.render(root.querySelector('.practice-kbd'), layout)
      };
      const change = n => { const u = TT.store.user(); u.jariStage = n; TT.store.save(); newRound(n); };
      S.sel = TT.stageSelector(root.querySelector('.dots-slot'), params.stage || 1, change, true);
      root.querySelectorAll('.stage-head .arrow').forEach(a =>
        a.addEventListener('click', () => change(Math.max(1, Math.min(8, S.stage + +a.dataset.d)))));
      onKey = onKeyDown;
      document.addEventListener('keydown', onKey);
      newRound(params.stage || TT.store.user().jariStage || 1);
    },
    unmount() { document.removeEventListener('keydown', onKey); S = null; }
  };
})(window.TT = window.TT || {});

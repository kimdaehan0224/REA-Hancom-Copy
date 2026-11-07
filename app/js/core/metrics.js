/*
 * 타수·정확도 계산
 *
 * [확인] FUN_0043cd40 (CHTTStrPrac, 짧은 글) — analysis §7.1
 *   목표 줄과 입력 줄을 글자 단위로 비교한다.
 *     - 키 입력 수가 같고 모든 키가 같으면 → 맞은 글자, 타수 += 키 입력 수
 *     - 마지막(조합 중) 글자는 앞부분 키가 일치하면 맞은 것으로 보고 min(키 수)만큼 타수에 더함
 *     - 입력한 글자마다 total += 1
 *   정확도 = 맞은 글자 / 입력한 글자 × 100           (FUN_0043b7b0)
 *   현재타수 = 타수 × 60000 / 경과 ms, 최대 999       (FUN_0043b7b0)
 * [추정] 위 규칙을 낱말·긴 글 연습에도 똑같이 적용한다 (원본에서 함수 단위로 확인하지 않음).
 */
(function (TT) {
  'use strict';
  const H = TT.hangul;

  function samePrefix(a, b, n) {
    for (let i = 0; i < n; i++) if (H.keyId(a[i]) !== H.keyId(b[i])) return false;
    return true;
  }

  /** @returns {{strokes:number, correct:number, total:number, wrong:boolean[]}} */
  function compareLine(target, typed, layout) {
    const T = Array.from(target), Y = Array.from(typed);
    let strokes = 0, correct = 0, total = 0;
    const wrong = [];
    for (let i = 0; i < Y.length; i++) {
      total++;
      const tk = i < T.length ? H.charToKeys(T[i], layout) : [];
      const yk = H.charToKeys(Y[i], layout);
      let ok = false;
      if (tk.length === yk.length && samePrefix(tk, yk, tk.length)) {
        ok = true; strokes += tk.length;                      // [확인] 완성된 글자
      } else if (i === Y.length - 1) {
        const n = Math.min(tk.length, yk.length);              // [확인] 마지막 글자 부분 일치
        if (n > 0 && samePrefix(tk, yk, n)) { ok = true; strokes += n; }
      }
      if (ok) correct++;
      wrong.push(!ok);
    }
    return { strokes, correct, total, wrong };
  }

  /** [확인] 타수 = strokes × 60000 / ms, 상한 999 */
  function speed(strokes, ms) {
    if (!ms || ms <= 0) return 0;
    return Math.min(999, Math.floor(strokes * 60000 / ms));
  }

  /** [확인] 정확도 = correct / total × 100 (입력이 없으면 0) */
  function accuracy(correct, total) {
    return total > 0 ? Math.floor(correct * 100 / total) : 0;
  }

  /**
   * 다음에 눌러야 할 키 (화상 키보드 표시용) [추정: 원본 화면의 주황 점 표시를 재현]
   * 조합 중인 마지막 글자가 다음 글자의 초성을 받침으로 품고 있는 경우("갑" → "가보")도 처리.
   */
  function nextKey(target, typed, layout) {
    const T = Array.from(target), Y = Array.from(typed);
    if (Y.length === 0) return T.length ? H.charToKeys(T[0], layout)[0] : { code: 'Enter', shift: false };
    for (let i = 0; i < Y.length - 1; i++) {
      if (Y[i] !== T[i]) return { code: 'Backspace', shift: false };
    }
    const i = Y.length - 1;
    if (i >= T.length) return { code: 'Backspace', shift: false };
    const seq = H.charToKeys(T[i], layout).concat(T[i + 1] ? H.charToKeys(T[i + 1], layout) : []);
    const yk = H.charToKeys(Y[i], layout);
    if (yk.length <= seq.length && samePrefix(seq, yk, yk.length)) {
      return seq[yk.length] || { code: 'Enter', shift: false };
    }
    return { code: 'Backspace', shift: false };
  }

  TT.metrics = { compareLine, speed, accuracy, nextKey };
})(window.TT = window.TT || {});

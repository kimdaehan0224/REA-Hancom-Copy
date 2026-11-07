/*
 * 한글 조합 입력 처리 (낱말/짧은글/긴글 공통)
 *
 * compositionstart / compositionend 로 "조합 중인 글자"를 구분한다.
 *  - 조합 중인 마지막 글자는 아직 확정되지 않았으므로 오타로 표시하지 않고,
 *    [확인] 원본(FUN_0043cd40)처럼 앞부분 키가 맞으면 맞은 것으로 계산한다.
 *  - 조합 중에 Enter/Space를 누르면 조합이 끝난 뒤(compositionend) 제출한다.
 * [추정] 반복누르기(설정) 끔 = 키를 누르고 있을 때 생기는 자동 반복 입력을 막는다.
 */
(function (TT) {
  'use strict';

  /**
   * @param {HTMLInputElement} input
   * @param {{onChange:(value:string, composing:boolean)=>void, onSubmit:(value:string)=>void,
   *          onKey?:(e:KeyboardEvent)=>void, submitKeys?:string[]}} h
   */
  function attach(input, h) {
    let composing = false;
    let pendingSubmit = false;
    const submitKeys = h.submitKeys || ['Enter'];

    const changed = () => h.onChange(input.value, composing);
    const submit = () => {
      pendingSubmit = false;
      h.onSubmit(input.value.replace(/\s+$/, ''));
    };

    const onStart = () => { composing = true; changed(); };
    const onEnd = () => {
      composing = false;
      changed();
      if (pendingSubmit) setTimeout(submit, 0);
    };
    const onInput = e => {
      composing = !!(e.isComposing || composing);
      if (pendingSubmit && !composing) { setTimeout(submit, 0); return; }
      changed();
    };
    const onKeyDown = e => {
      if (e.key === 'Escape') return; // 데모 종료는 화면이 처리
      if (e.repeat && !TT.store.settings().repeat && e.key !== 'Backspace') {
        e.preventDefault();
        return;
      }
      if (h.onKey) h.onKey(e);
      if (submitKeys.includes(e.key) || (submitKeys.includes(' ') && e.code === 'Space')) {
        if (e.isComposing || composing) {
          pendingSubmit = true;            // 조합이 끝나면 제출
        } else {
          e.preventDefault();
          submit();
        }
      }
    };

    input.addEventListener('compositionstart', onStart);
    input.addEventListener('compositionend', onEnd);
    input.addEventListener('input', onInput);
    input.addEventListener('keydown', onKeyDown);
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('spellcheck', 'false');

    return {
      get composing() { return composing; },
      reset() { composing = false; pendingSubmit = false; input.value = ''; },
      detach() {
        input.removeEventListener('compositionstart', onStart);
        input.removeEventListener('compositionend', onEnd);
        input.removeEventListener('input', onInput);
        input.removeEventListener('keydown', onKeyDown);
      }
    };
  }

  /** 목표 글자를 맞음/틀림/현재 위치로 색칠한 HTML */
  function paint(target, typed, layout, composing) {
    const r = TT.metrics.compareLine(target, typed, layout);
    const T = Array.from(target);
    const n = Array.from(typed).length;
    return T.map((c, i) => {
      let cls = '';
      if (i < n) {
        const isLast = i === n - 1;
        // 조합 중이어도 앞부분 키부터 틀리면 오타로 표시, 맞게 조합 중이면 'comp'
        cls = r.wrong[i] ? 'bad' : (isLast && composing ? 'comp' : 'ok');
      } else if (i === n) cls = 'here';
      return `<span class="${cls}">${c === ' ' ? '&nbsp;' : TT.ui.esc(c)}</span>`;
    }).join('');
  }

  TT.typingInput = { attach, paint };
})(window.TT = window.TT || {});

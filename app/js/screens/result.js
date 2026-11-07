/*
 * 7. 결과 창 (캡처 07은 다른 버전이라 레이아웃만 참고, 순위보기·로그인 버튼은 만들지 않음)
 *
 * [확인] FUN_00477c30 (analysis §3.5)
 *   - 제목: 자리 연습 결과 / 낱말 연습 결과 / 짧은글 연습 결과 / 긴글 연습 결과 / 타자 검정 결과 (62172~62176)
 *   - "%s 님의 연습 결과"(62237), "총 타 수 : %d 타"(62238), "오 타 수 : %d"(62239)
 *   - "정 확 도 : %d%%"(62180), "연습시간 : %d분 %d초"(62181), "평균타수 : %d"(62261)
 *   - 연습시간 = ms/60000 분, (ms%60000)/1000 초
 *   - 저장 플래그가 0이면 기록하지 않는다(param_5).
 * [추정] 표시 항목 배치(평균타수를 크게)는 캡처 07의 레이아웃을 따름.
 */
(function (TT) {
  'use strict';
  const TITLES = {
    jari: '자리 연습 결과', natmal: '낱말 연습 결과', short: '짧은글 연습 결과', long: '긴글 연습 결과', test: '타자 검정 결과'
  };

  /**
   * @param {{type:string, speed:number, acc:number, ms:number, strokes:number, errors:number,
   *          saved:boolean, saveRule?:string, demo?:boolean}} r
   */
  function show(r) {
    const u = TT.store.user();
    const esc = TT.ui.esc;
    const notes = [];
    if (r.demo) notes.push('Esc 키로 중단한 데모 결과입니다. (원본에 없는 기능)');
    if (!r.saved) notes.push(`기록 저장 조건(${r.saveRule || '-'})을 만족하지 않아 기록하지 않았습니다.`);
    const body = `
      <div class="result-name">${esc(u.name)} 님의 연습 결과</div>
      <div class="result-grid">
        <div class="big">평균타수 : ${r.speed}타/분</div>
        <div>정 확 도 : ${r.acc}%</div>
        <div>연습시간 : ${TT.ui.fmtTime(r.ms)}</div>
        <div>총 타 수 : ${r.strokes} 타</div>
        <div>오 타 수 : ${r.errors}</div>
      </div>
      ${notes.map(n => `<div class="result-note">${esc(n)}</div>`).join('')}`;
    TT.sound.done();
    return TT.ui.modal({ title: TITLES[r.type] || '연습 결과', body, className: 'result', buttons: [{ label: '확인', value: true, primary: true }] });
  }

  /** 기록 저장 + 결과 창 */
  async function finish(r) {
    if (r.saved) {
      TT.store.addRecord({
        type: r.type, date: Date.now(), speed: r.speed, acc: r.acc, ms: r.ms,
        strokes: r.strokes, errors: r.errors, stage: r.stage || null, demo: !!r.demo
      });
      TT.ui.refreshUserBadge();
    }
    await show(r);
  }

  TT.result = { show, finish, TITLES };
})(window.TT = window.TT || {});

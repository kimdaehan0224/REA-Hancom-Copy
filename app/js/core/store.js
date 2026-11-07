/*
 * 저장소 (localStorage)
 * [추정] 원본은 User.dat / UserPracResult.dat / UserKeyTypRst.dat 등에 저장 — 파일 형식은 분석하지 않았다.
 *        웹앱에서는 localStorage 하나에 사용자·설정·기록을 JSON으로 저장한다.
 */
(function (TT) {
  'use strict';
  const KEY = 'typing-trainer.v1';

  function newUser(name, targetSpeed, targetAcc) {
    return {
      id: 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      targetSpeed: targetSpeed || 200, // [확인] 목표타수 100~800 (리소스 62065)
      targetAcc: targetAcc || 90,      // [확인] 목표정확도 80~100 (리소스 62066)
      avgSpeed: 0, avgCount: 0,        // [확인] 사용자 평균타수 누적 평균 (FUN_0043c910 / FUN_00425590)
      jariStage: 1, natmalStage: 1,    // [확인] 상태줄 "자리연습 : %d단계  낱말 연습 : %d단계" (62198)
      records: [],
      fingers: Array(9).fill(0),       // [확인] 손가락별 통계 문자열 (62202~62209), 집계 기준은 [추정]
      fingerErrors: Array(9).fill(0),
      keySpeed: {},                    // [확인] 키별 평균 속도 테이블(46키) — FUN_0043bc10
      created: Date.now()
    };
  }

  function defaults() {
    return {
      users: [newUser('사용자 1')], // [추정] 첫 실행 시 기본 사용자 (캡처 01)
      currentId: null,
      settings: { layout: 'ko2', sound: true, repeat: false }
    };
  }

  let state;
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      state = raw ? JSON.parse(raw) : null;
    } catch (e) { state = null; }
    if (!state || !Array.isArray(state.users) || state.users.length === 0) state = defaults();
    state.settings = Object.assign(defaults().settings, state.settings || {});
    state.users.forEach(u => {
      const d = newUser(u.name);
      Object.keys(d).forEach(k => { if (u[k] === undefined) u[k] = d[k]; });
    });
    if (!state.users.some(u => u.id === state.currentId)) state.currentId = state.users[0].id;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn('저장 실패', e); }
  }

  function user() { return state.users.find(u => u.id === state.currentId) || state.users[0]; }

  /**
   * 연습 기록 추가
   * [확인] 짧은 글·긴 글 기록은 사용자 평균타수를 누적 평균으로 갱신한다:
   *        avg = (avg × n + speed) / (n + 1)
   */
  function addRecord(rec) {
    const u = user();
    u.records.push(rec);
    if (u.records.length > 500) u.records.splice(0, u.records.length - 500);
    if (rec.type === 'short' || rec.type === 'long') {
      u.avgSpeed = Math.floor((u.avgSpeed * u.avgCount + rec.speed) / (u.avgCount + 1));
      u.avgCount += 1;
    }
    save();
  }

  /** [확인] "초기화하면 사용자의 모든 정보가 삭제됩니다" (62038) — 이름·목표는 남긴다 [추정] */
  function resetUser(u) {
    const fresh = newUser(u.name, u.targetSpeed, u.targetAcc);
    fresh.id = u.id;
    Object.assign(u, fresh);
    save();
  }

  load();
  TT.store = {
    get state() { return state; },
    save, newUser, user, addRecord, resetUser,
    settings() { return state.settings; },
    layoutName(l) { return l === 'en' ? '영어 쿼티' : '두벌식 표준'; }
  };
})(window.TT = window.TT || {});

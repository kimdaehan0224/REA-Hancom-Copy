/*
 * 한글 분해 / 글자 → 키 입력 변환
 *
 * [확인] 원본은 글자를 "글자판별 키 입력 열"로 분해해서 타수를 센다.
 *        - CKor2Bul(두벌식) vtable 슬롯 6 = FUN_00412040 (analysis §7.1)
 *        - 음절을 초성/중성/종성으로 나눈 뒤 각각 두벌식 키 가상키 코드로 바꾼다.
 *        - 겹모음(ㅘ=ㅗ+ㅏ)·겹받침(ㄳ=ㄱ+ㅅ)은 키 2개, 쌍자음(ㄲ)은 Shift+키 1개로 센다.
 *        - ASCII 문자는 키 1개.
 * [추정] 영어(쿼티) 글자판은 US 배열 그대로 1글자 = 키 1개로 처리.
 * [미지원] 세벌식 390/순아래/최종, 드보락 (원본에는 CKor3Bul* 클래스가 있음 — 분해표 미분석)
 */
(function (TT) {
  'use strict';

  const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
  const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

  // [확인] 겹모음/겹받침 → 키 2개 (FUN_00412040의 분기: ㅘ→H,K / ㄳ→R,T 등)
  const SPLIT = {
    'ㅘ': 'ㅗㅏ', 'ㅙ': 'ㅗㅐ', 'ㅚ': 'ㅗㅣ', 'ㅝ': 'ㅜㅓ', 'ㅞ': 'ㅜㅔ', 'ㅟ': 'ㅜㅣ', 'ㅢ': 'ㅡㅣ',
    'ㄳ': 'ㄱㅅ', 'ㄵ': 'ㄴㅈ', 'ㄶ': 'ㄴㅎ', 'ㄺ': 'ㄹㄱ', 'ㄻ': 'ㄹㅁ', 'ㄼ': 'ㄹㅂ', 'ㄽ': 'ㄹㅅ',
    'ㄾ': 'ㄹㅌ', 'ㄿ': 'ㄹㅍ', 'ㅀ': 'ㄹㅎ', 'ㅄ': 'ㅂㅅ'
  };

  // [확인] 두벌식 키 배치 (ㄱ→R(0x52), ㄴ→S(0x53), ㅗ→H(0x48), ㅏ→K(0x4b) …)
  const KO2 = {
    'ㅂ': 'KeyQ', 'ㅈ': 'KeyW', 'ㄷ': 'KeyE', 'ㄱ': 'KeyR', 'ㅅ': 'KeyT', 'ㅛ': 'KeyY', 'ㅕ': 'KeyU', 'ㅑ': 'KeyI', 'ㅐ': 'KeyO', 'ㅔ': 'KeyP',
    'ㅁ': 'KeyA', 'ㄴ': 'KeyS', 'ㅇ': 'KeyD', 'ㄹ': 'KeyF', 'ㅎ': 'KeyG', 'ㅗ': 'KeyH', 'ㅓ': 'KeyJ', 'ㅏ': 'KeyK', 'ㅣ': 'KeyL',
    'ㅋ': 'KeyZ', 'ㅌ': 'KeyX', 'ㅊ': 'KeyC', 'ㅍ': 'KeyV', 'ㅠ': 'KeyB', 'ㅜ': 'KeyN', 'ㅡ': 'KeyM'
  };
  // [확인] 쌍자음/ㅒ/ㅖ = Shift + 키, 키 입력 수는 1 (ㄲ → 0xa052)
  const KO2_SHIFT = { 'ㅃ': 'KeyQ', 'ㅉ': 'KeyW', 'ㄸ': 'KeyE', 'ㄲ': 'KeyR', 'ㅆ': 'KeyT', 'ㅒ': 'KeyO', 'ㅖ': 'KeyP' };

  const KO2_INV = {}, KO2_SHIFT_INV = {};
  Object.keys(KO2).forEach(j => { KO2_INV[KO2[j]] = j; });
  Object.keys(KO2_SHIFT).forEach(j => { KO2_SHIFT_INV[KO2_SHIFT[j]] = j; });

  // US 배열: [code, 기본, Shift]
  const US_TABLE = [
    ['Backquote', '`', '~'], ['Digit1', '1', '!'], ['Digit2', '2', '@'], ['Digit3', '3', '#'], ['Digit4', '4', '$'],
    ['Digit5', '5', '%'], ['Digit6', '6', '^'], ['Digit7', '7', '&'], ['Digit8', '8', '*'], ['Digit9', '9', '('],
    ['Digit0', '0', ')'], ['Minus', '-', '_'], ['Equal', '=', '+'], ['BracketLeft', '[', '{'], ['BracketRight', ']', '}'],
    ['Backslash', '\\', '|'], ['Semicolon', ';', ':'], ['Quote', "'", '"'], ['Comma', ',', '<'], ['Period', '.', '>'],
    ['Slash', '/', '?'], ['Space', ' ', ' ']
  ];
  'abcdefghijklmnopqrstuvwxyz'.split('').forEach(c => US_TABLE.push(['Key' + c.toUpperCase(), c, c.toUpperCase()]));

  const US = {};      // char -> {code, shift}
  const US_INV = {};  // code -> {base, shift}
  US_TABLE.forEach(([code, base, sh]) => {
    US[base] = { code, shift: false };
    if (sh !== base) US[sh] = { code, shift: true };
    US_INV[code] = { base, shift: sh };
  });

  function isSyllable(ch) {
    const c = ch.charCodeAt(0);
    return c >= 0xAC00 && c <= 0xD7A3;
  }
  function isJamo(ch) {
    const c = ch.charCodeAt(0);
    return c >= 0x3131 && c <= 0x3163;
  }
  function isHangul(ch) { return !!ch && (isSyllable(ch) || isJamo(ch)); }

  /** 음절 → [초성, 중성, (종성)] / 호환 자모 → [자모] / 그 외 → null */
  function decompose(ch) {
    if (!ch) return null;
    if (isSyllable(ch)) {
      const s = ch.charCodeAt(0) - 0xAC00;
      const out = [CHO[Math.floor(s / 588)], JUNG[Math.floor((s % 588) / 28)]];
      const jong = JONG[s % 28];
      if (jong) out.push(jong);
      return out;
    }
    if (isJamo(ch)) return [ch];
    return null;
  }

  function jamoKeys(j) {
    const parts = SPLIT[j] ? SPLIT[j].split('') : [j];
    return parts.map(p => {
      if (KO2[p]) return { code: KO2[p], shift: false };
      if (KO2_SHIFT[p]) return { code: KO2_SHIFT[p], shift: true };
      return { code: '?' + p, shift: false };
    });
  }

  /**
   * 글자 하나를 키 입력 열로 바꾼다.
   * [확인] 한글은 두벌식 키 입력 수 = 타수 (CKor2Bul 분해)
   */
  function charToKeys(ch, layout) {
    if (!ch) return [];
    if (layout !== 'en' && isHangul(ch)) {
      const jamos = decompose(ch);
      const keys = [];
      jamos.forEach(j => keys.push(...jamoKeys(j)));
      return keys;
    }
    if (US[ch]) return [US[ch]];
    return [{ code: '?' + ch, shift: false }]; // 알 수 없는 문자도 1타 [추정]
  }

  /** 물리 키(+Shift) → 그 글자판에서 찍히는 글자 (자리연습 판정용) */
  function keyToChar(code, shift, layout) {
    if (layout !== 'en') {
      if (shift && KO2_SHIFT_INV[code]) return KO2_SHIFT_INV[code];
      if (KO2_INV[code]) return KO2_INV[code]; // 두벌식: Shift+ㅁ → ㅁ
    }
    const u = US_INV[code];
    if (!u) return null;
    return shift ? u.shift : u.base;
  }

  /** 화상 키보드용 라벨 {code: {base, shift}} */
  function labels(layout) {
    const out = {};
    Object.keys(US_INV).forEach(code => {
      const u = US_INV[code];
      if (layout !== 'en' && KO2_INV[code]) {
        out[code] = { base: KO2_INV[code], shift: KO2_SHIFT_INV[code] || '' };
      } else if (/^Key/.test(code)) {
        out[code] = { base: u.shift, shift: '' }; // 영문은 대문자 하나만 표시
      } else {
        out[code] = { base: u.base, shift: u.shift };
      }
    });
    return out;
  }

  const keyId = k => (k.shift ? 'S+' : '') + k.code;

  TT.hangul = { CHO, JUNG, JONG, decompose, charToKeys, keyToChar, labels, keyId, isHangul, isSyllable };
})(window.TT = window.TT || {});

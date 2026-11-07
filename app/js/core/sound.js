/*
 * 효과음
 * [확인] 원본에 소리 켜기/끄기 설정과 효과음 파일(Data\Sound\Wav\MsgType.WAV, miss.wav 등)이 있다.
 * [추정] 원본 음원은 쓰지 않고 WebAudio로 짧은 비프음을 합성한다.
 */
(function (TT) {
  'use strict';
  let ctx = null;
  function beep(freq, dur, type, vol) {
    if (!TT.store.settings().sound) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.value = vol || 0.05;
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + dur);
    } catch (e) { /* 소리 실패는 무시 */ }
  }
  TT.sound = {
    key() { beep(880, 0.04, 'triangle', 0.03); },
    error() { beep(180, 0.15, 'square', 0.04); },
    done() { beep(660, 0.12); setTimeout(() => beep(990, 0.18), 120); }
  };
})(window.TT = window.TT || {});

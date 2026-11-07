/*
 * 자리연습 단계 (1~8단계)
 * [확인] 자리연습은 1~8단계로 나뉜다 (캡처 02/03의 단계 선택 1~8).
 * [확인] 1단계는 기본 자리(왼손 ㅁㄴㅇㄹ, 오른손 ㅓㅏㅣ;)가 강조된다 (캡처 02).
 * [추정] 2~8단계의 키 구성은 원본 데이터(han%d.dat)를 분석하지 않아 일반적인 순서로 정했다.
 */
(function (TT) {
  'use strict';
  TT.data = TT.data || {};
  TT.data.jari = {
    ko2: [
      { name: '기본 자리', keys: ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅓ', 'ㅏ', 'ㅣ', ';'] },
      { name: '검지 안쪽', keys: ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'] },
      { name: '윗줄 왼손', keys: ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ'] },
      { name: '윗줄 오른손', keys: ['ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'] },
      { name: '아랫줄 왼손', keys: ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ'] },
      { name: '아랫줄 오른손', keys: ['ㅜ', 'ㅡ', ',', '.', '/'] },
      { name: '윗글쇠', keys: ['ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', 'ㅒ', 'ㅖ'] },
      { name: '숫자', keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] }
    ],
    en: [
      { name: 'Home row', keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'] },
      { name: 'Index inner', keys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'] },
      { name: 'Top left', keys: ['q', 'w', 'e', 'r', 't'] },
      { name: 'Top right', keys: ['y', 'u', 'i', 'o', 'p'] },
      { name: 'Bottom left', keys: ['z', 'x', 'c', 'v', 'b'] },
      { name: 'Bottom right', keys: ['n', 'm', ',', '.', '/'] },
      { name: 'Capitals', keys: ['A', 'S', 'D', 'F', 'J', 'K', 'L', 'E', 'R', 'U', 'I'] },
      { name: 'Numbers', keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] }
    ]
  };
  TT.data.JARI_COUNT = 40;   // [추정] 한 판에 치는 글자 수
  TT.data.NATMAL_COUNT = 20; // [추정] 한 판에 치는 낱말 수
  TT.data.SHORT_COUNT = 32;  // [확인] 짧은 글 진행도 = count × 100 / 32, 32문장이면 결과 창 (FUN_0043c910/0043bc10)
  TT.data.LONG_LINES_PER_PAGE = 5; // [추정] 결과 인자 page*5-5+line, 캡처 06의 한 쪽 5줄
})(window.TT = window.TT || {});

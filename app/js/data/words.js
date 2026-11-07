/*
 * 낱말 연습용 일반 단어 (원본 wordkor.dat/wordeng.dat 내용은 쓰지 않음)
 * [추정] 단계는 글자 수가 짧은 낱말부터 8묶음으로 나눈다.
 */
(function (TT) {
  'use strict';
  TT.data = TT.data || {};
  const ko = ('사과 바다 하늘 나무 학교 친구 가족 음악 연필 책상 의자 시계 우산 신발 모자 가방 커피 우유 과일 채소 ' +
    '기차 버스 자동차 비행기 자전거 도서관 병원 시장 공원 운동장 강아지 고양이 토끼 호랑이 거북이 다람쥐 무지개 구름 ' +
    '바람 햇살 눈사람 봄비 여름 가을 겨울 아침 점심 저녁 밤하늘 별빛 달빛 노래 그림 사진 편지 선물 생일 축제 여행 ' +
    '지도 나침반 등대 항구 섬마을 산책 소풍 김밥 떡볶이 냉면 비빔밥 된장국 감자 고구마 옥수수 딸기 수박 포도 복숭아 ' +
    '컴퓨터 키보드 마우스 모니터 전화기 냉장고 세탁기 청소기 창문 거울 수건 비누 칫솔 이불 베개 달력 공책 지우개 ' +
    '색연필 운동화 장갑 목도리 손수건 꽃다발 해바라기 민들레 소나무 단풍잎 시냇물 폭포수 모래성 조개껍데기 반딧불').split(' ');
  const en = ('apple river cloud music table chair window garden planet forest school friend family pencil paper letter ' +
    'bridge rocket guitar coffee bread orange yellow purple silver summer winter spring autumn morning evening market ' +
    'island travel camera rabbit turtle monkey dragon castle button keyboard monitor number simple quiet bright gentle ' +
    'happy little strong typing finger practice journey kitchen blanket pillow mirror candle lantern harbor meadow ' +
    'thunder rainbow sunrise breeze pebble').split(' ');

  function stages(list) {
    const sorted = list.slice().sort((a, b) => a.length - b.length);
    const size = Math.ceil(sorted.length / 8);
    return Array.from({ length: 8 }, (_, i) => sorted.slice(i * size, (i + 1) * size));
  }
  TT.data.words = { ko: stages(ko), en: stages(en) };
})(window.TT = window.TT || {});

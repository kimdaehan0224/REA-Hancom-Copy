/*
 * 긴 글 연습용 문단 — 모두 직접 지은 글 (원본 긴 글·캡처 06의 작품은 쓰지 않음)
 * [추정] 첫 쪽 첫 줄에 제목을 두고 제목도 입력한다 (캡처 06에서 제목 아래에도 입력 칸이 있음).
 */
(function (TT) {
  'use strict';
  TT.data = TT.data || {};
  TT.data.longTexts = {
    ko: [
      {
        title: '골목길의 아침',
        body: '골목길의 아침은 언제나 빵 굽는 냄새로 시작된다. 모퉁이 가게의 주인은 해가 뜨기 전부터 반죽을 치대고, 창문 너머로 노란 불빛이 새어 나온다. 학교에 가는 아이들은 그 앞을 지날 때마다 걸음을 늦추고 유리창에 코를 댄다. 주인은 웃으며 갓 구운 작은 빵 하나를 건네고, 아이들은 고맙다는 인사를 남기고 뛰어간다. 그렇게 하루가 열리면 골목은 조금씩 시끄러워진다. 자전거 바퀴 소리와 우유 배달 수레 소리가 섞이고, 담장 위의 고양이는 귀찮다는 듯 하품을 한다. 누군가에게는 평범한 장면이겠지만, 이 골목에 사는 사람들에게는 하루를 버티게 해 주는 작은 약속과도 같다. 내일도 빵 냄새가 날 것이라는 믿음, 그리고 그 냄새를 함께 맡을 이웃이 있다는 안도감이다.'
      },
      {
        title: '바다를 건너는 편지',
        body: '할머니는 매달 첫째 주 월요일이면 바다 건너에 사는 동생에게 편지를 쓰셨다. 볼펜 대신 꼭 만년필을 고집하셨고, 글씨를 틀리면 종이를 새로 꺼내 처음부터 다시 쓰셨다. 왜 그렇게까지 하시냐고 여쭈면, 편지는 마음을 옮겨 적는 일이라 대충 할 수 없다고 하셨다. 편지에는 텃밭에 심은 상추가 얼마나 자랐는지, 장날에 누구를 만났는지 같은 소소한 이야기가 가득했다. 답장은 늘 한 달쯤 뒤에 도착했는데, 할머니는 봉투를 바로 뜯지 않고 저녁을 다 드신 뒤에야 안경을 쓰고 천천히 읽으셨다. 지금 생각해 보면 그 기다림까지가 편지의 일부였던 것 같다. 빠르게 주고받는 메시지가 익숙한 요즘, 나는 가끔 할머니의 책상 서랍을 열어 본다. 그 안에는 아직도 바다 냄새가 나는 듯한 편지 묶음이 고무줄에 묶여 있다.'
      },
      {
        title: '작은 정원 가꾸기',
        body: '베란다 한쪽에 작은 화분 세 개를 들여놓은 것이 시작이었다. 처음에는 물을 너무 자주 주어 뿌리를 상하게 했고, 햇빛이 부족해 잎이 노랗게 변하기도 했다. 실패를 거듭하면서 식물마다 좋아하는 환경이 다르다는 것을 알게 되었다. 어떤 것은 흙이 마를 때까지 기다려야 했고, 어떤 것은 아침 햇살만으로도 충분했다. 이제는 퇴근하고 돌아와 화분을 살피는 시간이 하루 중 가장 조용한 순간이 되었다. 새잎이 돋아난 것을 발견하면 괜히 누군가에게 자랑하고 싶어진다. 정원이라고 부르기에는 아직 초라하지만, 매일 조금씩 자라는 것을 지켜보는 일은 생각보다 큰 위로가 된다. 서두르지 않아도 자라는 것들이 있다는 사실이, 바쁘게 사는 나에게 작은 쉼표를 찍어 준다.'
      }
    ],
    en: [
      {
        title: 'The Lighthouse Keeper',
        body: 'The lighthouse stood at the edge of the island, white and patient against the gray sea. Every evening the keeper climbed the narrow stairs, counted the steps out of habit, and lit the great lamp at the top. Ships passed in the dark without ever knowing his name, yet each of them trusted the steady light he kept alive. On quiet nights he wrote short notes in a worn notebook about the wind, the waves, and the birds that rested on the railing. He never thought of his work as important. He simply believed that someone, somewhere out on the water, was glad to see the light, and that was reason enough to climb the stairs again.'
      }
    ]
  };

  /** 낱말 경계에서 줄을 나눈다 [추정: 캡처 06의 한 줄 길이(한글 약 36자)] */
  TT.data.wrapText = function (text, max) {
    const words = text.split(/\s+/);
    const lines = [];
    let cur = '';
    words.forEach(w => {
      if (cur && (cur + ' ' + w).length > max) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
    });
    if (cur) lines.push(cur);
    return lines;
  };
})(window.TT = window.TT || {});

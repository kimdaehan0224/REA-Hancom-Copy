/*
 * 8. 설정/통계 (08_settings.png 캡처가 없어 리소스 문자열을 근거로 구성)
 *  - 사용자 정보(평균타수·목표타수·정확도), 글자판 선택, 소리, 반복누르기, 타자속도 기록 그래프, 하단 통계 버튼
 *
 * [확인] 사용자 정보 문자열: "이    름 : %s"(62213) "평균타수 : %d타/분"(62214) "목표타수 : %d타/분"(62215) "정 확 도 : %d%%"(62216)
 * [확인] "정보 수정"(62036), 소리 "켜기/끄기"(62034/62035)
 * [확인] 글자판 목록: 두벌식 표준, 세벌식 390/순아래/최종, 영어 쿼티/드보락 (62033~62045)
 *        → 이 웹앱은 두벌식 표준·영어 쿼티만 지원 (세벌식·드보락 분해표 미분석)
 * [확인] 손가락별 통계 "좌-소지 %4d" … "우-소지 %4d" (62202~62209)
 * [확인] 초기화 확인 문구 "초기화하면 사용자의 모든 정보가 삭제됩니다. 초기화하시겠습니까?" (62038)
 * [추정] "정 확 도"는 사용자의 목표 정확도로 표시 (원본에서 어떤 값인지 미확인)
 * [추정] 반복누르기 = 키를 누르고 있을 때 자동 반복 입력 허용 여부
 * [추정] 그래프는 최근 기록의 타수 추이 + 목표타수 선
 */
(function (TT) {
  'use strict';
  const TYPE_NAME = { jari: '자리', natmal: '낱말', short: '짧은글', long: '긴글' };
  const COLORS = { jari: '#8a8a8a', natmal: '#2fa3c9', short: '#e0612b', long: '#4c9a2a' };

  function drawGraph(canvas, u) {
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth, Hh = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = Hh * dpr;
    const g = canvas.getContext('2d');
    g.scale(dpr, dpr);
    g.clearRect(0, 0, W, Hh);
    const recs = u.records.filter(r => r.type !== 'jari').slice(-30);
    const pad = { l: 40, r: 10, t: 10, b: 22 };
    const max = Math.max(200, u.targetSpeed, ...recs.map(r => r.speed));
    const yMax = Math.ceil(max / 100) * 100;
    const x = i => pad.l + (recs.length <= 1 ? (W - pad.l - pad.r) / 2 : i * (W - pad.l - pad.r) / (recs.length - 1));
    const y = v => pad.t + (Hh - pad.t - pad.b) * (1 - v / yMax);
    g.font = '11px sans-serif'; g.fillStyle = '#888'; g.strokeStyle = '#e4e4e0'; g.lineWidth = 1;
    for (let v = 0; v <= yMax; v += yMax / 4) {
      g.beginPath(); g.moveTo(pad.l, y(v)); g.lineTo(W - pad.r, y(v)); g.stroke();
      g.fillText(String(v), 4, y(v) + 4);
    }
    // 목표타수
    g.setLineDash([5, 4]); g.strokeStyle = '#c2461a';
    g.beginPath(); g.moveTo(pad.l, y(u.targetSpeed)); g.lineTo(W - pad.r, y(u.targetSpeed)); g.stroke();
    g.setLineDash([]);
    if (!recs.length) {
      g.fillStyle = '#999'; g.font = '14px sans-serif';
      g.fillText('아직 기록이 없습니다.', W / 2 - 60, Hh / 2);
      return;
    }
    // 전체 추이 선
    g.strokeStyle = '#555'; g.lineWidth = 1.5;
    g.beginPath();
    recs.forEach((r, i) => (i ? g.lineTo(x(i), y(r.speed)) : g.moveTo(x(i), y(r.speed))));
    g.stroke();
    recs.forEach((r, i) => {
      g.fillStyle = COLORS[r.type] || '#333';
      g.beginPath(); g.arc(x(i), y(r.speed), 4, 0, Math.PI * 2); g.fill();
    });
  }

  function recordsTable(u) {
    const rows = u.records.slice(-60).reverse().map(r => {
      const d = new Date(r.date);
      const ds = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      return `<tr><td>${ds}</td><td>${TYPE_NAME[r.type] || r.type}${r.stage ? ' ' + r.stage + '단계' : ''}${r.demo ? ' (데모)' : ''}</td>
        <td>${r.speed}</td><td>${r.acc}%</td><td>${TT.ui.fmtTime(r.ms)}</td><td>${r.strokes}</td><td>${r.errors}</td></tr>`;
    }).join('');
    return `<div class="rec-scroll"><table class="rec"><tr><th>일시</th><th>연습</th><th>타수</th><th>정확도</th><th>시간</th><th>총타수</th><th>오타</th></tr>
      ${rows || '<tr><td colspan="7">기록이 없습니다.</td></tr>'}</table></div>`;
  }

  function fingerHtml(u) {
    const max = Math.max(1, ...u.fingers.slice(0, 8));
    return `<div class="finger-bars">${TT.keyboard.FINGER_NAMES.slice(0, 8).map((n, i) =>
      `<span>${n}</span><span class="bar" style="width:${u.fingers[i] * 100 / max}%"></span><span>${String(u.fingers[i]).padStart(4, ' ')}</span>`).join('')}</div>
      <p style="font-size:12px;color:#888;margin:10px 0 0">손가락별 맞게 친 키 수 · 오타: ${u.fingerErrors.slice(0, 8).join(' / ')}</p>`;
  }

  function keySpeedHtml(u) {
    const labels = TT.hangul.labels(TT.store.settings().layout);
    const list = Object.keys(u.keySpeed).map(c => ({ c, ...u.keySpeed[c] })).sort((a, b) => a.avg - b.avg);
    if (!list.length) return '<p>아직 기록이 없습니다.</p>';
    return `<div class="rec-scroll"><table class="rec"><tr><th>키</th><th>평균 속도(타/분)</th><th>횟수</th></tr>
      ${list.map(k => `<tr><td>${TT.ui.esc((labels[k.c] || {}).base || k.c)}</td><td>${k.avg}</td><td>${k.n}</td></tr>`).join('')}</table></div>
      <p style="font-size:12px;color:#888">느린 키부터 정렬 · 키 간격 60000/ms의 누적 평균 [원본 46키 테이블 방식]</p>`;
  }

  TT.screens.settings = {
    meta: { shell: true, tab: null, footer: 'back', backTo: '@prev', title: '설정/통계' },
    mount(el) {
      const st = TT.store.settings();
      const root = TT.ui.el(`<div>
        <div class="set-left">
          <div class="box"><h3>사용자 정보</h3><div class="info-line"></div>
            <div style="text-align:right"><button class="btn" data-act="edit">정보 수정</button></div></div>
          <div class="box"><h3>환경 설정</h3>
            <div class="opt-row"><span>글자판</span>
              <select class="layout">
                <optgroup label="한글"><option value="ko2">두벌식 표준</option>
                  <option disabled>세벌식 390 (미지원)</option><option disabled>세벌식 순아래 (미지원)</option><option disabled>세벌식 최종 (미지원)</option></optgroup>
                <optgroup label="영어"><option value="en">쿼티</option><option disabled>드보락 (미지원)</option></optgroup>
              </select></div>
            <div class="opt-row"><span>소리</span><span class="seg" data-opt="sound"><button data-v="1">켜기</button><button data-v="0">끄기</button></span></div>
            <div class="opt-row"><span>반복누르기</span><span class="seg" data-opt="repeat"><button data-v="1">켜기</button><button data-v="0">끄기</button></span></div>
          </div>
        </div>
        <div class="set-right">
          <div class="box graph-wrap"><h3>타자속도 기록</h3><canvas></canvas>
            <div class="legend"><span><i style="background:#2fa3c9"></i>낱말</span><span><i style="background:#e0612b"></i>짧은글</span>
              <span><i style="background:#4c9a2a"></i>긴글</span><span><i style="background:#c2461a"></i>목표타수(점선)</span></div></div>
        </div>
        <div class="stat-btns">
          <button class="btn" data-act="records">연습 기록</button>
          <button class="btn" data-act="fingers">손가락별 통계</button>
          <button class="btn" data-act="keys">키별 속도</button>
          <button class="btn" data-act="reset">사용자 초기화</button>
        </div>
      </div>`);
      el.appendChild(root);
      const canvas = root.querySelector('canvas');

      const refresh = () => {
        const u = TT.store.user();
        root.querySelector('.info-line').textContent =
          `이    름 : ${u.name}\n평균타수 : ${u.avgSpeed}타/분\n목표타수 : ${u.targetSpeed}타/분\n정 확 도 : ${u.targetAcc}%\n자    판 : ${TT.store.layoutName(st.layout)}`;
        root.querySelector('.layout').value = st.layout;
        root.querySelectorAll('.seg').forEach(s => {
          const on = !!st[s.dataset.opt];
          s.querySelectorAll('button').forEach(b => b.classList.toggle('on', (b.dataset.v === '1') === on));
        });
        drawGraph(canvas, u);
        TT.ui.refreshUserBadge();
      };

      root.querySelector('.layout').addEventListener('change', e => { st.layout = e.target.value; TT.store.save(); refresh(); });
      root.querySelectorAll('.seg').forEach(s => s.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        st[s.dataset.opt] = b.dataset.v === '1'; TT.store.save(); refresh();
      })));
      root.querySelector('[data-act=edit]').addEventListener('click', async () => {
        const u = TT.store.user();
        const v = await TT.userForm.open(u);
        if (v) { Object.assign(u, v); TT.store.save(); refresh(); }
      });
      root.querySelector('[data-act=records]').addEventListener('click', () =>
        TT.ui.modal({ title: '연습 기록', body: recordsTable(TT.store.user()) }));
      root.querySelector('[data-act=fingers]').addEventListener('click', () =>
        TT.ui.modal({ title: '손가락별 통계', body: fingerHtml(TT.store.user()) }));
      root.querySelector('[data-act=keys]').addEventListener('click', () =>
        TT.ui.modal({ title: '키별 속도', body: keySpeedHtml(TT.store.user()) }));
      root.querySelector('[data-act=reset]').addEventListener('click', async () => {
        if (!await TT.ui.confirm('초기화하면 사용자의 모든 정보가 삭제됩니다. 초기화하시겠습니까?', '사용자 초기화')) return;
        TT.store.resetUser(TT.store.user());
        refresh();
      });
      refresh();
    },
    unmount() {}
  };
})(window.TT = window.TT || {});

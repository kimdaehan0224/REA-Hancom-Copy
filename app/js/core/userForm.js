/*
 * 사용자 등록/수정 대화상자 (시작 화면의 등록·편집, 설정 화면의 정보 수정에서 공용)
 * [확인] 검증 문구는 원본 리소스 문자열(HncTT.kor RT_STRING)과 같다:
 *   62065 목표 타수 100~800 / 62066 목표 정확도 80~100 / 62067 동일 이름 / 62068 최소 한 자
 */
(function (TT) {
  'use strict';

  /** @returns {Promise<{name:string,targetSpeed:number,targetAcc:number}|null>} */
  async function open(user) {
    const title = user ? '사용자 수정' : '정보 등록'; // [확인] 62064 / 62063
    const body = TT.ui.el(`<div>
      <div class="form-row"><label>이름</label><input id="f-name" maxlength="16"></div>
      <div class="form-row"><label>목표타수</label><input id="f-speed" type="number" min="100" max="800"><span class="unit">타/분</span></div>
      <div class="form-row"><label>목표정확도</label><input id="f-acc" type="number" min="80" max="100"><span class="unit">%</span></div>
    </div>`);
    body.querySelector('#f-name').value = user ? user.name : '';
    body.querySelector('#f-speed').value = user ? user.targetSpeed : 200;
    body.querySelector('#f-acc').value = user ? user.targetAcc : 90;

    for (;;) {
      const v = await TT.ui.modal({
        title, body,
        buttons: [
          { label: '확인', primary: true, value: ov => ({
            name: ov.querySelector('#f-name').value.trim(),
            speedRaw: ov.querySelector('#f-speed').value.trim(),
            accRaw: ov.querySelector('#f-acc').value.trim()
          }) },
          { label: '취소', value: null, cancel: true }
        ]
      });
      if (!v) return null;
      const err = validate(v, user);
      if (!err) return { name: v.name, targetSpeed: +v.speedRaw, targetAcc: +v.accRaw };
      await TT.ui.alert(err);
    }
  }

  function validate(v, user) {
    if (v.name.length < 1) return '최소 한 자 이상의 이름을 사용해야 합니다.';
    if (TT.store.state.users.some(u => u.name === v.name && (!user || u.id !== user.id))) return '이미 동일한 사용자 이름이 있습니다.';
    if (!/^\d+$/.test(v.speedRaw) || +v.speedRaw < 100 || +v.speedRaw > 800) return '목표 타수 입력이 잘못되었습니다. 100에서 800까지 정수를 입력하세요.';
    if (!/^\d+$/.test(v.accRaw) || +v.accRaw < 80 || +v.accRaw > 100) return '목표 정확도 입력이 잘못되었습니다. 80에서 100까지 정수를 입력하세요.';
    return null;
  }

  TT.userForm = { open, validate };
})(window.TT = window.TT || {});

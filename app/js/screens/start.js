/*
 * 1. 시작 화면 (캡처 01)
 *  - 사용자 목록, 등록/편집/삭제, 시작
 * [확인] "최소 한 명의 사용자가 등록되어 있어야 합니다."(62061), "선택한 사용자를 지울까요?"(62062)
 * [추정] 목록에서 ↑/↓로 선택, Enter로 시작
 */
(function (TT) {
  'use strict';
  let root = null, onKey = null;

  function render() {
    const st = TT.store.state;
    const list = root.querySelector('.userlist');
    list.innerHTML = st.users.map(u =>
      `<li data-id="${u.id}" class="${u.id === st.currentId ? 'sel' : ''}">${TT.ui.esc(u.name)}</li>`).join('');
    list.querySelectorAll('li').forEach(li => {
      li.addEventListener('click', () => { st.currentId = li.dataset.id; TT.store.save(); render(); });
      li.addEventListener('dblclick', start);
    });
    const sel = list.querySelector('.sel');
    sel && sel.scrollIntoView({ block: 'nearest' });
  }

  async function add() {
    const v = await TT.userForm.open(null);
    if (!v) return;
    const u = TT.store.newUser(v.name, v.targetSpeed, v.targetAcc);
    TT.store.state.users.push(u);
    TT.store.state.currentId = u.id;
    TT.store.save();
    render();
  }

  async function edit() {
    const u = TT.store.user();
    const v = await TT.userForm.open(u);
    if (!v) return;
    Object.assign(u, v);
    TT.store.save();
    render();
  }

  async function del() {
    const st = TT.store.state;
    if (st.users.length <= 1) { await TT.ui.alert('최소 한 명의 사용자가 등록되어 있어야 합니다.'); return; }
    if (!await TT.ui.confirm('선택한 사용자를 지울까요?', '사용자 삭제')) return;
    st.users = st.users.filter(u => u.id !== st.currentId);
    st.currentId = st.users[0].id;
    TT.store.save();
    render();
  }

  function start() { TT.router.go('jariIntro'); }

  TT.screens.start = {
    meta: { shell: false, title: '시작' },
    mount(el) {
      root = TT.ui.el(`<div class="start-panel">
        <div class="start-title"><h1>타자 연습</h1><small>typing practice</small></div>
        <div class="start-desc">
          <p>타자를 처음 배우는 사람도 차근차근 단계를 밟으며 손에 익힐 수 있습니다.</p>
          <p>자리 연습, 낱말 연습, 짧은 글 연습, 긴 글 연습으로 실력을 단계별로 높여 보세요.</p>
        </div>
        <div class="userlist-box">
          <div class="userlist-head">사용자 목록</div>
          <ul class="userlist"></ul>
          <div class="userlist-btns">
            <button class="btn" data-act="add">등록</button>
            <button class="btn" data-act="edit">편집</button>
            <button class="btn" data-act="del">삭제</button>
          </div>
        </div>
        <div class="start-bottom"><button class="btn-start">시작</button></div>
      </div>`);
      el.appendChild(root);
      root.querySelector('[data-act=add]').addEventListener('click', add);
      root.querySelector('[data-act=edit]').addEventListener('click', edit);
      root.querySelector('[data-act=del]').addEventListener('click', del);
      root.querySelector('.btn-start').addEventListener('click', start);
      onKey = e => {
        if (TT.ui.modalOpen) return;
        const st = TT.store.state;
        const idx = st.users.findIndex(u => u.id === st.currentId);
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          const n = Math.max(0, Math.min(st.users.length - 1, idx + (e.key === 'ArrowDown' ? 1 : -1)));
          st.currentId = st.users[n].id; TT.store.save(); render();
        } else if (e.key === 'Enter') { e.preventDefault(); start(); }
      };
      document.addEventListener('keydown', onKey);
      render();
    },
    unmount() { document.removeEventListener('keydown', onKey); root = null; }
  };
})(window.TT = window.TT || {});

/*
 * 타자연습 (REA 재구현) — Electron 메인 프로세스
 *
 * - ../app 폴더의 웹앱을 수정 없이 그대로 띄운다.
 *   개발 실행(npm start): <repo>/app
 *   빌드된 exe:           <resources>/app (electron-builder extraResources로 복사)
 * - 웹앱은 고정 스킴 app://typing/ 으로 불러온다.
 *   portable exe는 실행할 때마다 임시 폴더에 풀리므로 file:// 경로가 바뀌어도
 *   저장소 출처(origin)가 항상 같도록 하기 위함이다. localStorage는
 *   %APPDATA%\rea-typing-trainer 아래에 저장되어 exe를 다시 실행해도 유지된다.
 */
const { app, BrowserWindow, Menu, protocol, net } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

const TITLE = '타자연습 (REA 재구현)';
const SCHEME = 'app';
const HOST = 'typing';

// 사용자 데이터 위치를 이름으로 고정 (productName이 바뀌어도 기존 기록 유지)
app.setPath('userData', path.join(app.getPath('appData'), 'rea-typing-trainer'));

protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

function appRoot() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'app')
    : path.join(__dirname, '..', 'app');
}

function registerAppProtocol() {
  const root = path.resolve(appRoot());
  protocol.handle(SCHEME, req => {
    const url = new URL(req.url);
    let rel = decodeURIComponent(url.pathname);
    if (rel === '/' || rel === '') rel = '/index.html';
    const file = path.resolve(path.join(root, rel));
    // app 폴더 밖으로 나가는 경로 차단
    if (url.host !== HOST || (file !== root && !file.startsWith(root + path.sep))) {
      return new Response('Not found', { status: 404 });
    }
    return net.fetch(pathToFileURL(file).toString());
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 750,
    useContentSize: true, // 창 테두리를 뺀 내용 영역이 1000x750
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    title: TITLE,
    backgroundColor: '#f4f4f0',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.setMenuBarVisibility(false);
  // 웹앱이 화면마다 document.title을 바꾸므로 창 제목은 고정
  win.on('page-title-updated', e => e.preventDefault());
  // 외부 링크나 새 창은 열지 않음
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(`${SCHEME}://${HOST}/`)) e.preventDefault();
  });
  win.loadURL(`${SCHEME}://${HOST}/index.html`);
}

// 같은 exe를 두 번 띄우면 저장 데이터가 엇갈릴 수 있으므로 하나만 실행
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
  });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    registerAppProtocol();
    createWindow();
  });
  app.on('window-all-closed', () => app.quit());
}

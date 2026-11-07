# 한컴 타자연습 (HncTT80) 정적 분석

- 대상 폴더: `C:\Program Files (x86)\HncTT\HncTT80`
- 분석일: 2026-11-07
- 도구: REA MCP (Ghidra 12.1.4 provider, PE resource parser, managed-artifact inspector), 리소스 문자열 디코드용 읽기 전용 Python 스크립트
- **앱은 실행하지 않았습니다.** 아래 내용은 모두 배포된 파일을 정적으로 분석한 결과입니다.
- 표기 규칙: **[관찰]** 도구 출력이나 파일 바이트에서 직접 본 것 · **[추론]** 관찰을 근거로 해석한 것 · **[미확인]** 이번 분석으로 확인하지 못한 것

---

## 1. 폴더 구성과 메인 exe

### 1.1 파일 목록 [관찰]

파일은 모두 62개이고 합계 약 138 MB입니다.

| 구분 | 파일 | 크기 | 비고 |
|---|---|---|---|
| 실행 파일 | `HncTT.exe` | 3,924,400 B | FileVersion 10.0.0.8, 설명 "Hancom Typing Training" |
| 언어 리소스 | `HncTT.kor` | 555,440 B | FileVersion 10.0.0.9, PE32 |
| 언어 리소스 | `HncTT.enu` | 470,448 B | FileVersion 10.0.0.9 |
| 이미지 묶음 | `Data\imagepak.dat` | 123,918,486 B | 전체 용량의 대부분 |
| UI·이미지 메타 | `Data\UI.Dat`, `Data\Image.Dat` | 118 KB / 4.5 KB | |
| 연습 데이터 | `Data\han1..7.dat`, `Data\eng1..10.dat` | 0.5–17 KB | |
| 연습 데이터 | `Data\wordkor.dat`, `Data\wordeng.dat` | 18.6 KB / 7.5 KB | |
| 연습 데이터 | `Data\shorthan.dat`, `Data\shorteng.dat` | 49 KB / 15.6 KB | |
| 연습 데이터 | `Data\titles.dat`, `Data\descr1..7.dat` | 수백 B | |
| 사용자·결과 | `Data\UserPracResult.dat`, `UserKeyTypRst.dat`, `CakeGameResult.dat`, `SosGameResult.dat` | 36–880 B | |
| 사운드 | `Data\Sound\Game_Snd\*.wav` (11개), `Data\Sound\Mid\*.mp3` (4개), `Data\Sound\Wav\*.wav` (5개) | | |
| 도움말 | `Help\HncTTkor.chm`, `Help\HncTTenu.chm`, `Help\hancomtaja_notice.html` | | |

### 1.2 메인 exe

- **[관찰]** 폴더에 있는 실행 파일(.exe)은 `HncTT.exe` 하나뿐입니다.
- **[관찰]** `HncTT.kor`는 PE32 이미지입니다. 리소스는 RT_BITMAP, RT_ICON, RT_MENU, RT_DIALOG, RT_STRING, RT_ACCELERATOR, RT_GROUP_ICON, RT_VERSION, RT_MANIFEST 49개입니다. Evidence: `ev_11dc6835…`
- **[추론]** `.kor`와 `.enu`는 MFC 위성 리소스 DLL(언어 팩)로 보입니다. 근거:
  - `.kor`의 문자열 ID 57344~61203이 MFC 표준(AFX) ID 대역과 일치합니다.
  - exe 안에 `_en.png`로 끝나는 이미지 경로 쌍이 있습니다.
  - `.enu`의 리소스 트리는 이번에 열어 보지 않았습니다. **[미확인]**

---

## 2. 네이티브인지 .NET인지

- **[관찰]** `inspect_managed_artifact` 결과 `classification.status = "not-managed"`입니다. PE에 CLI 데이터 디렉터리가 없어서 관리 메타데이터와 CIL이 없습니다. 머신 0x014c(x86), PE32, 섹션 5개. Evidence: `ev_421bf9a2…` (parent `ev_fc5b608b…`)
- **[관찰]** Ghidra 결과: 이미지 베이스 0x400000, 프로시저 12,253개, 정의 문자열 8,152개. PDB 참조는 `HncTT.pdb` (GUID 86b0d208-…)이고 PDB 파일 자체는 로드되지 않아 함수 이름은 `FUN_xxxxxxxx`로만 나옵니다. Evidence: `ev_c0a0372e…`
- **[관찰]** exe 안에 MFC/ATL 흔적이 있습니다: `AfxFrameOrView90su`, `f:\dd\vctools\vc7libs\ship\atlmfc\src\mfc\viewcore.cpp`, `CSimpleStringT<wchar_t>`. 정적 링크된 OpenSSL·libpng·libjpeg 문자열도 보입니다.
- **결론:** **네이티브 x86 Win32 C++ 앱**입니다. MFC 9.0(Visual C++ 2008) 계열 문서/뷰 구조에 유니코드 빌드입니다.
  - **[추론]** MFC 버전은 `90su` 클래스명에서 추정했습니다.
  - **[관찰]** `mscoree.dll` 문자열과 R6033 메시지가 있지만, 이는 CRT에 기본으로 들어 있는 문자열입니다. CLI 디렉터리가 없으므로 .NET 앱이 아닙니다.

---

## 3. 화면·기능 분석 근거

### 3.1 RTTI 클래스 이름 (exe) [관찰]

`search_strings` 결과에서 확인했습니다. Evidence: `ev_5584a0e3…`

| 클래스 | 역할 [추론] |
|---|---|
| `CNewHncTTView` | 메인 MFC 뷰 (창 클래스 이름 문자열 `CNewHncTTView`도 있음) |
| `CHTTPosPrac` | 자리 연습 |
| `CHTTWordPrac` | 낱말 연습 |
| `CHTTStrPrac` | 짧은 글 연습 |
| `CHTTLngStrPrac` | 긴 글 연습 |
| `CHTTKeyPrac` | 키 단위 연습 또는 타자 검정 (**[미확인]**) |
| `CHTTPracResultWnd`, `CLngPracResult` | 연습 결과 창, 긴 글 결과 |
| `CHTTGameResultWnd`, `CGameResult`, `CCakeGameResult`, `CSosGameResult` | 게임 결과 창 |
| `CNewTypeDlg`, `CAboutDlg` | 대화상자 |

클래스와 역할의 대응은 이름과 리소스 문자열(§3.3)을 맞춰 본 추론입니다. vtable에서 각 클래스의 메서드를 따라가 확인하지는 않았습니다.

### 3.2 메뉴·화면 구성

- **[관찰]** `HncTT.kor`의 RT_MENU 128은 MFC 마법사가 만드는 기본 메뉴(파일/편집/도움말)입니다. 실제 앱 화면은 이 메뉴가 아니라 이미지로 그린 커스텀 UI로 보입니다. **[추론]**
- **[관찰]** exe에 들어 있는 UI 이미지 경로:
  - 메인 메뉴: `Data\image\taja\mainmenubar.png`, `mainmenu_01~04.png` (영문판은 `_en`)
  - 게임 메뉴: `Data\image\taja\menu_cake.png`, `menu_sos.png`
  - 결과 창: `Data\image\result\window.png`, `button_ok.png`, `button_confirm.png`, `button_cancel.png`
  - 긴 글 점수판: `Data\image\taja\window_score_longtype.png`, `long_typebar_gray.png`, `long_typebar_green.png`
  - 타자 검정 버튼: `Data\image\taja\button_typecheck.png`
  - 케이크 게임: `Data\image\Cake_Image\*` (typing_pad, result_window, result_grade, result_number, gamescore_type 등)
  - SOS 게임: `Data\image\Sea_Image\*` (stage_select, Room_Stage, result_online_grade 등)
- **[추론]** 메인 메뉴는 4칸(`mainmenu_01~04`)이고, 게임은 하위 메뉴(케이크, SOS)로 나뉘는 구조로 보입니다. 4칸에 무엇이 들어가는지는 이미지를 디코드하지 않아 **[미확인]**입니다.
  - 리소스 문자열 후보: "타자 연습"(62037), "타자 검정"(62030), "놀이 점수"(62031), "온라인대전"(62236), "정보 수정"(62036)
- **[관찰]** PNG 경로가 있지만 `Data\image` 폴더는 디스크에 없습니다. **[추론]** 이미지는 `Data\imagepak.dat`(exe에 `Data\imagepak.dat` 문자열 있음)에 묶여 있고, 앱이 경로를 키로 써서 꺼내는 것으로 보입니다. 묶음 파일의 형식은 **[미확인]**입니다.

### 3.3 연습 종류 [관찰: 리소스 문자열, `HncTT.kor` RT_STRING]

| ID | 문자열 |
|---|---|
| 62169 / 62170 | 자리 연습 / 낱말 연습 |
| 62135, 62141 | 긴글 연습 / 긴글 불러오기 |
| 62172–62176 | 자리 연습 결과 / 낱말 연습 결과 / 짧은글 연습 결과 / 긴글 연습 결과 / 타자 검정 결과 |
| 62138 / 62142 | 케이크 던지기 / 해상구조 SOS (게임) |
| 62145 / 62146 | 풍선공격! / 튜브공격! (게임 내 효과) |
| 62228–62231 | 태평양 / 뉴욕 / 북극 / 이집트 (SOS 무대 이름으로 추정 **[추론]**) |
| 62240–62243 | 오븐 / 개수대 / 과자상자 / 냉장고 (케이크 게임 무대로 추정 **[추론]**) |
| 62032–62045 | 한글 / 두벌식 표준 / 두벌식 / 세벌식 390 / 세벌식 순아래 / 세벌식 최종 / 영어 / 쿼티 / 드보락 (자판 종류) |
| 62046–62053, 62202–62209 | 좌·우 소지/약지/중지/검지 (손가락별 통계, `%4d` 형식) |
| 62198 | `자판 : %s    자리연습 : %d단계    낱말 연습 : %d단계` |
| 62171 | 목표 정확도에 미달하여 현재 단계를 다시 연습합니다. |
| 62065 / 62066 | 목표 타수 100–800 / 목표 정확도 80–100 정수 입력 검증 |

연습 데이터 파일 이름도 exe 안에서 확인했습니다 [관찰]:
- `Data\han%d.dat`, `Data\eng%d.dat`
- `Data\wordkor.dat`, `Data\wordeng.dat`
- `Data\shorthan.dat`, `Data\shorteng.dat`
- `Data\titles.dat`, `NewTitles.dat`
- `User.dat`, `UserPracResult.dat`, `UserKeyTypRst.dat`, `LngTypingResult.dat`, `CakeGameResult.dat`, `SosGameResult.dat`

Evidence: `ev_fb3584fb…`

**[추론]** 파일과 연습의 대응은 이렇게 보입니다:
- `han/eng%d` → 자리 연습 단계 (한글 7단계, 영문 10단계)
- `word*` → 낱말 연습
- `short*` → 짧은 글 연습
- `titles` / `NewTitles` → 긴 글 목록 (사용자 추가분 포함)

.dat 파일 내부 형식은 **[미확인]**입니다.

### 3.4 타수·정확도 계산

리소스 문자열 ID를 `push imm32` 바이트로 검색해서(`search_bytes`) 해당 문자열을 쓰는 함수를 찾았습니다.

| 문자열 ID | 일치 주소 → 함수 |
|---|---|
| 62180 `정 확 도 : %d%%` | 0x477fd4 → `FUN_00477c30` |
| 62238 `총 타 수 : %d 타` | 0x477f86 → `FUN_00477c30` |
| 62214 `평균타수 : %d타/분` | `FUN_00435a60`, `FUN_00436ab0` |

Evidence: `ev_161e86f5…`, `ev_8fb7ce5d…`, `ev_a29c3775…`

#### (a) 현재 타수와 정확도 — `FUN_0043b7b0` (Evidence `ev_320a4dd9…`) [관찰: Ghidra 의사코드]

```c
elapsed = timeGetTime() - this->lineStart;           // +0xb8
if (this->field_a8 != 0)
    g_accuracy = ((float)this->field_ac / this->field_a8) * 100.0;   // DAT_007fc084
if (elapsed != 0)
    g_curSpeed = (float)((this->field_b0 * 60000) / elapsed);         // DAT_007fc088
if (g_curSpeed > 999.0) g_curSpeed = 999.0;
// 표시: 0xf30e "현재타수 %d", 0xf30f "목표타수 %d"(사용자 정보 +0x84), 0xf310 "정확도 %d%%"
// 게이지: accuracy/100, 목표타수/800 (각각 1.0으로 상한)
```

- **[관찰]** 타수 = **(카운터 +0xb0) × 60000 ÷ 경과 ms**, 즉 분당 타수이고 상한은 999입니다.
- **[관찰]** 정확도 = **(+0xac) ÷ (+0xa8) × 100**입니다.
- **[추론]** +0xb0, +0xac, +0xa8은 각각 "입력한 타수(한글은 자소/타건 단위일 수 있음)", "맞게 친 수", "전체 비교 수"로 보입니다. 이 필드에 값을 쓰는 곳은 추적하지 않았습니다. 한글 타수를 자모 단위로 세는지 음절 단위로 세는지도 **[미확인]**입니다.
- **[관찰]** 목표 타수 게이지의 분모 800은 리소스의 "100에서 800까지" 검증 문구와 일치합니다.

#### (b) 문장 단위 누적 — `FUN_0043c910` (Evidence `ev_19da6709…`) [관찰]

```c
if (this->best < g_curSpeed) this->best = ftol(g_curSpeed);    // "최고타수 %d" (0xf311)
this->count++;                                                 // +0xc4
progress = count * 100 / 32;                                   // "진행도 %d%%" (0xf312)
g_avgSpeed = ((count-1)*g_avgSpeed + ftol(...)) / count;       // DAT_007fc08c
g_avgAcc   = ((count-1)*g_avgAcc   + ftol(...)) / count;       // DAT_007fc090, "정확도 %d%%"
userStat->avg = (userStat->avg*userStat->n + g_avgSpeed) / ++userStat->n;  // (+0xd8)+0x18/+0x14
```

- **[관찰]** 평균 타수와 평균 정확도는 문장(줄)마다 **누적 이동평균**으로 갱신됩니다.
- **[관찰]** 진행도는 32개 항목 기준입니다.
- **[추론]** `ftol(...)`의 인자는 x87 스택이라 의사코드에 드러나지 않습니다. 각각 `g_curSpeed`(DAT_007fc088)와 `g_accuracy`(DAT_007fc084)로 보입니다.

#### (c) 키별 속도와 종료 판정 — `FUN_0043bc10` (Evidence `ev_014e3232…` 이후 호출부 의사코드) [관찰]

- 키를 누를 때마다 `60000 / (현재 시각 − 이전 키 시각)`로 순간 타수를 계산합니다. 간격이 0이면 600으로 둡니다.
- 46개(0x2e) 키 테이블에서 해당 키를 찾아 키별 평균 속도를 누적합니다.
- 맞은 글자는 1, 틀린 글자는 2로 위치별 표시 배열에 기록합니다.
- 32개(`0x1f < count`)를 마치면 다음을 처리합니다:
  - 전체 소요 시간이 **11초 미만**이면 `save = 0`입니다. 결과 함수는 이때 현재 타수와 정확도 전역값을 0으로 초기화합니다.
  - **평균 정확도 ≥ 70**이면 평균 타수를 100/200/300/400/500 구간으로 나눠 각각 다른 분기에서 사용자 정보 함수(`FUN_0044f4d0`)를 호출하고, 그 뒤 `FUN_0044fb90`을 호출합니다.
  - 마지막으로 `FUN_00477c30(0x20, g_avgSpeed, g_avgAcc, 소요ms, save)`를 호출해 결과 창을 엽니다.
- **[추론]**
  - 이 경로는 진행도와 최고·현재 타수 표시로 볼 때 **짧은 글 연습** 화면으로 보입니다.
  - 100~500 구간 분기는 등급, 배지 또는 기록을 갱신하는 것으로 보이지만 내용은 **[미확인]**입니다.
  - 46키 통계는 `UserKeyTypRst.dat`에 저장되는 것으로 보이지만 저장 경로는 **[미확인]**입니다.

### 3.5 결과 화면 — `FUN_00477c30` (Evidence `ev_014e3232…`) [관찰]

- 결과 제목 문자열 5종(0xf2dc–0xf2e0: 자리/낱말/짧은글/긴글/타자검정 결과)과 다음 문자열을 로드합니다:
  - 0xf31d `%s 님의 연습 결과`, 0xf31e `총 타 수`, 0xf31f `오 타 수`
  - 0xf334 `빠 르 기`, 0xf335 `평균타수`
  - 언어 플래그 `DAT_006e6644 == 10`일 때만 0xf2e4 `정 확 도 : %d%%`와 0xf2e5 `연습시간 : %d분 %d초`. 플래그가 11 또는 12일 때는 ID 0x82/0x84를 로드합니다.
- 화면 모드는 `*(app+0x78)`이 0~3인 4가지 경우로 나뉩니다:
  - 모드 0·1: 이름 + 인자 3개(param_1, param_2, param_3) + 연습 시간
  - 모드 2·3: 이름 + 인자 2개(param_2, param_3) + 연습 시간
  - 모드 3은 사용자 정보를 갱신하는 호출(`FUN_00451060`)을 추가로 합니다.
- 연습 시간은 `ms / 60000`분, `(ms % 60000) / 1000`초로 표시합니다.
- 호출하는 함수는 4개입니다: `0x425590`, `0x42c180`, `0x43bc10`, `0x43ee70`. Evidence `ev_8be5cd42…`
- **[추론]** 호출 함수 4개는 연습 종류별 화면으로 보입니다. `0x43bc10`을 제외한 3개는 내용을 확인하지 않았습니다. **[미확인]**
- **[추론]** `DAT_006e6644`는 UI 언어 코드로 보입니다(10 = 한국어?). **[미확인]**
- **[관찰]** `param_5 == 0`(저장하지 않음)이면 현재 타수·정확도 전역값을 0으로 초기화합니다. `DAT_007fc05c == 1`이면 `FUN_00419df0`을 호출하는데, 이 함수도 같은 전역값을 참조합니다(xref). **[추론]** 온라인 기록 전송이나 파일 저장일 수 있지만 **[미확인]**입니다.

### 3.6 그 밖의 관찰

- **[관찰]** 온라인 기능 문자열이 있습니다:
  - 게임 서버 `tajagame1~10.hancom.co.kr`
  - `http://taja.hancom.co.kr/user_ranking_view.do?id=%ws` 등 웹 페이지 URL
  - 로그인·채널·방 관련 오류 메시지
  - 정적 링크된 OpenSSL과 IOCP 소켓 오류 문자열(`GQCS`)
- **[관찰]** 대화상자 100은 "한컴 타자연습 정보"(SysTabControl32), 즉 정보 창입니다.
- **[관찰]** 리소스에 한컴오피스 2014/2018 사용권 계약서 문자열이 함께 들어 있습니다.

---

## 4. 질문별 답 정리

| 질문 | 상태 | 요약 |
|---|---|---|
| 폴더 구성과 메인 exe | 답함 | `HncTT.exe`가 메인입니다. `.kor`/`.enu`는 언어 리소스 DLL로 추정되고, 데이터·사운드는 `Data\`, 이미지는 `imagepak.dat`에 있습니다. |
| 네이티브인지 .NET인지 | 답함 | 네이티브 x86 MFC 앱입니다(CLI 디렉터리 없음). |
| 메뉴·화면 구성 | 일부만 답함 | 이미지 경로와 문자열로 메인 4칸, 게임 2종, 결과 창 구성을 추정했습니다. 실제 배치와 이미지 내용은 확인하지 못했습니다. |
| 연습 종류 | 답함(추론 포함) | 자리/낱말/짧은 글/긴 글/타자 검정, 게임 2종(케이크 던지기, 해상구조 SOS), 온라인 대전. |
| 타수·정확도 계산 | 일부만 답함 | 공식(분당 타수 = 타 × 60000 / ms, 상한 999; 정확도 = 맞음/전체 × 100; 문장 단위 이동평균)은 확인했습니다. 카운터를 증가시키는 코드와 한글 타수 단위는 확인하지 못했습니다. |
| 결과 화면 | 일부만 답함 | 결과 창 함수, 표시 항목, 저장 조건(11초 미만이면 저장 안 함)을 확인했습니다. 호출 함수 4개 중 3개와 저장 형식은 확인하지 못했습니다. |

## 5. 모르는 것 / 다음에 볼 것

1. 타 카운터(+0xb0, +0xac, +0xa8)를 증가시키는 코드. 한글 조합 중 타수를 어떤 단위로 세는지가 여기서 결정됩니다.
2. `FUN_00477c30`의 나머지 호출 함수 3개(`0x425590`, `0x42c180`, `0x43ee70`)가 어느 연습에 해당하는지, 각 연습의 종료 조건.
3. `CHTTKeyPrac`의 정체.
4. `imagepak.dat`, `UI.Dat`, 연습 데이터 `.dat`, 사용자 결과 `.dat`의 형식.
5. 결과 창 모드 값(`app+0x78`)과 `DAT_006e6644`의 의미.
6. 평균 정확도 70 이상 + 타수 구간 분기(`FUN_0044fb90`)의 내용.

## 6. 주요 Evidence ID

| 내용 | Evidence |
|---|---|
| managed 판별 | `ev_421bf9a2df99e23cf114598c5d851baecb0ecc6d8de46c33534b0efbd1ee8d6a` |
| `.kor` 리소스 | `ev_11dc68353472455766ff1044b820bb4f83411edd48822176b5b4ab0794fb293c` |
| binary overview | `ev_c0a0372ef08b1b8e29c313d1b9e901b610b99a3076035fad37d6d156d764a5e2` |
| `.dat` 문자열 | `ev_fb3584fb39514324005e94539818e72bc2b0aa2724cb69e4fdcae72271e39d56` |
| 클래스·이미지 문자열 | `ev_5584a0e37e9a313bf8093b2563c072d25a02f32e8aab731a22754bb400ec4fa7` |
| 결과 창 의사코드 | `ev_014e323205ac73b7f5f15c1f1728bf239832bc34aad8eb8b846ccd71d70da898` |
| 결과 창 호출 함수 | `ev_8be5cd42d0bc8f8f9e76f288897d9b552b54fd13d3013695cfac31b9c245b4a9` |
| 문장 단위 누적 | `ev_19da67095dd8242fc54f72f86ac359261353e75a1ef15ad79d6ad579fee44740` |
| 현재 타수·정확도 | `ev_320a4dd9d172fd2413566d34ae5433f919e4d0653f9053d6d16c9c77f994eeb5` |

- 대상 SHA-256
  - `HncTT.exe`: `af3ca6a35752ab52580a2f130835d329a96705b443e632bda4bde8856a45a450`
  - `HncTT.kor`: `f816e41e9c84aac61ee0c6300d62af4d3cb53bf8613c0ad35955cfc183e2cbc0`
- 한계:
  - Ghidra 의사코드는 원본 소스가 아닙니다.
  - x87 부동소수 인자는 의사코드에서 일부 생략됩니다.
  - 간접 호출(vtable)로 이어지는 관계는 추적하지 않았습니다. (§7에서 일부 보완)

---

## 7. 추가 분석 (2026-11-07): 타 카운터와 결과 창 호출 함수

범위는 두 질문으로 한정했습니다. `.dat`/`imagepak.dat` 형식은 분석하지 않았고, 앱도 실행하지 않았습니다.

### 7.1 타 카운터: 한글은 **두벌식 키 입력(자모) 단위**로 셉니다

#### (1) 카운터를 쓰는 함수 — `FUN_0043cd40` [관찰]

- §3.4(a)에서 본 세 필드 `+0xac`, `+0xa8`, `+0xb0`에 값을 쓰는 곳을 `mov [reg+0xb0], reg` 바이트 패턴으로 찾았습니다(`0x420000–0x445000` 범위). Evidence `ev_f680b7a6…`
- 이 함수는 증가(inc)가 아니라 **매번 처음부터 다시 계산해서 대입**합니다. Evidence `ev_298d19f6…`
- 유일한 호출 함수는 `FUN_0043bc10`(CHTTStrPrac vtable 슬롯 5, §7.2)입니다. Evidence `ev_8951e252…`

```c
target = this->targetLine->text;   // (+0x84)+0xc0, UTF-16
typed  = this->typedLine->text;    // (+0x88)+0xc0
for (i = 0; i < len(typed); i++) {
    g_kbd->vtbl[0x18](target[i], &nT, keysT);   // 글자 → 키 입력 열로 분해
    g_kbd->vtbl[0x18](typed[i],  &nY, keysY);
    if (nT == nY && keysT == keysY)  { strokes += nT; correct++; }      // 완성된 글자
    else if (i == len(typed)-1)      { /* 마지막(조합 중) 글자: 앞부분 키가 일치하면 */
                                       strokes += min(nT, nY); correct++; }
    total++;
}
this->correct (+0xac) = correct;   // 맞은 글자 수
this->total   (+0xa8) = total;     // 입력한 글자 수
this->strokes (+0xb0) = strokes;   // 맞은 글자의 키 입력 수 합계
```

의사코드에서는 지역 변수가 겹쳐 보여서 `nY`가 누적 변수(`local_68`)와 섞여 나옵니다. 위 코드는 비교 구조를 정리한 것입니다.

#### (2) 분해 함수 — `CKor2Bul::slot6` = `FUN_00412040` [관찰]

- `g_kbd`(DAT_007fc4c0) vtable의 오프셋 0x18(슬롯 6)에 들어갈 함수입니다. `.rdata`의 vtable `0x6a8438` 슬롯 6이 `0x412040`이고, 그 RTTI 이름이 **`CKor2Bul`**입니다. 읽기 전용 PE 파싱 스크립트로 확인했습니다.
- 동작 [관찰] (Evidence `ev_52870fe3…`, `ev_f2af726f…`):
  1. `FUN_0040c710`이 유니코드 음절(U+AC00–D7A3)과 자모를 **조합형 비트(초성 5비트·중성 5비트·종성 5비트)**로 바꿉니다.
  2. 초성·중성·종성마다 **두벌식 키 가상키 코드**를 배열에 하나씩 추가하고 개수를 셉니다.
- 매핑 예시:

| 자모 | 키 코드 | 키 입력 수 |
|---|---|---|
| ㄱ | `0x52`('R') | 1 |
| ㄴ | `0x53`('S') | 1 |
| ㄲ | `0xa052` (상위 비트 = Shift 표시, R) | **1** |
| ㅘ | `0x48` + `0x4b` (H+K) | **2** |
| ㅙ | H+O | 2 |
| 종성 ㄳ | R+T | **2** |
| 종성 ㄶ | S+G | 2 |

- ASCII(< 0x7F)는 100개짜리 키 테이블(`DAT_006e0240`)에서 찾아 1타로 셉니다.

#### (3) 결론

| 항목 | 단위 | 근거 |
|---|---|---|
| **타수(분자 `+0xb0`)** | **두벌식 키 입력 수** = 자모 단위. 겹모음과 겹받침은 키 2개, 쌍자음은 Shift+키 1개로 셈 | [관찰] `FUN_0043cd40` + `CKor2Bul` 분해표 |
| 정확도 | **글자(음절) 단위**: 맞은 글자 ÷ 입력한 글자 × 100. 한 글자의 자모 중 하나라도 틀리면 그 글자 전체가 오답 | [관찰] `+0xac`/`+0xa8`가 글자마다 1씩 더해짐 |
| 조합 중인 마지막 글자 | 목표 글자와 앞부분 키가 일치하는 만큼 타수에 넣음 | [관찰] |

- 예시: "닭"(ㄷ+ㅏ+ㄺ)은 E, K, F, R로 **4타**입니다. "과"(ㄱ+ㅘ)는 R, H, K로 **3타**입니다. [추론: 위 분해표를 적용한 결과]
- **세벌식:** 같은 슬롯 6 구현이 `CKor3BulDn`(`0x413240`), `CKor3Bul390`(`0x4143c0`), `CKor3BulFl`(`0x415610`)에도 있습니다 [관찰: vtable `0x6a8470`/`0x6a84a8`/`0x6a84e0`]. 사용자가 고른 자판에 맞는 객체가 `g_kbd`에 들어가 해당 자판의 키 입력 수로 셀 것으로 보입니다 [추론]. 세벌식 분해표 내용은 열어 보지 않았습니다 **[미확인]**.
- **범위의 한계:** `FUN_0043cd40`은 **짧은 글 연습** 경로에서만 확인했습니다. 자리·낱말·긴 글 연습도 같은 `g_kbd->vtbl[0x18]`을 쓰는지는 함수 단위로 확인하지 않았습니다 **[미확인]**. 다만 `DAT_007fc4c0`이 세 클래스 주소 범위(`0x4235xx`, `0x42bdxx`, `0x43f1xx`)에서도 참조됩니다 [관찰].

### 7.2 결과 창(`FUN_00477c30`)을 호출하는 4개 함수의 정체 [관찰]

- 연습 클래스의 RTTI(TypeDescriptor → CompleteObjectLocator → vtable)를 `.rdata`에서 읽기 전용으로 파싱해 vtable 항목을 뽑았습니다. 세 클래스 모두 **vtable 슬롯 5**가 결과 창 호출 함수입니다.
- `CHTTKeyPrac`은 같은 방법으로 vtable을 찾지 못했습니다 **[미확인]**.

| 호출 함수 | 소속 | 연결 근거 | 연습 |
|---|---|---|---|
| `0x42c180` | `CHTTPosPrac` vtable `0x6ac310` 슬롯 5 | 직접 vtable 항목 | **자리 연습** |
| `0x43ee70` | `CHTTWordPrac` vtable `0x6ad15c` 슬롯 5 | 직접 vtable 항목 | **낱말 연습** |
| `0x43bc10` | `CHTTStrPrac` vtable `0x6ad084` 슬롯 5 | 직접 vtable 항목 | **짧은 글 연습** (§3.4의 추론이 확정됨) |
| `0x425590` | `CHTTLngStrPrac` vtable `0x6aaf08` 슬롯 4 `0x4235e0`이 호출(+`0x424280`도 호출) | Evidence `ev_98efb29f…` | **긴 글 연습** |

vtable 전체 항목:
- `CHTTPosPrac` = {42b550, 42b5f0, 42c0d0, 42c0f0, 42c0e0, **42c180**, 4054f0}
- `CHTTWordPrac` = {43e930, 43ea00, 43ede0, 43ee00, 43ee60, **43ee70**, 4054f0, …}
- `CHTTStrPrac` = {43aee0, 43af80, 43b7a0, 42d810, 43b7b0, **43bc10**, 4054f0, …}
- `CHTTLngStrPrac` = {422c00, 422f60, 4239d0, 4239c0, **4235e0**, 423af0, 4054f0, …}

#### 긴 글 연습 결과 경로 `FUN_00425590` (Evidence `ev_83d8e1b3…`) [관찰]

- 기록 저장 조건: **입력 타수(`+0x68`) > 100이고 소요 시간 > 10초**.
  - 짧은 글은 "32문장 완료 + 11초 이상"으로, 조건이 다릅니다.
- 등급 처리: 정확도 > 70이면 현재 타수(`DAT_007fc088`)를 100/200/300/400/500 구간으로 나눠 `FUN_0044f4d0`와 `FUN_0044fb90`을 호출합니다(짧은 글과 같은 패턴).
- `+0x88 != 0` 분기에서는 정확도를 다음 식으로 다시 계산해 `FUN_004456f0`·`FUN_00445a30`에 넘깁니다.
  ```c
  ((+0x70)+(+0x6c)) / ((+0x74)+(+0x78)) * 100
  ```
  [추론] 이 분기는 **타자 검정** 모드(긴 글로 치르는 검정)로 보이지만 확인하지는 않았습니다 **[미확인]**.
- 결과 창 첫 인자는 `page*5 − 5 + line`(`+0x90`, `+0x94`)입니다. [추론] 지금까지 친 줄 수를 넘기는 것으로 보입니다.

### 7.3 §3·§5 갱신 사항

- §3.4(c)의 "이 경로는 짧은 글 연습으로 보인다"는 **관찰로 확정**됐습니다.
- §3.5 "호출 함수 4개 중 3개 미확인"은 해소됐습니다.
- §5 미해결 목록 1·2번은 위 내용으로 대부분 해소됐습니다. 남은 것:
  - 세벌식 분해표 내용
  - 자리·낱말·긴 글 연습의 타수 단위가 짧은 글과 같은지
  - `CHTTKeyPrac` vtable
  - 긴 글 `+0x88` 분기의 정체

### 7.4 추가 Evidence ID

| 내용 | Evidence |
|---|---|
| `+0xb0` 대입 위치 검색 | `ev_f680b7a61b00d6ad3ff0ccc9bbeb1d1925f328e2e2708bb0b4f8f0ac53c897f8` |
| 카운터 계산 `FUN_0043cd40` | `ev_298d19f6e576d59a14ffae3020520d0040fc7d666b6e8281863f25032d6e6155` |
| `FUN_0043cd40` 호출 함수 | `ev_8951e252a7fdf3c5f777e85a75769716ebf509be51d4935bf3da3b05f9c551cb` |
| 유니코드→조합형 `FUN_0040c710` | `ev_f2af726fb3c14f552ed02835bbd6faf1a0521e6f62b41722c0b11263bf50c6d5` |
| 두벌식 분해 `FUN_00412040` | `ev_52870fe3e85c30074a188619f0991d6492a3d44db0c43b3191f722b2917e3a1a` |
| 긴 글 결과 `FUN_00425590` | `ev_83d8e1b38b34fd5aa5ebed5c3be902ad13f09e693a6bffa8c8241cc121ae8d7a` |
| `FUN_00425590` 호출 함수 | `ev_98efb29fe73d72b96c9e2f9af81987f50f142e913174013dc25f2b7fbf6fc70e` |

- vtable과 RTTI 이름은 REA Evidence가 아닙니다. `HncTT.exe`(SHA-256 `af3ca6a3…`)의 `.rdata`를 읽기 전용 Python 스크립트로 직접 파싱한 결과입니다.

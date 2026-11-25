# DESIGN.md — EngLoop 디자인 시스템

> 모든 화면 작업은 이 문서를 따른다. (PRD.md의 기능 요구사항과 함께 적용)

# 디자인 콘셉트
흑백 패션 매거진 같은 미니멀 에디토리얼 스타일.
색은 거의 쓰지 않고, 큰 타이포그래피·넓은 여백·각진 검정 버튼·가는 선 아이콘으로 고급스러움을 낸다.
사진은 쓰지 않고, 거대한 영어 단어 자체를 히어로 이미지처럼 사용한다.
모바일 세로 화면(360~430px) 기준으로 설계한다.

# 색상 (CSS 변수 + Tailwind theme에 등록)
라이트 모드
--bg: #E9E7E4        (기본 배경, 따뜻한 밝은 회색)
--bg-soft: #F5F4F2   (카드·목록 영역, 오프화이트)
--surface-mid: #D3D2CF (중간 회색 띠 섹션)
--ink: #111111       (본문 글자, 버튼, 검정 띠 섹션 배경)
--ink-muted: #6B6B6B (보조 설명 글자)
--line: #1111111F    (얇은 구분선, 12% 투명도)
--on-ink: #F5F4F2    (검정 배경 위 글자)
--correct: #2F6B45   (정답, 차분한 녹색 — 이 두 색만 예외)
--wrong: #9E3B2F     (오답, 차분한 적갈색)

다크 모드 (prefers-color-scheme: dark, 설정에서 수동 전환도 가능)
--bg: #111111 / --bg-soft: #1A1A1A / --surface-mid: #2A2A2A
--ink: #EDEBE8 / --ink-muted: #9A9A9A / --line: #EDEBE81F
--on-ink: #111111 / --correct: #6FAF85 / --wrong: #D9776A

규칙: 위 색 외에 다른 색(파랑, 보라, 그라데이션 등)은 절대 쓰지 않는다.
그림자는 쓰지 않는다. 구분은 여백과 얇은 선, 배경 톤 차이로만 한다.

# 타이포그래피
- 글꼴: 영문·베트남어는 "Inter", 한국어 "Noto Sans KR", 일본어 "Noto Sans JP",
  중국어 "Noto Sans SC". 현재 언어에 맞게 font-family 순서를 바꾼다.
- 오프라인(PWA)에서도 보이도록 Google Fonts 링크 대신 @fontsource 패키지로 앱에 포함한다.
- 스타일 4가지만 쓴다:
  1. Display: 거대한 영어 단어. font-weight 800, 화면 폭을 거의 채우는 크기
     (clamp(64px, 22vw, 120px)), letter-spacing -0.04em, line-height 0.9.
     긴 단어는 화면에 맞게 자동으로 글자 크기를 줄인다.
  2. Heading: 굵은 대문자 제목 (예: "VOCABULARY"). weight 700, 28~36px,
     letter-spacing -0.01em, line-height 1.0.
  3. Label: 아주 작은 대문자 라벨 (예: "TODAY'S WORD", "LEVEL A2").
     weight 500, 11~12px, letter-spacing 0.25em, 대문자. 라벨 아래에 24px 길이 1px 짧은 밑줄을 둘 수 있다.
  4. Body: 본문·해설. weight 400, 15~16px, line-height 1.6, 색 --ink-muted 또는 --ink.
- 한·중·일 텍스트에는 letter-spacing을 넓히지 않는다(0으로).

# 컴포넌트
- Primary 버튼: 배경 --ink, 글자 --on-ink, 모서리 0 (완전히 각지게),
  높이 48px 이상, 대문자 Label 스타일 글자. 누르면 살짝 투명도 0.85.
- Text 버튼(보조): 배경 없음, 대문자 Label 스타일 + 1px 밑줄 + 오른쪽 화살표 "→".
- 카드: 배경 --bg-soft, 모서리 0, 그림자 없음, 안쪽 여백 20px.
- 아이콘: lucide-react, stroke-width 1.5, 크기 20~22px, 색 --ink.
- 퀴즈 선택지: 높이 56px 이상, 1px --line 테두리, 모서리 0.
  선택 시 배경 --ink + 글자 --on-ink.
  정답은 --correct 테두리 2px + 체크 아이콘, 오답은 --wrong 테두리 2px + X 아이콘.
  (색만으로 구분하지 않고 반드시 아이콘을 함께 표시한다.)
- 진행 막대: 높이 2px, 배경 --line, 채움 --ink.
- 상단 고정 띠: 높이 28px, 배경 --ink, Label 스타일 글자로 "🔥 5 DAY STREAK · 12 / 20 TODAY" 같은 정보 표시.

# 화면별 레이아웃
- 홈:
  1) 상단 띠 (연속 학습일·오늘 진행도)
  2) 헤더: 왼쪽 앱 이름(굵은 대문자 워드마크), 오른쪽 설정 아이콘
  3) 히어로: Label "TODAY'S WORD" → Display 크기로 오늘의 단어 → 아래에 모국어 뜻(Body) → 발음 듣기 Text 버튼.
     히어로 아래 Primary 버튼 "START QUIZ"와 Text 버튼 "LEVEL TEST →"를 나란히.
  4) 검정 띠 섹션(배경 --ink): 세로로 3개 행 — VOCABULARY / GRAMMAR / REVIEW(오답 노트).
     각 행은 큰 대문자 제목 + 한 줄 설명(선택 언어) + "START →" 텍스트 버튼, 행 사이 얇은 구분선.
  5) 통계 줄(배경 --bg-soft): 2×2 격자 — 연속 학습일, 오늘 목표, 정답률, 현재 레벨.
     각 칸은 가는 선 아이콘 + Label + 큰 숫자.
- 퀴즈: 상단 2px 진행 막대 + "QUESTION 3 / 10" Label, 문제 문장은 Heading 크기, 아래 선택지 4개, 하단 고정 Primary 버튼 "CHECK"/"NEXT".
- 해설: 정답 후 화면 아래에서 올라오는 패널(배경 --bg-soft), Label "WHY" + 해설 Body.
- 결과: Display 크기로 점수(예: "8/10"), 아래에 틀린 문제 목록 카드, Primary "REVIEW MISTAKES".
- 온보딩·설정: 넓은 여백, 한 화면에 질문 하나, 큰 Heading + 선택지 목록.

# 여백과 움직임
- 화면 좌우 여백 24px, 섹션 사이 여백 48~64px. 여백을 아끼지 않는다.
- 애니메이션은 짧고 절제되게: 화면 전환 fade 200ms, 패널 slide-up 250ms. 튀는 효과·바운스 금지.
- prefers-reduced-motion이면 애니메이션을 끈다.

# 하지 말 것
- 둥근 모서리, 그림자, 그라데이션, 유리 효과, 이모지 장식(상단 띠의 🔥 하나만 허용)
- 원색 포인트 컬러, 컬러풀한 일러스트
- 한 화면에 글꼴 굵기·크기를 4가지 스타일 이외로 늘리는 것

---

## 구현 메모 (코드와 이 문서를 맞추기 위한 규칙)

- 색·글꼴·타이포 클래스는 `src/index.css`(CSS 변수, `.t-display` `.t-heading` `.t-label` `.t-body`, `.btn-primary` `.btn-text` `.card`)와 `tailwind.config.js`에 정의되어 있다. 새 화면은 이 클래스만 조합해서 만든다.
- Tailwind 설정에서 `borderRadius`와 `boxShadow`는 비워 두어 둥근 모서리·그림자를 쓸 수 없게 했다.
- 다크 모드: `<html data-theme="light|dark">`로 수동 전환. 속성이 없으면 기기 설정을 따른다.
- 화면 문구는 모두 `src/i18n/*.json`으로 번역한다. 영어 모드일 때 디자인 예시 문구(START QUIZ, WHY 등)가 그대로 나온다.
  예외: 홈 검정 띠의 VOCABULARY / GRAMMAR / REVIEW 제목과 ENGLOOP 워드마크는 영어 학습 앱의 디자인 요소로 모든 언어에서 영어로 둔다(아래 설명 줄은 번역).
- 화면 안의 영어 텍스트(문제 문장, 선택지, 오늘의 단어, 영어 제목)에는 `lang="en"`을 붙인다. 그러면 Inter 글꼴과 영문 자간이 적용되고, 한·중·일 문구는 자간 0으로 표시된다.

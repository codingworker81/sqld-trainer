# SQLD 2과목 암기

SQLD 2과목(SQL 문법) 내용을 간격 반복(Leitner)으로 암기하는 개인용 학습 PWA입니다. 서버 없이 브라우저(IndexedDB)에만 학습 기록을 저장하며, Android 스마트폰과 Windows PC 양쪽에 앱처럼 설치해 씁니다.

## 배포 주소

**https://codingworker81.github.io/sqld-trainer/**

`master` 브랜치에 push하면 GitHub Actions가 자동으로 빌드·배포합니다(`.github/workflows/deploy.yml`).

## Android 설치 방법

1. Android Chrome으로 위 주소에 접속합니다.
2. 오른쪽 위 메뉴(⋮) → **"앱 설치"** 또는 **"홈 화면에 추가"**를 누릅니다.
3. 설치 후 홈 화면 아이콘으로 실행하면 주소창 없이 전체 화면으로 열립니다.
4. 한 번 실행한 뒤에는 비행기 모드(오프라인)에서도 사용할 수 있습니다.

## PC(Windows) 설치 방법

1. Chrome 또는 Edge로 위 주소에 접속합니다.
2. 주소창 오른쪽의 설치 아이콘(⊕ 또는 모니터 모양)을 클릭 → **"설치"**를 누릅니다.
3. 설치되면 별도의 앱 창으로 열리고, 시작 메뉴·바탕화면에 바로가기가 생깁니다.

## 업데이트

카드 내용이나 기능이 바뀐 새 버전이 배포되면, 이미 설치된 앱 화면 위쪽에 **"새 버전이 있습니다"** 배너가 뜹니다. **새로고침**을 누르면 즉시 반영됩니다(학습 기록은 그대로 유지됩니다). 배너를 닫아도 다음 방문 시 다시 확인합니다.

## 개발

```bash
npm install
npm run dev       # 개발 서버 (http://localhost:5173/sqld-trainer/)
npm run build     # 타입체크 + 프로덕션 빌드
npm run preview   # 빌드 결과 로컬 미리보기 (PWA/Manifest 확인용)
npm run test      # Vitest
npm run lint      # ESLint
```

## 기술 스택

React 18 · TypeScript(strict) · Vite · Tailwind CSS · React Router(HashRouter) · IndexedDB(Dexie.js) · vite-plugin-pwa · Vitest. 자세한 내용은 [`CLAUDE.md`](./CLAUDE.md)와 [`docs/PRD.md`](./docs/PRD.md)를 참고하세요.

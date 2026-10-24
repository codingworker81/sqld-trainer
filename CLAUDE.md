# SQLD 2과목 암기학습 앱 (sqld-trainer)

## 프로젝트 개요
- SQLD 2과목 SQL 문법을 간격 반복(Leitner 5단계)으로 암기하는 개인용 학습 앱
- 요구사항 원본: docs/PRD.md (기능 ID F-01~F-19, 알고리즘은 6절, 데이터 모델은 8절, 배포는 12절)
- 사용 기기: Android 스마트폰(주 학습), Windows PC(보조) — PWA로 설치해 사용
- 시험일 2026-11-14, P0 마감 2026-10-31

## 기술 스택
- React 18 + TypeScript(strict) + Vite, Tailwind CSS, React Router(HashRouter)
- IndexedDB(Dexie.js), react-markdown + remark-gfm, Prism(SQL 구문 강조), Recharts
- vite-plugin-pwa, Vitest, zod(콘텐츠 검증)
- 배포: GitHub Actions → GitHub Pages
- 서버·백엔드 없음 (F-19 도입 결정 전까지)

## 폴더 구조
- src/content/units.json, src/content/cards/uXX.json, src/content/summaries/uXX.md — 정적 콘텐츠
- src/engine/ — Leitner·세션 구성·숙련도 순수 함수 (UI·DB 의존 금지)
- src/db/ — Dexie 스키마와 저장소 함수
- src/features/<화면>/ — home, units, summary, study, notes, quiz, stats, settings
- src/components/ — 공통 UI
- scripts/validate-content.ts — 콘텐츠 검증

## 명령어
- npm run dev / npm run build / npm run preview
- npm run test (Vitest) / npm run lint
- npm run validate:content (build 전에 자동 실행)

## 규칙
1. 작업 시작 전 docs/PRD.md의 관련 절을 읽고, 해당 기능 ID를 기준으로 구현한다.
2. UI 문구는 한국어로 작성한다. 코드·주석·커밋 메시지는 영어로 작성한다.
3. 모바일(375px) 우선으로 만들고, 1024px 이상에서는 사이드바 레이아웃을 쓴다.
4. 학습 기록은 Dexie로만 저장한다. localStorage는 쓰지 않는다.
5. 카드 id는 절대 바꾸지 않는다. 학습 기록이 id로 연결된다.
6. 날짜는 Asia/Seoul 기준 'YYYY-MM-DD' 문자열로 다룬다.
7. src/engine 로직을 바꾸면 반드시 단위 테스트를 추가·수정한다.
8. 새 라이브러리는 PRD 9절에 없는 경우 추가 전에 이유를 설명하고 확인받는다.
9. 작업을 마치면 lint, test, build를 실행하고 결과와 함께 "완료 확인 사항" 대비 충족 여부를 표로 보고한다.
10. 요청 범위를 넘는 기능은 만들지 말고, 필요하다고 판단되면 제안만 한다.

# Changelog

All notable changes to this project are documented in this file.

## [1.0.0] - 2026-10-25

Initial MVP release.

### Added

- 19개 단원, 420장의 SQLD 2과목(SQL 문법) 학습 카드와 단원별 요약노트
- Leitner 5단계 간격 반복 기반 "오늘의 복습" 세션 (복습 + 신규 카드 배분)
- 7종 카드 유형 학습: definition, predict, cloze, dbms, ox, choice, order
- 홈 화면 진행률 대시보드 (D-day, 전체·함정 숙련도, 연속 학습일, 오늘 학습량)
- 단원 목록 화면 (단원별 숙련도·카드 수 표시, 단원 선택 학습)
- 요약노트 보기 (Markdown, 표·SQL 코드 강조)
- 학습 기록 로컬 저장 (IndexedDB/Dexie), 새로고침·재접속 후에도 유지
- 학습 기록 백업: JSON 내보내기(공유 시트/파일 다운로드)·가져오기(병합) · 초기화
- PWA 설치 지원 (Android 홈 화면, PC 데스크톱 앱), 오프라인 사용, 버전 업데이트 안내
- 라이트/다크/시스템 테마

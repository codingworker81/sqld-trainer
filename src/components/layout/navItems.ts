import type { ComponentType, SVGProps } from 'react';
import { HomeIcon, UnitsIcon, NotesIcon, StatsIcon, SettingsIcon } from './icons';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

// 하단 탭 4개 (홈, 단원, 노트, 통계) — 설정은 홈 화면 우측 상단 아이콘으로 별도 진입
export const bottomTabItems: NavItem[] = [
  { to: '/', label: '홈', icon: HomeIcon },
  { to: '/units', label: '단원', icon: UnitsIcon },
  { to: '/notes', label: '노트', icon: NotesIcon },
  { to: '/stats', label: '통계', icon: StatsIcon },
];

// 사이드바(1024px 이상) = 하단 탭과 같은 메뉴 + 설정
export const sidebarItems: NavItem[] = [...bottomTabItems, { to: '/settings', label: '설정', icon: SettingsIcon }];

import { NavLink } from 'react-router-dom';
import { bottomTabItems } from './navItems';

export function BottomTabBar() {
  return (
    <nav
      aria-label="주요 메뉴"
      className="safe-bottom safe-left safe-right fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-900/95"
    >
      <ul className="mx-auto flex max-w-[640px] justify-around">
        {bottomTabItems.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex min-h-11 flex-col items-center justify-center gap-0.5 py-2 text-xs ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`
              }
            >
              <Icon className="h-6 w-6" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

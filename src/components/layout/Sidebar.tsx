import { NavLink } from 'react-router-dom';
import { sidebarItems } from './navItems';

export function Sidebar() {
  return (
    <aside
      aria-label="주요 메뉴"
      className="safe-top safe-left hidden w-60 shrink-0 border-r border-slate-200 lg:flex lg:flex-col dark:border-slate-800"
    >
      <div className="px-6 py-6 text-lg font-bold">SQLD 2과목 암기</div>
      <ul className="flex flex-col gap-1 px-3">
        {sidebarItems.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
}

import { Link } from 'react-router-dom';
import { SettingsIcon } from '../../components/layout/icons';

export default function HomePage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">홈</h1>
        <Link
          to="/settings"
          aria-label="설정"
          className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <SettingsIcon className="h-6 w-6" />
        </Link>
      </div>
      <p className="mt-4 text-slate-600 dark:text-slate-300">
        D-day, 오늘의 복습, 숙련도 등은 이후 Stage에서 채워집니다.
      </p>
    </div>
  );
}

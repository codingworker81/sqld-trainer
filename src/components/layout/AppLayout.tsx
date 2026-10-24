import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomTabBar } from './BottomTabBar';

export function AppLayout() {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-h-dvh flex-1 flex-col">
        <main className="safe-top flex-1 pb-24 lg:pb-6">
          <div className="mx-auto w-full px-4 py-6 sm:max-w-[640px] lg:max-w-[768px]">
            <Outlet />
          </div>
        </main>
        <BottomTabBar />
      </div>
    </div>
  );
}

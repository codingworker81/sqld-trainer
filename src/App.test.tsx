import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './app/ThemeProvider';

function renderApp() {
  return render(
    <ThemeProvider>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </HashRouter>
    </ThemeProvider>,
  );
}

afterEach(() => {
  cleanup();
  window.location.hash = '';
});

describe('App routing', () => {
  it('renders the home page by default', () => {
    renderApp();
    expect(screen.getByRole('heading', { name: '홈' })).toBeInTheDocument();
  });

  it('opens the stats page directly from a hash URL', () => {
    window.location.hash = '#/stats';
    renderApp();
    expect(screen.getByRole('heading', { name: '통계' })).toBeInTheDocument();
  });

  it('navigates between bottom tabs', () => {
    renderApp();
    const unitsLinks = screen.getAllByRole('link', { name: /단원/ });
    fireEvent.click(unitsLinks[0]);
    expect(screen.getByRole('heading', { name: '단원 목록' })).toBeInTheDocument();
  });
});

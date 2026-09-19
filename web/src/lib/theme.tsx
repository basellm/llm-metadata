import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'light' | 'dark' | 'system';

/** 过渡起点（视口坐标，通常为触发按钮中心） */
export interface ThemeOrigin {
  x: number;
  y: number;
}

/** 与 index.html 防闪烁脚本保持一致 */
const STORAGE_KEY = 'llm-metadata.theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const TRANSITION_MS = 450;

function readStoredTheme(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
  } catch {
    return 'system';
  }
}

function resolveDark(theme: Theme): boolean {
  return theme === 'dark' || (theme === 'system' && window.matchMedia(DARK_QUERY).matches);
}

function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', resolveDark(theme));
}

/**
 * 以圆形揭示过渡切换主题（View Transitions API，思路来自 Magic UI AnimatedThemeToggler）：
 * 新主题从起点向外扩散覆盖旧主题。浏览器不支持、用户偏好减少动态效果或未提供起点时直接切换。
 * 坐标使用百分比：Chrome 在非整数缩放下会对 ::view-transition-new(root) 的像素 clip-path 缩放错误。
 */
function transitionTheme(apply: () => void, origin: ThemeOrigin | undefined): void {
  if (
    !origin ||
    typeof document.startViewTransition !== 'function' ||
    window.matchMedia(REDUCED_MOTION_QUERY).matches
  ) {
    apply();
    return;
  }
  const { innerWidth: width, innerHeight: height } = window;
  const radius = Math.hypot(
    Math.max(origin.x, width - origin.x),
    Math.max(origin.y, height - origin.y),
  );
  const at = `${(origin.x / width) * 100}% ${(origin.y / height) * 100}%`;
  // circle() 的百分比半径相对 hypot(w, h) / √2 解析
  const end = `${(radius / (Math.hypot(width, height) / Math.SQRT2)) * 100}%`;

  const transition = document.startViewTransition(() => flushSync(apply));
  transition.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0% at ${at})`, `circle(${end} at ${at})`] },
        {
          duration: TRANSITION_MS,
          easing: 'ease-in-out',
          fill: 'forwards',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    })
    .catch(() => {
      // 过渡被跳过或中断时主题已切换，无需处理
    });
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme, origin?: ThemeOrigin) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);

  // 应用主题；跟随系统时响应系统级切换
  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return;
    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme, origin?: ThemeOrigin) => {
    // 实际明暗不变（如系统已是深色时选择“深色”）则无需过渡
    const changes = resolveDark(next) !== document.documentElement.classList.contains('dark');
    transitionTheme(
      () => {
        applyTheme(next);
        setThemeState(next);
      },
      changes ? origin : undefined,
    );
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 存储不可用时仅在当前会话生效
    }
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

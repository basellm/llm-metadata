import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';

import App from './App';
import { TooltipProvider } from './components/ui/tooltip';
import { I18nProvider } from './lib/i18n';
import { ThemeProvider } from './lib/theme';
import './index.css';

// reducedMotion="user"：系统开启“减少动态效果”时，所有 motion 驱动的位移/缩放动画退化为即时切换
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <I18nProvider>
          <TooltipProvider>
            <App />
          </TooltipProvider>
        </I18nProvider>
      </ThemeProvider>
    </MotionConfig>
  </StrictMode>,
);

# Stylesheet Performance Optimization Plan

## Current Issues Identified

Based on the analysis of your application, here are the stylesheet loading bottlenecks:

### 1. **External Font Loading (Google Fonts)**
- **Issue**: Loading Inter font from Google Fonts CDN (blocking render)
- **Location**: `app/root.tsx` lines 59-70
- **Impact**: Network latency + DNS lookup + download time

### 2. **Multiple Stylesheet Imports**
Currently loading 4 separate stylesheets:
- `reactToastifyStyles` - React Toastify CSS
- `tailwindReset` - UnoCSS Tailwind reset
- `globalStyles` - Main SCSS file (which imports 8+ sub-files)
- `xtermStyles` - Terminal CSS

### 3. **SCSS Import Chain**
`app/styles/index.scss` imports multiple files:
```scss
@use 'variables.scss';
@use 'z-index.scss';
@use 'animations.scss';
@use 'components/terminal.scss';
@use 'components/resize-handle.scss';
@use 'components/code.scss';
@use 'components/editor.scss';
@use 'components/toast.scss';
```

### 4. **UnoCSS Runtime Generation**
- Using `virtual:uno.css` which generates CSS at runtime
- Large safelist in `uno.config.ts` (all custom icons)

## Optimization Strategies

### Priority 1: Self-Host Google Fonts ⚡
**Impact**: High | **Effort**: Low

Replace Google Fonts CDN with self-hosted fonts to eliminate external network requests.

**Implementation**:
1. Download Inter font files (woff2 format)
2. Add to `public/fonts/` directory
3. Update `root.tsx` to use local font files
4. Add `font-display: swap` for better perceived performance

### Priority 2: Inline Critical CSS 🎯
**Impact**: High | **Effort**: Medium

Inline critical CSS in the HTML head to prevent render-blocking.

**Implementation**:
1. Extract critical CSS for above-the-fold content
2. Inline in `<Head>` component
3. Lazy-load non-critical stylesheets

### Priority 3: Optimize SCSS Compilation 🔧
**Impact**: Medium | **Effort**: Low

**Current**: SCSS files are compiled at build time but loaded as separate chunks
**Solution**: 
- Enable CSS minification in production
- Use CSS modules for component-specific styles
- Consider migrating to UnoCSS utilities where possible

### Priority 4: Preload Key Resources 📦
**Impact**: Medium | **Effort**: Low

Add resource hints to improve loading:
```tsx
{ rel: 'preload', href: globalStyles, as: 'style' }
{ rel: 'preload', href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' }
```

### Priority 5: Code Splitting for Vendor CSS 📊
**Impact**: Medium | **Effort**: Medium

Split vendor CSS (react-toastify, xterm) from application CSS:
- Load only when components are used
- Use dynamic imports for heavy components

### Priority 6: Optimize UnoCSS Configuration ⚙️
**Impact**: Low-Medium | **Effort**: Low

**Current Issues**:
- Large safelist with all custom icons
- Runtime CSS generation overhead

**Solutions**:
1. Use `extractorSvelte` or similar to auto-detect used classes
2. Remove unused icons from safelist
3. Enable CSS extraction in production build

## Recommended Implementation Order

### Phase 1: Quick Wins (1-2 hours)
1. ✅ Self-host Inter font
2. ✅ Add preload hints for critical resources
3. ✅ Enable CSS minification in production

### Phase 2: Medium Optimizations (2-4 hours)
4. ✅ Inline critical CSS
5. ✅ Optimize UnoCSS safelist
6. ✅ Add font-display: swap

### Phase 3: Advanced Optimizations (4-8 hours)
7. ✅ Implement CSS code splitting
8. ✅ Migrate common styles to UnoCSS utilities
9. ✅ Lazy-load vendor CSS

## Expected Performance Improvements

- **First Contentful Paint (FCP)**: -200-400ms
- **Largest Contentful Paint (LCP)**: -300-500ms
- **Time to Interactive (TTI)**: -400-600ms
- **Total Blocking Time (TBT)**: -100-200ms

## Monitoring

After implementation, measure:
1. Lighthouse performance score
2. Network waterfall in DevTools
3. CSS file sizes (before/after)
4. Time to first render

## Next Steps

Would you like me to implement these optimizations? I recommend starting with Phase 1 (quick wins) which will provide immediate improvements with minimal risk.

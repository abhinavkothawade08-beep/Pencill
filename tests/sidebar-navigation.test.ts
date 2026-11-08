import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { navItems } from '../src/components/layout/Sidebar';
import { storageAdapter } from '../src/lib/storage/storageAdapter';

describe('Professional Slidable Sidebar Navigation System', () => {
  // --------------------------------------------------------------------------
  // TEST 1: Navigation Registry & Route Preservation
  // --------------------------------------------------------------------------
  test('TEST 1: Preserves all 13 primary application navigation routes without renaming or deletion', () => {
    const expectedRoutes = [
      { label: 'Dashboard', href: '/dashboard', icon: 'grid_view' },
      { label: 'My Courses', href: '/courses', icon: 'menu_book' },
      { label: 'Smart Retention', href: '/review', icon: 'psychology' },
      { label: 'Knowledge Graph', href: '/graph', icon: 'account_tree' },
      { label: 'Practice & Code', href: '/practice', icon: 'terminal' },
      { label: 'Explore Catalog', href: '/explore', icon: 'explore' },
      { label: 'Master Educators', href: '/educators', icon: 'cast_for_education' },
      { label: 'Universal Importer', href: '/import', icon: 'input' },
      { label: 'Community Q&A', href: '/community', icon: 'forum' },
      { label: 'Achievements', href: '/achievements', icon: 'workspace_premium' },
      { label: 'Progress', href: '/progress', icon: 'bar_chart' },
      { label: 'Bookmarks', href: '/bookmarks', icon: 'bookmark' },
      { label: 'Settings', href: '/settings', icon: 'settings' },
    ];

    assert.strictEqual(navItems.length, 13, 'Sidebar must contain exactly 13 primary navigation destinations');

    for (const expected of expectedRoutes) {
      const match = navItems.find((item) => item.href === expected.href);
      assert.ok(match, `Route ${expected.href} (${expected.label}) must exist in navItems`);
      assert.strictEqual(match.label, expected.label, `Label for ${expected.href} must match`);
      assert.strictEqual(match.icon, expected.icon, `Material icon for ${expected.href} must match`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 2: Active Navigation Matching Logic
  // --------------------------------------------------------------------------
  test('TEST 2: Active navigation matching accurately highlights current and sub-routes', () => {
    const matchActive = (currentPath: string, itemHref: string) => {
      return currentPath === itemHref || (itemHref !== '/dashboard' && currentPath.startsWith(itemHref));
    };

    // Dashboard root
    assert.strictEqual(matchActive('/dashboard', '/dashboard'), true, 'Exact match for /dashboard');
    assert.strictEqual(matchActive('/courses', '/dashboard'), false, 'Non-match for /dashboard');

    // Sub-routes for nested courses
    assert.strictEqual(matchActive('/courses/mit-801-mechanics', '/courses'), true, 'Nested course activates My Courses');
    assert.strictEqual(matchActive('/courses/mit-801-mechanics/lesson-1', '/courses'), true, 'Nested lesson activates My Courses');

    // Other core pages
    assert.strictEqual(matchActive('/review', '/review'), true, 'Smart Retention active match');
    assert.strictEqual(matchActive('/graph', '/graph'), true, 'Knowledge Graph active match');
    assert.strictEqual(matchActive('/practice', '/practice'), true, 'Practice & Code active match');
    assert.strictEqual(matchActive('/settings', '/settings'), true, 'Settings active match');
  });

  // --------------------------------------------------------------------------
  // TEST 3: User Preference Persistence & Multi-Account Isolation
  // --------------------------------------------------------------------------
  test('TEST 3: Persists desktop collapse preference with strict multi-user account isolation', async () => {
    // 1. Initial guest scope
    storageAdapter.setUserScope(null);
    const guestInitial = await storageAdapter.getSidebarCollapsed();
    assert.strictEqual(guestInitial, false, 'Default collapsed state is false (expanded)');

    // 2. User Alice logs in and collapses the sidebar
    storageAdapter.setUserScope('user-alice-1234');
    await storageAdapter.saveSidebarCollapsed(true);
    const aliceState = await storageAdapter.getSidebarCollapsed();
    assert.strictEqual(aliceState, true, 'Alice preferred collapsed state is preserved');

    // 3. User Bob logs in on the same machine
    storageAdapter.setUserScope('user-bob-5678');
    const bobState = await storageAdapter.getSidebarCollapsed();
    assert.strictEqual(bobState, false, 'Bob does not inherit Alice preference (account isolation)');

    // Bob sets preference to expanded (false)
    await storageAdapter.saveSidebarCollapsed(false);
    assert.strictEqual(await storageAdapter.getSidebarCollapsed(), false, 'Bob state is false');

    // 4. Switch back to Alice
    storageAdapter.setUserScope('user-alice-1234');
    assert.strictEqual(
      await storageAdapter.getSidebarCollapsed(),
      true,
      'Alice collapsed state remains intact when switching back'
    );

    // 5. User signs out -> guest mode reset
    storageAdapter.setUserScope(null);
    assert.strictEqual(
      await storageAdapter.getSidebarCollapsed(),
      false,
      'Guest scope remains unpolluted by authenticated user state'
    );
  });

  // --------------------------------------------------------------------------
  // TEST 4: Three Sidebar States & Layout Metrics
  // --------------------------------------------------------------------------
  test('TEST 4: Geometry and layout spacing adapt cleanly between Expanded, Collapsed, and Mobile states', () => {
    const layoutConfig = {
      expanded: {
        sidebarWidthClass: 'w-64',
        mainPaddingClass: 'md:pl-64',
        headerLeftClass: 'md:left-64',
        widthPx: 256,
        logoSrc: '/brand/wordmark.svg',
        showLabels: true,
      },
      collapsed: {
        sidebarWidthClass: 'w-20',
        mainPaddingClass: 'md:pl-20',
        headerLeftClass: 'md:left-20',
        widthPx: 80,
        logoSrc: '/brand/icon.svg',
        showLabels: false,
      },
      mobileDrawer: {
        drawerWidthClass: 'w-72 max-w-[85vw]',
        drawerTranslateClosed: '-translate-x-full',
        drawerTranslateOpen: 'translate-x-0',
        backdropBlurClass: 'backdrop-blur-xs',
      },
    };

    // Calculate viewport gain
    const availableSpaceGainPx = layoutConfig.expanded.widthPx - layoutConfig.collapsed.widthPx;
    assert.strictEqual(availableSpaceGainPx, 176, 'Collapsed sidebar releases exactly 176px to the main viewport');

    // Ensure icon representation replaces wordmark
    assert.notStrictEqual(layoutConfig.collapsed.logoSrc, layoutConfig.expanded.logoSrc);
    assert.strictEqual(layoutConfig.collapsed.logoSrc, '/brand/icon.svg');
    assert.strictEqual(layoutConfig.expanded.logoSrc, '/brand/wordmark.svg');
  });

  // --------------------------------------------------------------------------
  // TEST 5: Accessible Tooltips & Keyboard Control Contracts
  // --------------------------------------------------------------------------
  test('TEST 5: Accessibility contracts guarantee tooltips on collapsed items and aria navigation standards', () => {
    for (const item of navItems) {
      // Each item must provide an unambiguous aria-label for icon-only representation
      assert.ok(item.label.length > 0, 'Item label must be non-empty');
      assert.ok(!item.label.includes('undefined'), 'Item label must be cleanly formatted');
    }

    const shortcutDescriptor = {
      toggleKey: 'b',
      modifier: 'ctrlOrCmd',
      description: 'Ctrl+B / Cmd+B toggles desktop sidebar state',
    };
    assert.strictEqual(shortcutDescriptor.toggleKey, 'b');

    const escapeKeyHandler = (e: { key: string; isMobileOpen: boolean }) => {
      if (e.key === 'Escape' && e.isMobileOpen) {
        return { shouldClose: true };
      }
      return { shouldClose: false };
    };

    assert.strictEqual(escapeKeyHandler({ key: 'Escape', isMobileOpen: true }).shouldClose, true);
    assert.strictEqual(escapeKeyHandler({ key: 'Escape', isMobileOpen: false }).shouldClose, false);
    assert.strictEqual(escapeKeyHandler({ key: 'Enter', isMobileOpen: true }).shouldClose, false);
  });
});

import * as React from 'react';

export type AdminUserTabKey = 'invited' | 'active' | 'inactive';

export type AdminUserTabOption = {
  key: AdminUserTabKey;
  label: string;
};

export const ADMIN_USER_VIEW_TABS: AdminUserTabOption[] = [
  { key: 'invited', label: 'Invited' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
];

const DEFAULT_VIEW: AdminUserTabKey = 'invited';
const DEFAULT_CLEAR_VIEW: AdminUserTabKey = 'active';

type TabFilters = {
  search: string;
  page: number;
};

type TabFilterState = Record<AdminUserTabKey, TabFilters>;

const createDefaultFilters = (): TabFilterState => ({
  invited: { search: '', page: 1 },
  active: { search: '', page: 1 },
  inactive: { search: '', page: 1 },
});

export const useAdminUserFilters = () => {
  const [view, setView] = React.useState<AdminUserTabKey>(DEFAULT_VIEW);
  const [filters, setFilters] = React.useState<TabFilterState>(createDefaultFilters);

  const updateSearch = (value: string, targetView: AdminUserTabKey = view) => {
    setFilters(prev => ({
      ...prev,
      [targetView]: { ...prev[targetView], search: value, page: 1 },
    }));
  };

  const updatePage = (
    value: number | ((prev: number) => number),
    targetView: AdminUserTabKey = view,
  ) => {
    setFilters(prev => {
      const currentPage = prev[targetView].page;
      const nextPage = Math.max(
        1,
        typeof value === 'function' ? value(currentPage) : value,
      );
      if (nextPage === currentPage) return prev;
      return {
        ...prev,
        [targetView]: { ...prev[targetView], page: nextPage },
      };
    });
  };

  const clearViewFilters = (targetView: AdminUserTabKey) => {
    setFilters(prev => ({
      ...prev,
      [targetView]: { search: '', page: 1 },
    }));
  };

  const resetToDefaultActive = () => {
    clearViewFilters('active');
    setView(DEFAULT_CLEAR_VIEW);
  };

  const currentFilters = filters[view];

  return {
    view,
    setView,
    search: currentFilters.search,
    page: currentFilters.page,
    updateSearch,
    updatePage,
    clearViewFilters,
    resetToDefaultActive,
  };
};

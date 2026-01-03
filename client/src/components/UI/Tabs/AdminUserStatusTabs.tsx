import React, { useRef } from 'react';
import { ADMIN_USER_VIEW_TABS, AdminUserTabKey, AdminUserTabOption } from '../../../pages/Admin/UserManagement/state';

interface AdminUserStatusTabsProps {
  value: AdminUserTabKey;
  onChange: (next: AdminUserTabKey) => void;
  tabs?: AdminUserTabOption[];
}

const AdminUserStatusTabs: React.FC<AdminUserStatusTabsProps> = ({
  value,
  onChange,
  tabs = ADMIN_USER_VIEW_TABS,
}) => {
  const tabRefs = useRef<Record<AdminUserTabKey, HTMLButtonElement | null>>({
    invited: null,
    active: null,
    inactive: null,
  });

  const focusTab = (key: AdminUserTabKey) => {
    const target = tabRefs.current[key];
    target?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const currentIndex = tabs.findIndex(tab => tab.key === value);
    if (currentIndex === -1) return;
    const offset = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (currentIndex + offset + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    onChange(nextTab.key);
    focusTab(nextTab.key);
  };

  return (
    <div className="admin-tabs" role="tablist" aria-label="User status views" onKeyDown={handleKeyDown}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={value === tab.key}
          className={`tab-btn ${value === tab.key ? 'active' : ''}`}
          onClick={() => onChange(tab.key)}
          ref={el => {
            tabRefs.current[tab.key] = el;
          }}
        >
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default AdminUserStatusTabs;

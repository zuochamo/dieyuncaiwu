import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface TabItem {
  key: string;
  title: string;
  closable: boolean;
}

interface TabsContextType {
  tabs: TabItem[];
  activeKey: string;
  addTab: (key: string, title: string, closable?: boolean) => void;
  removeTab: (key: string) => string;
  setActiveKey: (key: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabs must be used within TabsProvider');
  }
  return context;
};

const pageTitles: Record<string, string> = {
  '/dashboard': '工作台',
  '/customer': '客户管理',
  '/finance': '财务模块',
  '/voucher': '凭证列表',
  '/invoice': '发票管理',
  '/tax': '税务管理',
  '/compliance': '合规管理',
};

export const getPageTitle = (path: string): string => {
  if (pageTitles[path]) return pageTitles[path];
  for (const [key, title] of Object.entries(pageTitles)) {
    if (path.startsWith(key + '/') || path === key) return title;
  }
  const parts = path.split('/');
  return parts[parts.length - 1] || '未命名';
};

type Channel = 'home' | 'customer' | 'finance' | 'tax' | 'compliance';

const channelDefaultPaths: Record<Channel, string> = {
  home: '/dashboard',
  customer: '/customer',
  finance: '/finance',
  tax: '/tax',
  compliance: '/compliance',
};

export function getChannelForPath(pathname: string): Channel {
  if (pathname.startsWith('/customer')) return 'customer';
  if (pathname.startsWith('/finance') || pathname.startsWith('/invoice') || pathname.startsWith('/voucher') || pathname.startsWith('/report') || pathname.startsWith('/asset') || pathname.startsWith('/inventory') || pathname.startsWith('/settings')) return 'finance';
  if (pathname.startsWith('/tax')) return 'tax';
  if (pathname.startsWith('/compliance')) return 'compliance';
  return 'home';
}

interface TabsProviderProps {
  children: ReactNode;
}

export const TabsProvider: React.FC<TabsProviderProps> = ({ children }) => {
  const [tabs, setTabs] = useState<TabItem[]>([
    { key: '/dashboard', title: '工作台', closable: false },
  ]);
  const [activeKey, setActiveKey] = useState('/dashboard');

  const addTab = useCallback((key: string, title?: string, closable = true) => {
    const tabTitle = title || getPageTitle(key);
    setTabs(prev => {
      if (prev.find(t => t.key === key)) {
        setActiveKey(key);
        return prev;
      }
      return [...prev, { key, title: tabTitle, closable }];
    });
    setActiveKey(key);
  }, []);

  const removeTab = useCallback((key: string): string => {
    let nextKey = '';
    setTabs(prev => {
      const newTabs = prev.filter(t => t.key !== key);
      if (newTabs.length === 0) return prev;

      if (activeKey === key) {
        const closedChannel = getChannelForPath(key);
        const sameChannelTab = newTabs.find(t => getChannelForPath(t.key) === closedChannel);
        if (sameChannelTab) {
          nextKey = sameChannelTab.key;
        } else {
          nextKey = channelDefaultPaths[closedChannel];
        }
        setActiveKey(nextKey);
      } else {
        nextKey = activeKey;
      }
      return newTabs;
    });
    return nextKey;
  }, [activeKey]);

  return (
    <TabsContext.Provider value={{ tabs, activeKey, addTab, removeTab, setActiveKey }}>
      {children}
    </TabsContext.Provider>
  );
};

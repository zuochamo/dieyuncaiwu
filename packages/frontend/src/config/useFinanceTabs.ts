import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TabItem, tabConfig } from './financeTabConfig';

/**
 * 标签页管理 Hook
 * 负责标签页的创建、切换、关闭逻辑
 */
export function useFinanceTabs() {
  const navigate = useNavigate();
  const location = useLocation();

  const [tabs, setTabs] = useState<TabItem[]>([
    { key: '/home', title: '账套首页', closable: false },
  ]);
  const [activeKey, setActiveKey] = useState('/home');

  // 路由变化时自动添加标签页
  useEffect(() => {
    const path = location.pathname;
    // 首次加载 /finance.html 或根路径时，重定向到首页，不创建标签
    if (path === '/' || path === '' || path === '/finance.html') {
      navigate('/home', { replace: true });
      return;
    }
    // 首页不需要重复添加标签
    if (path === '/home') {
      setActiveKey(path);
      return;
    }
    setTabs(prev => {
      const existing = prev.find(t => t.key === path);
      if (!existing) {
        const config = tabConfig[path] || { title: path.split('/').pop() || '页面' };
        return [...prev, { key: path, title: config.title, closable: true }];
      }
      return prev;
    });
    setActiveKey(path);
  }, [location.pathname, navigate]);

  // 标签页切换
  const handleTabChange = (key: string) => {
    setActiveKey(key);
    navigate(key);
  };

  // 关闭标签页
  const handleTabClose = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length <= 1) return;

    const newTabs = tabs.filter(t => t.key !== key);
    setTabs(newTabs);

    if (activeKey === key) {
      const closedIndex = tabs.findIndex(t => t.key === key);
      const nextTab = newTabs[closedIndex - 1] || newTabs[closedIndex];
      if (nextTab) {
        setActiveKey(nextTab.key);
        navigate(nextTab.key);
      }
    }
  };

  // 支持页面通过事件更新/关闭标签（用于 finance.html 下的自建路由）
  useEffect(() => {
    const onUpdateTitle = (evt: Event) => {
      const e = evt as CustomEvent<{ key: string; title: string }>;
      const key = e.detail?.key;
      const title = e.detail?.title;
      if (!key || !title) return;
      setTabs(prev => prev.map(t => (t.key === key ? { ...t, title } : t)));
    };
    const onClose = (evt: Event) => {
      const e = evt as CustomEvent<{ key: string; fallbackKey?: string }>;
      const key = e.detail?.key;
      const fallbackKey = e.detail?.fallbackKey || '/voucher';
      if (!key) return;

      setTabs(prev => {
        const exists = prev.some(t => t.key === key);
        if (!exists) return prev;
        const newTabs = prev.filter(t => t.key !== key);

        // 如果关闭的是当前激活 tab，跳转到 fallback（若 fallback 不在 tabs 列表里，仍可正常 navigate）
        if (activeKey === key) {
          setActiveKey(fallbackKey);
          navigate(fallbackKey);
        }
        return newTabs.length > 0 ? newTabs : [{ key: '/home', title: '账套首页', closable: false }];
      });
    };

    window.addEventListener('finance-tabs:update-title', onUpdateTitle as any);
    window.addEventListener('finance-tabs:close', onClose as any);
    return () => {
      window.removeEventListener('finance-tabs:update-title', onUpdateTitle as any);
      window.removeEventListener('finance-tabs:close', onClose as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, navigate]);

  return { tabs, activeKey, handleTabChange, handleTabClose };
}

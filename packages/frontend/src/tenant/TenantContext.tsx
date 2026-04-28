import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api from '../api';

export interface Tenant {
  id: string;
  name: string;
  industryType?: string;
  startPeriod?: string;
  status?: string;
  createdAt?: string;
}

interface TenantContextValue {
  allTenants: Tenant[];
  activeTenants: Tenant[];
  loading: boolean;
  tenantId: string | null;
  setTenantId: (id: string) => void;
  refreshTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | null>(null);

const STORAGE_KEY = 'accounting.tenantId';

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [tenantId, setTenantIdState] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const tenantIdRef = useRef(tenantId);
  const retryRef = useRef<{ timer: number | null; count: number }>({ timer: null, count: 0 });

  // 保持 ref 同步
  useEffect(() => {
    tenantIdRef.current = tenantId;
  }, [tenantId]);

  const refreshTenants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tenant');
      const list = Array.isArray(res) ? (res as Tenant[]) : [];
      setAllTenants(list);
      retryRef.current.count = 0;

      // 初始化默认租户
      const currentId = tenantIdRef.current;
      if (!currentId || !list.some(t => t.id === currentId)) {
        const next = list.find(t => t.status === 'active')?.id || null;
        if (next) {
          localStorage.setItem(STORAGE_KEY, next);
          setTenantIdState(next);
        }
      }
    } catch (e) {
      console.error('获取客户列表失败', e);

      // 连接类错误时做有限次数重试（解决“后端晚启动/短暂抖动”导致客户列表空白）
      const anyErr = e as any;
      const msg = String(anyErr?.message || '');
      const isConnLike =
        msg.includes('ECONNREFUSED') ||
        msg.includes('Network Error') ||
        msg.includes('Failed to fetch') ||
        msg.includes('timeout');

      if (isConnLike && retryRef.current.count < 5) {
        retryRef.current.count += 1;
        const delay = Math.min(2000 * retryRef.current.count, 8000);
        if (retryRef.current.timer) window.clearTimeout(retryRef.current.timer);
        retryRef.current.timer = window.setTimeout(() => {
          refreshTenants();
        }, delay);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTenants();
  }, [refreshTenants]);

  useEffect(() => {
    return () => {
      if (retryRef.current.timer) window.clearTimeout(retryRef.current.timer);
    };
  }, []);

  const setTenantId = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setTenantIdState(id);
  }, []);

  const activeTenants = useMemo(() => allTenants.filter(t => t.status === 'active'), [allTenants]);

  const value = useMemo<TenantContextValue>(
    () => ({ allTenants, activeTenants, loading, tenantId, setTenantId, refreshTenants }),
    [allTenants, activeTenants, loading, tenantId, setTenantId, refreshTenants],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
}

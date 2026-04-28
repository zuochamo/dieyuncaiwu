import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

/* ─── Logo SVG ─────────────────────────────────────────── */
const CloudLogo: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cloudGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4FC3F7" />
        <stop offset="100%" stopColor="#0288D1" />
      </linearGradient>
    </defs>
    {/* 云朵主体 */}
    <path
      d="M38 32H14a8 8 0 1 1 1.6-15.84A10 10 0 0 1 36 22a6 6 0 0 1 2 10z"
      fill="url(#cloudGrad)"
    />
    {/* 内部闪电/AI符号 */}
    <path d="M26 18l-5 8h4l-2 6 7-9h-4l2-5z" fill="white" opacity="0.9" />
  </svg>
);

/* ─── 左侧特性卡片（半透明版） ───────────────────────────── */
const FeatureCard: React.FC<{ icon: string; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: 12,
    background: 'rgba(255,255,255,0.18)',
    backdropFilter: 'blur(10px)',
    borderRadius: 12,
    padding: '14px 18px',
    border: '1px solid rgba(255,255,255,0.3)',
  }}>
    <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
    <div>
      <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, textShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>{title}</div>
      <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>{desc}</div>
    </div>
  </div>
);

/* ─── 主组件 ────────────────────────────────────────────── */
const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const ok = await login(values.username, values.password);
      if (ok) {
        message.success('登录成功');
        navigate('/dashboard', { replace: true });
      } else {
        message.error('账号或密码错误');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#f0f6ff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
    }}>
      {/* ── 左侧品牌区 ── */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #e8f4ff 0%, #c5dff8 30%, #a8ccf0 60%, #7bb3e8 100%)',
        display: 'flex',
        alignItems: 'center',
        padding: '48px 56px 48px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 背景装饰圆 */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 400, height: 400,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -120, left: -60,
          width: 500, height: 500,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.10)',
          pointerEvents: 'none',
        }} />

        {/* 两列布局：左侧内容 + 右侧特性卡片 */}
        <div style={{
          display: 'flex',
          gap: 36,
          width: '100%',
          maxWidth: 760,
          position: 'relative',
          zIndex: 1,
          justifyContent: 'flex-start',
        }}>
          {/* 左列：Logo + 标题 + AI引擎 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
              <CloudLogo size={40} />
              <div>
                <div style={{ color: '#0d47a1', fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>叠云会计服务</div>
                <div style={{ color: '#1565c0', fontSize: 12, opacity: 0.8 }}>让财务更智能 让决策更精准</div>
              </div>
            </div>

            {/* 主标题 */}
            <div style={{ marginBottom: 16 }}>
              <h1 style={{
                fontSize: 36, fontWeight: 800, lineHeight: 1.25,
                color: '#0d47a1', margin: 0,
                textShadow: '0 2px 12px rgba(13,71,161,0.15)',
              }}>
                把重复的账<br />交给AI
              </h1>
              <h2 style={{
                fontSize: 28, fontWeight: 700, lineHeight: 1.4,
                color: '#1565c0', margin: '8px 0 0',
              }}>
                把重要的决策留给自己
              </h2>
            </div>

            {/* 标签 */}
            <div style={{
              display: 'flex', gap: 16, marginBottom: 36,
              color: '#1976d2', fontSize: 15, fontWeight: 500,
            }}>
              {['智能', '高效', '安全', '专业'].map((tag, i) => (
                <React.Fragment key={tag}>
                  <span>{tag}</span>
                  {i < 3 && <span style={{ opacity: 0.5 }}>·</span>}
                </React.Fragment>
              ))}
            </div>

            {/* 中央插画区域 */}
            <div style={{
              width: '100%', maxWidth: 440,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 24,
              padding: '28px 24px',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.4)',
              boxShadow: '0 20px 60px rgba(13,71,161,0.12)',
            }}>
              {/* 中心图示 */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1976d2, #0d47a1)',
                  boxShadow: '0 12px 36px rgba(25,118,210,0.4)',
                  marginBottom: 12,
                }}>
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <path d="M20 8 L28 16 L24 16 L24 26 L16 26 L16 16 L12 16 Z" fill="white" opacity="0.9"/>
                    <circle cx="20" cy="20" r="18" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none"/>
                  </svg>
                </div>
                <div style={{ color: '#0d47a1', fontWeight: 700, fontSize: 16 }}>叠云 AI 引擎</div>
              </div>

              {/* 功能标签网格 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { icon: '🤖', label: '智能记账' },
                  { icon: '🧾', label: '票据识别' },
                  { icon: '🔄', label: '自动对账' },
                  { icon: '📊', label: '报表分析' },
                  { icon: '🛡️', label: '数据安全' },
                  { icon: '⚡', label: 'AI 决策' },
                ].map(item => (
                  <div key={item.label} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'rgba(255,255,255,0.5)',
                    borderRadius: 10, padding: '8px 12px',
                    fontSize: 13, color: '#1565c0', fontWeight: 500,
                  }}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右列：特性卡片竖排 - 填充空白区域 */}
          <div style={{
            width: 220,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 16,
          }}>
            <FeatureCard icon="✅" title="科技赋能财务" desc="让数据驱动增长" />
            <FeatureCard icon="🔗" title="财务连接未来" desc="让业务更有价值" />
            <FeatureCard icon="🛡️" title="安全守护信任" desc="让企业行稳致远" />
          </div>
        </div>
      </div>

      {/* ── 右侧登录区 ── */}
      <div style={{
        width: 420,
        flexShrink: 0,
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 48px',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.06)',
      }}>
        {/* 右侧顶部 Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <CloudLogo size={28} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ color: '#666', fontSize: 15, marginBottom: 4 }}>欢迎使用</div>
          <div style={{ color: '#1976d2', fontSize: 22, fontWeight: 700 }}>叠云会计服务</div>
        </div>

        {/* 登录类型标签 */}
        <div style={{
          display: 'flex', gap: 0, marginBottom: 32,
          borderBottom: '2px solid #f0f0f0',
          width: '100%',
        }}>
          <div style={{
            flex: 1, textAlign: 'center', paddingBottom: 10,
            color: '#1976d2', fontWeight: 600, fontSize: 14,
            borderBottom: '2px solid #1976d2', marginBottom: -2,
          }}>
            账号登录
          </div>
        </div>

        {/* 登录表单 */}
        <Form
          name="login"
          onFinish={handleSubmit}
          style={{ width: '100%' }}
          size="large"
          initialValues={{ remember: true }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入账号' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="请输入账号"
              style={{ borderRadius: 8, height: 46 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="请输入密码"
              style={{ borderRadius: 8, height: 46 }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Checkbox
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
              >
                <span style={{ fontSize: 13, color: '#666' }}>记住我</span>
              </Checkbox>
              <span style={{ fontSize: 13, color: '#1976d2', cursor: 'pointer' }}>忘记密码？</span>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 46,
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #1976d2, #0d47a1)',
                border: 'none',
                boxShadow: '0 8px 24px rgba(25,118,210,0.35)',
              }}
            >
              登  录
            </Button>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <SafetyCertificateOutlined style={{ color: '#52c41a', marginTop: 2 }} />
              <span style={{ fontSize: 12, color: '#8c8c8c', lineHeight: 1.6 }}>
                登录即表示您已阅读并同意
                <span style={{ color: '#1976d2', cursor: 'pointer' }}>用户协议</span>
                、
                <span style={{ color: '#1976d2', cursor: 'pointer' }}>隐私保护政策</span>
              </span>
            </div>
          </Form.Item>
        </Form>

        {/* 底部版权 */}
        <div style={{
          marginTop: 'auto',
          paddingTop: 48,
          textAlign: 'center',
          color: '#bfbfbf',
          fontSize: 12,
        }}>
          叠云会计服务 | 让财务更智能 让决策更精准
        </div>
      </div>
    </div>
  );
};

export default Login;

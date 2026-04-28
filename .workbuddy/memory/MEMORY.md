# 财务软件开发 - 项目记忆

## 项目架构
- **前端**: React + TypeScript + Vite + Ant Design，运行在 localhost:5173
- **后端**: NestJS，端口 3001，需手动 `npx nest start` 或 `npm run start:dev` 启动
- **数据库**: PostgreSQL 远程 192.168.31.127:5001
- **双入口**: index.html（主系统）+ finance.html（账套独立窗口）
- **主系统路由**: App.tsx — Dashboard / CustomerList / FinanceModule / TaxBurden / Compliance / UserSettings 等
- **账套系统路由**: FinanceApp.tsx — FinanceHome / VoucherList / InvoiceList / Report 等

## 关键设计
- **财务模块两层结构**: `/finance` 是客户列表（管理端），点击"进账套"新窗口打开 `finance.html` 进入账套系统
- **账套首页 FinanceHome**: 快捷入口卡片 + 智能记账助手 + 本期财税指标
- **FinanceApp 标签页机制**: useEffect 监听路由变化自动创建标签，`/home` 和 `/finance.html` 需特殊处理避免重复标签
- **主系统顶部导航**: 首页 / 客户 / 财务 / 税务 / 合规 / 设置（6个大频道）
- **设置模块**: 合规后面的独立大模块，目前含"登录用户"管理页

## 用户认证系统
- **后端**: UserModule — entities/user.entity.ts + user.service.ts + user.controller.ts + auth.controller.ts
- **API**: GET/POST/PUT/DELETE `/api/users`，POST `/api/auth/login`
- **密码哈希**: SHA256 + random salt
- **种子数据**: 启动时自动创建 root/123456 管理员
- **前端**: AuthContext 先尝试后端 `/api/auth/login`，失败时 fallback 本地硬编码账号
- **重要**: NestJS `setGlobalPrefix('api')`，Controller 路径不要加 `api/` 前缀

## 命名规范
- **账套内"设置"** → 改名为"财务设置"（FinanceApp 侧边栏）
- **主系统"设置"** → 独立大模块，合规后面，含登录用户管理

## 模块化结构速查
- **后端 7 模块**：tenant / voucher / invoice / inventory / asset / report / user
- **依赖链**：Invoice/Inventory/Asset → Voucher → Report(只读)
- **前端双入口**：index.html(管理端) → Layout.tsx+App.tsx；finance.html(账套端) → FinanceApp.tsx
- **前端页面**：21个平铺在 pages/，未按领域分子文件夹
- **增改指引**：新业务→新建后端模块+注册app.module.ts + 前端新页面+路由

## 注意事项
- 后端重启电脑后需手动启动（无 Docker，无自启动）
- 后端代码修改后需 `npx nest build` 重新编译再启动
- vite.config.ts 代理指向 3001 端口
- finance.html 路径会被 React Router 识别为 `/finance.html`，需在路由判断中处理
- NestJS 全局前缀 `api`，Controller 不需再写 `api/` 前缀（踩坑）
- FinanceApp.tsx 承担布局+路由+标签页三职责（325行），可考虑拆分

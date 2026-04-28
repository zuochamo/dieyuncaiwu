# 代理记账系统 V1

基于 Web 的代理记账系统，支持多租户、自动凭证引擎、发票管理、库存管理、固定资产折旧和财务报表。

## 技术栈

- **前端**: React + Vite + TypeScript
- **后端**: NestJS + TypeScript
- **数据库**: PostgreSQL
- **缓存**: Redis
- **文件存储**: MinIO
- **部署**: Docker Compose

## 功能模块

### V1 功能
1. 多租户管理
2. 会计凭证（手动/自动）
3. 发票管理（支持 Excel 导入）
4. 固定资产折旧
5. 库存管理
6. 财务报表（资产负债表、利润表）

### V2 规划
- AI 自动记账
- 税务申报
- 发票查重

### V3 规划
- 银行对账
- 成本核算自动化

## 快速启动

### 使用 Docker Compose（推荐）

```bash
# 1. 复制环境变量
cp .env.example .env

# 2. 启动所有服务
docker-compose up -d

# 3. 访问
# 前端: http://localhost:3000
# 后端 API: http://localhost:3001/api
# MinIO 控制台: http://localhost:9001
```

### 本地开发

```bash
# 后端
cd packages/backend
npm install
npm run start:dev

# 前端
cd packages/frontend
npm install
npm run dev
```

## 数据库初始化

数据库表会在首次启动时通过 `docker/postgres/init.sql` 自动创建。

## 项目结构

```
├── packages/
│   ├── backend/          # NestJS 后端
│   │   └── src/
│   │       ├── tenant/   # 租户模块
│   │       ├── voucher/  # 凭证模块（含自动凭证引擎）
│   │       ├── invoice/  # 发票模块（含 Excel 导入）
│   │       ├── inventory/# 库存模块
│   │       ├── asset/    # 固定资产模块
│   │       └── report/   # 报表模块
│   └── frontend/         # React 前端
│       └── src/
│           ├── pages/    # 页面组件
│           └── components/# 公共组件
├── docker/
│   └── postgres/
│       └── init.sql      # 数据库初始化
├── docker-compose.yml
└── .env.example
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /voucher/create | 创建凭证 |
| POST | /voucher/post | 过账凭证 |
| GET  | /report/balance-sheet | 资产负债表 |
| GET  | /report/income | 利润表 |
| POST | /invoice/import | 导入发票 |
| POST | /inventory/in | 入库 |
| POST | /asset/depreciation/run | 运行折旧 |

## 限制

- 单租户最多 1000 个科目
- 初始部署支持 1000 个凭证

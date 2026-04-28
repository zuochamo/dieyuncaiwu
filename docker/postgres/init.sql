-- ============================================
-- 代理记账系统 - 数据库初始化脚本
-- ============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 租户表
-- ============================================
CREATE TABLE tenant (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    industry_type VARCHAR(100),
    start_period VARCHAR(7),
    status VARCHAR(20) DEFAULT 'pending', -- pending: 待建账务, active: 已建账务
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. 会计科目表
-- ============================================
CREATE TABLE account_subject (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(id),
    code VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL, -- asset / liability / equity / income / expense
    direction VARCHAR(10) NOT NULL, -- debit / credit
    parent_id UUID REFERENCES account_subject(id),
    level INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, code)
);

CREATE INDEX idx_subject_tenant ON account_subject(tenant_id);
CREATE INDEX idx_subject_parent ON account_subject(parent_id);

-- ============================================
-- 3. 凭证主表
-- ============================================
CREATE TABLE voucher (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(id),
    source_type VARCHAR(20) DEFAULT 'manual', -- manual / invoice / inventory / asset
    source_id UUID,
    voucher_no VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft / posted
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, voucher_no)
);

CREATE INDEX idx_voucher_tenant_date ON voucher(tenant_id, date);
CREATE INDEX idx_voucher_status ON voucher(status);

-- ============================================
-- 4. 凭证明细表
-- ============================================
CREATE TABLE voucher_entry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID NOT NULL REFERENCES voucher(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES account_subject(id),
    debit NUMERIC(18,2) DEFAULT 0,
    credit NUMERIC(18,2) DEFAULT 0,
    summary VARCHAR(500)
);

CREATE INDEX idx_entry_voucher ON voucher_entry(voucher_id);
CREATE INDEX idx_entry_subject ON voucher_entry(subject_id);

-- ============================================
-- 5. 自动凭证规则表
-- ============================================
CREATE TABLE voucher_rule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(id),
    biz_type VARCHAR(50) NOT NULL, -- 业务类型
    trigger_event VARCHAR(50) NOT NULL, -- 触发事件
    debit_subject_id UUID REFERENCES account_subject(id),
    credit_subject_id UUID REFERENCES account_subject(id),
    tax_subject_id UUID REFERENCES account_subject(id),
    formula TEXT, -- 计算公式
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rule_tenant ON voucher_rule(tenant_id);

-- ============================================
-- 6. 发票表
-- ============================================
CREATE TABLE invoice (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(id),
    type VARCHAR(10) NOT NULL, -- input / output
    date DATE NOT NULL,
    amount NUMERIC(18,2) NOT NULL,
    tax NUMERIC(18,2) DEFAULT 0,
    customer_name VARCHAR(200),
    raw_data JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- pending / processed / void
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_tenant ON invoice(tenant_id);
CREATE INDEX idx_invoice_type ON invoice(type);
CREATE INDEX idx_invoice_date ON invoice(date);

-- ============================================
-- 7. 商品/存货表
-- ============================================
CREATE TABLE inventory_item (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(id),
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_item_tenant ON inventory_item(tenant_id);

-- ============================================
-- 8. 库存流水表
-- ============================================
CREATE TABLE inventory_txn (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(id),
    item_id UUID NOT NULL REFERENCES inventory_item(id),
    type VARCHAR(10) NOT NULL, -- in / out
    qty NUMERIC(18,4) NOT NULL,
    amount NUMERIC(18,2) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_txn_tenant ON inventory_txn(tenant_id);
CREATE INDEX idx_txn_item ON inventory_txn(item_id);
CREATE INDEX idx_txn_date ON inventory_txn(date);

-- ============================================
-- 9. 固定资产表
-- ============================================
CREATE TABLE fixed_asset (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(id),
    name VARCHAR(200) NOT NULL,
    original_value NUMERIC(18,2) NOT NULL,
    residual_rate NUMERIC(5,4) DEFAULT 0.05,
    useful_life INT NOT NULL, -- 使用年限（月）
    start_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_asset_tenant ON fixed_asset(tenant_id);

-- ============================================
-- 10. 资产折旧表
-- ============================================
CREATE TABLE asset_depreciation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES fixed_asset(id),
    period VARCHAR(7) NOT NULL, -- YYYY-MM
    amount NUMERIC(18,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(asset_id, period)
);

CREATE INDEX idx_dep_asset ON asset_depreciation(asset_id);

-- ============================================
-- 11. 汇总账表
-- ============================================
CREATE TABLE ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(id),
    subject_id UUID NOT NULL REFERENCES account_subject(id),
    period VARCHAR(7) NOT NULL, -- YYYY-MM
    debit_total NUMERIC(18,2) DEFAULT 0,
    credit_total NUMERIC(18,2) DEFAULT 0,
    balance NUMERIC(18,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, subject_id, period)
);

CREATE INDEX idx_ledger_tenant_period ON ledger(tenant_id, period);

-- ============================================
-- 插入默认示例租户
-- ============================================
INSERT INTO tenant (id, name, industry_type, start_period, status)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '示例公司', '服务业', '2024-01', 'active');

-- 插入默认会计科目（小企业会计准则）
INSERT INTO account_subject (tenant_id, code, name, type, direction, level) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1001', '库存现金', 'asset', 'debit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1002', '银行存款', 'asset', 'debit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1122', '应收账款', 'asset', 'debit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1221', '其他应收款', 'asset', 'debit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1401', '材料采购', 'asset', 'debit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1403', '原材料', 'asset', 'debit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1405', '库存商品', 'asset', 'debit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1601', '固定资产', 'asset', 'debit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1602', '累计折旧', 'asset', 'credit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2001', '短期借款', 'liability', 'credit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2201', '应付账款', 'liability', 'credit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2202', '预收账款', 'liability', 'credit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2211', '应付职工薪酬', 'liability', 'credit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2221', '应交税费', 'liability', 'credit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2241', '其他应付款', 'liability', 'credit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '4001', '实收资本', 'equity', 'credit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '4101', '资本公积', 'equity', 'credit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '4103', '盈余公积', 'equity', 'credit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '4104', '利润分配', 'equity', 'credit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '5001', '生产成本', 'expense', 'debit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '5401', '主营业务成本', 'expense', 'debit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '5402', '其他业务成本', 'expense', 'debit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '5403', '营业税金及附加', 'expense', 'debit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '6001', '主营业务收入', 'income', 'credit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '6051', '其他业务收入', 'income', 'credit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '6601', '管理费用', 'expense', 'debit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '6602', '销售费用', 'expense', 'debit', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '6603', '财务费用', 'expense', 'debit', 1);

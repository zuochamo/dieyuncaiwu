import React, { useMemo, useState } from 'react';
import { Alert, Button, Card, Descriptions, Divider, Upload, message, Space, Typography } from 'antd';
import { InboxOutlined, UploadOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import api from '../../api';
import { useTenant } from '../../tenant/TenantContext';

const { Dragger } = Upload;
const { Text, Title } = Typography;

type ImportResult = {
  fileUsed: string;
  mode: string;
  periods: string[];
  voucherCount: number;
  entryCount: number;
  replacedVoucherCount: number;
  assistantUpserts: { created: number; reused: number };
  ledgerUpserts: { created: number; updated: number };
  warnings: string[];
};

const LegacyImport: React.FC = () => {
  const { tenantId } = useTenant();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const fileHint = useMemo(() => {
    if (!file) return null;
    if (file.name !== '2026.xls' && file.name !== '2026.xlsx') return '建议使用标准文件名：2026.xls（但仍可尝试导入）';
    return null;
  }, [file]);

  const doImport = async (useServerFile: boolean) => {
    if (!tenantId) {
      message.error('请先选择客户');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      let res: any;
      if (useServerFile) {
        res = await api.post('/voucher/legacy-import', null, { params: { tenantId, mode: 'replace' } });
      } else {
        if (!file) {
          message.warning('请先选择要导入的 Excel 文件');
          return;
        }
        const fd = new FormData();
        fd.append('file', file);
        res = await api.post(`/voucher/legacy-import?tenantId=${tenantId}&mode=replace`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setResult((res as any)?.body || null);
      message.success('旧账迁入完成');
    } catch (e: any) {
      message.error(e?.response?.data?.message || '导入失败');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>旧账迁入</Title>
        <Space>
          <Button
            icon={<CloudDownloadOutlined />}
            onClick={() => doImport(true)}
            loading={loading}
          >
            使用服务器上的 2026.xls 迁入
          </Button>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => doImport(false)}
            loading={loading}
            disabled={!file}
          >
            上传并迁入（覆盖）
          </Button>
        </Space>
      </div>

      <Alert
        type="warning"
        showIcon
        message="覆盖导入提示"
        description="本功能会按凭证号覆盖导入（同期间同凭证号会先删除再导入）。建议先备份数据库。"
        style={{ marginBottom: 16 }}
      />

      <Card>
        <Dragger
          multiple={false}
          accept=".xls,.xlsx"
          beforeUpload={(f) => {
            setFile(f);
            return false;
          }}
          onRemove={() => {
            setFile(null);
            setResult(null);
          }}
          fileList={file ? [{ uid: 'legacy-xls', name: file.name, status: 'done' }] as any : []}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p className="ant-upload-text">将 `2026.xls` 拖到这里，或点击选择文件</p>
          <p className="ant-upload-hint">支持工作表：凭证序时簿、科目余额表</p>
        </Dragger>

        {fileHint && (
          <Alert type="info" showIcon message={fileHint} style={{ marginTop: 12 }} />
        )}

        <Divider />

        {!result ? (
          <Text type="secondary">导入完成后会在此展示迁入结果。</Text>
        ) : (
          <>
            <Descriptions title="迁入结果" bordered size="small" column={2}>
              <Descriptions.Item label="数据源">{result.fileUsed}</Descriptions.Item>
              <Descriptions.Item label="模式">{result.mode}</Descriptions.Item>
              <Descriptions.Item label="期间">{(result.periods || []).join(', ') || '-'}</Descriptions.Item>
              <Descriptions.Item label="覆盖删除凭证数">{result.replacedVoucherCount}</Descriptions.Item>
              <Descriptions.Item label="导入凭证数">{result.voucherCount}</Descriptions.Item>
              <Descriptions.Item label="导入分录行数">{result.entryCount}</Descriptions.Item>
              <Descriptions.Item label="辅助核算（新增/复用）">
                {result.assistantUpserts?.created ?? 0} / {result.assistantUpserts?.reused ?? 0}
              </Descriptions.Item>
              <Descriptions.Item label="Ledger（新增/更新）">
                {result.ledgerUpserts?.created ?? 0} / {result.ledgerUpserts?.updated ?? 0}
              </Descriptions.Item>
            </Descriptions>

            {(result.warnings || []).length > 0 && (
              <Alert
                type="warning"
                showIcon
                message={`导入警告（${result.warnings.length}）`}
                description={(
                  <div style={{ maxHeight: 260, overflow: 'auto' }}>
                    {(result.warnings || []).map((w, i) => (
                      <div key={i} style={{ marginBottom: 4 }}>{w}</div>
                    ))}
                  </div>
                )}
                style={{ marginTop: 12 }}
              />
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default LegacyImport;


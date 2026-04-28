import React from 'react';
import { Upload, Button, Select, message, Card } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useTenant } from '../../tenant/TenantContext';

const InvoiceImport: React.FC = () => {
  const [invoiceType, setInvoiceType] = React.useState('input');
  const navigate = useNavigate();
  const { tenantId } = useTenant();

  const handleUpload = async (file: File) => {
    if (!tenantId) {
      message.error('请先选择租户');
      return false;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tenantId', tenantId);
    formData.append('type', invoiceType);

    try {
      await api.post('/invoice/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      message.success('导入成功');
      navigate('/invoice');
    } catch (e: any) {
      message.error(e?.response?.data?.message || '导入失败');
    }
    return false;
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>导入发票</h2>
      <Card style={{ maxWidth: 500 }}>
        <div style={{ marginBottom: 16 }}>
          <span style={{ marginRight: 8 }}>发票类型:</span>
          <Select value={invoiceType} onChange={setInvoiceType} style={{ width: 120 }}>
            <Select.Option value="input">进项</Select.Option>
            <Select.Option value="output">销项</Select.Option>
          </Select>
        </div>
        <Upload beforeUpload={handleUpload} accept=".xlsx,.xls" maxCount={1}>
          <Button icon={<UploadOutlined />}>选择 Excel 文件</Button>
        </Upload>
        <p style={{ marginTop: 16, color: '#666' }}>
          Excel 列名需包含：日期、金额、税额、客户名称
        </p>
      </Card>
    </div>
  );
};

export default InvoiceImport;

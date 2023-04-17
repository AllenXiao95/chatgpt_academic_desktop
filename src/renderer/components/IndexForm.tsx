import { useState, useEffect } from 'react';
import { Button, Checkbox, Form, Input, Radio, Spin, Modal } from 'antd';
import type { RadioChangeEvent } from 'antd';

interface IndexFormProp {
  config: {
    API_KEY: string;
    proxies: {
      http: string;
      https: string;
    };
    WEB_PORT: number;
    LLM_MODEL: string;
    API_URL: string;
    MODE: string;
    url: string;
    mode: string;
    remember: boolean;
  };
  onFormChange: Function
}

function IndexForm(props: IndexFormProp) {
  // Define state variables
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastRedirectUrl, setLastRedirectUrl] = useState('');

  // Register form component
  const [form] = Form.useForm();

  // Define initial config object
  let config = {
    API_KEY: props.config.API_KEY,
    USE_PROXY: "True",
    proxies: {
      http: props.config.proxies.http,
      https: props.config.proxies.https,
    },
    CHATBOT_HEIGHT: 1115,
    CODE_HIGHLIGHT: "True",
    LAYOUT: 'LEFT-RIGHT',
    TIMEOUT_SECONDS: 25,
    WEB_PORT: props.config.WEB_PORT,
    MAX_RETRY: 2,
    LLM_MODEL: props.config.LLM_MODEL,
    API_URL: props.config.API_URL,
    CONCURRENT_COUNT: 100,
    AUTHENTICATION: [],
    url: props.config.url,
    mode: props.config.mode,
    remember: props.config.remember
  };

  // Set initial form values if remember is true
  useEffect(() => {
    if (props.config.remember) {
      form.setFieldsValue(config)
    }

    let lastRedirectUrl = window.electron.ipcRenderer.getStoreValue('lastRedirectUrl') || '';
    setLastRedirectUrl(lastRedirectUrl);
    if (lastRedirectUrl !== '') {
      setIsModalOpen(true);
    };
  }, [])

  // Define mode state variable and change handler
  const [mode, setMode] = useState<string>(props.config.mode);
  const onModeChange = (e: RadioChangeEvent) => {
    setMode(e.target.value as string);
  }

  // Define form submit handler
  const onFinish = (values: any) => {
    setLoading(true);
    Object.assign(config, values);
    props.onFormChange(config);
  };

  const handleOk = () => {
    window.electron.ipcRenderer.runByUrl(lastRedirectUrl);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };


  return (
    <div className='form-wrapper'>
      <Modal title="Basic Modal" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
        <p>检测到上次使用的链接, 是否继续使用?</p>
      </Modal>
      <Spin spinning={loading} tip='启动中! 若第一次启动会耗时很久, 请耐心等待!'>
        <Form
          name="basic"
          form={form}
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 600 }}
          initialValues={config}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="启动模式"
            name='mode'>

            <Radio.Group onChange={onModeChange} value={mode}>
              <Radio value='docker'>docker</Radio>
              <Radio value='url'>url</Radio>
            </Radio.Group>
          </Form.Item>

          {
            mode === 'docker' && (
              <div>
                <Form.Item
                  label="ApiKey"
                  name="API_KEY"
                  rules={[{ required: true, message: 'Please input your api key!' }]}
                >
                  <Input placeholder='example: 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' />
                </Form.Item>
                <Form.Item
                  label="Proxy(HTTP)"
                  name={['proxies', 'http']}
                  rules={[{ required: true, message: 'Please input your proxy setting!' }]}
                >
                  <Input value={config.proxies.http} placeholder='example: socks5h://localhost:11284' />
                </Form.Item>

                <Form.Item
                  label="Proxy(HTTPS)"
                  name={['proxies', 'https']}
                  rules={[{ required: true, message: 'Please input your proxy setting!' }]}
                >
                  <Input value={config.proxies.https} placeholder='example: socks5h://localhost:11284' />
                </Form.Item>
              </div>
            )
          }

          {
            mode === 'url' && (
              <Form.Item
                label="Url"
                name="url"
                rules={[{ required: true, message: 'Please input url!' }]}
              >
                <Input value={config.url} />
              </Form.Item>
            )
          }

          <Form.Item
            name="remember"
            valuePropName="checked"
            wrapperCol={{ offset: 8, span: 16 }}
          >
            <Checkbox>Remember me</Checkbox>
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
            <Button type="primary" htmlType="submit">
              启动
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </div >
  );
}

export default IndexForm;

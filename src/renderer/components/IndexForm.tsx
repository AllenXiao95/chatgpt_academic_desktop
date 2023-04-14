import { useState, useEffect } from 'react';
import { Button, Checkbox, Form, Input, Radio, Spin } from 'antd';
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
  const [loading, setLoading] = useState(false);

  // 注册表单组件
  const [form] = Form.useForm();
  // 注册表单
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

  useEffect(() => {
    if (props.config.remember) {
      form.setFieldsValue(config)
    }
  }, [])

  // 注册模式切换变量
  const [mode, setMode] = useState<string>(props.config.mode);
  const onModeChange = (e: RadioChangeEvent) => {
    setMode(e.target.value as string);
  }

  const onFinish = (values: any) => {
    // 将values和合并到config
    Object.assign(config, values);
    props.onFormChange(config)
  };

  return (
    <div className='form-wrapper'>
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
          {
            loading ? <Spin /> : <Button type="primary" htmlType="submit">
              启动
            </Button>
          }
        </Form.Item>
      </Form>
    </div >
  );
}

export default IndexForm;

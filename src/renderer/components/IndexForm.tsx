import { useState } from 'react';
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
    URL: string;
  };
  onFormChange: Function
}

function IndexForm(props: IndexFormProp) {
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
  };

  let URL = props.config.URL;
  // 注册模式切换变量
  const [mode, setMode] = useState<string>('');
  const onModeChange = (e: RadioChangeEvent) => {
    setMode(e.target.value as string);
  }

  const onFinish = (values: any) => {
    // 将values和合并到config
    Object.assign(config, values);
    console.log('onFinish', values, config);
    props.onFormChange(config)
  };

  return (
    <div className='form-wrapper'>
      <Form
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
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
                <Input value={config.API_KEY} placeholder='example: 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' />
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
              <Input value={URL} />
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
    </div >
  );
}

export default IndexForm;

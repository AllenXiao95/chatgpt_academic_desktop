import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import IndexForm from './components/IndexForm';
import './App.css';
import { Modal } from 'antd';
import jsonToText from './utils/index';
import { useEffect, useState } from 'react';

function Hello() {
  const [lastRedirectUrl, setLastRedirectUrl] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // define formConfig
  const [formConfig, setFormConfig] = useState<any>({
    API_KEY: '',
    proxies: {
      http: '',
      https: '',
    },
    WEB_PORT: 0,
    LLM_MODEL: 'gpt-3.5-turbo',
    API_URL: 'https://api.openai.com/v1/chat/completions',
    mode: 'docker',
    url: '',
    remember: false
  });

  useEffect(() => {
    let lastRedirectUrl = window.electron.ipcRenderer.getStoreValue('lastRedirectUrl') || '';
    setLastRedirectUrl(lastRedirectUrl);
    if (lastRedirectUrl !== '') {
      setIsModalOpen(true);
    };

    let formConfigStore = window.electron.ipcRenderer.getStoreValue('formConfig') || '';
    if (formConfigStore !== '') {
      formConfigStore = JSON.parse(formConfigStore)

      formConfigStore.remember ? setFormConfig(formConfigStore) : null
    };
  }, [])


  // Form回调
  const onFormChange = (values: any) => {
    let formConfigStore = window.electron.ipcRenderer.getStoreValue('formConfig') || '';
    let isUpdated = false;

    if (formConfigStore !== '' && values.remember === true) {
      formConfigStore === JSON.stringify(values) ? isUpdated = false : isUpdated = true
    } else {
      isUpdated = true
    }

    if (values.remember === true) {
      window.electron.ipcRenderer.setStoreValue('formConfig', JSON.stringify(values));
    } else {
      window.electron.ipcRenderer.setStoreValue('formConfig', '');
    }

    // set port
    values.WEB_PORT = window.electron.ipcRenderer.getStoreValue('WEB_PORT') || 30000;

    if (values.mode === 'docker') {
      delete values.url
      delete values.remember
      delete values.mode
      isUpdated ? window.electron.ipcRenderer.renderAndRunDocker(jsonToText(values)) : window.electron.ipcRenderer.reRunDocker(values.WEB_PORT);
    } else {
      window.electron.ipcRenderer.runByUrl(values.url);
    }
  }

  const handleOk = () => {
    window.electron.ipcRenderer.runByUrl(lastRedirectUrl);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <div>
      <Modal title="提示" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
        <p>是否继续使用上次配置?</p>
      </Modal>
      <IndexForm config={formConfig} onFormChange={onFormChange} />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}

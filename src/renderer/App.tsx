import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import IndexForm from './components/IndexForm';
import './App.css';
import jsonToText from './utils/index';
import { useEffect, useState } from 'react';

function Hello() {
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
    MODE: 'docker',
    URL: ''
  });

  useEffect(() => {
    let formConfig = window.electron.ipcRenderer.getStoreValue('formConfig') || '';
    if (formConfig) {
      formConfig = JSON.parse(formConfig);
      setFormConfig(formConfig);
    }
  }, [])


  // Form回调
  const onFormChange = (values: any) => {
    if (values.remember) {
      window.electron.ipcRenderer.setStoreValue('formConfig', JSON.stringify(values));
    }

    if (values.mode === 'docker') {
      delete values.url
      delete values.remember
      window.electron.ipcRenderer.renderAndRunDocker(jsonToText(values));
    } else {
      window.electron.ipcRenderer.runByUrl(values.url);
    }
  }

  return (
    <div>
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

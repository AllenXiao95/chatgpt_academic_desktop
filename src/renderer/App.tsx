import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import IndexForm from './components/IndexForm';
import './App.css';
import jsonToText from './utils/index';


function Hello() {
  const formConfig = {
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
  };

  // Form回调
  const onFormChange = (values: any) => {
    console.log('onFormChange', values);
    window.electron.ipcRenderer.renderAndRunDocker(jsonToText(values));
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

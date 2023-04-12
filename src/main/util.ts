/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import net from 'net';
import { exec, execSync } from 'child_process';

/**
 * Resolves the path of an HTML file based on the environment.
 * @param htmlFileName - The name of the HTML file.
 * @returns The resolved path of the HTML file.
 */
export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

/**
 * Creates or rewrites a Python file with the given text.
 * @param filePath - The path of the Python file.
 * @param text - The text to write to the Python file.
 */
export function createOrRewritePythonFile(filePath: string, text: string) {
  exec(`echo "${text}" > ${filePath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }

    console.log('File saved in ' + filePath);
  });
}

function getFreePortInRange(start: number, end: number): Promise<number> {
  return new Promise((resolve, reject) => {
    for (let port = start; port <= end; port++) {
      const server = net.createServer();
      server.listen(port, () => {
        server.close();
        resolve(port);
      });
      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          // Port is in use, try the next one
        } else {
          reject(err);
        }
      });
    }
  });
}

export function generateDockerfile(filePath: string) {
  const text = `
FROM python:3.11

RUN apt-get update && apt-get install -y git

RUN echo '[global]' > /etc/pip.conf && \\ \n
    echo 'index-url = https://mirrors.aliyun.com/pypi/simple/' >> /etc/pip.conf && \\ \n
    echo 'trusted-host = mirrors.aliyun.com' >> /etc/pip.conf \n

RUN git clone https://github.com/binary-husky/chatgpt_academic.git /chatgpt_academic && \\ \n
    pip3 install gradio requests[socks] mdtex2html

COPY config.py /chatgpt_academic/config.py

WORKDIR /chatgpt_academic

CMD ["python3", "main.py"]
  `

  exec(`echo "${text}" > ${filePath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }

    console.log('File saved in ' + filePath);
  });
}

/**
 * Build Docker image and run it.
 */
export function runDocker(dockerPath: string) {

  const dockerName = 'chatgpt_academic';
  try {
    execSync('docker -V', { stdio: 'inherit' });
    execSync(`docker build -t ${dockerName} .`, { cwd: dockerPath, stdio: 'inherit' });
    getFreePortInRange(30000, 40000).then((port) => {
      execSync(`docker run --rm -it -p ${port}:${port} ${dockerName}`);
      return `localhost:${port}`
    }).catch(() => {
      return false
    });

    return false;
  } catch (error) {
    console.error(`exec error: ${error}`);
    return false;
  }
}

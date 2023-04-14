/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import net from 'net';
import fs from 'fs';
import { spawn } from 'child_process';

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
  fs.writeFile(filePath, text, (err) => {
    if (err) throw err;
    console.log('The file has been saved to ' + filePath);
  });
}

export function getFreePortInRange(start: number, end: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const checkPort = (port: number) => {
      const server = net.createServer();
      server.listen(port, () => {
        server.close();
        resolve(port);
      });
      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          // Port is in use, try the next one
          checkPort(port + 1);
        } else {
          reject(err);
        }
      });
    };
    checkPort(start);
  });
}

export function generateDockerfile(filePath: string) {
  const text = `
FROM python:3.11

RUN  sed -i s@/archive.ubuntu.com/@/mirrors.aliyun.com/@g /etc/apt/sources.list
RUN  apt-get clean
RUN apt-get update && apt-get install -y git

RUN echo '[global]' > /etc/pip.conf && \\ \n
    echo 'index-url = https://mirrors.aliyun.com/pypi/simple/' >> /etc/pip.conf && \\ \n
    echo 'trusted-host = mirrors.aliyun.com' >> /etc/pip.conf \n

RUN git clone https://github.com/binary-husky/chatgpt_academic.git /chatgpt_academic && \\ \n
    pip3 install gradio requests[socks] mdtex2html

COPY config.py /chatgpt_academic/config.py

WORKDIR /chatgpt_academic

CMD ["python3", "-u", "main.py"]
  `

  fs.writeFile(filePath, text, (err) => {
    if (err) throw err;
    console.log('The file has been saved to ' + filePath);
  });
  console.log('File saved in ' + filePath);
}


const promisifiedExec = (cmd: string, opts?: any, onData?: (data: any) => void) =>
  new Promise((resolve, reject) => {
    const proc = spawn(cmd, {
      shell: true,
      cwd: opts?.cwd,
      stdio: 'inherit',
    });
    const chunks: any[] = [];
    proc.stdout?.on('data', (chunk) => {
      if (onData) {
        onData(chunk);
      }
      chunks.push(chunk);
    });
    proc.on('error', reject);
    proc.on('close', (code) => {
      const stdout = Buffer.concat(chunks).toString();
      if (code === 0) {
        resolve({ code, stdout });
      } else {
        reject({ code, stdout });
      }
    });
  });


/**
 * Build Docker image and run it.
 */
export async function runDocker(dockerPath: string, port: number): Promise<string> {
  return new Promise(async (resolve, reject) => {
    console.log('Building docker image...', dockerPath);
    const dockerName = 'chatgpt_academic';
    try {
      const dockerVersion: any = await promisifiedExec('docker --version', { cwd: dockerPath });
      console.log(`stdout: ${dockerVersion.stdout}`);

      const dockerBuild: any = await promisifiedExec(`docker build -t ${dockerName} --progress=plain .`, { cwd: dockerPath, stdio: 'pipe' });
      console.log(`stdout: ${dockerBuild.stdout}`);

      const dockerImages: any = await promisifiedExec('docker images', { cwd: dockerPath });
      console.log(`stdout: ${dockerImages.stdout}`);

      const dockerRun: any = await promisifiedExec(`docker run -d --name ${dockerName} --rm -it -p ${port}:${port} ${dockerName}`, { stdio: 'pipe' });
      console.log(`stdout: ${dockerRun.stdout}`);
      resolve(`http://localhost:${port}`);
    } catch (error: any) {
      console.log(`error: ${error}`);
      reject(error);
    }
  })
}

export async function rerunDocker(port: number): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const dockerName = 'chatgpt_academic';
    try {
      const dockerRun: any = await promisifiedExec(`docker run -d --name ${dockerName} --rm -it -p ${port}:${port} ${dockerName}`, { stdio: 'pipe' });
      console.log(`stdout: ${dockerRun.stdout}`);
      resolve(`http://localhost:${port}`);
    } catch (error: any) {
      reject(error.message);
    }
  })
}

/**
 * Deletes the docker container.
 * @param containerName - The name of the container.
*/
export async function stopDockerContainer() {
  const dockerStop: any = await promisifiedExec(`docker stop chatgpt_academic`, { stdio: 'pipe' });
  console.log(`stdout: ${dockerStop.stdout}`);
  const dockerRemove: any = await promisifiedExec(`docker rm chatgpt_academic`, { stdio: 'pipe' });
  console.log(`stdout: ${dockerRemove.stdout}`);
}

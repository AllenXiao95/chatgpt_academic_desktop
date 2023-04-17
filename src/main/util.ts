/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import net from 'net';
import fs from 'fs';
import { exec, spawn } from 'child_process';

/**
 * Resolves the path of an HTML file based on the environment.
 * @param htmlFileName - The name of the HTML file.
 * @returns The resolved path of the HTML file.
 */
export function resolveHtmlPath(htmlFileName: string): string {
  const port = process.env.PORT || 1212;
  const url = new URL(`http://localhost:${port}`);
  if (process.env.NODE_ENV === 'development') {
    url.pathname = htmlFileName;
  } else {
    url.pathname = path.join('renderer', htmlFileName);
  }
  return url.href;
}

/**
 * Writes a string to a file, creating the file if it does not exist.
 * @param filePath - The path of the file to write to.
 * @param text - The text to write to the file.
 */
export function writeToFile(filePath: string, text: string): void {
  fs.writeFile(filePath, text, (err) => {
    if (err) throw err;
    console.log('The file has been saved to ' + filePath);
  });
}

/**
 * Get a free port in the given range.
 * @param start - The start of the port range.
 * @param end - The end of the port range.
 * @returns A promise that resolves to the free port number.
 */
export function getFreePortInRange(start: number): Promise<number> {
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

/**
 * Generate a Dockerfile with the given file path.
 * @param filePath - The path of the Dockerfile to generate.
 */
export function generateDockerfile(filePath: string): void {
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
 * Build and run a Docker image.
 * @param dockerPath - The path of the Dockerfile.
 * @param port - The port to run the Docker container on.
 * @returns A promise that resolves to the URL of the running Docker container.
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

/**
 * Re-Run a Docker container.
 * @param port - The port to run the Docker container on.
 * @returns A promise that resolves to the URL of the running Docker container.
 */
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
 * Check the status of the chatgpt_academic Docker container.
 */
export async function checkDockerContainerStatus() {
  let containerStatusRunning = false,
    location = "";
  exec(`docker ps --format "{{.Names}}::{{.Status}}::{{.Ports}}"`, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error}`);
    } else if (stderr) {
      console.log(`stderr: ${stderr}`);
    } else {
      const lines = stdout.split('\n');
      lines.forEach((line) => {
        const [name, status] = line.split('::');
        if (name === 'chatgpt_academic' && status.indexOf('Up') !== -1) {
          containerStatusRunning = true;
        }
      })
    }
  })

  return containerStatusRunning;
}


/**
 * Reset chatgpt_academic docker settings.
 * @param containerName - The name of the container.
*/
export async function resetDockerSettting() {
  await promisifiedExec(`docker stop chatgpt_academic`, { stdio: 'pipe' });
  await promisifiedExec(`docker rm chatgpt_academic`, { stdio: 'pipe' });
  await promisifiedExec(`docker rmi chatgpt_academic`, { stdio: 'pipe' });
}

/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import net from 'net';
import fs from 'fs';
import { exec, spawn } from 'child_process';
import { dialog } from 'electron';

const ENV = process.platform === 'darwin' ? { env: { ...process.env, PATH: `${process.env.PATH}:/usr/local/bin` } } : {};

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
    exec(`docker build -t ${dockerName} --progress=plain . && docker run -d --name ${dockerName} -p ${port}:${port} ${dockerName}`, { ...ENV, cwd: dockerPath }, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error}`);
        reject(error);
      } else if (stderr) {
        console.log(`stderr: ${stderr}`);
        reject(stderr);
      } else {
        console.log(`stdout: ${stdout}`);
        resolve(`http://localhost:${port}`);
      }
    });
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
      exec(`docker stop chatgpt_academic && docker rm chatgpt_academic && docker run -d --name ${dockerName} -p ${port}:${port} ${dockerName}`, ENV, (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error}`);
        } else if (stderr) {
          console.log(`stderr: ${stderr}`);
        } else {
          console.log(`stdout: ${stdout}`);
        }
        resolve(`http://localhost:${port}`);
      });
    } catch (error: any) {
      reject(error.message);
    }
  })
}

/**
 * Check the status of the chatgpt_academic Docker container.
 */
export function checkDockerStatus() {
  dialog.showMessageBox({
    type: 'info',
    message: `Checking docker services...${process.platform}`,
  })

  return new Promise((resolve, reject) => {
    exec(`docker ps`, ENV, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error}`);
        reject()
      } else if (stderr) {
        reject()
        console.log(`stderr: ${stderr}`);
      } else {
        console.log(`stdout: ${stdout}`);
        resolve(true);
      }
    });
  })
}

/**
 * Check the status of the chatgpt_academic Docker container.
 */
export function checkDockerContainerStatus(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    exec(`docker ps --format "{{.Names}}::{{.Status}}::{{.Ports}}"`, ENV, (error, stdout, stderr) => {
      if (error) {
        reject()
        console.log(`error: ${error}`);
      } else if (stderr) {
        reject()
        console.log(`stderr: ${stderr}`);
      } else {
        const lines = stdout.split('\n');
        console.log(`lines:: ${lines}`);
        lines.forEach((line) => {
          const [name, status] = line.split('::');
          if (name === 'chatgpt_academic' && status.indexOf('Up') !== -1) {
            resolve(true);
          }
        })

        reject()
      }
    })

  })
}


/**
 * Reset chatgpt_academic docker settings.
 * @param containerName - The name of the container.
*/
export async function resetDockerSettting() {
  exec(`docker stop chatgpt_academic && docker rm chatgpt_academic && docker rmi chatgpt_academic`, ENV, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error}`);
    } else if (stderr) {
      console.log(`stderr: ${stderr}`);
    } else {
      console.log(`stdout: ${stdout}`);
    }
  });
}

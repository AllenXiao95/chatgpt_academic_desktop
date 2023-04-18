# Usage
具体使用方式参照binary-husky大佬[chatgpt_academic](https://github.com/binary-husky/chatgpt_academic)

## docker方式
<img width="1022" alt="image" src="https://user-images.githubusercontent.com/18730237/232692422-4fead118-ec5b-4dc7-b8c6-8184717cfbb4.png">
填写相关信息并运行

### 提示
<img width="259" alt="image" src="https://user-images.githubusercontent.com/18730237/232692145-c01e0e66-176a-4b88-9d6e-966c71825f8b.png">
如果启动时出现上面警告, 说明本地docker环境没有准备好, docker方式和本地存储的地址启动可能报错

另外, 所有填写的数据都会存在用户本地路径`userData/chatgpt_academic_data`文件夹下

## url方式
<img width="1022" alt="image" src="https://user-images.githubusercontent.com/18730237/232692473-4809e237-6e0a-4fa8-afe1-19cf3544550f.png">
推荐使用huggingface克隆space后使用

## 功能
- 自动化配置并运行docker容器
- 本地化存储配置

# 本地调试&运行
## Install

install dependencies:

```bash
npm install
```

## Starting Development

Start the app in the `dev` environment:

```bash
npm start
```

## Packaging for Production

To package apps for the local platform:

```bash
npm run package
```

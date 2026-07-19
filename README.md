# shop-booking-system

店铺预约系统是一个前后端分离的实训项目，面向线下门店预约场景，提供预约时段展示、预约下单、个人中心、登录注册、用户资料维护、头像上传、预约记录查询与取消、店铺活动展示等功能。

项目采用 `Next.js + Flask + SQLite` 实现业务闭环，前端适配部署到 Vercel，后端用于本地运行演示，适合作为 GitHub 公开仓库、课程实训交付和全栈入门项目展示。

## 项目功能

### 4 大页面

| 页面 | 路由 | 功能说明 |
| --- | --- | --- |
| 首页 | `/` | 展示未来一个月可预约时段，显示日期、时间、剩余名额，已约满时段不可继续预约。 |
| 预约页 | `/book` | 选择日期和时段，填写姓名、手机号后提交预约订单，提交后可到个人中心查询。 |
| 活动页 | `/activity` | 展示店铺活动、优惠文案、活动起止时间，并自动显示未开始、进行中、已结束状态。 |
| 个人中心 | `/user` | 支持注册、登录、退出登录；登录后展示用户信息、上传头像、编辑用户名/性别/生日，并查询或取消绑定手机号下的预约。 |

### 用户与预约规则

- 用户注册时需要账号、密码、手机号和用户名。
- 密码使用哈希保存到数据库，不直接保存明文密码。
- 每个账号绑定一个手机号。
- 每个手机号只能绑定一个账号，避免多个账户共用同一手机号。
- 个人中心必须先登录或注册，登录后才能查看用户资料和预约记录。
- 头像支持本地选择图片，前端转为 DataURL 后保存到 SQLite 数据库字段。
- 预约订单仍以手机号关联查询，个人中心只查询当前登录账号绑定手机号下的预约记录。

### 后端接口

| 方法 | 接口 | 功能说明 |
| --- | --- | --- |
| `GET` | `/api/time-slot` | 查询全部预约时段，按日期和时间排序，返回最大容量、已预约人数和实时剩余人数。 |
| `POST` | `/api/book-order` | 创建预约订单，校验姓名、手机号、预约时段，防止同一手机号重复预约同一时段，并控制满员时段不可超额预约。 |
| `GET` | `/api/activity` | 查询店铺活动列表，支持 `page`、`size` 分页参数，并返回活动状态。 |
| `POST` | `/api/user/register` | 用户注册，保存账号、密码哈希、绑定手机号和用户名。 |
| `POST` | `/api/user/login` | 用户登录，校验账号密码并返回用户资料。 |
| `PUT` | `/api/user/profile` | 保存用户头像、用户名、性别、生日。 |
| `GET` | `/api/user/order?phone=手机号` | 根据手机号查询预约订单。个人中心使用当前账号绑定手机号调用。 |
| `PUT` | `/api/user/cancel` | 根据订单 ID 取消正常订单，释放对应预约时段名额。 |
| `GET` | `/api/health` | 健康检查接口，用于本地调试和线上部署验证。 |
| `GET` | `/api/summary` | 查询预约时段、订单和活动数量统计。 |

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 前端框架 | Next.js 14、React 18、TypeScript |
| 前端路由 | Next.js App Router |
| 后端框架 | Flask、Flask-SQLAlchemy、Flask-CORS |
| 密码处理 | Werkzeug Password Hash |
| 数据库 | SQLite |
| 前端部署 | Vercel |
| 后端运行 | 本地 Flask 演示 |
| 开发环境 | macOS、Homebrew、Node.js、Python |

## Mac 本地环境安装

### 1. 安装 Homebrew

如果本机已经安装 Homebrew，可以跳过这一步。

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. 安装 Node.js 和 Python

```bash
brew update
brew install node
brew install python
```

检查版本：

```bash
node -v
npm -v
python3 --version
pip3 --version
```

### 3. 克隆项目

```bash
git clone https://github.com/你的GitHub用户名/shop-booking-system.git
cd shop-booking-system
```

### 4. 安装前端依赖

```bash
cd frontend
npm install
```

### 5. 安装后端依赖

```bash
cd ../backend
python3 -m venv .venv
source .venv/bin/activate
pip install Flask Flask-SQLAlchemy flask-cors python-dotenv gunicorn
```

## 本地启动

前端和后端需要分别启动，建议打开两个终端窗口。

### 1. 启动 Flask 后端

macOS 上 `5000` 端口可能被系统服务占用，推荐使用 `5001`：

```bash
cd /Users/bana/shop-booking-system/backend
source .venv/bin/activate
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000 FLASK_PORT=5001 python app.py
```

后端地址：

```text
http://127.0.0.1:5001
```

健康检查：

```text
http://127.0.0.1:5001/api/health
```

### 2. 启动 Next.js 前端

先配置前端 API 地址：

```bash
cd /Users/bana/shop-booking-system/frontend
printf 'NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5001\n' > .env.local
npm run dev
```

前端地址：

```text
http://localhost:3000
```

如果页面出现 `missing required error components, refreshing...`，可清理 Next.js 缓存后重启：

```bash
cd /Users/bana/shop-booking-system/frontend
rm -rf .next
npm run dev
```

## Windows 本地部署说明

以下命令建议在 PowerShell 中执行。

### 1. 安装基础环境

如果电脑已安装 Git、Node.js 和 Python，可以跳过对应安装命令。

```powershell
winget install Git.Git
winget install OpenJS.NodeJS
winget install Python.Python.3.11
```

安装完成后重新打开 PowerShell，检查版本：

```powershell
git --version
node -v
npm -v
python --version
pip --version
```

### 2. 克隆项目

```powershell
git clone https://github.com/你的GitHub用户名/shop-booking-system.git
cd shop-booking-system
```

### 3. 安装后端依赖

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install Flask Flask-SQLAlchemy flask-cors python-dotenv
```

如果 PowerShell 阻止虚拟环境脚本运行，可执行：

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

然后重新执行：

```powershell
.\.venv\Scripts\Activate.ps1
```

### 4. 初始化示例数据

```powershell
python seed_data.py
```

该脚本会生成未来 30 天预约时段、店铺活动和示例预约订单。

### 5. 启动 Flask 后端

```powershell
$env:CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
$env:FLASK_PORT="5001"
python app.py
```

后端地址：

```text
http://127.0.0.1:5001
```

健康检查：

```text
http://127.0.0.1:5001/api/health
```

### 6. 安装并启动前端

新开一个 PowerShell 窗口：

```powershell
cd shop-booking-system\frontend
npm install
Set-Content -Path .env.local -Value "NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5001"
npm run dev
```

如果当前 PowerShell 已经在项目根目录，前端目录进入命令改为：

```powershell
cd frontend
```

前端地址：

```text
http://localhost:3000
```

### 7. Windows 常见问题

如果 `npm run dev` 后页面仍读取不到后端，请确认：

1. 后端 PowerShell 窗口没有关闭。
2. `http://127.0.0.1:5001/api/health` 可以返回 JSON。
3. `frontend/.env.local` 内容是：

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5001
```

如果修改了 `.env.local`，需要停止并重新执行：

```powershell
npm run dev
```

## 示例数据

项目提供示例数据脚本，可生成未来 30 天预约时段、店铺活动和示例预约订单。

```bash
cd /Users/bana/shop-booking-system/backend
source .venv/bin/activate
python seed_data.py
```

当前脚本会生成：

- 未来 30 天预约时段，每天 5 个时段，共 150 条。
- 多条店铺活动，覆盖进行中、未开始、已结束状态。
- 若干示例预约订单。
- 个人中心测试预约手机号：`13800138000`。

说明：注册登录功能需要先在个人中心注册账号。注册时可绑定已有预约手机号，例如 `13800138000`，登录后即可查询该手机号下的示例预约记录。

## 线上 Demo

前端 Demo：

```text
待填写：https://你的-vercel-项目地址.vercel.app
```

后端 API：

```text
本地演示：http://127.0.0.1:5001
```

后端健康检查：

```text
本地演示：http://127.0.0.1:5001/api/health
```

## 部署说明

本项目当前采用“前端单独部署到 Vercel，后端只在本地运行演示”的方式。

重要说明：

- Vercel 只托管 Next.js 前端页面。
- Flask 后端不部署到公网平台，只在演示电脑本地运行。
- 如果 Vercel 前端配置 `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5001`，浏览器会请求“当前访问者电脑上的 5001 端口”。
- 因此，只有在你的电脑本地启动 Flask 后端时，你打开 Vercel 前端 URL 才能完整演示预约、登录、活动、查询等接口功能。
- 其他人单独打开 Vercel 前端 URL 时，如果他们本机没有运行后端，会看到接口请求失败。这是当前部署方案的正常限制。

### Vercel 部署前端操作步骤

1. 将项目推送到 GitHub 公开仓库。
2. 在 Vercel 导入该 GitHub 仓库。
3. Vercel 项目配置：
   - Framework Preset：`Next.js`
   - Root Directory：`frontend`
   - Build Command：`npm run build`
   - Install Command：`npm install`
4. 配置环境变量：

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5001
```

### 1. 推送代码到 GitHub

在项目根目录执行：

```bash
cd /Users/bana/shop-booking-system
git add .
git commit -m "deploy frontend to vercel"
git branch -M main
git remote add origin https://github.com/你的GitHub用户名/shop-booking-system.git
git push -u origin main
```

如果已经存在 remote，使用：

```bash
git remote set-url origin https://github.com/你的GitHub用户名/shop-booking-system.git
git push -u origin main
```

### 2. 在 Vercel 创建前端项目

1. 登录 Vercel。
2. 点击 `Add New Project`。
3. 选择刚才的 GitHub 仓库。
4. 配置如下：

```text
Framework Preset: Next.js
Root Directory: frontend
Build Command: npm run build
Install Command: npm install
```

### 3. 配置 Vercel 环境变量

在 Vercel 项目的 Environment Variables 中添加：

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5001
```

然后点击 Deploy。

### 4. 本地启动后端配合 Vercel 前端演示

拿到 Vercel 前端地址后，例如：

```text
https://你的-vercel-前端域名.vercel.app
```

本地启动 Flask 后端时，`CORS_ORIGINS` 要包含这个 Vercel 地址：

```bash
cd /Users/bana/shop-booking-system/backend
source .venv/bin/activate
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://你的-vercel-前端域名.vercel.app FLASK_PORT=5001 python app.py
```

如果需要先生成示例数据：

```bash
cd /Users/bana/shop-booking-system/backend
source .venv/bin/activate
python seed_data.py
```

### 5. 演示访问方式

1. 保持本地 Flask 后端终端运行。
2. 浏览器打开 Vercel 前端 URL。
3. 页面中的接口请求会访问本机 `http://127.0.0.1:5001`。
4. 可以演示首页时段、活动页、预约提交、注册登录、头像上传、预约查询和取消。

### 6. 常见问题

1. 如果 Vercel 页面显示请求失败，检查本地 Flask 后端是否正在运行。
2. 如果浏览器报跨域错误，检查本地后端启动命令中的 `CORS_ORIGINS` 是否包含真实 Vercel 地址。
3. 如果页面没有数据，执行 `python seed_data.py` 后重启后端。
4. 如果别人打开 Vercel URL 不能使用接口，是因为后端没有公网部署；当前方案只支持本地演示完整功能。

## 仓库目录结构

```text
shop-booking-system/
├── README.md                         # 项目说明文档
├── api_doc.md                        # API 接口文档
├── prompt_log.md                     # AI Prompt 使用与归档记录
├── summary.md                        # 项目总结预留文件
├── .env.example                      # 环境变量示例
├── .gitignore                        # Git 忽略规则
├── .gitattributes                    # Git 属性配置
├── backend/                          # Flask 后端项目
│   ├── app.py                        # Flask 应用入口、接口路由、异常处理、日志和跨域配置
│   ├── models.py                     # SQLAlchemy 模型：用户、预约时段、预约订单、店铺活动
│   ├── seed_data.py                  # 示例数据生成脚本
│   └── db/
│       └── init.sql                  # SQLite 建表 SQL
├── frontend/                         # Next.js 前端项目
│   ├── package.json                  # 前端依赖和 npm scripts
│   ├── package-lock.json             # 前端依赖锁定文件
│   ├── next.config.js                # Next.js 配置
│   ├── tsconfig.json                 # TypeScript 配置
│   ├── next-env.d.ts                 # Next.js TypeScript 声明文件
│   ├── app/                          # Next.js App Router 页面
│   │   ├── layout.tsx                # 全局布局
│   │   ├── globals.css               # 全局样式和主题变量
│   │   ├── error.tsx                 # 页面错误组件
│   │   ├── not-found.tsx             # 404 页面组件
│   │   ├── page.tsx                  # 首页：预约时段列表
│   │   ├── book/
│   │   │   └── page.tsx              # 预约页：提交预约订单
│   │   ├── user/
│   │   │   └── page.tsx              # 个人中心：登录注册、用户资料、预约记录
│   │   └── activity/
│   │       └── page.tsx              # 活动页：店铺活动列表
│   ├── components/
│   │   ├── Nav.tsx                   # 全局导航组件
│   │   └── StyleBlocks.tsx           # 公共样式组件：标题、状态块、状态标签
│   ├── hooks/
│   │   └── useTimeSlots.ts           # 预约时段数据请求 Hook
│   └── utils/
│       └── api.ts                    # 前端接口请求封装
├── docs/                             # 实训文档与交付物目录
│   ├── code_review/
│   │   └── day2_ai_code_review.md    # Day2 AI 代码评审记录
│   ├── demo_video/                   # 演示视频存放目录
│   ├── postman/                      # Postman 接口测试文件存放目录
│   └── prompt_screenshot/            # Prompt 截图存放目录
├── instance/                         # Flask/SQLite 本地运行生成目录，不建议提交业务数据
└── logs/                             # 后端运行日志目录
```

本地运行后可能出现以下目录或文件，通常不作为核心源码说明：

```text
frontend/node_modules/                # 前端依赖目录
frontend/.next/                       # Next.js 构建缓存
frontend/.env.local                   # 前端本地环境变量
backend/.venv/                        # Python 虚拟环境
backend/instance/shop_booking.db      # 后端本地 SQLite 数据库
backend/__pycache__/                  # Python 字节码缓存
```

## 数据库表说明

| 表名 | 说明 |
| --- | --- |
| `user` | 用户账号、密码哈希、绑定手机号、头像、用户名、性别、生日。 |
| `time_slot` | 店铺可预约日期、开始时间、结束时间、最大容量、已预约人数。 |
| `booking` | 用户预约订单，包含预约人姓名、手机号、订单状态和关联时段。 |
| `activity` | 店铺活动标题、开始时间、结束时间和优惠文案。 |

## 实训交付物清单

| 交付物 | 路径 | 说明 |
| --- | --- | --- |
| 项目源码 | `backend/`、`frontend/` | 店铺预约系统前后端源码。 |
| 数据库建表 SQL | `backend/db/init.sql` | SQLite 四张核心表：用户、预约时段、预约订单、店铺活动。 |
| 数据模型代码 | `backend/models.py` | SQLAlchemy ORM 模型和字段约束。 |
| 后端接口实现 | `backend/app.py` | Flask API、登录注册、用户资料、预约、活动、跨域、日志和异常处理。 |
| 示例数据脚本 | `backend/seed_data.py` | 生成未来一个月预约时段、示例活动和示例订单。 |
| 前端页面实现 | `frontend/app/` | 首页、预约页、活动页、个人中心、错误页和 404 页。 |
| 公共导航组件 | `frontend/components/Nav.tsx` | 页面间导航入口。 |
| 公共样式组件 | `frontend/components/StyleBlocks.tsx` | 页面标题、状态提示、状态标签等复用组件。 |
| 前端请求封装 | `frontend/utils/api.ts` | 统一 API Base URL、请求和错误处理。 |
| 数据请求 Hook | `frontend/hooks/useTimeSlots.ts` | 预约时段查询复用逻辑。 |
| API 文档 | `api_doc.md` | 接口请求方式、入参、返回示例和业务限制说明。 |
| AI 代码评审记录 | `docs/code_review/day2_ai_code_review.md` | Day2 项目代码评审与问题记录。 |
| Prompt 归档记录 | `prompt_log.md` | 实训期间 AI 生成任务记录。 |
| README 项目文档 | `README.md` | GitHub 公开仓库展示文档。 |
| Postman 测试材料 | `docs/postman/` | 接口测试集合预留目录。 |
| 演示视频 | `docs/demo_video/` | 项目运行演示视频预留目录。 |
| Prompt 截图 | `docs/prompt_screenshot/` | AI Prompt 使用截图预留目录。 |

## 常用命令

前端开发：

```bash
cd frontend
npm run dev
```

前端构建：

```bash
cd frontend
npm run build
```

后端开发：

```bash
cd backend
source .venv/bin/activate
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000 FLASK_PORT=5001 python app.py
```

生成示例数据：

```bash
cd backend
source .venv/bin/activate
python seed_data.py
```

后端生产启动示例：

```bash
gunicorn backend.app:app
```

## 公开仓库展示建议

在提交到 GitHub 前，建议确认：

1. 不提交 `.env`、`.env.local`、数据库运行文件、日志文件和依赖缓存目录。
2. README 中补充真实 Vercel 前端地址，并说明后端为本地演示地址。
3. Postman、演示视频、Prompt 截图等实训材料放入 `docs/` 对应目录。
4. 前端部署到 Vercel 后，配合本地 Flask 后端验证 `/api/health`、`/api/time-slot`、`/api/activity`、`/api/user/register`、`/api/user/login` 等接口可以正常访问。

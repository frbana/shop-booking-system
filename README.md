# shop-booking-system

店铺预约系统是一个前后端分离的实训项目，面向线下门店预约场景，支持用户查看可预约时段、提交预约信息、查询个人预约记录、取消预约订单，并展示店铺活动信息。

项目采用 `Next.js + Flask + SQLite` 实现基础业务闭环，前端适配部署到 Vercel，后端适配部署到 Render，适合作为 GitHub 公开仓库、课程实训交付和全栈入门项目展示。

## 项目功能

### 4 大页面

| 页面 | 路由 | 功能说明 |
| --- | --- | --- |
| 首页 | `/` | 展示店铺可预约日期和时段卡片，实时显示剩余名额，已约满时段不可继续选择。 |
| 预约页 | `/book` | 支持选择预约日期、预约时段，填写姓名和 11 位手机号后提交预约订单。 |
| 个人中心 | `/user` | 通过手机号查询预约记录，展示订单状态、预约时间、订单号，并支持取消正常订单。 |
| 活动页 | `/activity` | 展示店铺活动列表、活动时间、优惠文案，并根据当前时间显示未开始、进行中、已结束状态。 |

### 4 个核心后端接口

| 方法 | 接口 | 功能说明 |
| --- | --- | --- |
| `GET` | `/api/time-slot` | 查询全部预约时段，按日期和时间排序，返回最大容量、已预约人数和实时剩余人数。 |
| `POST` | `/api/book-order` | 创建预约订单，校验姓名、手机号、预约时段，防止同一手机号重复预约同一时段，并控制满员时段不可超额预约。 |
| `GET` | `/api/user/order?phone=手机号` | 根据手机号查询用户预约订单，返回订单状态、下单时间和关联预约时段信息。 |
| `PUT` | `/api/user/cancel` | 根据订单 ID 取消正常订单，更新订单状态，并释放对应预约时段名额。 |

补充接口：

| 方法 | 接口 | 功能说明 |
| --- | --- | --- |
| `GET` | `/api/activity` | 查询店铺活动列表。 |
| `GET` | `/api/health` | 健康检查接口，用于本地调试和线上部署验证。 |
| `GET` | `/api/summary` | 查询预约时段、订单和活动数量统计。 |

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 前端框架 | Next.js 14、React 18、TypeScript |
| 后端框架 | Flask、Flask-SQLAlchemy、Flask-CORS |
| 数据库 | SQLite |
| 前端部署 | Vercel |
| 后端部署 | Render |
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

可选：如果后续新增 `requirements.txt`，也可以使用：

```bash
pip install -r requirements.txt
```

## 本地启动

前端和后端需要分别启动，建议打开两个终端窗口。

### 1. 启动 Flask 后端

终端 A：

```bash
cd /Users/bana/shop-booking-system/backend
source .venv/bin/activate
python app.py
```

默认后端地址：

```text
http://localhost:5000
```

健康检查：

```text
http://localhost:5000/api/health
```

### 2. 启动 Next.js 前端

终端 B：

```bash
cd /Users/bana/shop-booking-system/frontend
npm run dev
```

默认前端地址：

```text
http://localhost:3000
```

前端默认请求后端地址为：

```text
http://localhost:5000
```

如需自定义后端地址，可在 `frontend/.env.local` 中配置：

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

## 线上 Demo

前端 Demo：

```text
待填写：https://你的-vercel-项目地址.vercel.app
```

后端 API：

```text
待填写：https://你的-render-服务地址.onrender.com
```

后端健康检查：

```text
待填写：https://你的-render-服务地址.onrender.com/api/health
```

## 部署说明

### Vercel 部署前端

1. 将项目推送到 GitHub 公开仓库。
2. 在 Vercel 导入该 GitHub 仓库。
3. Vercel 项目配置：
   - Framework Preset：`Next.js`
   - Root Directory：`frontend`
   - Build Command：`npm run build`
   - Install Command：`npm install`
4. 配置环境变量：

```env
NEXT_PUBLIC_API_BASE_URL=https://你的-render-后端域名.onrender.com
```

### Render 部署后端

1. 在 Render 创建 Web Service。
2. 连接 GitHub 仓库。
3. Render 服务配置：
   - Runtime：`Python 3`
   - Build Command：`pip install Flask Flask-SQLAlchemy flask-cors python-dotenv gunicorn`
   - Start Command：`gunicorn backend.app:app`
4. 配置环境变量：

```env
APP_ENV=production
FLASK_ENV=production
SECRET_KEY=请替换为复杂随机字符串
DATABASE_URL=sqlite:///shop_booking.db
CORS_ORIGINS=https://你的-vercel-前端域名.vercel.app
LOG_DIR=logs
```

说明：Render 免费服务的本地文件系统不适合长期保存 SQLite 数据。实训演示可以使用 SQLite，生产场景建议迁移到 PostgreSQL、Supabase 或 Neon。

## 仓库目录结构

```text
shop-booking-system/
├── README.md                         # 项目说明文档
├── api_doc.md                        # 接口文档预留文件
├── prompt_log.md                     # AI Prompt 使用与归档记录
├── summary.md                        # 项目总结预留文件
├── .env.example                      # 环境变量示例
├── .gitignore                        # Git 忽略规则
├── .gitattributes                    # Git 属性配置
├── backend/                          # Flask 后端项目
│   ├── app.py                        # Flask 应用入口、接口路由、异常处理、日志和跨域配置
│   ├── models.py                     # SQLAlchemy 数据模型：预约时段、预约订单、店铺活动
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
│   │   ├── globals.css               # 全局样式
│   │   ├── page.tsx                  # 首页：预约时段列表
│   │   ├── book/
│   │   │   └── page.tsx              # 预约页：提交预约订单
│   │   ├── user/
│   │   │   └── page.tsx              # 个人中心：查询和取消预约
│   │   └── activity/
│   │       └── page.tsx              # 活动页：店铺活动列表
│   ├── components/
│   │   └── Nav.tsx                   # 全局导航组件
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
backend/__pycache__/                  # Python 字节码缓存
```

## 实训交付物清单

| 交付物 | 路径 | 说明 |
| --- | --- | --- |
| 项目源码 | `backend/`、`frontend/` | 店铺预约系统前后端源码。 |
| 数据库建表 SQL | `backend/db/init.sql` | SQLite 三张核心表：预约时段、预约订单、店铺活动。 |
| 数据模型代码 | `backend/models.py` | SQLAlchemy ORM 模型和字段约束。 |
| 后端接口实现 | `backend/app.py` | Flask API、跨域、日志、异常处理和业务逻辑。 |
| 前端页面实现 | `frontend/app/` | 首页、预约页、个人中心、活动页。 |
| 公共导航组件 | `frontend/components/Nav.tsx` | 页面间导航入口。 |
| 前端请求封装 | `frontend/utils/api.ts` | 统一 API Base URL、请求和错误处理。 |
| 数据请求 Hook | `frontend/hooks/useTimeSlots.ts` | 预约时段查询复用逻辑。 |
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
python app.py
```

后端生产启动示例：

```bash
gunicorn backend.app:app
```

## 公开仓库展示建议

在提交到 GitHub 前，建议确认：

1. 不提交 `.env`、数据库运行文件、日志文件和依赖缓存目录。
2. README 中补充真实 Vercel 前端地址和 Render 后端地址。
3. Postman、演示视频、Prompt 截图等实训材料放入 `docs/` 对应目录。
4. 线上部署后验证 `/api/health`、`/api/time-slot`、`/api/activity` 等接口可以正常访问。

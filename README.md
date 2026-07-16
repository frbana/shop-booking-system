# shop-booking-system
店铺预约系统实训项目

## Vercel + Render 免费部署教程

本项目采用 Next.js 前端部署到 Vercel，Flask 后端部署到 Render。部署前先把代码推送到 GitHub 公开仓库。

### 1. GitHub 公开仓库绑定 Vercel

1. 登录 GitHub，新建公开仓库，例如 `shop-booking-system`。
2. 在本地项目目录提交代码并推送：

```bash
git add .
git commit -m "init shop booking system"
git branch -M main
git remote add origin https://github.com/你的用户名/shop-booking-system.git
git push -u origin main
```

3. 登录 Vercel，点击 `Add New Project`。
4. 选择刚才的 GitHub 仓库并导入。
5. 前端代码在 `frontend` 目录时，Vercel 配置如下：
   - Framework Preset：`Next.js`
   - Root Directory：`frontend`
   - Build Command：`npm run build`
   - Output Directory：保持默认
   - Install Command：`npm install`
6. 配置前端环境变量：

```env
NEXT_PUBLIC_API_BASE_URL=https://你的-render-后端域名.onrender.com
```

7. 点击 Deploy，部署完成后会得到 Vercel 域名，例如：

```text
https://shop-booking-system.vercel.app
```

### 2. Render 部署 Flask 后端

1. 登录 Render，点击 `New +`，选择 `Web Service`。
2. 连接 GitHub 仓库，选择 `shop-booking-system`。
3. 后端代码在 `backend` 目录时，Render 配置如下：
   - Name：`shop-booking-api`
   - Runtime：`Python 3`
   - Region：选择默认或离用户较近的区域
   - Branch：`main`
   - Root Directory：留空或填写项目根目录，按仓库结构决定
   - Build Command：

```bash
pip install -r backend/requirements.txt
```

   - Start Command：

```bash
gunicorn backend.app:app
```

4. 如果项目还没有 `requirements.txt`，后端至少需要包含：

```txt
Flask
Flask-SQLAlchemy
flask-cors
python-dotenv
gunicorn
```

5. Render 环境变量建议填写：

```env
APP_ENV=production
FLASK_ENV=production
SECRET_KEY=请换成复杂随机字符串
DATABASE_URL=sqlite:///shop_booking.db
CORS_ORIGINS=https://你的-vercel-前端域名.vercel.app
LOG_DIR=logs
```

6. Python 版本可通过项目根目录添加 `runtime.txt` 指定：

```txt
python-3.11.9
```

7. 部署完成后，Render 会提供后端域名，例如：

```text
https://shop-booking-api.onrender.com
```

可以访问健康检查接口确认后端是否正常：

```text
https://shop-booking-api.onrender.com/api/health
```

### 3. 前后端跨域地址修改与线上域名适配

前端调用后端时，不要写死 localhost。Next.js 使用环境变量：

```env
NEXT_PUBLIC_API_BASE_URL=https://shop-booking-api.onrender.com
```

后端 Flask 需要允许 Vercel 前端域名跨域访问：

```env
CORS_ORIGINS=https://shop-booking-system.vercel.app
```

如果本地和线上都要支持，可以用英文逗号分隔：

```env
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://shop-booking-system.vercel.app
```

本地开发时：

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

线上部署时：

```env
NEXT_PUBLIC_API_BASE_URL=https://shop-booking-api.onrender.com
```

修改环境变量后，需要重新部署 Vercel 和 Render，配置才会生效。

### 4. 免费部署常见问题

#### 4.1 Render 免费服务首次访问慢或超时

Render 免费服务长时间无人访问会休眠。再次访问时需要冷启动，可能等待几十秒。

处理方式：

1. 前端页面增加加载提示，避免用户误以为页面坏了。
2. 首次打开前先访问后端健康检查接口 `/api/health`。
3. 使用定时任务服务定期访问后端，但免费平台可能限制此类保活方式。
4. 重要项目建议升级 Render 付费实例。

#### 4.2 SQLite 数据库持久化问题

Render 免费 Web Service 的本地文件系统不适合长期保存 SQLite 数据。重新部署、实例迁移或服务重启后，SQLite 文件可能丢失或回退。

处理方式：

1. 学习和演示项目可以继续使用 SQLite。
2. 需要真实线上保存预约数据时，建议改用 Render PostgreSQL、Supabase PostgreSQL 或 Neon PostgreSQL。
3. 如果必须短期使用 SQLite，避免把数据库文件放在临时目录，并提前说明数据不保证持久。

#### 4.3 Vercel 前端请求后端失败

常见原因：

1. `NEXT_PUBLIC_API_BASE_URL` 没有填写 Render 后端域名。
2. Flask 后端 `CORS_ORIGINS` 没有包含 Vercel 前端域名。
3. 后端还在冷启动，第一次请求超时。
4. 接口地址写成了 `/api/...`，但前端部署后这个地址会指向 Vercel 自己，不是 Render。

排查方式：

1. 打开浏览器开发者工具，查看 Network 请求地址。
2. 确认请求地址是 `https://你的后端.onrender.com/api/...`。
3. 直接在浏览器访问 Render 后端接口，看是否有 JSON 返回。
4. 修改环境变量后重新部署。

#### 4.4 Render 启动失败

常见原因：

1. `requirements.txt` 缺少依赖。
2. Start Command 写错。
3. Flask app 实例路径写错。
4. Python 版本不兼容。

本项目推荐启动命令：

```bash
gunicorn backend.app:app
```

如果 Render 日志提示找不到模块，需要确认：

1. 仓库里存在 `backend/app.py`。
2. `app.py` 中有 `app = create_app()`。
3. Build Command 已正确安装依赖。

### 5. 部署检查清单

部署前确认：

1. GitHub 仓库是公开仓库。
2. Vercel Root Directory 设置为 `frontend`。
3. Vercel 配置了 `NEXT_PUBLIC_API_BASE_URL`。
4. Render Start Command 使用 `gunicorn backend.app:app`。
5. Render 配置了 `CORS_ORIGINS`，值是 Vercel 前端域名。
6. 后端 `/api/health` 可以访问。
7. 前端首页可以请求 `/api/time-slot`。
8. 预约、活动、个人中心接口在浏览器 Network 中返回正常 JSON。

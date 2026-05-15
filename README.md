# Free Baidu AI Imaging

百度AI生图服务的 OpenAI 兼容 API。

## 安装

```bash
npm install
```

## 启动

```bash
npm start
```

## API

### 生成图片

```bash
curl -X POST http://localhost:3000/v1/images/generations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "一只可爱的猫咪", "n": 1}'
```

### 响应格式

```json
{
  "created": 1699999999,
  "data": [{"url": "https://...", "revised_prompt": "..."}]
}
```

## 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/v1/images/generations` | 生成图片 |
| GET | `/health` | 健康检查 |

## 注意

- 首次运行会自动下载 Playwright 浏览器
- 图片生成约需 30-60 秒
- 返回的 URL 有效期有限，请及时保存

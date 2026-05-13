# 百度AI生图 API

百度AI生图服务的 OpenAI 兼容 API 封装。

## 快速开始

```bash
npm install
npm start
```

## API 使用

### OpenAI 兼容接口

```bash
curl -X POST http://localhost:3000/v1/images/generations \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只可爱的橘猫在草地上玩耍",
    "n": 1,
    "size": "1024x1024"
  }'
```

### Python 示例

```python
import requests

response = requests.post(
    "http://localhost:3000/v1/images/generations",
    json={"prompt": "一只可爱的橘猫在草地上玩耍", "n": 1}
)

result = response.json()
print(result["data"][0]["url"])
```

## 响应格式

```json
{
  "created": 1699999999,
  "data": [
    {
      "url": "https://gips0.baidu.com/...",
      "revised_prompt": "一只可爱的橘猫在草地上玩耍"
    }
  ]
}
```

## 端点

| 端点 | 说明 |
|------|------|
| `POST /v1/images/generations` | OpenAI 兼容的图片生成 |
| `GET /health` | 健康检查 |

## 注意事项

1. 首次运行会自动下载 Playwright 浏览器
2. 图片生成约需 30-60 秒
3. 返回的 URL 有效期有限，请及时下载保存

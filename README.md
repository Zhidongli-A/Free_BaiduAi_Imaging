# Free Baidu AI Imaging

基于百度AI生图服务的 OpenAI 兼容 API。无需 OpenAI API Key，免费生成高质量图片。

## 特性

- **OpenAI 兼容**：完全兼容 OpenAI Images API 格式
- **免费使用**：基于百度AI生图，无需付费
- **即插即用**：可接入任何支持 OpenAI API 的客户端/工具
- **中文优化**：对中文提示词支持良好

## 安装

```bash
npm install
```

## 启动

```bash
npm start
```

服务默认运行在 `http://localhost:3000`

## API 使用

### 生成图片

**请求：**

```bash
curl -X POST http://localhost:3000/v1/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-any-key" \
  -d '{
    "prompt": "一只可爱的橘猫在草地上晒太阳",
    "n": 1,
    "size": "1024x1024",
    "model": "dall-e-3"
  }'
```

**响应：**

```json
{
  "created": 1699999999,
  "data": [
    {
      "url": "https://gips0.baidu.com/...",
      "revised_prompt": "一只可爱的橘猫在草地上晒太阳"
    }
  ]
}
```

### 请求参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `prompt` | string | 是 | 图片描述，支持中文 |
| `n` | integer | 否 | 生成数量（1-4），默认 1 |
| `size` | string | 否 | 图片尺寸，默认 1024x1024 |
| `model` | string | 否 | 模型名称，默认 dall-e-3 |
| `response_format` | string | 否 | 返回格式：url 或 b64_json |

### 端点列表

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/v1/images/generations` | 生成图片 |
| GET | `/health` | 健康检查 |

## 接入 OpenAI 客户端

由于 API 完全兼容 OpenAI 格式，你可以将其接入任何支持 OpenAI API 的工具：

### Python 示例

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="sk-any-key"  # 任意值即可
)

response = client.images.generate(
    model="dall-e-3",
    prompt="一只可爱的猫咪",
    n=1,
    size="1024x1024"
)

print(response.data[0].url)
```

### 配置第三方工具

在支持 OpenAI API 的工具中，设置：
- **API Base URL**: `http://localhost:3000/v1`
- **API Key**: 任意值（如 `sk-free`）

## 注意事项

- 首次运行会自动下载 Playwright 浏览器（约 100MB）
- 图片生成约需 30-60 秒
- 返回的 URL 有效期有限，请及时下载保存
- 建议配合代理使用以提高稳定性

## 许可证

MIT

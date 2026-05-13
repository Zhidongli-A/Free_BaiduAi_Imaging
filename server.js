const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const BaiduImageGenerator = require('./baidu_image_generator');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ charset: 'utf-8' }));

// 确保所有响应都使用 UTF-8 编码
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// 创建图片生成器实例池
const generatorPool = [];
const MAX_POOL_SIZE = 3;

async function getGenerator() {
  // 查找空闲的生成器
  const availableGenerator = generatorPool.find(g => !g.inUse);
  if (availableGenerator) {
    availableGenerator.inUse = true;
    return availableGenerator.generator;
  }
  
  // 如果池未满，创建新实例
  if (generatorPool.length < MAX_POOL_SIZE) {
    const generator = new BaiduImageGenerator();
    await generator.init();
    generatorPool.push({ generator, inUse: true });
    return generator;
  }
  
  // 等待可用实例
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const available = generatorPool.find(g => !g.inUse);
      if (available) {
        clearInterval(checkInterval);
        available.inUse = true;
        resolve(available.generator);
      }
    }, 500);
  });
}

function releaseGenerator(generator) {
  const poolItem = generatorPool.find(g => g.generator === generator);
  if (poolItem) {
    poolItem.inUse = false;
  }
}

// OpenAI 兼容的图像生成 API
app.post('/v1/images/generations', async (req, res) => {
  try {
    const { 
      prompt, 
      n = 1, 
      size = '1024x1024', 
      response_format = 'url',
      model = 'dall-e-3'
    } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: {
          message: 'Missing required parameter: prompt',
          type: 'invalid_request_error',
          code: 'missing_prompt'
        }
      });
    }

    // 调试日志：打印接收到的原始提示词
    console.log(`[${new Date().toISOString()}] 收到生成请求: "${prompt}"`);
    console.log(`[DEBUG] Prompt length: ${prompt.length}, char codes: ${[...prompt].slice(0, 10).map(c => c.charCodeAt(0).toString(16))}`);

    const generator = await getGenerator();
    
    try {
      const result = await generator.generateImage(prompt);
      
      // 构建 OpenAI 格式的响应
      const data = [];
      
      // 根据请求的n值返回相应数量的图片
      const urlsToReturn = result.all_urls.slice(0, Math.min(n, result.all_urls.length));
      
      for (let i = 0; i < urlsToReturn.length; i++) {
        const imageData = {
          url: urlsToReturn[i],
          revised_prompt: prompt
        };
        
        if (response_format === 'b64_json') {
          // 如果需要base64格式，可以在这里转换
          imageData.b64_json = null; // 暂时不支持
        }
        
        data.push(imageData);
      }

      const response = {
        created: Math.floor(Date.now() / 1000),
        data: data
      };

      console.log(`[${new Date().toISOString()}] 生成完成，返回 ${data.length} 张图片`);
      
      res.json(response);
      
    } finally {
      releaseGenerator(generator);
    }
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Internal server error',
        type: 'api_error',
        code: 'internal_error'
      }
    });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    pool_size: generatorPool.length,
    available: generatorPool.filter(g => !g.inUse).length
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    name: '百度AI生图逆向API',
    version: '1.0.0',
    endpoints: {
      'OpenAI兼容': '/v1/images/generations (POST)',
      '健康检查': '/health (GET)'
    },
    usage: {
      openai: {
        url: '/v1/images/generations',
        method: 'POST',
        body: {
          prompt: '描述你想要生成的图片',
          n: 1,
          size: '1024x1024'
        }
      }
    }
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           百度AI生图逆向API服务已启动                       ║
╠════════════════════════════════════════════════════════════╣
║  端口: ${PORT}                                               ║
║  OpenAI API: http://localhost:${PORT}/v1/images/generations  ║
║  健康检查:   http://localhost:${PORT}/health                 ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n正在关闭服务...');
  for (const item of generatorPool) {
    await item.generator.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n正在关闭服务...');
  for (const item of generatorPool) {
    await item.generator.close();
  }
  process.exit(0);
});

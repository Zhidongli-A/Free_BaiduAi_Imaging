const { chromium } = require('playwright');

class BaiduImageGenerator {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('正在启动浏览器...');
    this.browser = await chromium.launch({
      headless: true,
      channel: 'chrome',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    this.page = await this.browser.newPage({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    this.page.setDefaultTimeout(60000);
    this.page.setDefaultNavigationTimeout(120000);

    console.log('浏览器启动成功');
  }

  async generateImage(prompt) {
    if (!this.page) {
      await this.init();
    }

    try {
      // 1. 打开URL
      console.log('Step 1: 打开百度AI页面...');
      await this.page.goto('https://chat.baidu.com/?enter_type=chat_url', {
        waitUntil: 'domcontentloaded',
        timeout: 120000
      });

      await this.page.waitForTimeout(5000);
      console.log('  ✓ 页面加载完成');

      // 2. 点击AI生图按钮
      console.log('Step 2: 点击AI生图按钮...');
      const aiImageButton = await this.page.locator('div').filter({ hasText: /^AI生图$/ }).first();
      await aiImageButton.waitFor({ state: 'visible', timeout: 15000 });
      await aiImageButton.click();
      console.log('  ✓ 已点击AI生图按钮');
      await this.page.waitForTimeout(3000);

      // 3. 点击输入框并输入提示词
      console.log('Step 3: 输入提示词...');
      await this.page.waitForTimeout(2000);

      const inputBox = await this.page.locator('div[contenteditable="true"]').first();
      await inputBox.waitFor({ state: 'visible', timeout: 20000 });

      await inputBox.click();
      await this.page.waitForTimeout(500);

      await this.page.keyboard.press('Control+a');
      await this.page.waitForTimeout(200);
      await this.page.keyboard.press('Delete');
      await this.page.waitForTimeout(200);

      await inputBox.fill(prompt);
      await this.page.waitForTimeout(1000);

      const inputValue = await inputBox.textContent();
      console.log(`  ✓ 已输入提示词: "${inputValue}"`);

      // 4. 点击发送按钮
      console.log('Step 4: 点击发送按钮...');
      const sendButton = await this.page.locator('#ci-submit-button-ai');
      await sendButton.waitFor({ state: 'visible', timeout: 15000 });
      await sendButton.click();
      console.log('  ✓ 已点击发送按钮');

      // 5. 等待页面响应和重定向
      console.log('Step 5: 等待页面响应...');
      await this.page.waitForTimeout(5000);

      // 6. 等待生成完成
      console.log('Step 6: 等待图片生成完成...');
      await this.waitForGenerationComplete();

      // 7. 获取4个图片URL
      console.log('Step 7: 获取生成的图片URL...');
      const imageUrls = await this.getImageUrls();

      // 8. 随机选择一个URL
      const selectedUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)];

      console.log('✓ 图片生成完成！');

      return {
        success: true,
        prompt: prompt,
        all_urls: imageUrls,
        selected_url: selectedUrl,
        created_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('生成图片时出错:', error);
      await this.page.screenshot({ path: 'debug_error.png' });
      throw error;
    }
  }

  async waitForGenerationComplete() {
    const maxWaitTime = 300000;
    const checkInterval = 3000;
    const startTime = Date.now();
    let lastPercentage = '';
    let lastLogTime = 0;
    let imagesDetected = false;

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const loadingElements = await this.page.locator('text=/收集中|生成中|[0-9]+%/').all();
        let isLoading = false;

        for (const el of loadingElements) {
          if (await el.isVisible().catch(() => false)) {
            const text = await el.textContent();
            if (text && text !== lastPercentage) {
              console.log(`  生成进度: ${text}`);
              lastPercentage = text;
            }
            isLoading = true;
          }
        }

        const images = await this.page.locator('._image-visible_c32gq_184').all();

        if (images.length >= 4 && !imagesDetected) {
          console.log(`  ✓ 检测到 ${images.length} 张生成的图片！`);
          imagesDetected = true;
        }

        if (imagesDetected && !isLoading) {
          console.log('  图片生成完成，等待图片完全加载...');
          await this.page.waitForTimeout(5000);
          return;
        }

        if (Date.now() - lastLogTime > 30000) {
          console.log('  仍在等待图片生成...');
          lastLogTime = Date.now();
        }

      } catch (e) {}

      await this.page.waitForTimeout(checkInterval);
    }

    throw new Error('等待图片生成超时（超过5分钟）');
  }

  async getImageUrls() {
    const images = await this.page.locator('._image-visible_c32gq_184').all();
    console.log(`  找到 ${images.length} 张生成的图片`);

    let urls = [];
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src && !urls.includes(src)) {
        urls.push(src);
      }
    }

    if (urls.length === 0) {
      await this.page.screenshot({ path: 'debug_no_images.png' });
      throw new Error('未能获取到生成的图片URL');
    }

    console.log(`  ✓ 成功获取 ${urls.length} 张图片URL`);
    return urls.slice(0, 4);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

module.exports = BaiduImageGenerator;

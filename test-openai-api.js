const http = require('http');

const postData = JSON.stringify({
  prompt: '一只可爱的猫咪',
  n: 1,
  size: '1024x1024'
});

const options = {
  hostname: 'localhost',

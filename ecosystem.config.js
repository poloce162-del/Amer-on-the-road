module.exports = {
  apps: [
    {
      name: 'amer-on-the-road',
      script: './server/server.js',
      instances: 'max',
      exec_mode: 'cluster'
    }
  ]
};
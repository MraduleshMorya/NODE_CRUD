module.exports = {
  apps: [{
    name: "love-after-provider-backend",
    script: "./app.js",
    env: {
      NODE_ENV: "development"
    },
    env_test: {
      NODE_ENV: "local",
    },
    env_staging: {
      NODE_ENV: "staging",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
}
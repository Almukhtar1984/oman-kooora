module.exports = {
  apps: [
    {
      name: "omkoora-backend",
      cwd: "/home/user/web/omkoora-backend.souftech.com/public_html/server",
      script: "./scripts/start-production.mjs",
      watch: false,
      env_production: {
        NODE_ENV: "production",
        PORT: "7001",
      },
    },
    {
      name: "omkoora-club",
      cwd: "/home/user/web/omkoora-club.souftech.com/public_html/client/club",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      watch: false,
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "omkoora-team",
      cwd: "/home/user/web/omkoora-team.souftech.com/public_html/client/team",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3008",
      watch: false,
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "omkoora-plyer",
      cwd: "/home/user/web/omkoora-plyer.souftech.com/public_html/client/plyer",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 30010",
      watch: false,
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "omkoora-super-admin",
      cwd: "/home/user/web/omkoora-super-admin.souftech.com/public_html/client/super-admin",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3006",
      watch: false,
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};


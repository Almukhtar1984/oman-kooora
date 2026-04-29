module.exports = {
    apps : [
        {
            name: "ApiPro",
            script: "./src/app.mjs",
            watch: false,
            exec_mode: "fork",
            instances: 1,
            max_memory_restart: "400M",
            env: {
                "NODE_ENV": "production",
                "PORT": process.env.PORT || 8000
            },
            env_production: {
                "NODE_ENV": "production",
            },
        }
    ]
}
module.exports = {
    apps : [
        {
            name: "DorrahApi",
            script: "./scripts/start-production.mjs",
            // node_args: "-r esm",
            watch: false,
            env: {
                "NODE_ENV": "development",
            },
            production_env: {
                "NODE_ENV": "production",
            },
        }
    ]
}

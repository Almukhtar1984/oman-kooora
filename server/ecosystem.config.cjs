module.exports = {
    apps : [
        {
            name: "DorrahApi",
            script: "./app.mjs",
            // node_args: "-r esm",
            watch: true,
            env: {
                "NODE_ENV": "development",
            },
            production_env: {
                "NODE_ENV": "production",
            },
        }
    ]
}
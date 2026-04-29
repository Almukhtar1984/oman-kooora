import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "https://api-employees.qafilaty.com/graphql",
  documents: "graphql/**/*.graphql",
  generates: {
    "generated/gql/": {
      preset: "client",
      plugins: [],
    },
  },
};

export default config;

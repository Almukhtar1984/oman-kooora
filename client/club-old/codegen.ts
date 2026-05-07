import type { CodegenConfig } from "@graphql-codegen/cli";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7001";
const graphqlSchemaUrl = `${apiUrl.replace(/\/$/, "")}/graphql`;

const config: CodegenConfig = {
  overwrite: true,
  schema: graphqlSchemaUrl,
  documents: "graphql/**/*.graphql",
  generates: {
    "generated/gql/": {
      preset: "client",
      plugins: [],
    },
  },
};

export default config;

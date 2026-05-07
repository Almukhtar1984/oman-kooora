import {GraphQLError, Kind} from "graphql";

const DEFAULT_MAX_DEPTH = 8;
const DEFAULT_MAX_COMPLEXITY = 500;

const parsePositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const getFragmentMap = (context) => {
    const fragments = new Map();

    for (const definition of context.getDocument().definitions) {
        if (definition.kind === Kind.FRAGMENT_DEFINITION) {
            fragments.set(definition.name.value, definition);
        }
    }

    return fragments;
}

const isIgnoredField = (field) => {
    return ["__typename", "__schema", "__type"].includes(field.name.value);
}

const getDepth = (selectionSet, fragments, currentDepth = 0, visitedFragments = new Set()) => {
    if (!selectionSet) return currentDepth;

    let maxDepth = currentDepth;

    for (const selection of selectionSet.selections) {
        if (selection.kind === Kind.FIELD) {
            if (isIgnoredField(selection)) continue;

            const fieldDepth = getDepth(
                selection.selectionSet,
                fragments,
                currentDepth + 1,
                new Set(visitedFragments)
            );

            maxDepth = Math.max(maxDepth, fieldDepth);
        }

        if (selection.kind === Kind.INLINE_FRAGMENT) {
            maxDepth = Math.max(
                maxDepth,
                getDepth(selection.selectionSet, fragments, currentDepth, new Set(visitedFragments))
            );
        }

        if (selection.kind === Kind.FRAGMENT_SPREAD) {
            const fragmentName = selection.name.value;
            if (visitedFragments.has(fragmentName)) continue;

            const fragment = fragments.get(fragmentName);
            if (!fragment) continue;

            const nextVisitedFragments = new Set(visitedFragments);
            nextVisitedFragments.add(fragmentName);

            maxDepth = Math.max(
                maxDepth,
                getDepth(fragment.selectionSet, fragments, currentDepth, nextVisitedFragments)
            );
        }
    }

    return maxDepth;
}

const getComplexity = (selectionSet, fragments, visitedFragments = new Set()) => {
    if (!selectionSet) return 0;

    let complexity = 0;

    for (const selection of selectionSet.selections) {
        if (selection.kind === Kind.FIELD) {
            if (isIgnoredField(selection)) continue;

            complexity += 1 + getComplexity(selection.selectionSet, fragments, new Set(visitedFragments));
        }

        if (selection.kind === Kind.INLINE_FRAGMENT) {
            complexity += getComplexity(selection.selectionSet, fragments, new Set(visitedFragments));
        }

        if (selection.kind === Kind.FRAGMENT_SPREAD) {
            const fragmentName = selection.name.value;
            if (visitedFragments.has(fragmentName)) continue;

            const fragment = fragments.get(fragmentName);
            if (!fragment) continue;

            const nextVisitedFragments = new Set(visitedFragments);
            nextVisitedFragments.add(fragmentName);

            complexity += getComplexity(fragment.selectionSet, fragments, nextVisitedFragments);
        }
    }

    return complexity;
}

export const createGraphqlDepthLimitRule = (maxDepth = DEFAULT_MAX_DEPTH) => {
    const limit = parsePositiveInt(maxDepth, DEFAULT_MAX_DEPTH);

    return (context) => {
        const fragments = getFragmentMap(context);

        return {
            OperationDefinition(node) {
                const depth = getDepth(node.selectionSet, fragments);

                if (depth > limit) {
                    context.reportError(new GraphQLError(
                        `GraphQL operation exceeds max depth of ${limit}`,
                        {
                            nodes: [node],
                            extensions: {
                                code: "GRAPHQL_DEPTH_LIMIT",
                                depth,
                                maxDepth: limit
                            }
                        }
                    ));
                }
            }
        };
    };
}

export const createGraphqlComplexityLimitRule = (maxComplexity = DEFAULT_MAX_COMPLEXITY) => {
    const limit = parsePositiveInt(maxComplexity, DEFAULT_MAX_COMPLEXITY);

    return (context) => {
        const fragments = getFragmentMap(context);

        return {
            OperationDefinition(node) {
                const complexity = getComplexity(node.selectionSet, fragments);

                if (complexity > limit) {
                    context.reportError(new GraphQLError(
                        `GraphQL operation exceeds max complexity of ${limit}`,
                        {
                            nodes: [node],
                            extensions: {
                                code: "GRAPHQL_COMPLEXITY_LIMIT",
                                complexity,
                                maxComplexity: limit
                            }
                        }
                    ));
                }
            }
        };
    };
}

export const buildGraphqlValidationRules = () => [
    createGraphqlDepthLimitRule(process.env.GRAPHQL_MAX_DEPTH),
    createGraphqlComplexityLimitRule(process.env.GRAPHQL_MAX_COMPLEXITY)
];

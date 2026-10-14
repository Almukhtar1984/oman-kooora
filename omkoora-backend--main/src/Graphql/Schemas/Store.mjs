import {gql} from "apollo-server-express";

// Stores module — a store is a standalone unit with its own owner login
// (role 8), mirroring the stadium-owner model. Deliberately simple: product
// listing + a purchase request that reaches the owner. No inventory system and
// no online payment (cash on delivery only for now).
export const typeDefs = gql`

    extend type Query {
        # ── Public (mobile app / landing) — no token, safe read-only ──────────
        stores: [Store!]
        store(id: ID!): Store
        storeProducts(idStore: ID!): [Product!]
        product(id: ID!): Product

        # ── Store-owner dashboard (role 8, @auth) ─────────────────────────────
        myStore: Store                 # the owner's first store (convenience)
        myStores: [Store!] @auth(requires: user)
        myStoreProducts: [Product!] @auth(requires: user)
        myStoreOrders: [Order!] @auth(requires: user)
        # Simple sales report: one row per owned store (order count + total).
        myStoreReport: [StoreReport!] @auth(requires: user)
    }

    extend type Mutation {
        # ── Super-admin provisioning (role 1) ─────────────────────────────────
        provisionStoreOwner(email: String!, password: String!): User! @auth(requires: user)

        # ── Owner management (role 8) ─────────────────────────────────────────
        createStore(content: contentStore!): Store! @auth(requires: user)
        updateStore(id: ID!, content: contentStore!): statusUpdate @auth(requires: user)
        createProduct(content: contentProduct!): Product! @auth(requires: user)
        updateProduct(id: ID!, content: contentProduct!): statusUpdate @auth(requires: user)
        deleteProduct(id: ID!): statusDelete @auth(requires: user)
        updateOrderStatus(idOrder: ID!, status: String!): statusUpdate @auth(requires: user)

        # ── Public purchase request (from the app) — no token ─────────────────
        createOrder(content: contentOrder!): Order!
    }

    type Store {
        id:         ID
        name:       String
        about:      String
        logo:       String
        images:     String
        phone:      String
        whatsapp:   String
        mohafada:   String
        wiliya:     String
        is_active:  Boolean
        id_user:    ID        # owning store-owner account (role 8), if any
        owner:      User      # the store-owner account
        products:   [Product]
        createdAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:  Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    type Product {
        id:            ID
        name:          String
        about:         String
        price:         Float
        quantity:      Int
        images:        String
        is_available:  Boolean
        id_store:      ID
        store:         Store
        createdAt:     Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:     Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    type Order {
        id:             ID
        full_name:      String
        phone:          String
        address:        String
        note:           String
        total:          Float
        status:         String
        payment_method: String
        payment_status: String
        id_store:       ID
        store:          Store
        items:          [OrderItem]
        createdAt:      Date  @date(format: "yyyy-MM-dd HH:mm:ss")
        updatedAt:      Date  @date(format: "yyyy-MM-dd HH:mm:ss")
    }

    type OrderItem {
        id:           ID
        product_name: String
        price:        Float
        quantity:     Int
        id_product:   ID
        product:      Product
    }

    # One row per owned store for the simple sales report.
    type StoreReport {
        id_store:     ID
        store_name:   String
        orders_count: Int
        total_sales:  Float
    }

    input contentStore {
        name:      String
        about:     String
        phone:     String
        whatsapp:  String
        mohafada:  String
        wiliya:    String
        is_active: Boolean
        logo:      Upload
        images:    [Upload]
    }

    input contentProduct {
        name:         String
        about:        String
        price:        Float
        quantity:     Int
        is_available: Boolean
        id_store:     ID
        images:       [Upload]
    }

    input orderItemInput {
        id_product: ID!
        quantity:   Int
    }

    input contentOrder {
        full_name: String!
        phone:     String!
        address:   String
        note:      String
        id_store:  ID!
        items:     [orderItemInput!]!
    }
`;

import { ApolloError } from 'apollo-server-express';
import sequelize from 'sequelize';
import dotenv from 'dotenv';
import path from "path";
import { createWriteStream } from "fs";
import { v4 as UUID } from "uuid";

import logger from "../../Config/logger.mjs";
import { User, Permission, Store, Product, Order, OrderItem, Notification } from '../../Models/index.mjs';
import { hashPassword } from "../../Helpers/index.mjs";
import { sendPushToUser } from "../../Config/firebase.mjs";
import { __dirname } from "../../app.mjs";

dotenv.config();

const { Op } = sequelize;

const STORE_OWNER_ROLE = "8";
const SUPER_ADMIN_ROLE = "1";
const FULL_GRANT = "1,2,3,4,5,6,7,8,9,10";
const ORDER_STATUSES = ["waiting", "accepted", "rejected", "delivered"];
const IMG_TYPES = ["JPEG", "JPG", "PNG", "WEBP"];

// Save a single Upload stream to /uploads and return the stored filename.
// Returns null for a non-image so callers can reject.
const saveImage = async (upload) => {
    const { createReadStream, filename } = await upload;
    const parts = String(filename || "").split(".");
    const imgType = parts[parts.length - 1].toUpperCase();
    if (IMG_TYPES.indexOf(imgType) === -1) return null;
    const imgUniqName = `${UUID()}.${imgType}`;
    const pathName = path.join(__dirname, `./../uploads/${imgUniqName}`);
    const stream = createReadStream();
    await stream.pipe(createWriteStream(pathName));
    return imgUniqName;
};

// Save an array of Uploads → comma-separated filenames (or "" when none).
const saveImages = async (uploads) => {
    if (!uploads || uploads.length === 0) return "";
    const names = [];
    for (let i = 0; i < uploads.length; i++) {
        const name = await saveImage(uploads[i]);
        if (!name) throw new ApolloError("This file is not image");
        names.push(name);
    }
    return names.join(",");
};

// The ids of every store the signed-in owner holds. [] when not authed.
const ownedStoreIds = async (context) => {
    const user = context?.user;
    if (!context?.isAuth || !user) return [];
    const stores = await Store.findAll({ where: { id_user: user.id }, attributes: ["id"], raw: true });
    return stores.map((s) => s.id);
};

export const resolvers = {
    Query: {
        // ── Public ────────────────────────────────────────────────────────────
        stores: async () => {
            try {
                return await Store.findAll({ where: { is_active: true }, order: [["createdAt", "DESC"]] });
            } catch (error) {
                logger.error(`stores: ${error?.message}`);
                throw new ApolloError(error);
            }
        },

        store: async (obj, { id }) => {
            try {
                if (!id) return null;
                return await Store.findByPk(id);
            } catch (error) {
                logger.error(`store: ${error?.message}`);
                throw new ApolloError(error);
            }
        },

        storeProducts: async (obj, { idStore }) => {
            try {
                if (!idStore) return [];
                return await Product.findAll({
                    where: { id_store: idStore, is_available: true },
                    order: [["createdAt", "DESC"]],
                });
            } catch (error) {
                logger.error(`storeProducts: ${error?.message}`);
                throw new ApolloError(error);
            }
        },

        product: async (obj, { id }) => {
            try {
                if (!id) return null;
                return await Product.findByPk(id);
            } catch (error) {
                logger.error(`product: ${error?.message}`);
                throw new ApolloError(error);
            }
        },

        // All available products from active stores — the marketplace feed.
        allProducts: async () => {
            try {
                const activeStores = await Store.findAll({ where: { is_active: true }, attributes: ["id"], raw: true });
                const ids = activeStores.map((s) => s.id);
                if (!ids.length) return [];
                return await Product.findAll({
                    where: { id_store: { [Op.in]: ids }, is_available: true },
                    order: [["createdAt", "DESC"]],
                });
            } catch (error) {
                logger.error(`allProducts: ${error?.message}`);
                throw new ApolloError(error);
            }
        },

        // ── Admin (super-admin, role 1) ────────────────────────────────────────
        adminStoreOwners: async (obj, args, context) => {
            try {
                const u = context?.user;
                if (!context?.isAuth || !u) throw new ApolloError("Authentication required", "AUTH_REQUIRED");
                if (u.role !== SUPER_ADMIN_ROLE) throw new ApolloError("غير مصرّح: الأدمن فقط", "FORBIDDEN");
                return await User.findAll({ where: { role: STORE_OWNER_ROLE }, order: [["createdAt", "DESC"]] });
            } catch (error) {
                logger.error(`adminStoreOwners: ${error?.message}`);
                throw new ApolloError(error);
            }
        },

        adminOrders: async (obj, args, context) => {
            try {
                const u = context?.user;
                if (!context?.isAuth || !u) throw new ApolloError("Authentication required", "AUTH_REQUIRED");
                if (u.role !== SUPER_ADMIN_ROLE) throw new ApolloError("غير مصرّح: الأدمن فقط", "FORBIDDEN");
                return await Order.findAll({ order: [["createdAt", "DESC"]] });
            } catch (error) {
                logger.error(`adminOrders: ${error?.message}`);
                throw new ApolloError(error);
            }
        },

        // ── Owner dashboard (role 8) ───────────────────────────────────────────
        myStore: async (obj, args, context) => {
            try {
                const user = context?.user;
                if (!context?.isAuth || !user) return null;
                return await Store.findOne({ where: { id_user: user.id }, order: [["createdAt", "ASC"]] });
            } catch (error) {
                logger.error(`myStore: ${error?.message}`);
                throw new ApolloError(error);
            }
        },

        myStores: async (obj, args, context) => {
            try {
                const user = context?.user;
                if (!context?.isAuth || !user) return [];
                return await Store.findAll({ where: { id_user: user.id }, order: [["createdAt", "DESC"]] });
            } catch (error) {
                logger.error(`myStores: ${error?.message}`);
                throw new ApolloError(error);
            }
        },

        myStoreProducts: async (obj, args, context) => {
            try {
                const ids = await ownedStoreIds(context);
                if (ids.length === 0) return [];
                return await Product.findAll({
                    where: { id_store: { [Op.in]: ids } },
                    order: [["createdAt", "DESC"]],
                });
            } catch (error) {
                logger.error(`myStoreProducts: ${error?.message}`);
                throw new ApolloError(error);
            }
        },

        myStoreOrders: async (obj, args, context) => {
            try {
                const ids = await ownedStoreIds(context);
                if (ids.length === 0) return [];
                return await Order.findAll({
                    where: { id_store: { [Op.in]: ids } },
                    order: [["createdAt", "DESC"]],
                });
            } catch (error) {
                logger.error(`myStoreOrders: ${error?.message}`);
                throw new ApolloError(error);
            }
        },

        myStoreReport: async (obj, args, context) => {
            try {
                const user = context?.user;
                if (!context?.isAuth || !user) return [];
                const stores = await Store.findAll({ where: { id_user: user.id }, attributes: ["id", "name"], raw: true });
                if (stores.length === 0) return [];
                const report = [];
                for (const s of stores) {
                    // Only accepted/delivered orders count as realized sales.
                    const rows = await Order.findAll({
                        where: { id_store: s.id, status: { [Op.in]: ["accepted", "delivered"] } },
                        attributes: ["total"],
                        raw: true,
                    });
                    const total = rows.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
                    report.push({
                        id_store: s.id,
                        store_name: s.name,
                        orders_count: rows.length,
                        total_sales: total,
                    });
                }
                return report;
            } catch (error) {
                logger.error(`myStoreReport: ${error?.message}`);
                throw new ApolloError(error);
            }
        },
    },

    // ── Field resolvers ────────────────────────────────────────────────────────
    Store: {
        owner: async ({ id_user }) => (id_user ? await User.findByPk(id_user) : null),
        products: async ({ id }) =>
            id ? await Product.findAll({ where: { id_store: id }, order: [["createdAt", "DESC"]] }) : [],
    },

    Product: {
        store: async ({ id_store }) => (id_store ? await Store.findByPk(id_store) : null),
    },

    Order: {
        store: async ({ id_store }) => (id_store ? await Store.findByPk(id_store) : null),
        items: async ({ id }) =>
            id ? await OrderItem.findAll({ where: { id_order: id } }) : [],
    },

    OrderItem: {
        product: async ({ id_product }) => (id_product ? await Product.findByPk(id_product) : null),
    },

    Mutation: {
        // Super-admin creates (or resets the password of) a store-owner account (role 8).
        provisionStoreOwner: async (obj, { email, password }, context) => {
            try {
                const caller = context?.user;
                if (!context?.isAuth || !caller) return new ApolloError("Authentication required", "AUTH_REQUIRED");
                if (caller.role !== SUPER_ADMIN_ROLE) {
                    return new ApolloError("غير مصرّح: السوبر أدمن فقط", "FORBIDDEN");
                }
                const normalizedEmail = String(email || "").trim().toLowerCase();
                if (!normalizedEmail) return new ApolloError("البريد مطلوب", "EMAIL_REQUIRED");
                if (!password || password.length < 6) return new ApolloError("كلمة المرور قصيرة جدًا", "PASSWORD_TOO_SHORT");

                const existing = await User.findOne({ where: { email: normalizedEmail } });
                if (existing) {
                    if (existing.role !== STORE_OWNER_ROLE) {
                        return new ApolloError("البريد مستخدم لحساب آخر", "EMAIL_TAKEN");
                    }
                    existing.password = await hashPassword(password);
                    existing.activation = true;
                    existing.email_verify = true;
                    await existing.save();
                    return existing;
                }

                const user = await User.create({
                    email: normalizedEmail,
                    password: await hashPassword(password),
                    role: STORE_OWNER_ROLE,
                    activation: true,
                    email_verify: true,
                });
                await Permission.create({ id_user: user.id, teams: FULL_GRANT });
                return user;
            } catch (error) {
                logger.error(`provisionStoreOwner: ${error?.message}`);
                throw new ApolloError(error);
            }
        },

        createStore: async (obj, { content }, context) => {
            try {
                const caller = context?.user;
                if (!context?.isAuth || !caller) return new ApolloError("Authentication required", "AUTH_REQUIRED");

                const logoUpload = await content.logo;
                const imageUploads = await content.images;
                delete content.logo;
                delete content.images;

                // The creating owner owns the store — unless the super-admin
                // assigns it to a specific merchant account (content.id_user).
                const assignTo = (caller.role === SUPER_ADMIN_ROLE && content.id_user) ? content.id_user : caller.id;
                delete content.id_user;
                const store = await Store.create({ ...content, id_user: assignTo });

                const patch = {};
                if (logoUpload) {
                    const name = await saveImage(logoUpload);
                    if (!name) return new ApolloError("This file is not image");
                    patch.logo = name;
                }
                if (imageUploads && imageUploads.length > 0) {
                    patch.images = await saveImages(imageUploads);
                }
                if (Object.keys(patch).length) {
                    await Store.update(patch, { where: { id: store.id } });
                    return await Store.findByPk(store.id);
                }
                return store;
            } catch (error) {
                logger.error(`createStore: ${error?.message}`);
                throw new ApolloError(error);
            }
        },

        updateStore: async (obj, { id, content }, context) => {
            try {
                const ids = await ownedStoreIds(context);
                if (!ids.includes(id)) return new ApolloError("غير مصرّح", "FORBIDDEN");

                const logoUpload = await content.logo;
                const imageUploads = await content.images;
                delete content.logo;
                delete content.images;

                if (logoUpload) {
                    const name = await saveImage(logoUpload);
                    if (!name) return new ApolloError("This file is not image");
                    content.logo = name;
                }
                if (imageUploads && imageUploads.length > 0) {
                    content.images = await saveImages(imageUploads);
                }
                await Store.update({ ...content }, { where: { id } });
                return { status: true };
            } catch (error) {
                logger.error(`updateStore: ${error?.message}`);
                throw new ApolloError(error);
            }
        },

        createProduct: async (obj, { content }, context) => {
            try {
                const ids = await ownedStoreIds(context);
                if (ids.length === 0) return new ApolloError("لا يوجد متجر لهذا الحساب", "NO_STORE");
                // Default to the owner's first store when id_store is omitted.
                const idStore = content.id_store || ids[0];
                if (!ids.includes(idStore)) return new ApolloError("غير مصرّح", "FORBIDDEN");

                const imageUploads = await content.images;
                delete content.images;

                const product = await Product.create({ ...content, id_store: idStore });

                if (imageUploads && imageUploads.length > 0) {
                    const images = await saveImages(imageUploads);
                    await Product.update({ images }, { where: { id: product.id } });
                    return await Product.findByPk(product.id);
                }
                return product;
            } catch (error) {
                logger.error(`createProduct: ${error?.message}`);
                throw new ApolloError(error);
            }
        },

        updateProduct: async (obj, { id, content }, context) => {
            try {
                const ids = await ownedStoreIds(context);
                const product = await Product.findByPk(id);
                if (!product || !ids.includes(product.id_store)) return new ApolloError("غير مصرّح", "FORBIDDEN");

                const imageUploads = await content.images;
                delete content.images;
                // Never let a product be moved to a store the caller does not own.
                if (content.id_store && !ids.includes(content.id_store)) {
                    return new ApolloError("غير مصرّح", "FORBIDDEN");
                }
                if (imageUploads && imageUploads.length > 0) {
                    content.images = await saveImages(imageUploads);
                }
                await Product.update({ ...content }, { where: { id } });
                return { status: true };
            } catch (error) {
                logger.error(`updateProduct: ${error?.message}`);
                throw new ApolloError(error);
            }
        },

        deleteProduct: async (obj, { id }, context) => {
            try {
                const ids = await ownedStoreIds(context);
                const product = await Product.findByPk(id);
                if (!product || !ids.includes(product.id_store)) return { status: false };
                await Product.destroy({ where: { id } });
                return { status: true };
            } catch (error) {
                logger.error(`deleteProduct: ${error?.message}`);
                throw new ApolloError(error);
            }
        },

        updateOrderStatus: async (obj, { idOrder, status }, context) => {
            try {
                if (!ORDER_STATUSES.includes(status)) return new ApolloError("حالة غير صالحة", "INVALID_STATUS");
                const ids = await ownedStoreIds(context);
                const order = await Order.findByPk(idOrder);
                if (!order || !ids.includes(order.id_store)) return new ApolloError("غير مصرّح", "FORBIDDEN");
                const patch = { status };
                // Cash on delivery: marking delivered implies the cash was collected.
                if (status === "delivered") patch.payment_status = "paid";
                await Order.update(patch, { where: { id: idOrder } });
                return { status: true };
            } catch (error) {
                logger.error(`updateOrderStatus: ${error?.message}`);
                throw new ApolloError(error);
            }
        },

        // Public: a buyer places a purchase request from the app (no token).
        createOrder: async (obj, { content }) => {
            try {
                const { full_name, phone, address, note, id_store, items } = content;
                if (!id_store) return new ApolloError("المتجر مطلوب", "STORE_REQUIRED");
                if (!items || items.length === 0) return new ApolloError("لا توجد منتجات في الطلب", "EMPTY_ORDER");

                const store = await Store.findByPk(id_store, { attributes: ["id", "name", "id_user"] });
                if (!store) return new ApolloError("المتجر غير موجود", "STORE_NOT_FOUND");

                // Price every line from the DB (never trust client prices) and total server-side.
                const lineRows = [];
                let total = 0;
                for (const it of items) {
                    const product = await Product.findByPk(it.id_product);
                    if (!product || product.id_store !== id_store) {
                        return new ApolloError("منتج غير صالح في الطلب", "INVALID_PRODUCT");
                    }
                    const qty = Math.max(1, Number(it.quantity) || 1);
                    const price = Number(product.price) || 0;
                    total += price * qty;
                    lineRows.push({
                        product_name: product.name,
                        price,
                        quantity: qty,
                        id_product: product.id,
                    });
                }

                const order = await Order.create({
                    full_name,
                    phone,
                    address: address || null,
                    note: note || null,
                    total,
                    status: "waiting",
                    payment_method: "cash_on_delivery",
                    payment_status: "unpaid",
                    id_store,
                });

                await OrderItem.bulkCreate(lineRows.map((r) => ({ ...r, id_order: order.id })));

                // Notify the store owner (if the store has one) about the new order.
                try {
                    if (store.id_user) {
                        const body = `طلب جديد في متجر ${store.name || ""} من ${full_name || phone || "عميل"} بإجمالي ${total}`;
                        await Notification.create({ body, id_user: store.id_user });
                        sendPushToUser(store.id_user, { title: "طلب جديد", body }).catch(() => {});
                    }
                } catch (notifyErr) {
                    logger.error(`createOrder notify: ${notifyErr?.message}`);
                }

                return order;
            } catch (error) {
                logger.error(`createOrder: ${error?.message}`);
                throw new ApolloError(error);
            }
        },
    },
};

// Platform-wide AI connection settings (singleton row, id="default"), managed
// by the super-admin only. API keys are stored ENCRYPTED (see Helpers/Secrets).
export default (db, types) => {
    return db.define('ai_setting', {
        id: {
            type: types.STRING(32),
            primaryKey: true,
            defaultValue: 'default',
        },
        active_provider: {
            type: types.ENUM,
            values: ['openai', 'gemini'],
            defaultValue: 'gemini',
        },
        enabled: {
            type: types.BOOLEAN,
            defaultValue: false,
        },
        // Encrypted at rest; never returned to the client.
        openai_api_key: { type: types.TEXT, allowNull: true },
        openai_model: { type: types.STRING(100), allowNull: true },
        gemini_api_key: { type: types.TEXT, allowNull: true },
        gemini_model: { type: types.STRING(100), allowNull: true },
    }, {
        timestamps: true,
        createdAt: true,
        updatedAt: true,
    });
};

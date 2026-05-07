export const up = async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("users", "refresh_token_version", {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        after: "last_failed_login_at"
    });

    await queryInterface.addColumn("users", "refresh_token_id", {
        type: Sequelize.STRING(100),
        allowNull: true,
        after: "refresh_token_version"
    });
};

export const down = async (queryInterface) => {
    await queryInterface.removeColumn("users", "refresh_token_id");
    await queryInterface.removeColumn("users", "refresh_token_version");
};

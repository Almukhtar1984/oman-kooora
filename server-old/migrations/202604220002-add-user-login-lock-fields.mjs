export const up = async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("users", "failed_login_attempts", {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        after: "email_verify"
    });

    await queryInterface.addColumn("users", "locked_until", {
        type: Sequelize.DATE,
        allowNull: true,
        after: "failed_login_attempts"
    });

    await queryInterface.addColumn("users", "last_failed_login_at", {
        type: Sequelize.DATE,
        allowNull: true,
        after: "locked_until"
    });
};

export const down = async (queryInterface) => {
    await queryInterface.removeColumn("users", "last_failed_login_at");
    await queryInterface.removeColumn("users", "locked_until");
    await queryInterface.removeColumn("users", "failed_login_attempts");
};

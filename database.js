const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(process.env.POSTGRES_DB || 'postgres',
    process.env.POSTGRES_USER || 'postgres',
    process.env.POSTGRES_PASSWORD || '',
    {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: process.env.POSTGRES_PORT || 5432,
        dialect: 'postgres',
        dialectOptions: {
            ssl: process.env.POSTGRES_SSL == "true"
        }
    });
const User = sequelize.define('user', {
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    profile: {
        type: DataTypes.JSON,
        allowNull: false
    },
    accessToken: {
        type: DataTypes.STRING,
        allowNull: false
    },
});
module.exports = {
    sequelize: sequelize,
    User: User
};

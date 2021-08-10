const { Sequelize, DataTypes, Op } = require('sequelize');
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
  sub: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  nickname: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  picture: {
    type: DataTypes.STRING,
    allowNull: false
  },
});
const Transaction = sequelize.define('transaction', {
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amountUakt: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  transactionHash: {
    type: DataTypes.STRING,
    allowNull: true
  },
});
const BlockedAddress = sequelize.define('blockedAddress', {
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
});

const latestTransactionSince = async (user, date) => {
  return await Transaction.findOne({
    where: {
      userId: user.id,
      createdAt: {
        [Op.gt]: date
      },
      transactionHash: {
        [Op.not]: null
      }
    },
    order: [
      ['createdAt', 'DESC'],
    ]
  })
}

Transaction.belongsTo(User, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' })
User.hasMany(Transaction, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' })

module.exports = {
  sequelize,
  User,
  Transaction,
  BlockedAddress,
  latestTransactionSince
};

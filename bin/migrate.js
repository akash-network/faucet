require("ts-node").register();
const db = require("../database");
db.sequelize.sync();

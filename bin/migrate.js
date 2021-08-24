require("ts-node").register();
const db = require("../database.js");
db.sequelize.sync();

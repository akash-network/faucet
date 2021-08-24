import express from "express";
const router = express.Router();
import * as db from "../database";
import { ensureAuthenticated, ensurePermission } from "../utils";

router.get(
  "/",
  ensureAuthenticated,
  ensurePermission,
  function (req: any, res: any, next: any) {
    db.Transaction.findAll({
      order: [["createdAt", "DESC"]],
      limit: 500,
      include: db.User,
    })
      .then((transactions) => {
        res.status(200).send(JSON.stringify(transactions));
      })
      .catch((err) => {
        res.status(500).send(JSON.stringify(err));
      });
  }
);

export { router };

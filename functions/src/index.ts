import * as admin from "firebase-admin";
import {onItemFavoriteChange} from "./onFavoritesChange";

const serviceAccount = require("../key/config.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// triggers
exports.onItemFavoriteChange = onItemFavoriteChange;

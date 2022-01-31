import * as admin from "firebase-admin";
import {onItemFavoriteChange} from "./onFavoritesChange";
import {onCreateProfile, onDeleteProfile} from "./onProfileUpdate";

const serviceAccount = require("../key/config.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// triggers
exports.onItemFavoriteChange = onItemFavoriteChange;
exports.onCreateProfile = onCreateProfile;
exports.onDeleteProfile = onDeleteProfile;

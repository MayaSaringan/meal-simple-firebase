import * as admin from "firebase-admin";
import {onItemFavoriteChange} from "./onFavoritesChange";
import {onCreateProfile, onDeleteProfile} from "./onProfileUpdate";
import {onCreateFood, onDeleteFood} from "./onFoodUpdate";

const serviceAccount = require("../key/config.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// triggers
exports.onItemFavoriteChange = onItemFavoriteChange;
exports.onCreateProfile = onCreateProfile;
exports.onDeleteProfile = onDeleteProfile;
exports.onCreateFood = onCreateFood;
exports.onDeleteFood = onDeleteFood;

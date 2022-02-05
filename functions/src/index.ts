import * as admin from "firebase-admin";
import {onItemFavoriteChange} from "./onFavoritesChange";
import {onCreateProfile, onDeleteProfile} from "./onProfileUpdate";
import {onCreateFood, onUpdateFood, onDeleteFood} from "./onFoodUpdate";
import {
  onCreateCollection,
  onUpdateCollection,
  onDeleteCollection,
} from "./onCollectionUpdate";

const serviceAccount = require("../key/config.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// triggers
exports.onItemFavoriteChange = onItemFavoriteChange;
exports.onCreateProfile = onCreateProfile;
exports.onDeleteProfile = onDeleteProfile;
exports.onCreateFood = onCreateFood;
exports.onUpdateFood = onUpdateFood;
exports.onDeleteFood = onDeleteFood;
exports.onCreateCollection = onCreateCollection;
exports.onUpdateCollection = onUpdateCollection;
exports.onDeleteCollection = onDeleteCollection;

import * as functions from "firebase-functions";
import {
  getContentForCollection,
  getAllProfiles,
  getProfile,
  getCollection,
} from "./common";
import {onUpdateCollectionFn} from "./onCollectionUpdate";
import {BasicFood, FoodID, ProfileID} from "./types";

const buildFoodFromSnap = (
    snapData: FirebaseFirestore.DocumentData,
    userId: ProfileID,
): BasicFood => {
  return {
    name: snapData.name,
    numLikes: snapData.likes.length,
    isLiked: snapData.likes.includes(userId),
  };
};

const deleteFoodInAllCollections = async (foodId: FoodID): Promise<void> => {
  const profiles = await getAllProfiles();
  profiles.forEach(async ({value}) => {
    const foodContentCollRef = getContentForCollection(value.foodsCollection);
    await foodContentCollRef.doc(foodId).delete();
  });
};

const deleteFoodInPersonalCollection = async (
    userId: ProfileID,
    foodId: FoodID,
): Promise<void> => {
  const profileData = await getProfile(userId);

  const foodCollId = profileData.foodsCollection;
  const foodContentCollRef = getContentForCollection(foodCollId);
  const foodCollData = await getCollection(foodCollId);
  await foodContentCollRef.doc(foodId).delete();
  await onUpdateCollectionFn(userId, foodCollId, foodCollData);

  const likesCollId = profileData.likesCollection;
  const likesCollData = await getCollection(likesCollId);
  const likesContentCollRef = getContentForCollection(likesCollId);
  await likesContentCollRef.doc(foodId).delete();
  await onUpdateCollectionFn(userId, likesCollId, likesCollData);
};

const overwriteFoodInAllCollections = async (
    foodId: FoodID,
    food: BasicFood,
): Promise<void> => {
  const profiles = await getAllProfiles();
  profiles.forEach(async ({value}) => {
    const foodContentCollRef = getContentForCollection(value.foodsCollection);
    await foodContentCollRef.doc(foodId).set(food);
  });
};

const overwriteFoodInPersonalCollection = async (
    userId: ProfileID,
    foodId: FoodID,
    food: BasicFood,
): Promise<void> => {
  const profileData = await getProfile(userId);
  const foodCollId = profileData.foodsCollection;
  const foodContentCollRef = getContentForCollection(foodCollId);
  const foodCollData = await getCollection(foodCollId);
  await foodContentCollRef.doc(foodId).set(food);
  await onUpdateCollectionFn(userId, foodCollId, foodCollData);
  const likesCollId = profileData.likesCollection;
  const likesCollData = await getCollection(likesCollId);
  const likesContentCollRef = getContentForCollection(likesCollId);
  if (food.isLiked) {
    await likesContentCollRef.doc(foodId).set(food);
  } else {
    const foodRef = await likesContentCollRef.doc(foodId).get();
    if (foodRef.exists) {
      await likesContentCollRef.doc(foodId).delete();
    }
  }
  await onUpdateCollectionFn(userId, likesCollId, likesCollData);
};
export const onCreateFood = functions.firestore
    .document("foods/{itemId}")
    .onCreate(async (snap, context): Promise<void> => {
      console.log("onCreateFood Triggered");
      try {
        const uid = context?.auth?.uid;
        const itemID = context.params.itemId;
        if (!uid) {
          throw new Error("No valid uid");
        }

        const snapData = snap.data();
        const data = buildFoodFromSnap(snapData, uid);
        if (snapData.access === "public") {
          await overwriteFoodInAllCollections(itemID, data);
        }
        await overwriteFoodInPersonalCollection(uid, itemID, data);

        return;
      } catch (e) {
        console.log(e);
      }
    });

export const onUpdateFood = functions.firestore
    .document("foods/{itemId}")
    .onUpdate(async (change, context): Promise<void> => {
      console.log("onUpdateFood Triggered");
      try {
        const uid = context?.auth?.uid;
        const itemID = context.params.itemId;
        if (!uid) {
          throw new Error("No valid uid");
        }
        const snapData = change.after.data();
        const data = buildFoodFromSnap(snapData, uid);

        if (snapData.access === "public") {
          await overwriteFoodInAllCollections(itemID, data);
        }
        await overwriteFoodInPersonalCollection(uid, itemID, data);

        return;
      } catch (e) {
        console.log(e);
      }
    });

export const onDeleteFood = functions.firestore
    .document("foods/{itemId}")
    .onDelete(async (snap, context): Promise<void> => {
      console.log("onDeleteFood Triggered", context.params.itemId);
      try {
        const uid = context?.auth?.uid;
        const itemId = context.params.itemId;
        if (!uid) {
          throw new Error("No valid uid");
        }

        const snapData = snap.data();
        if (snapData.access === "public") {
          await deleteFoodInAllCollections(itemId);
        }
        await deleteFoodInPersonalCollection(uid, itemId);
      } catch (e) {
        console.log(e);
      }
    });

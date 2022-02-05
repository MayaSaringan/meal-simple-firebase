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
): BasicFood => {
  return {
    name: snapData.name,
    numLikes: snapData.likes.length,
    isLiked: snapData.likes.includes(snapData.owner),
    owner: snapData.owner,
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
  await onUpdateCollectionFn(foodCollId, foodCollData);

  const likesCollId = profileData.likesCollection;
  const likesCollData = await getCollection(likesCollId);
  const likesContentCollRef = getContentForCollection(likesCollId);
  await likesContentCollRef.doc(foodId).delete();
  await onUpdateCollectionFn(likesCollId, likesCollData);
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
    foodId: FoodID,
    food: BasicFood,
): Promise<void> => {
  const profileData = await getProfile(food.owner);
  const foodCollId = profileData.foodsCollection;
  const foodContentCollRef = getContentForCollection(foodCollId);
  const foodCollData = await getCollection(foodCollId);
  await foodContentCollRef.doc(foodId).set(food);
  await onUpdateCollectionFn(foodCollId, foodCollData);
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
  await onUpdateCollectionFn(likesCollId, likesCollData);
};
export const onCreateFood = functions.firestore
    .document("foods/{itemId}")
    .onCreate(async (snap): Promise<void> => {
      console.log("onCreateFood Triggered");
      try {
        const snapData = snap.data();
        const itemID = snap.id;

        const data = buildFoodFromSnap(snapData);
        if (snapData.access === "public") {
          await overwriteFoodInAllCollections(itemID, data);
        }
        await overwriteFoodInPersonalCollection(itemID, data);

        return;
      } catch (e) {
        console.log(e);
      }
    });

export const onUpdateFood = functions.firestore
    .document("foods/{itemId}")
    .onUpdate(async (change): Promise<void> => {
      console.log("onUpdateFood Triggered");
      try {
        const snapData = change.after.data();
        const itemID = change.after.id;
        const data = buildFoodFromSnap(snapData);

        if (snapData.access === "public") {
          await overwriteFoodInAllCollections(itemID, data);
        }
        await overwriteFoodInPersonalCollection(itemID, data);

        return;
      } catch (e) {
        console.log(e);
      }
    });

export const onDeleteFood = functions.firestore
    .document("foods/{itemId}")
    .onDelete(async (snap): Promise<void> => {
      console.log("onDeleteFood Triggered");
      try {
        const itemId = snap.id;

        const snapData = snap.data();
        if (snapData.access === "public") {
          await deleteFoodInAllCollections(itemId);
        }
        await deleteFoodInPersonalCollection(snapData.owner, itemId);
      } catch (e) {
        console.log(e);
      }
    });

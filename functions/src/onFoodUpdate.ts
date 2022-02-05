import * as functions from "firebase-functions";
import {
  getContentForCollection,
  getAllProfiles,
  getAllCollections,
  getProfile,
} from "./common";
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
  const foodContentCollRef = getContentForCollection(
      profileData.foodsCollection,
  );
  await foodContentCollRef.doc(foodId).set(food);
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
          overwriteFoodInAllCollections(itemID, data);
        } else {
          overwriteFoodInPersonalCollection(uid, itemID, data);
        }
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
          overwriteFoodInAllCollections(itemID, data);
        } else {
          overwriteFoodInPersonalCollection(uid, itemID, data);
        }
        return;
      } catch (e) {
        console.log(e);
      }
    });

export const onDeleteFood = functions.firestore
    .document("foods/{itemId}")
    .onDelete(async (_, context): Promise<void> => {
      console.log("onDeleteFood Triggered", context.params.itemId);
      try {
        const uid = context?.auth?.uid;
        const itemId = context.params.itemId;
        if (!uid) {
          throw new Error("No valid uid");
        }
        const collections = await getAllCollections();
        collections.forEach(async ({id}) => {
          await getContentForCollection(id).doc(itemId).delete();
        });
      } catch (e) {
        console.log(e);
      }
    });

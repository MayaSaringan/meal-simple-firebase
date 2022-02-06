import * as functions from "firebase-functions";
import {
  getContentForCollection,
  getAllProfiles,
  getProfile,
  getCollection,
} from "./common";
import {onUpdateCollectionFn} from "./onCollectionUpdate";
import {
  BasicFood,
  CollectionID,
  Food,
  FoodID,
  Profile,
  ProfileID,
} from "./types";

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

const overwriteFoodInCollection = async (
    collId: CollectionID,
    foodId: FoodID,
    food: BasicFood,
): Promise<void> => {
  const ref = getContentForCollection(collId);
  await ref.doc(foodId).set(food);
  const foodCollData = await getCollection(collId);
  await onUpdateCollectionFn(collId, foodCollData);
};

const deleteFoodInCollection = async (
    collId: CollectionID,
    foodId: FoodID,
): Promise<void> => {
  const ref = getContentForCollection(collId);
  await ref.doc(foodId).delete();
  const foodCollData = await getCollection(collId);
  await onUpdateCollectionFn(collId, foodCollData);
};
const overwriteFoodInProfile = async (
    {id, value}: { id: ProfileID; value: Profile },
    foodId: FoodID,
    originalFood: Food,
): Promise<void> => {
  const food = buildFoodFromSnap(originalFood);
  const collIds = [value.foodsCollection, value.likesCollection];
  const deleteInstead = [false, false];
  if (!originalFood.likes.includes(id)) {
    deleteInstead[1] = true;
  }
  await Promise.all(
      collIds.map((collId, idx) => {
        if (deleteInstead[idx]) {
          return deleteFoodInCollection(collId, foodId);
        }
        return overwriteFoodInCollection(collId, foodId, food);
      }),
  );
};

const overwriteFoodInCollections = async (
    foodId: FoodID,
    originalFood: Food,
): Promise<void> => {
  const food = buildFoodFromSnap(originalFood);
  if (originalFood.access === "public") {
    const profiles = await getAllProfiles();
    await Promise.all(
        profiles.map((profile) => {
          return overwriteFoodInProfile(profile, foodId, originalFood);
        }),
    );
  } else {
    const profileData = await getProfile(food.owner);
    await overwriteFoodInProfile(
        {id: food.owner, value: profileData},
        foodId,
        originalFood,
    );
  }
};

export const onCreateFood = functions.firestore
    .document("foods/{itemId}")
    .onCreate(async (snap): Promise<void> => {
      console.log("onCreateFood Triggered");
      try {
        const snapData = snap.data() as Food;
        const itemID = snap.id;

        await overwriteFoodInCollections(itemID, snapData);
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
        const snapData = change.after.data() as Food;
        const itemID = change.after.id;
        await overwriteFoodInCollections(itemID, snapData);

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

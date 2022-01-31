import * as admin from "firebase-admin";
import {firestore} from "firebase-admin";

// assumes admin was initialized by caller
export const getProfileCollRef = (): firestore.CollectionReference => {
  return admin.firestore().collection("profiles");
};

export const getProfileDocRef = (
    userId: string,
): firestore.DocumentReference => {
  return getProfileCollRef().doc(userId);
};

export const getCollectionCollRef = (): firestore.CollectionReference => {
  return admin.firestore().collection("collections");
};

export const createCollectionDoc = (owner: string): Promise<string> => {
  return getCollectionCollRef()
      .add({owner})
      .then((docRef) => docRef.id);
};

export const getCollectionDoc = (
    collId: string,
): firestore.DocumentReference => {
  return getCollectionCollRef().doc(collId);
};

export const getCollectionDocContentCollRef = (
    collId: string,
): firestore.CollectionReference => {
  return getCollectionCollRef().doc(collId).collection("content");
};

// assumes admin was initialized by caller
export const getFoodCollRef = (): firestore.CollectionReference => {
  return admin.firestore().collection("foods");
};

export const getFoodDocRef = (foodId: string): firestore.DocumentReference => {
  return getFoodCollRef().doc(foodId);
};

export const getPersonalFoodContentCollRef = async (
    userId: string,
): Promise<firestore.CollectionReference> => {
  const profileData = await getProfileDocRef(userId).get();
  let data = undefined;
  if (!profileData.exists) {
    throw new Error(`No profile data found for userId ${userId}`);
  } else {
    data = profileData.data();
  }
  const foodCollId = data?.foodsCollection;
  return getCollectionDocContentCollRef(foodCollId);
};

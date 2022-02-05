import * as admin from "firebase-admin";
import {firestore} from "firebase-admin";
import {
  Collection,
  CollectionID,
  Feed,
  FeedID,
  Food,
  FoodID,
  Profile,
  ProfileID,
} from "./types";

// assumes admin was initialized by caller
export const getProfileCollRef = (): firestore.CollectionReference => {
  return admin.firestore().collection("profiles");
};

export const getProfileDocRef = (
    userId: ProfileID,
): firestore.DocumentReference => {
  return getProfileCollRef().doc(userId);
};

export const getProfile = async (userId: ProfileID): Promise<Profile> => {
  const doc = await getProfileDocRef(userId).get();
  const docData = doc.data();
  if (doc.exists && docData) {
    return docData as Profile;
  } else {
    throw new Error(`Profile for ${userId} does not exist.`);
  }
};

export const updateProfile = async (
    userId: ProfileID,
    data: Profile,
): Promise<void> => {
  await getProfileDocRef(userId).update(data);
};

export const getAllProfiles = async (): Promise<
  { id: ProfileID; value: Profile }[]
> => {
  const allProfilesQuery = await getProfileCollRef().get();
  const allProfilesSnaps = await allProfilesQuery.docs;
  const snaps = await Promise.all(allProfilesSnaps);
  const content: { id: ProfileID; value: Profile }[] = [];
  snaps.forEach((s) =>
    content.push({id: s.id as ProfileID, value: s.data() as Profile}),
  );
  return content;
};

export const getCollectionCollRef = (): firestore.CollectionReference => {
  return admin.firestore().collection("collections");
};

export const getCollectionDocRef = (
    collId: CollectionID,
): firestore.DocumentReference => {
  return getCollectionCollRef().doc(collId);
};

export const getContentForCollection = (
    collId: CollectionID,
): firestore.CollectionReference => {
  return getCollectionCollRef().doc(collId).collection("content");
};

export const getCollection = async (
    collId: CollectionID,
): Promise<Collection> => {
  const doc = await getCollectionDocRef(collId).get();
  const docData = doc.data();
  if (doc.exists && docData) {
    return docData as Collection;
  } else {
    throw new Error(`Collection for ${collId} does not exist.`);
  }
};
export const getAllCollections = async (): Promise<
  { id: CollectionID; value: Collection }[]
> => {
  const allCollections = await getCollectionCollRef().get();
  const allCollectionSnaps = await allCollections.docs;
  const snaps = await Promise.all(allCollectionSnaps);
  const content: { id: CollectionID; value: Collection }[] = [];
  snaps.forEach(async (s) => {
    content.push({id: s.id as CollectionID, value: s.data() as Collection});
  });
  return content;
};

export const createCollection = (owner: ProfileID): Promise<string> => {
  return getCollectionCollRef()
      .add({owner})
      .then((docRef) => docRef.id);
};

export const deleteCollections = async (
    filter?: string[] | undefined,
): Promise<void> => {
  let queryRes = undefined;
  if (filter !== undefined) {
    const [propName, operator, expected] = filter;
    const query = getCollectionCollRef().where(
        propName,
      operator as never,
      expected,
    );
    queryRes = await query.get();
  } else {
    queryRes = await getCollectionCollRef().get();
  }
  const snaps = await Promise.all(queryRes.docs);
  snaps.forEach(async (snap) => {
    const collectionRef = getContentForCollection(snap.id);
    const contentQuery = await collectionRef.get();
    contentQuery.docs.forEach((contentSnap) => contentSnap.ref.delete());
  });
  snaps.forEach((snap) => {
    return getCollectionDocRef(snap.id).delete();
  });
};

export const getFoodCollRef = (): firestore.CollectionReference => {
  return admin.firestore().collection("foods");
};

export const getFoodDocRef = (foodId: FoodID): firestore.DocumentReference => {
  return getFoodCollRef().doc(foodId);
};

export const getFood = async (foodId: FoodID): Promise<Food> => {
  const doc = await getFoodDocRef(foodId).get();
  const docData = doc.data();
  if (doc.exists && docData) {
    return docData as Food;
  } else {
    throw new Error(`Food for ${foodId} does not exist.`);
  }
};

export const updateFood = async (foodId: FoodID, data: Food): Promise<void> => {
  await getFoodDocRef(foodId).update(data);
};

export const getFeedCollRef = (): firestore.CollectionReference => {
  return admin.firestore().collection("feeds");
};

export const getFeedDocRef = (feedId: FeedID): firestore.DocumentReference => {
  return getFeedCollRef().doc(feedId);
};
export const createFeed = async (owner: ProfileID): Promise<string> => {
  const res = await admin.firestore().collection("feeds").add({owner});
  const resGet = await res.get();
  if (resGet.exists) {
    return resGet.id;
  } else {
    throw new Error(`Failed to create feed for owner ${owner}`);
  }
};

export const deleteFeed = async (feedId: FeedID): Promise<void> => {
  await admin.firestore().collection("feeds").doc(feedId).delete();
};

export const getContentForFeed = (
    feedId: FeedID,
): firestore.CollectionReference => {
  return getFeedDocRef(feedId).collection("content");
};

export const getAllFeeds = async (): Promise<{ id: FeedID; value: Feed }[]> => {
  const allFeeds = await getFeedCollRef().get();
  const allFeedSnaps = await allFeeds.docs;
  const snaps = await Promise.all(allFeedSnaps);
  const content: { id: FeedID; value: Feed }[] = [];
  snaps.forEach((s) =>
    content.push({id: s.id as FeedID, value: s.data() as Feed}),
  );
  return content;
};

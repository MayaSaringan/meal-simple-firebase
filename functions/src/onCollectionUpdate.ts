import * as functions from "firebase-functions";
import {
  getContentForCollection,
  getProfile,
  getFeedDocRef,
  getAllFeeds,
  getContentForFeed,
} from "./common";
import {BasicCollection, BasicFood, CollectionID, ProfileID} from "./types";

const overwriteInAllFeeds = async (
    collId: CollectionID,
    collection: BasicCollection,
): Promise<void> => {
  const feeds = await getAllFeeds();
  feeds.forEach(async ({id}) => {
    const feedDoc = getFeedDocRef(id);
    await feedDoc.collection("content").doc(collId).set(collection);
  });
};

const overwriteInPersonalFeed = async (
    userId: ProfileID,
    collId: CollectionID,
    collection: BasicCollection,
): Promise<void> => {
  const profileData = await getProfile(userId);
  const feedDoc = getFeedDocRef(profileData.feed);
  await feedDoc.collection("content").doc(collId).set(collection);
};

export const onUpdateCollectionFn = async (
    uid: ProfileID,
    collId: CollectionID,
    snapData: FirebaseFirestore.DocumentData,
): Promise<void> => {
  const contentRef = getContentForCollection(collId);
  const query = await contentRef.orderBy("numLikes").limit(20).get();
  const feedData: BasicCollection = {
    owner: snapData.owner,
    content: [],
  };

  query.forEach((snap) => {
    feedData.content.push(snap.data() as BasicFood);
  });

  if (snapData.access === "public") {
    await overwriteInAllFeeds(collId, feedData);
  } else {
    await overwriteInPersonalFeed(uid, collId, feedData);
  }
  return;
};

export const onCreateCollection = functions.firestore
    .document("collections/{collId}")
    .onCreate(async (snap, context): Promise<void> => {
      console.log("onCreateCollection Triggered");
      try {
        const uid = context?.auth?.uid;
        const collId = snap.id;
        if (!uid) {
          throw new Error("No valid uid");
        }
        const snapData = snap.data();
        onUpdateCollectionFn(uid, collId, snapData);
        return;
      } catch (e) {
        console.log(e);
      }
    });

export const onUpdateCollection = functions.firestore
    .document("collections/{collId}")
    .onUpdate(async (change, context): Promise<void> => {
      console.log("onUpdateCollection Triggered");
      try {
        const uid = context?.auth?.uid;
        const collId = change.after.id;
        if (!uid) {
          throw new Error("No valid uid");
        }
        const snapData = change.after.data();
        onUpdateCollectionFn(uid, collId, snapData);
      } catch (e) {
        console.log(e);
      }
    });

export const onDeleteCollection = functions.firestore
    .document("collections/{collId}")
    .onDelete(async (snap, context): Promise<void> => {
      console.log("onDeleteCollection Triggered", context.params.itemId);
      try {
        const uid = context?.auth?.uid;
        const collId = snap.id;
        if (!uid) {
          throw new Error("No valid uid");
        }
        const feeds = await getAllFeeds();
        feeds.forEach(async ({id}) => {
          await getContentForFeed(id).doc(collId).delete();
        });
      } catch (e) {
        console.log(e);
      }
    });

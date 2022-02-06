import * as functions from "firebase-functions";
import {
  createCollection,
  createFeed,
  deleteCollections,
  deleteFeed,
} from "./common";
import {Profile} from "./types";

// a trigger
export const onCreateProfile = functions.firestore
    .document("profiles/{userId}")
    .onCreate(async (snap): Promise<void> => {
      console.log("onCreateProfile Triggered");
      try {
        const userId = snap.id;
        const objectsToCreate = ["collection", "collection", "feed"];
        const [likesCollId, foodsCollId, feedId] = await Promise.all(
            objectsToCreate.map((type) => {
              if (type === "collection") {
                return createCollection(userId);
              } else if (type === "feed") {
                return createFeed(userId);
              }
              throw new Error("unexpected type");
            }),
        );
        await snap.ref.set({
          likesCollection: likesCollId,
          foodsCollection: foodsCollId,
          collections: [],
          feed: feedId,
        });
      } catch (e) {
        console.log(e);
      }
    });

export const onDeleteProfile = functions.firestore
    .document("profiles/{userId}")
    .onDelete(async (snap): Promise<void> => {
      console.log("onDeleteProfile Triggered");
      try {
        const deletedId = snap.id;
        const snapData = snap.data() as Profile;
        await deleteCollections(["owner", "==", deletedId]);
        await deleteFeed(snapData.feed);
      } catch (e) {
        console.log(e);
      }
    });

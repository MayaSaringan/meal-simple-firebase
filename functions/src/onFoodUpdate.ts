import * as functions from "firebase-functions";
import {
  getCollectionDocContentCollRef,
  getFoodDocRef,
  getProfileCollRef,
  getPersonalFoodContentCollRef,
  getCollectionCollRef,
  getCollectionDoc,
} from "./common";

export const onCreateFood = functions.firestore
    .document("foods/{itemId}")
    .onCreate(async (snap, context): Promise<void> => {
      console.log("onCreateFood Triggered");
      try {
        const uid = context?.auth?.uid || "priv";
        const itemID = context.params.itemId;
        if (!uid) {
          throw new Error("No valid uid");
        }
        const snapshot = await getFoodDocRef(itemID).get();
        if (snapshot.exists) {
          const snapData = snap.data();
          const data = {
            name: snapData.name,
            thumbnail: snapData.thumbnail,
            numLikes: snapData.likes?.length || 0,
            isLiked: snapData.likes?.includes(uid),
          };
          if (snapData.access === "public") {
            const allProfilesQuery = await getProfileCollRef().get();
            const allProfilesSnaps = await allProfilesQuery.docs;
            const snaps = await Promise.all(allProfilesSnaps);
            {
              snaps.forEach(async (snap) => {
                const foodsCollId = snap.data().foodsCollection;
                const foodContentCollRef =
                getCollectionDocContentCollRef(foodsCollId);
                await foodContentCollRef.doc(itemID).delete();
                await foodContentCollRef.doc(itemID).set(data);
              });
            }
          } else {
          // eslint-disable-next-line max-len
            const personalFoodCollRef = await getPersonalFoodContentCollRef(uid);
            await personalFoodCollRef.doc(itemID).delete();
            await personalFoodCollRef.doc(itemID).set(data);
          }
        } else {
          throw new Error("Food does not exist");
        }
      } catch (e) {
        console.log(e);
      }
    });

export const onDeleteFood = functions.firestore
    .document("foods/{itemId}")
    .onDelete(async (_, context): Promise<void> => {
      console.log("onDeleteFood Triggered", context.params.itemId);
      try {
        const uid = context?.auth?.uid || "priv";
        const itemId = context.params.itemId;
        if (!uid) {
          throw new Error("No valid uid");
        }

        const query = await getCollectionCollRef().get();
        query.forEach(async (snap) => {
          const collRef = getCollectionDoc(snap.id);
          if (snap.exists) {
            const collFoodRef = collRef.collection("content").doc(itemId);
            await collFoodRef.delete();
          } else {
            throw new Error("Collection does not exist");
          }
        });
      } catch (e) {
        console.log(e);
      }
    });

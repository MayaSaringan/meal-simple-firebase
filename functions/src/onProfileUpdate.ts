import * as functions from "firebase-functions";
import {
  createCollectionDoc,
  getCollectionCollRef,
  getCollectionDoc,
  getCollectionDocContentCollRef,
  getProfileDocRef,
} from "./common";

const deleteCollections = async (owner: string) => {
  const query = await getCollectionCollRef().where("owner", "==", owner).get();
  const snaps = await Promise.all(query.docs);
  {
    snaps.forEach(async (snap) => {
      const collectionRef = getCollectionDocContentCollRef(snap.id);
      const contentQuery = await collectionRef.get();
      contentQuery.docs.forEach((contentSnap) => contentSnap.ref.delete());
    });
  }
  {
    snaps.forEach((snap) => {
      return getCollectionDoc(snap.id).delete();
    });
  }
};

// a trigger
export const onCreateProfile = functions.firestore
    .document("profiles/{userId}")
    .onCreate(async (snap, context): Promise<void> => {
      console.log("onCreateProfile Triggered");
      try {
        const profileSnap = await getProfileDocRef(context.params.userId).get();

        if (profileSnap.exists) {
          const likesCollId = await createCollectionDoc(snap.id);
          const foodsCollId = await createCollectionDoc(snap.id);
          await getProfileDocRef(context.params.userId).update({
            likesCollection: likesCollId,
            foodsCollection: foodsCollId,
            collections: [],
          });
        } else {
          throw new Error("Profile does not exist");
        }
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
        await deleteCollections(deletedId);
      } catch (e) {
        console.log(e);
      }
    });

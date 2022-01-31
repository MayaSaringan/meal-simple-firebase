import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// assumes admin was initialized by caller
const getProfileCollRef = () => {
  return admin.firestore().collection("profiles");
};

const getProfileDocRef = (userId: string) => {
  return getProfileCollRef().doc(userId);
};

const getCollectionCollRef = () => {
  return admin.firestore().collection("collections");
};

const createCollectionDoc = (owner: string) => {
  return getCollectionCollRef()
      .add({order: [], owner})
      .then((docRef) => docRef.id);
};

const getCollectionDoc = (collId: string) => {
  return getCollectionCollRef().doc(collId);
};

const getCollectionDocContent = (collId: string) => {
  return getCollectionCollRef().doc(collId).collection("content");
};
const deleteCollections = (owner: string) => {
  return getCollectionCollRef()
      .where("owner", "==", owner)
      .get()
      .then((query) => {
        return Promise.all(query.docs)
            .then((snaps) => {
              snaps.forEach((snap) => {
                const collectionRef = getCollectionDocContent(snap.id);
                return collectionRef.get().then((contentQuery) => {
                  contentQuery.docs.forEach((contentSnap) =>
                    contentSnap.ref.delete(),
                  );
                });
              });
            })
            .then(() => {
              return Promise.all(query.docs).then((snaps) => {
                snaps.forEach((snap) => {
                  return getCollectionDoc(snap.id).delete();
                });
              });
            });
      });
};

// a trigger
export const onCreateProfile = functions.firestore
    .document("profiles/{userId}")
    .onCreate(async (snap, context): Promise<void> => {
      console.log("onCreateProfile Triggered");
      return getProfileDocRef(context.params.userId)
          .get()
          .then((snapshot) => {
            if (snapshot.exists) {
              return createCollectionDoc(snap.id).then((collId) => {
                return new Promise((res, rej) => {
                  getProfileDocRef(context.params.userId)
                      .update({likesCollection: collId, collections: []})
                      .then(() => res())
                      .catch(rej);
                });
              });
            } else {
              throw new Error("Profile does not exist");
            }
          });
    });

export const onDeleteProfile = functions.firestore
    .document("profiles/{userId}")
    .onDelete(async (snap): Promise<void> => {
      console.log("onDeleteProfile Triggered");
      const deletedId = snap.id;
      await deleteCollections(deletedId);
    });

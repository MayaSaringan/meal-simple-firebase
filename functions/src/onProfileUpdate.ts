import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// assumes admin was initialized by caller

const getProfileDocRef = (userId: string) => {
  return admin.firestore().collection("profiles").doc(userId);
};
const createCollectionDoc = (owner: string) => {
  return admin
      .firestore()
      .collection("collections")
      .add({order: [], owner})
      .then((docRef) => docRef.id);
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
                      .update({likesCollection: collId})
                      .then(() => res())
                      .catch(rej);
                });
              });
            } else {
              throw new Error("Profile does not exist");
            }
          });
    });

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// assumes admin was initialized by caller

const getItemsCollRef = (userId: string) => {
  return admin
      .firestore()
      .collection("accounts")
      .doc(userId)
      .collection("items");
};

const getPublicItemsCollRef = () => {
  return admin
      .firestore()
      .collection("shared")
      .doc("public")
      .collection("items");
};
const favoriteHelper = (userId: string, itemId: string, isAdding: boolean) => {
  return getItemsCollRef(userId)
      .doc(itemId)
      .get()
      .then((snapshot) => {
        if (snapshot.exists) {
          return getItemsCollRef(userId)
              .doc(itemId)
              .update({
                favoritedBy: isAdding ?
              admin.firestore.FieldValue.arrayUnion(userId) :
              admin.firestore.FieldValue.arrayRemove(userId),
              });
        } else {
        // search in public items if not found
          return getPublicItemsCollRef()
              .doc(itemId)
              .update({
                favoritedBy: isAdding ?
              admin.firestore.FieldValue.arrayUnion(userId) :
              admin.firestore.FieldValue.arrayRemove(userId),
              });
        }
      });
};
// a trigger
export const onItemFavoriteChange = functions.firestore
    .document("accounts/{userId}/itemFavorites/{itemId}")
    .onWrite(async (change, {params}): Promise<void> => {
      console.log("onItemFavorite Triggered");
      const document = change.after.exists ? change.after.data() : null;

      if (
        !document ||
      (change.before.data()?.favorited !== document.favorited &&
        !document.favorited)
      ) {
      // remove from favoritedBy, if item still exists
        try {
          await favoriteHelper(params.userId, params.itemId, false);
        } catch (e) {
          console.error(e);
          return;
        }
      } else {
      // add to favoritedBy, if item still exists
        try {
          await favoriteHelper(params.userId, params.itemId, true);
        } catch (e) {
          console.error(e);
          return;
        }
      }
    });

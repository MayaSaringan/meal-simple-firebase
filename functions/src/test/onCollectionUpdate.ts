import {expect} from "chai";
import {
  getCollectionDocRef,
  getContentForFeed,
  getProfile,
  getProfileDocRef,
} from "../common";
import {BasicCollection, CollectionID, ProfileID} from "../types";
import {snooz} from "./common";

require("../index");

describe("Collection updates", () => {
  const myUid: ProfileID = "testUid";
  const collId: CollectionID = "testColl";

  before(async () => {
    await getProfileDocRef(myUid).set({owner: myUid});
    await snooz(1000);
  });
  after(async () => {
    await getProfileDocRef(myUid).delete();
    await snooz();
  });

  const getFeedCollectionData = async (): Promise<{
    exists: boolean;
    data: BasicCollection | undefined;
  }> => {
    const profData = await getProfile(myUid);
    const contentRef = await getContentForFeed(profData.feed);
    const snap = await contentRef.doc(collId);
    const ref = await snap.get();
    const exists = ref.exists;
    const docData = ref.data();
    return {exists, data: exists ? (docData as BasicCollection) : undefined};
  };

  const addCollection = async () => {
    await getCollectionDocRef(collId).set({
      owner: myUid,
    });
    await snooz();
  };

  const deleteCollection = async () => {
    await getCollectionDocRef(collId).delete();
    await snooz();
  };

  describe("onCreateCollection works as expected", () => {
    after(async () => {
      await deleteCollection();
    });

    it("collection feed data is correct", async () => {
      await addCollection();
      const {data} = await getFeedCollectionData();
      expect({
        owner: myUid,
        content: [],
      }).deep.eq(data);
    });
  });

  describe("onDeleteCollection works as expected", () => {
    before(async () => {
      await addCollection();
      await deleteCollection();
    });

    it("food delete cascades to feed", async () => {
      const res = await getFeedCollectionData();
      expect(res.exists).false;
    });
  });
});

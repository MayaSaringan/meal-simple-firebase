import {expect} from "chai";
import {
  getCollection,
  getCollectionDocRef,
  getFeed,
  getFeedDocRef,
  getProfile,
  getProfileDocRef,
} from "../common";
import {Profile, ProfileID} from "../types";
require("../index");

const snooz = async (time = 2000) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};
describe("Profile updates work as expected", () => {
  const myUid: ProfileID = "testUid";
  let profData: Profile;
  describe("onCreateProfile works as expected", () => {
    before(async () => {
      await getProfileDocRef(myUid).set({name: "Test"});
      await snooz();
      profData = await getProfile(myUid);
    });
    after(async () => {
      await getProfileDocRef(myUid).delete();
      await snooz();
    });
    it("onCreateProfile creates likes collection", async () => {
      const collId = profData.likesCollection;
      const collSnap = await getCollection(collId);
      expect(profData).haveOwnProperty("likesCollection");
      expect(collSnap.owner).eql(myUid);
    });
    it("onCreateProfile creates all foods collection", async () => {
      const collId = profData.foodsCollection;
      const collSnap = await getCollection(collId);
      expect(profData).haveOwnProperty("foodsCollection");
      expect(collSnap.owner).eql(myUid);
    });
    it("onCreateProfile creates feed", async () => {
      const feedId = profData.feed;
      const feedSnap = await getFeed(feedId);
      expect(profData).haveOwnProperty("feed");
      expect(feedSnap.owner).eql(myUid);
    });
  });

  describe("onDeleteProfile works as expected", () => {
    before(async () => {
      await getProfileDocRef(myUid).set({name: "Test"});
      await snooz();
      profData = await getProfile(myUid);
      await getProfileDocRef(myUid).delete();
      await snooz();
    });
    it("onDeleteProfile removes profile", async () => {
      const snap = await getProfileDocRef(myUid);
      const ref = await snap.get();
      expect(ref.exists).false;
    });
    it("onDeleteProfile removes likes collection", async () => {
      const collId = profData.likesCollection;
      const snap = await getCollectionDocRef(collId);
      const ref = await snap.get();
      expect(ref.exists).false;
    });
    it("onDeleteProfile removes all foods collection", async () => {
      const collId = profData.foodsCollection;
      const snap = await getCollectionDocRef(collId);
      const ref = await snap.get();
      expect(ref.exists).false;
    });
    it("onDeleteProfile removes feed", async () => {
      const feedId = profData.feed;
      const snap = await getFeedDocRef(feedId);
      const ref = await snap.get();
      expect(ref.exists).false;
    });
  });
});

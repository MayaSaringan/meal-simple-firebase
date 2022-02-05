import {expect} from "chai";
import {
  getCollectionDocRef,
  getFeedDocRef,
  getProfile,
  getProfileDocRef,
} from "../common";
import {Collection, Feed, Profile, ProfileID} from "../types";
import {snooz} from "./common";

require("../index");

describe("Profile updates", () => {
  const myUid: ProfileID = "testUid";
  let profData: Profile;

  const getCollectionData = async (
      collId: string,
  ): Promise<{ exists: boolean; data: Collection | undefined }> => {
    const snap = await getCollectionDocRef(collId);
    const ref = await snap.get();
    const exists = ref.exists;
    const docData = ref.data();
    return {exists, data: exists ? (docData as Collection) : undefined};
  };

  const getFeedData = async (
      feedId: string,
  ): Promise<{ exists: boolean; data: Feed | undefined }> => {
    const snap = await getFeedDocRef(feedId);
    const ref = await snap.get();
    const exists = ref.exists;
    const docData = ref.data();
    return {exists, data: exists ? (docData as Feed) : undefined};
  };

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

    it("creates likes collection", async () => {
      const collId = profData.likesCollection;
      const res = await getCollectionData(collId);
      expect(profData).haveOwnProperty("likesCollection");
      expect(res.exists).true;
      expect(res.data?.owner).eql(myUid);
    });

    it("creates all foods collection", async () => {
      const collId = profData.foodsCollection;
      const res = await getCollectionData(collId);
      expect(profData).haveOwnProperty("foodsCollection");
      expect(res.exists).true;
      expect(res.data?.owner).eql(myUid);
    });

    it("creates feed", async () => {
      const feedId = profData.feed;
      const res = await getFeedData(feedId);
      expect(profData).haveOwnProperty("feed");
      expect(res.exists).true;
      expect(res.data?.owner).eql(myUid);
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

    it("removes profile", async () => {
      const snap = await getProfileDocRef(myUid);
      const ref = await snap.get();
      expect(ref.exists).false;
    });

    it("removes likes collection", async () => {
      const collId = profData.likesCollection;
      const res = await getCollectionData(collId);
      expect(res.exists).false;
    });

    it("removes all foods collection", async () => {
      const collId = profData.foodsCollection;
      const res = await getCollectionData(collId);
      expect(res.exists).false;
    });

    it("removes feed", async () => {
      const feedId = profData.feed;
      const res = await getFeedData(feedId);
      expect(res.exists).false;
    });
  });
});

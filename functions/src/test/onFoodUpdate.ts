import {expect} from "chai";
import {
  getContentForCollection,
  getFoodDocRef,
  getProfile,
  getProfileDocRef,
} from "../common";
import {BasicFood, CollectionID, Food, Profile, ProfileID} from "../types";
import {snooz} from "./common";

require("../index");

describe("Food updates", () => {
  const myUid: ProfileID = "testUid";
  const foodId: ProfileID = "testFood";
  let profData: Profile;

  before(async () => {
    await getProfileDocRef(myUid).set({name: "Test"});
    await snooz();
    profData = await getProfile(myUid);
  });
  after(async () => {
    await getProfileDocRef(myUid).delete();
    await snooz();
  });

  const getFoodCollectionData = async (
      collId: CollectionID,
  ): Promise<{
    exists: boolean;
    data: BasicFood | undefined;
  }> => {
    const contentRef = await getContentForCollection(collId);
    const snap = await contentRef.doc(foodId);
    const ref = await snap.get();
    const exists = ref.exists;
    const docData = ref.data();
    return {exists, data: exists ? (docData as BasicFood) : undefined};
  };

  const addFood = async (isLiked: boolean) => {
    await getFoodDocRef(foodId).set({
      name: "Banana",
      owner: myUid,
      likes: isLiked ? [myUid] : [],
    });
    await snooz();
  };

  const editFood = async (change: Partial<Food>) => {
    await getFoodDocRef(foodId).update(change);
    await snooz();
  };

  const deleteFood = async () => {
    await getFoodDocRef(foodId).delete();
    await snooz();
  };

  describe("onCreateFood works as expected", () => {
    after(async () => {
      await deleteFood();
    });

    it("food collection data is correct", async () => {
      await addFood(false);
      const {data} = await getFoodCollectionData(profData.foodsCollection);
      expect({
        name: "Banana",
        owner: myUid,
        isLiked: false,
        numLikes: 0,
      }).deep.eq(data);
    });

    it("adds food to personal collection", async () => {
      await addFood(false);
      const res = await getFoodCollectionData(profData.foodsCollection);
      expect(res.exists).true;
    });

    it("does NOT add food to likes if uid NOT in likes", async () => {
      await addFood(false);
      const res = await getFoodCollectionData(profData.likesCollection);
      expect(res.exists).false;
    });

    it("does add food to likes if uid in likes", async () => {
      await addFood(true);
      const res = await getFoodCollectionData(profData.likesCollection);
      expect(res.exists).true;
    });
  });

  describe("onUpdateFood works as expected", () => {
    before(async () => {
      await addFood(false);
    });
    after(async () => {
      await deleteFood();
    });

    it("food collection data is correct", async () => {
      await editFood({name: "Banana V2"});
      const {data} = await getFoodCollectionData(profData.foodsCollection);
      expect({
        name: "Banana V2",
        owner: myUid,
        isLiked: false,
        numLikes: 0,
      }).deep.eq(data);
    });

    it("food edit cascades to personal collection", async () => {
      await editFood({name: "Banana V2"});
      const res = await getFoodCollectionData(profData.foodsCollection);
      expect(res.data?.name).eql("Banana V2");
    });

    it("food edit does add to likes collection", async () => {
      await editFood({likes: [myUid]});
      const res = await getFoodCollectionData(profData.likesCollection);
      expect(res.exists).true;
      expect(res.data?.isLiked).true;
    });

    it("food edit cascades to likes collection", async () => {
      await editFood({likes: [myUid]});
      const res = await getFoodCollectionData(profData.likesCollection);
      expect(res.data?.isLiked).true;
    });

    it("food edit does remove from likes collection", async () => {
      await editFood({likes: [myUid]});
      await editFood({likes: []});
      const res = await getFoodCollectionData(profData.likesCollection);
      expect(res.exists).false;
    });
  });

  describe("onDeleteFood works as expected", () => {
    before(async () => {
      await addFood(true);
      await deleteFood();
    });

    it("food delete cascades to personal collection", async () => {
      const res = await getFoodCollectionData(profData.foodsCollection);
      expect(res.exists).false;
    });

    it("food edit does cascades to likes collection", async () => {
      const res = await getFoodCollectionData(profData.likesCollection);
      expect(res.exists).false;
    });
  });
});

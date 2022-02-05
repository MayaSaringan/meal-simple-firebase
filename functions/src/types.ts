export interface Profile {
  likesCollection: string;
  foodsCollection: string;
  feed: string;
  collections: string[];
}

export type ProfileID = string;

export interface Collection {
  owner: ProfileID;
}

export type CollectionID = string;

export interface BasicCollection {
  owner: string;
  content: BasicFood[];
}

export interface Food {
  name: string;
  likes: string[];
  access: "public" | "private";
  owner: ProfileID;
}

export type FoodID = string;

export interface BasicFood {
  name: string;
  numLikes: number;
  isLiked: boolean;
  owner: ProfileID;
}

export interface Feed {
  owner: ProfileID;
}

export type FeedID = string;

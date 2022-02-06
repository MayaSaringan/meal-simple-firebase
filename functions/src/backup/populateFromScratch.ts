import {getProfileDocRef} from "../common";
import {snooz} from "../test/common";
require("../index");

const main = async () => {
  // Start admin profile.
  await getProfileDocRef("admin").set({name: "Maya Saringan"});
  await snooz(2000);
};

main();

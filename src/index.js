import { runningAPI } from "./yt_es";

runningAPI().catch((e) => {
  console.error(e);
  throw e;
});

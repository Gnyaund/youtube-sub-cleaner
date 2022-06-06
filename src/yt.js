const { google } = require("googleapis");
const fs = require("fs");
const _async = require("async");
const localData = require("./../jsondata/channels_data.json");
const DetailData = require("./../jsondata/uploads.json");
const date = require("./../jsondata/getdate.json");
const del = require("./../jsondata/delete.json");

const googleAuth = () => {
  const CREDENTIALS_PATH = "credentials.json";
  const TOKEN_PATH = "token.json";
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));

  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  oAuth2Client.setCredentials(token);

  return oAuth2Client;
};

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function getNumOfSubs() {
  const auth = googleAuth();
  const service = google.youtube({ version: "v3", auth });

  const res = await service.subscriptions.list({
    mine: true,
    part: "snippet",
    fields: "pageInfo(totalResults)",
  });

  return res.data.pageInfo.totalResults;
}

let count = 0;

/*
const subsListSettings = {
  mine: true,
  part: "snippet",
  fields: "nextPageToken, items(snippet(title, channelId))",
  maxResults: 1,
  pageToken: "",
};
*/
//pageToken空欄にすれば勝手に最初のやつもらえる
const subsListSettings = (nextpage) => {
  return {
    mine: true,
    part: "snippet",
    //fields: "nextPageToken, items(snippet(title, channelId))",
    maxResults: 50,
    pageToken: nextpage,
  };
};
const getChSetting = (ch_id) => {
  return { part: "snippet,contentDetails,statistics", id: ch_id };
};

let chInfo = [];

let nextToken = "";
async function getChList(token) {
  const auth = googleAuth();
  const service = google.youtube({ version: "v3", auth });

  await service.subscriptions
    .list(subsListSettings(token))
    .then(async function (response) {
      const channel = response.data.items[0];
      const snippet = channel.snippet;
      //console.log(response);
      nextToken = response.data.nextPageToken;
      //const subs = await getNumOfSub();

      for (let i = 0; i < response.data.items.length; i++) {
        chInfo.push({
          title: response.data.items[i].snippet.title,
          id: response.data.items[i].snippet.resourceId.channelId,
        });
      }
      if (nextToken !== undefined) {
        getChList(nextToken);
        // データの取得が完了した場合はconsoleに結果表示
      } else {
        return chInfo;
        //console.log(chInfo);
        //console.log(chInfo[0].id);
      }
    });
}

async function getPropertyfromObject(object) {
  let array = [];
  for (const element in object) {
    if (Object.hasOwnProperty.call(object, element)) {
      array.push(object[element]);
    } else {
      return array;
    }
  }
}
let fo = 0;

//チャンネルIDから投稿動画のプレイリスト取得
//object: {title: hogehoge, id: foo}
function getUploads(input, dataId) {
  return new Promise((resolve, reject) => {
    console.log(`START: dataId ->${dataId}  Name -> ${input.title}`);
    const auth = googleAuth();
    const service = google.youtube({ version: "v3", auth });
    service.channels
      .list({
        part: "snippet, contentDetails, statistics",
        id: input.id,
      })
      .then(function (response) {
        const channel = response.data.items;
        const uploads_id = channel[0].contentDetails.relatedPlaylists.uploads;
        input.uploads_id = uploads_id;
      });
    setTimeout(() => {
      console.log(`END: dataId ->${dataId}  Name -> ${input.title}`);
      resolve({
        input,
      });
    }, 1500);
  });
}

async function executingGetUploads(object) {
  let chData = [];
  const workerLim = 10;
  const res = await _async.mapValuesLimit(
    object,
    workerLim,
    _async.asyncify(getUploads)
  );
  for (const v of Object.values(res)) {
    chData.push(v.input);
  }
  return chData;
}

async function getUpId(id) {
  const auth = googleAuth();
  const service = google.youtube({ version: "v3", auth });

  const data = await service.channels
    .list({
      part: "snippet,contentDetails,statistics",
      id: id,
    })
    .then(function (response) {
      const channel = response.data.items;
      const uploads_id = channel[0].contentDetails.relatedPlaylists.uploads;
      console.log(uploads_id);
    });
}

//最新動画の取得
async function __getlatestVideo(playlist_id) {
  const auth = googleAuth();
  const youtube = google.youtube({ version: "v3", auth });

  const res = await youtube.playlistItems.list({
    part: "snippet",
    playlistId: playlist_id,
  });
  //console.log(res.data.items[0].snippet);
  const video = res.data.items[0].snippet;
  return {
    latest_video: video.publishedAt,
  };
}

function getlatestVideo(input, dataId) {
  return new Promise((resolve, reject) => {
    console.log(`START: dataId ->${dataId}  Name -> ${input.title}`);
    const auth = googleAuth();
    const service = google.youtube({ version: "v3", auth });
    service.playlistItems
      .list({
        part: "snippet",
        playlistId: input.uploads_id,
      })
      .then(function (response) {
        const video = response.data.items[0].snippet;
        input.latestDate = video.publishedAt;
      })
      .catch((error) => {
        input.latestDate = "";
      });
    setTimeout(() => {
      console.log(`END: dataId ->${dataId}  Name -> ${input.title}`);
      resolve({
        input,
      });
    }, 1000);
  });
}

async function executingGetlatestDate(object) {
  //console.log("Getting DATE of latest video");
  let chData = [];
  const workerLim = 10;
  const res = await _async.mapValuesLimit(
    object,
    workerLim,
    _async.asyncify(getlatestVideo)
  );
  for (const v of Object.values(res)) {
    chData.push(v.input);
  }
  return chData;
}

async function __getlatestVideos(chList) {
  const auth = googleAuth();
  const service = google.youtube({ version: "v3", auth });
  await Promise.all(
    chList.map(async (object) => {
      if (Object.hasOwnProperty.call(chList[0], "uploads_id")) {
        console.log(object.uploads_id);
        return await service.playlistItems
          .list({
            part: "snippet",
            playlistId: object.uploads_id,
          })
          .then(function (response) {
            const video = response.data.items[0].snippet;
            object.latest_video = video.publishedAt;
          });
      }
    })
  );
}

async function __recommendDeleteChannels(chList) {
  /* 1 year */
  const DATE = new Date();
  const YEAR = DATE.getFullYear();
  await Promise.all(
    chList.map(async (object) => {
      if (Object.hasOwnProperty.call(chList[0], "latestDate")) {
        //console.log(object.latestDate);
        const str = object.latestDate;
        if (str.indexOf(YEAR) == -1) {
          object.delete = 0;
        }
        return 0;
      }
    })
  );
  return chList;
}

async function recommendDeleteChannels(chList, y) {
  const DATE = new Date();
  const YEAR = DATE.getFullYear();
  /* 2 year */
  await Promise.all(
    chList.map(async (object) => {
      if (Object.hasOwnProperty.call(chList[0], "latestDate")) {
        //console.log(object.latestDate);
        const ye = object.latestDate.substr(0, 4);
        const latest = Number(ye);
        if (latest - YEAR < y + 1 && Math.sign(latest - YEAR) == -1) {
          object.delete = 0;
          delete object.latestDate;
          //console.log(`title:${object.title}  latest:${object.latestDate}`);
        }
        return 0;
      }
    })
  );
  return chList;
}

function deleteChannels(input, dataId) {
  const auth = googleAuth();
  const service = google.youtube({ version: "v3", auth });
  return new Promise((resolve, reject) => {
    if (Object.hasOwnProperty.call(input, "delete")) {
      service.subscriptions.delete({
        id: input.id,
      });
      input.del = 1;
      setTimeout(() => {
        resolve({ input });
      }, 1000);
    } else {
      resolve({ input });
    }
  });
}
async function executingDeleteChannels(object) {
  let chData = [];
  const workerLim = 100;
  const res = await _async.mapValuesLimit(
    object,
    workerLim,
    _async.asyncify(deleteChannels)
  );
  for (const v of Object.values(res)) {
    chData.push(v.input);
  }
  return chData;
}

async function runningAPI() {
  const list = await getChList("");
  await sleep(1500);
  const u = await executingGetUploads(chInfo);
  const d = await executingGetlatestDate(u);
  const ga = await recommendDeleteChannels(d, 1);
  /*
  const data1 = JSON.stringify(ga, undefined, 4);
  console.log(data1);
  */
  const de = await executingDeleteChannels(ga);
  console.log("DONE");
}

async function main() {
  //const list = await getChList("");
  //await sleep(3000);
  //chInfo = localData; //テスト用にローカルから持ち出してる
  //const d = await coCurrently_uploads(chInfo);
  /* JSON書き出し用
  const data1 = JSON.stringify(d, undefined, 4);
  fs.writeFileSync("uploads.json", data1);
  */
  //const f = await coCurrently_getDate(DetailData);
  await runningAPI();
  //await sleep(2000);
  // getUploadsList(chInfo); //最後の29こだけ取得できない
  //await sleep(3000);
  //await getlatestVideos(chInfo);
  //await sleep(2300);
  //console.log(JSON.stringify(chInfo, undefined, 4));
  //console.log(fo);

  //testing();
  let test1 = []; //てすとでやってみて
  //
  //
  //const subsList = await getSubs();
  /* ここに回す処理 */
  //console.log(subsList.id);
  //const uploadsId = await getChannel(subsList.id);
  //console.log(uploadsId);
  //const latestVideos = await getlatestVideo(uploadsId);
  //console.log(latestVideos);
}

main().catch((e) => {
  console.error(e);
  throw e;
});

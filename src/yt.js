const { google } = require("googleapis");
const fs = require("fs");

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

//チャンネルIDから投稿動画のプレイリスト取得
async function getChannel(ch_id) {
  const auth = googleAuth();
  const service = google.youtube({ version: "v3", auth });

  const res = await service.channels.list({
    part: "snippet,contentDetails,statistics",
    id: ch_id,
  });
  const channels = res.data.items;
  //console.log(channels[0].contentDetails.relatedPlaylists.uploads);
  return channels[0].contentDetails.relatedPlaylists.uploads;
}

//最新動画の取得
async function getlatestVideo(playlist_id) {
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
let chInfo = [];

async function testing() {
  const auth = googleAuth();
  const service = google.youtube({ version: "v3", auth });
  const res = await service.subscriptions.list({
    maxResults: 50,
    mine: true,
    part: "snippet",
  });
  console.log(res.data.items[1].snippet);
}

//1つずつなら一つの関数にまとめれそう　classとか使えばまとめていけるのかな
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

async function getUploadsList(chList) {
  const auth = googleAuth();
  const service = google.youtube({ version: "v3", auth });

  /*
  const res = await service.channels.list({
    part: "snippet,contentDetails,statistics",
    id: ch_id,
  });
  const channels = res.data.items;
  //console.log(channels[0].contentDetails.relatedPlaylists.uploads);
  return channels[0].contentDetails.relatedPlaylists.uploads;
  */
  const subs = getNumOfSubs();
  /*
  Promise.all(
    chIds.map(async (chList) => {
      await service.channels
        .list(getChSetting(chList[i].id))
        .then(function (response) {
          const channel = response.data.items;
          const uploads_id = channel[0].contentDetails.relatedPlaylists.uploads;
          console.log(uploads_id);
          chInfo[i].uploads_id = uploads_id;
        });
    })
  );
  */
  for (const key in chList) {
    if (Object.hasOwnProperty.call(chList[0], "id")) {
      //console.log("Hello???");
      console.log(chList[key].id);
      const data = await service.channels
        .list({
          part: "snippet,contentDetails,statistics",
          id: chList[key].id,
        })
        .then(function (response) {
          const channel = response.data.items;
          const uploads_id = channel[0].contentDetails.relatedPlaylists.uploads;
          console.log(uploads_id);
          //chList[0].uploads_id = uploads_id;
        });
    }
  }
}
/*
class YoutubeDataAPI {
  constructor() {
    this.auth = googleAuth();
    this.service = google.youtube({ version: "v3", auth: this.auth });
  }
  info = [];
  async getNumOfSub() {
    const res = await this.service.subscriptions.list({
      mine: true,
      part: "snippet",
      fields: "pageInfo(totalResults)",
    });
    return res.data.pageInfo.totalResults;
  }

  async getCount() {
    const subs = await this.getNumOfSub();
    return Math.round(subs / 50);
  }

  executeSubsList(token) {
    this.service.subscriptions.list(subsListSettings(token));
  }
  
  async getChannelInfo() {
    this.executeSubsList(token).then({
      function(response) {
        pagetoken = response.nextPageToken;
        // 取得したデータを整形して結果用の配列に入れる
        for (var i = 0; i < response.items.length; i++) {
          results.push({
            title: response.items[i].snippet.title,
            id: response.items[i].snippet.channelId,
          });
        }
        // 次のデータがある場合は再度データ取得を実行
        if (pagetoken !== undefined) {
         getChannelInfo();
          // データの取得が完了した場合はconsoleに結果表示
        } else {
          console.log(results);
        }
      },
    });
  }
  

  async foo(params) {
    let ch = await this.service.subscriptions.list(subsListSettings(""));
    const channel = ch.data.items[0];
    const snippet = channel.snippet;
    const count = await this.getCount();
    for (let index = 0; index < count; index++) {
      let nextCh = await this.service.subscriptions
        .list(subsListSettings(nextpage))
        .then();
    }
    return {
      id: snippet.channelId,
      name: snippet.title,
      nextToken: ch.data.nextPageToken,
    };
  }
}
*/
async function main() {
  const list = await getChList("");
  await sleep(3000);
  console.log(chInfo);

  //testing();
  let test1 = []; //てすとでやってみて
  //
  //await getUploadsList(chInfo);
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

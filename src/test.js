const { google } = require("googleapis");
const fs = require("fs");
const _async = require("async");

const data = [
  {
    title: "みざちゃんねる",
    id: "UCFBSXqhTCTQp7zfXO-FhA6A",
    uploads_id: "UUFBSXqhTCTQp7zfXO-FhA6A",
    del: 0,
  },
  {
    title: "jun channel",
    id: "UCx1nAvtVDIsaGmCMSe8ofsQ",
    uploads_id: "UUx1nAvtVDIsaGmCMSe8ofsQ",
  },
  {
    title: "瀬戸弘司 / Koji Seto",
    id: "UCFBjsYvwX7kWUjQoW7GcJ5A",
    uploads_id: "UUFBjsYvwX7kWUjQoW7GcJ5A",
  },
  {
    title: "瀬戸弘司ミニ",
    id: "UCzkHSAUZUBP1MV2t8tqntdA",
    uploads_id: "UUzkHSAUZUBP1MV2t8tqntdA",
  },
  {
    title: "鷺原鈴音【SagiharaRinne】",
    id: "UCiQPSLj6Zg2ERGdq3o8M87Q",
    uploads_id: "UUiQPSLj6Zg2ERGdq3o8M87Q",
  },
  {
    title: "StylishNoob",
    id: "UC2j4lymo8Ce_1RXMeo4afcQ",
    uploads_id: "UU2j4lymo8Ce_1RXMeo4afcQ",
  },
  {
    title: "SHAKAch",
    id: "UCjg5-lUiUzdmzzBRY9Xqrhw",
    uploads_id: "UUjg5-lUiUzdmzzBRY9Xqrhw",
  },
  {
    title: "Eruru/えるるぅ",
    id: "UC6ynhYYeU6wiUOyqxG7uISw",
    uploads_id: "UU6ynhYYeU6wiUOyqxG7uISw",
  },
  {
    title: "SPYGEA / スパイギア",
    id: "UCBnFEiB9v4afsg8tbhmIACQ",
    uploads_id: "UUBnFEiB9v4afsg8tbhmIACQ",
  },
  {
    title: "とある漢のチャンネルもこう",
    id: "UCZFxcWJS1_iVIFETARRRHZQ",
    uploads_id: "UUZFxcWJS1_iVIFETARRRHZQ",
  },
  {
    title: "Mary Channel / 西園寺メアリ【ハニスト】",
    id: "UCwePpiw1ocZRSNSkpKvVISw",
    uploads_id: "UUwePpiw1ocZRSNSkpKvVISw",
  },
  {
    title: "ローレン・イロアス / Lauren Iroas【にじさんじ】",
    id: "UCgmFrRcyH7d1zR9sIVQhFow",
    uploads_id: "UUgmFrRcyH7d1zR9sIVQhFow",
  },
];

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

async function getUploadsList(chList) {
  const auth = googleAuth();
  const service = google.youtube({ version: "v3", auth });
  await Promise.all(
    chList.map(async (object) => {
      if (Object.hasOwnProperty.call(chList[0], "id")) {
        return await service.channels
          .list({
            part: "snippet,contentDetails,statistics",
            id: object.id,
          })
          .then(function (response) {
            const channel = response.data.items;
            const uploads_id =
              channel[0].contentDetails.relatedPlaylists.uploads;
            //console.log("UpID" + uploads_id);
            object.uploads_id = uploads_id;
            fo++;
          });
      }
    })
  );
}

function task(input, dataId) {
  return new Promise((resolve, reject) => {
    console.log(
      `TASK START : workerId->dataId->${dataId} name->${input.title}`
    );
    const auth = googleAuth();
    const service = google.youtube({ version: "v3", auth });
    service.channels
      .list({
        part: "snippet,contentDetails,statistics",
        id: input.id,
      })
      .then(function (response) {
        const channel = response.data.items;
        const uploads_id = channel[0].contentDetails.relatedPlaylists.uploads;
        //console.log("UpID" + uploads_id);
        input.uploads_id = uploads_id;
      });
    setTimeout(() => {
      console.log(
        `----- TASK END : workerId->dataId->${dataId} name->${input.title}`
      );
      resolve({
        input,
      });
    }, 3000);
  });
}
/*
(async () => {
  let chInfo = [];
  const workerNum = 5;
  const res = await _async.mapValuesLimit(
    data,
    workerNum,
    _async.asyncify(task)
  );
  for (const v of Object.values(res)) {
    chInfo.push(v.input);
    //console.log(v);
  }
  console.log(chInfo);
})();
*/
async function __getPlaylist() {
  const auth = googleAuth();
  const youtube = google.youtube({ version: "v3", auth });
  const playlist_id = "UUdZh0h9NiK48LGhtP-WRDPQ"; //存在しないリスト
  const exist_id = "UUHTWZvJOz1pPedcZNe6QBwg";
  const res = await youtube.playlistItems
    .list({
      part: "snippet",
      playlistId: "HL",
      mine: true,
    })
    .catch((error) => {
      // reponse.headers.status == 404 で処理かけるか ~.headers.statusText == "Not Found"
      // errors[0].reason tokademo ari
      console.log(error.response);
      //無を代入
    });
  //console.log(res.data.items[0].snippet);
  console.log(res.data);
}

function getlatestVideo(input, dataId) {
  return new Promise((resolve, reject) => {
    console.log(`START: dataId ->${dataId}  Name -> ${input.title}`);
    const upId = input.uploads_id;
    const auth = googleAuth();
    const service = google.youtube({ version: "v3", auth });
    service.playlistItems
      .list({
        part: "snippet",
        playlistId: upId,
      })
      .then(function (response) {
        const video = response.data.items[0].snippet;
        input.latestDate = video.publishedAt;
        console.log(input.latestDate);
      })
      .catch((error) => {
        console.log(error);
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

async function coCurrently_getDate() {
  console.log("Getting DATE of latest video");
  let chData = [];
  const workerLim = 10;
  const res = await _async.mapValuesLimit(
    data,
    workerLim,
    _async.asyncify(getlatestVideo)
  );
  for (const v of Object.values(res)) {
    chData.push(v.input);
  }
  return chData;
}

async function yo() {
  const f = await coCurrently_getDate();
  console.log(f);
}

function getHistory(input, dataId) {
  return new Promise((resolve, reject) => {
    console.log(`START: dataId ->${dataId}  Name -> ${input.title}`);
    const upId = input.uploads_id;
    const auth = googleAuth();
    const service = google.youtube({ version: "v3", auth });
    service.playlistItems
      .list({
        part: "snippet",
        mine: true,
      })
      .then(function (response) {
        const video = response.data.items[0].snippet;
        input.latestDate = video.publishedAt;
        console.log(input.latestDate);
      })
      .catch((error) => {
        console.log(error);
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

async function __getHistory() {
  const auth = googleAuth();
  const service = google.youtube({ version: "v3", auth });

  const res = await service.channels
    .list({
      mine: true,
      part: "snippet, contentDetails",
    })
    .then(function (response) {
      console.log(
        response.data.items[0].contentDetails.relatedPlaylists.watchHistory
      );
      console.log(JSON.stringify(response.data.items[0], undefined, 4));
      //console.log(response.data.items[0].contentDetails.relatedPlaylists);
      //再生履歴表示できるようにしないとだめっぽい
    });
}

/*
再生履歴がAPI v3から取り出し不可になった
→Google Data ExportでJSONで再生履歴データを持ってきてやったほうがよさそう
puppeterでゴリ押しがいいかも

 */

function deleteChannels(input, dataId) {
  return new Promise((resolve, reject) => {
    if (Object.hasOwnProperty.call(input, "del")) {
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

async function main() {
  const t = await executingDeleteChannels(data);
  console.log(t);
}

main();

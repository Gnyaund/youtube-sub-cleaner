const { google } = require("googleapis");
const fs = require("fs");
const _async = require("async");

const data = [
  {
    title: "みざちゃんねる",
    id: "UCFBSXqhTCTQp7zfXO-FhA6A",
  },
  {
    title: "jun channel",
    id: "UCx1nAvtVDIsaGmCMSe8ofsQ",
  },
  {
    title: "瀬戸弘司 / Koji Seto",
    id: "UCFBjsYvwX7kWUjQoW7GcJ5A",
  },
  {
    title: "瀬戸弘司ミニ",
    id: "UCzkHSAUZUBP1MV2t8tqntdA",
  },
  {
    title: "鷺原鈴音【SagiharaRinne】",
    id: "UCiQPSLj6Zg2ERGdq3o8M87Q",
  },
  {
    title: "StylishNoob",
    id: "UC2j4lymo8Ce_1RXMeo4afcQ",
  },
  {
    title: "SHAKAch",
    id: "UCjg5-lUiUzdmzzBRY9Xqrhw",
  },
  {
    title: "Eruru/えるるぅ",
    id: "UC6ynhYYeU6wiUOyqxG7uISw",
  },
  {
    title: "SPYGEA / スパイギア",
    id: "UCBnFEiB9v4afsg8tbhmIACQ",
  },
  {
    title: "とある漢のチャンネルもこう",
    id: "UCZFxcWJS1_iVIFETARRRHZQ",
  },
  {
    title: "Mary Channel / 西園寺メアリ【ハニスト】",
    id: "UCwePpiw1ocZRSNSkpKvVISw",
  },
  {
    title: "ローレン・イロアス / Lauren Iroas【にじさんじ】",
    id: "UCgmFrRcyH7d1zR9sIVQhFow",
  },
  {
    title: "Lazvell",
    id: "UCqf8Mlsu9tsWigALK2gT-1g",
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

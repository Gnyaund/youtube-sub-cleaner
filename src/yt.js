const fs = require("fs");
const { google } = require("googleapis");

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

async function getSubs(nextpage) {
  const auth = googleAuth();
  const service = google.youtube({ version: "v3", auth });

  if (count == 0) {
    count++;
    const res = await service.subscriptions.list({
      mine: true,
      part: "snippet",
      fields: "nextPageToken, items(id, snippet(title))",
      maxResults: 1,
    });

    const channel = res.data.items[0];
    const snippet = channel.snippet;
    return {
      id: channel.id,
      name: snippet.title,
      nextToken: res.data.nextPageToken,
    };
  } else {
    const res = await service.subscriptions.list({
      mine: true,
      part: "snippet",
      fields: "nextPageToken,items(id, snippet(title))",
      pageToken: nextpage,
      maxResults: 1,
    });

    const channel = res.data.items[0];
    const snippet = channel.snippet;
    return {
      id: channel.id,
      name: snippet.title,
      nextToken: res.data.nextPageToken,
    };
  }
}

async function main() {
  //const num_of_subs = await getNumOfSubs();
  //console.log(num_of_subs);

  const subsList = await getSubs();
  const nextsub = await getSubs(subsList.nextToken);
  console.log(subsList);
  console.log(nextsub);
}

main().catch((e) => {
  console.error(e);
  throw e;
});

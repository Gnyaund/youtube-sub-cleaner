/  googleapis is CommonJS  /;

const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const { stringify } = require("querystring");
const { title } = require("process");
const { get } = require("http");

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
/*
(async () => {
  const auth = googleAuth();
  const service = google.youtube({ version: "v3", auth });
  //console.log(youtube.channels);
  try {
    service.channels.list(
      {
        auth: auth,
        part: "snippet,contentDetails,statistics, brandingSettings",
        mine: true,
      },
      function (err, response) {
        if (err) {
          console.log("The API returned an error: " + err);
          return;
        }
        const channels = response.data.items;
        if (channels.length == 0) {
          console.log("No channel found.");
        } else {
          console.log(
            "This channel's ID is %s. Its title is '%s', and " +
              "it has %s views.",
            channels[0].id,
            channels[0].snippet.title,
            channels[0].statistics.viewCount
          );
          //console.log(JSON.stringify(channels, undefined, 4));
        }
      }
    );
  } catch (error) {
    console.log("The API returned an error: " + error);
  }
})();
*/

async function getSubs() {
  const auth = googleAuth();
  const service = google.youtube({ version: "v3", auth });
  // Acquire an auth client, and bind it to all future calls

  // Do the magic
  const res = await service.subscriptions.list({
    mine: true,
    part: "snippet",
    fields: "pageInfo(totalResults),items(id, snippet(title))",
  });
  //console.log(JSON.stringify(res.data, undefined, 4))
  const channel = res.data.items[0];
  const snippet = channel.snippet;
  return {
    id: channel.id,
    name: snippet.title,
  };
  /*
  console.log(res.data.items["snippet"]);
  currentSubs: res.data["pageInfo"]["totalResults"]

  */
}

async function main() {
  const subsList = await getSubs().catch((e) => {
    console.error(e);
    throw e;
  });
  console.log(subsList);
}

main().catch((e) => {
  console.error(e);
  throw e;
});

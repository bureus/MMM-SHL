const NodeHelper = require("node_helper");
const request = require("request-promise");
const encode = require("nodejs-base64-encode");

const baseUrl = "https://openapi.shl.se";
var Url = require("url");
var debugMe = true;

module.exports = NodeHelper.create({
  // --------------------------------------- Start the helper
  start: function() {
    log("Starting helper: " + this.name);
    this.started = false;
  },
  // --------------------------------------- Schedule a stands update
  scheduleUpdate: function(refreshRate) {
    let self = this;
    self.estimatedRefreshTime = new Date(Date.now() + refreshRate);
    log("Sceduled refresh at: " + self.estimatedRefreshTime.toLocaleTimeString());
    this.updatetimer = setInterval(function() {
      // This timer is saved in uitimer so that we can cancel it
      self.update();
    }, refreshRate);
  },
  // --------------------------------------- Get access token
  getAccessToken: async function() {
    let self = this;
    return new Promise(resolve => {
      let basicAuth = encode.encode(
        this.config.clientId + ":" + this.config.clientSecret,
        "base64"
      );
      let options = {
        method: "POST",
        uri: baseUrl + "/oauth2/token",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + basicAuth
        },
        body: "grant_type=client_credentials"
      };

      request(options)
        .then(function(body) {
          let reply = JSON.parse(body);
          debug("access token response: " + body);
          self.accessToken = {
            token: reply.access_token,
            expires: new Date(Date.now() + 3600000)
          };
          debug("generateAccessToken completed");
          resolve(true);
        })
        .catch(function(error) {
          log("generateAccessToken failed =" + error);
          self.sendSocketNotification("SERVICE_FAILURE", error);
          reject();
        });
    });
  },
  // --------------------------------------- Get stands
  getStands: async function() {
    let self = this;
    return new Promise(resolve => {
      if (self.accessToken) {
        debug("Getting standings");
        let currentDate = new Date(Date.now());
        let year =
          currentDate.getMonth() < 5
            ? currentDate.getFullYear() - 1
            : currentDate.getFullYear();
        let options = {
          method: "GET",
          uri: baseUrl + "/seasons/" + year + "/statistics/teams/standings",
          headers: {
            Authorization: "Bearer " + self.accessToken.token
          },
          json: true
        };

        request(options)
          .then(function(response) {
            debug("Standings retrived: " + JSON.stringify(response));
            let stands = response;
            debug("Number of teams: " + stands.length);
            resolve(stands);
          })
          .catch(function(error) {
            log("getStands failed =" + error);
            if (error.statusCode == 401) self.getAccessToken();
          });
      } else {
        log("Missing access token..");
        reject();
      }
    });
  },
  // --------------------------------------- Get games
  getGames: async function() {
    let self = this;
    return new Promise(resolve => {
      if (self.accessToken) {
        debug("Getting standings");
        let currentDate = new Date(Date.now());
        let year =
          currentDate.getMonth() < 5
            ? currentDate.getFullYear() - 1
            : currentDate.getFullYear();
        let options = {
          method: "GET",
          uri: baseUrl + "/seasons/" + year + "/games",
          headers: {
            Authorization: "Bearer " + self.accessToken.token
          },
          json: true
        };

        request(options)
          .then(function(response) {
            debug("Games retrived: " + JSON.stringify(response));
            let games = response;
            debug("Number of games: " + games.length);
            resolve(games);
            //gamesPerTeams = groupGamesPerTeam(games);
            //resolve(gamesPerTeams);
          })
          .catch(function(error) {
            log("getStands failed =" + error);
            if (error.statusCode == 401) self.getAccessToken();
          });
      } else {
        log("Missing access token..");
        reject();
      }
    });
  },
  // --------------------------------------- Get team content
  getTeamContent: function(teamId) {
    switch (teamId) {
      case "FHC":
        return {
          icon:
            "https://www.shl.se/team_graphics/nef_shl/fhc1-fhc-f7c59/special/30.png",
          name: "Frölunda"
        };
      case "DIF":
        return {
          icon:
            "https://www.shl.se/team_graphics/nef_shl/dif1-dif-896f9/special/30.png",
          name: "Djurgården"
        };
      case "BIF":
        return {
          icon:
            "https://www.shl.se/team_graphics/nef_shl/bif1-bif-713a5/special/30.png",
          name: "Brynäs"
        };
      case "FBK":
        return {
          icon:
            "https://www.shl.se/team_graphics/nef_shl/fbk1-fbk-88173/special/30.png",
          name: "Färjestad"
        };
      case "HV71":
        return {
          icon:
            "https://www.shl.se/team_graphics/nef_shl/hv711-hv71-32ce9/special/30.png",
          name: "HV71"
        };
      case "LHC":
        return {
          icon:
            "https://www.shl.se/team_graphics/nef_shl/lhc1-lhc-e49a6/special/30.png",
          name: "Linköping"
        };
      case "LHF":
        return {
          icon:
            "https://www.shl.se/team_graphics/nef_shl/lhf1-lhf-cc96a/special/30.png",
          name: "Luleå"
        };
      case "MIF":
        return {
          icon:
            "https://www.shl.se/team_graphics/nef_shl/mif1-mif-d39e4/special/30.png",
          name: "Malmö"
        };
      case "MIK":
        return {
          icon:
            "https://www.shl.se/team_graphics/nef_shl/mik1-mik-82c5d/special/30.png",
          name: "Mora"
        };
      case "OHK":
        return {
          icon:
            "https://www.shl.se/team_graphics/nef_shl/ohk1-ohk-0ab2b/special/30.png",
          name: "Örebro"
        };
      case "RBK":
        return {
          icon:
            "https://www.shl.se/team_graphics/nef_shl/rbk1-rbk-539f1/special/30.png",
          name: "Rögle"
        };
      case "SAIK":
        return {
          icon:
            "https://www.shl.se/team_graphics/nef_shl/saik1-saik-ba23a/special/30.png",
          name: "Skellefteå"
        };
      case "TIK":
        return {
          icon:
            "https://www.shl.se/team_graphics/nef_shl/tik1-tik-9d6bb/special/30.png",
          name: "Timerå"
        };
      case "VLH":
        return {
          icon:
            "https://www.shl.se/team_graphics/nef_shl/vlh1-vlh-8a4d0/special/30.png",
          name: "Växjö"
        };
      case "IKO":
        return {
          icon:
            "https://www.shl.se/team_graphics/nef_shl/iko1-iko-891ab/special/30.png",
          name: "Oskarshamn"
        };
      case "LIF":
        return {
          icon:
            "https://www.shl.se/team_graphics/nef_shl/lif1-lif-57923/special/30.png",
          name: "Leksand"
        };
      default:
        return null;
    }
  },
  sendStand: async function() {
    let self = this;
    let dto = await self.generateDto();
    debug(JSON.stringify(dto));
    if (dto.sortedStand.length > 0) {
      self.sendSocketNotification("STANDS", dto); // send teams stands back to app.
    } else {
      self.sendSocketNotification("SERVICE_FAILURE", "Missing teams..");
    }
  },
  // --------------------------------------- update
  update: async function() {
    let self = this;
    if (this.updatetimer) {
      clearInterval(this.updatetimer);
    }
    if (!self.accessToken || self.accessToken.expires < Date.now()) {
      await self.getAccessToken();
      if (self.accessToken) debug("Access token retrived: " + self.accessToken);
    }
    
    self.games = await self.getGames();
    self.gamePerTeam = groupGamesPerTeam(self.games);
    self.stands = await self.getStands();
    await self.sendStand();
    let timeToNextUpdate = getRefreshTime(
      sortOnUpcomingGame(new Date(Date.now()), self.games)[0]
    );
    self.scheduleUpdate(timeToNextUpdate);
  },
  // --------------------------------------- Create DTO
  generateDto: async function() {
    let self = this;
    let dto = [];
    self.stands.forEach(team => {
      if (
        !this.config.teams ||
        this.config.teams.indexOf(team.team_code) > -1
      ) {
        debug("Team is: " + team.team_code);
        let teamContent = self.getTeamContent(team.team_code);
        team.icon = teamContent.icon;
        team.name = teamContent.name;
        team.games = sortOnUpcomingGame(
          new Date(Date.now()),
          self.gamePerTeam[team.team_code]
        );
        team.nextGame = team.games.length > 0 ? team.games[0] : null;
        debug(JSON.stringify(team));
        dto.push(team);
      }
    });
    debug(JSON.stringify(dto));
    let sortedStands = sortByKey(dto, "rank");
    let timeToNextUpdate = getRefreshTime(
      sortOnUpcomingGame(new Date(Date.now()), self.games)[0]
    );
    let nextUpdate = new Date(Date.now() + timeToNextUpdate);
    return {
        sortedStand: sortedStands,
        updated: Date.now(),
        nextUpdate: nextUpdate
    };
  },
  // --------------------------------------- Handle notifications
  socketNotificationReceived: async function(notification, payload) {
    const self = this;
    log("socketNotificationReceived");
    if (notification === "CONFIG") {
      log("CONFIG event received");
      this.config = payload;
      this.started = true;
      //debugMe = this.config.debug;
      if (!self.accessToken) {
        await self.getAccessToken(); // Get inital access token
      }
      self.update();
    }
  }
});

//
// Utilities
//
function sortByKey(array, key) {
  return array.sort(function(a, b) {
    let x = a[key];
    let y = b[key];
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

function getRefreshTime(nextGame) {
  if (!nextGame) {
    return 3600000;
  }
  let estimatedEndTime = new Date(nextGame.start_date_time);
  estimatedEndTime.setHours(estimatedEndTime.getHours() + 2);
  estimatedEndTime.setMinutes(estimatedEndTime.getMinutes() + 45);
  return estimatedEndTime - new Date(Date.now());
}

function sortOnUpcomingGame(date, array) {
  array.sort(function(a, b) {
    var distancea = Math.abs(date - new Date(a.start_date_time));
    var distanceb = Math.abs(date - new Date(b.start_date_time));
    return distancea - distanceb; // sort a before b when the distance is smaller
  });
  let sorted = array.filter(function(d) {
    return new Date(d.start_date_time) - date > 0;
  });
  return sorted;
}

function groupGamesPerTeam(games) {
  let teams = {};
  for (let i = 0; i < games.length; i++) {
    let awayTeam = games[i]["away_team_code"];
    let homeTeam = games[i]["home_team_code"];
    if (!teams[awayTeam]) {
      teams[awayTeam] = [];
    }
    if (!teams[homeTeam]) {
      teams[homeTeam] = [];
    }
    teams[awayTeam].push(games[i]);
    teams[homeTeam].push(games[i]);
  }
  return teams;
}

// --------------------------------------- At beginning of log entries
function logStart() {
  return new Date(Date.now()).toLocaleTimeString() + " MMM-SHL: ";
}

// --------------------------------------- Logging
function log(msg) {
  console.log(logStart() + msg);
}
// --------------------------------------- Debugging
function debug(msg) {
  if (debugMe) log(msg);
}

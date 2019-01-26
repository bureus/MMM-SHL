const NodeHelper = require("node_helper");
const request = require("request-promise");
const simpleOauth2 = require('simple-oauth2');
const baseUrl = 'https://openapi.shl.se';
var Url = require("url");
var debugMe = false;

module.exports = NodeHelper.create({
    // --------------------------------------- Start the helper
    start: function () {
        log("Starting helper: " + this.name);
        this.started = false;
        this.initiate();
    },
    // --------------------------------------- Schedule a stands update
    scheduleUpdate: function () {
        let self = this;
        this.updatetimer = setInterval(function () { // This timer is saved in uitimer so that we can cancel it
            self.sendStand();
        }, 3600000);
    },
    // --------------------------------------- Get access token
    getAccessToken: async function () {
        let self = this;
        return new Promise(resolve => {
            try {
                log("Getting access token");
                let credentials = {
                    client: {
                        id: this.config.clientId,
                        secret: this.config.clientSecret
                    },
                    auth: {
                        tokenHost: baseUrl + '/oauth2/token'
                    }
                };
                let oauth2 = simpleOauth2.create(credentials);
                let result = oauth2.clientCredentials.getToken();
                let accessToken = oauth2.accessToken.create(result);
                resolve(accessToken);
            }
            catch (e) {
                logger.error('Access Token error', e.message);
                reject();
            }
        });
    },
    // --------------------------------------- Get stands
    getStands: async function(){
        let self = this;
        return new Promise(resolve => {
            if (self.accessToken) {
                debug("Getting standings");
                let currentDate = new Date(Date.now());
                let year = currentDate.getMonth() > 5 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
                let options = {
                    method: "GET",
                    uri: baseUrl+"/seasons/"+year+"/statistics/teams/standings",
                    headers: {
                        "Authorization": "Bearer " + self.accessToken.access_token,
                    },
                    json: true
                };
    
                request(options)
                    .then(function (response) {
                        debug("Standings retrived");
                        debug("Number of teams: " + response.length);
                        resolve(response);
                    })
                    .catch(function (error) {
                        log("getStands failed =" + error);
                        if (error.statusCode == 401)
                            self.getAccessToken();
                    });
            } else {
                log("Missing access token..");
                reject();
            }
        });
    },
    // --------------------------------------- Get games
    getGames: async function(){
        let self = this;
        return new Promise(resolve => {
            if (self.accessToken) {
                debug("Getting standings");
                let currentDate = new Date(Date.now());
                let year = currentDate.getMonth() > 5 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
                let options = {
                    method: "GET",
                    uri: baseUrl+"/seasons/"+year+"/games",
                    headers: {
                        "Authorization": "Bearer " + self.accessToken.access_token,
                    },
                    json: true
                };
    
                request(options)
                    .then(function (response) {
                        debug("Games retrived");
                        debug("Number of games: " + response.length);
                        resolve(response);
                    })
                    .catch(function (error) {
                        log("getStands failed =" + error);
                        if (error.statusCode == 401)
                            self.getAccessToken();
                    });
            } else {
                log("Missing access token..");
                reject();
            }
        });
    },
     // --------------------------------------- Get team content
     getTeamContent: function(teamId){
        switch(teamId) {
            case "FHC":
                return { 
                    icon: "https://www.shl.se/team_graphics/nef_shl/fhc1-fhc-f7c59/special/30.png",
                    name: "Frölunda"
                    };
            case "DIF":
                return { 
                    icon: "https://www.shl.se/team_graphics/nef_shl/dif1-dif-896f9/special/30.png",
                    name: "Djurgården"
                };
            default:
              return null;
          }
    },
    sendStand: function(){
        let dto = generateDto();
        if(dto.length > 0 ){
            self.sendSocketNotification("STANDS", dto); // send teams stands back to app.
        }else{
            self.sendSocketNotification("SERVICE_FAILURE", "Missing teams..");
        }
    },
    // --------------------------------------- Initiate
    initiate: async function(){
        let self = this;
        if(self.accessToken){
            self.accessToken = await self.getAccessToken();
        }

        self.games = await self.getGames();
        self.stands = await self.getStands();
        sendStand();
        scheduleUpdate();
    },
    // --------------------------------------- Create DTO
    generateDto: async function(){
        let self = this;
        let dto = [];
        self.stands.forEach(team => {
            if(team.team_code == "FHC" || team.team_code == "DIF"){
                let teamContent = getTeamContent(team.team_code);
                team.icon = teamContent.icon;
                team.name = teamContent.name;
                dto.push(team);
            }    
        });
        return dto;
    }


});

//
// Utilities
//
function sortByKey(array, key) {
    return array.sort(function (a, b) {
        let x = a[key]; let y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

// --------------------------------------- At beginning of log entries
function logStart() {
    return (new Date(Date.now())).toLocaleTimeString() + " MMM-SHL: ";
}

// --------------------------------------- Logging
function log(msg) {
    console.log(logStart() + msg);
}
// --------------------------------------- Debugging
function debug(msg) {
    if (debugMe) log(msg);
}
const NodeHelper = require("node_helper");
const request = require("request-promise");
const encode = require("nodejs-base64-encode");
const baseUrl = 'https://openapi.shl.se';
var Url = require("url");
var debugMe = true;

module.exports = NodeHelper.create({
    // --------------------------------------- Start the helper
    start: function () {
        log("Starting helper: " + this.name);
        this.started = false;
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
            let basicAuth = encode.encode(this.config.clientId + ":" + this.config.clientSecret, "base64")
            let options = {
                method: "POST",
                uri: baseUrl + '/oauth2/token',
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": "Basic " + basicAuth,
                },
                body: "grant_type=client_credentials"
            };

            request(options)
                .then(function (body) {
                    let reply = JSON.parse(body);
                    debug("access token response: "+body);
                    self.accessToken = {
                        token: reply.access_token,
                        expires: reply.expires_in
                    }
                    debug("generateAccessToken completed");
                    resolve(true);
                })
                .catch(function (error) {
                    log("generateAccessToken failed =" + error);
                    self.sendSocketNotification("SERVICE_FAILURE", error);
                    reject();
                });
        });


    },
    // --------------------------------------- Get stands
    getStands: async function(){
        let self = this;
        return new Promise(resolve => {
            if (self.accessToken) {
                debug("Getting standings");
                let currentDate = new Date(Date.now());
                let year = currentDate.getMonth() < 5 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
                let options = {
                    method: "GET",
                    uri: baseUrl+"/seasons/"+year+"/statistics/teams/standings",
                    headers: {
                        "Authorization": "Bearer " + self.accessToken.token,
                    },
                    json: true
                };
    
                request(options)
                    .then(function (response) {
                        debug("Standings retrived: "+JSON.stringify(response));
                        let stands = response;
                        debug("Number of teams: " + stands.length);
                        resolve(stands);
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
                let year = currentDate.getMonth() < 5 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
                let options = {
                    method: "GET",
                    uri: baseUrl+"/seasons/"+year+"/games",
                    headers: {
                        "Authorization": "Bearer " + self.accessToken.token,
                    },
                    json: true
                };
    
                request(options)
                    .then(function (response) {
                        debug("Games retrived: "+JSON.stringify(response));
                        let games = response;
                        debug("Number of games: " + games.length);
                        resolve(games);
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
    sendStand: async function(){
        let self = this;
        let dto = await self.generateDto();
        debug(JSON.stringify(dto));
        if(dto.length > 0 ){
            self.sendSocketNotification("STANDS", dto); // send teams stands back to app.
        }else{
            self.sendSocketNotification("SERVICE_FAILURE", "Missing teams..");
        }
    },
    // --------------------------------------- Initiate
    initiate: async function(){
        let self = this;
        if(!self.accessToken){
            self.accessToken = await self.getAccessToken();
            if(self.accessToken)
                debug("Access token retrived: "+self.accessToken);
        }

        self.games = await self.getGames();
        self.stands = await self.getStands();
        await self.sendStand();
        self.scheduleUpdate();
    },
    // --------------------------------------- Create DTO
    generateDto: async function(){
        let self = this;
        let dto = [];
        self.stands.forEach(team => {
            if(team.team_code == "FHC" || team.team_code == "DIF"){
                debug("Team is: "+team.team_code);
                let teamContent = self.getTeamContent(team.team_code);
                team.icon = teamContent.icon;
                team.name = teamContent.name;
                debug(JSON.stringify(team));
                dto.push(team);
            }    
        });
        debug(JSON.stringify(dto));
        let sortedStands = sortByKey(dto, "rank");
        return sortedStands;
    },
     // --------------------------------------- Handle notifications
     socketNotificationReceived: async function (notification, payload) {
        const self = this;
        log("socketNotificationReceived")
        if (notification === "CONFIG") {
            log("CONFIG event received")
            this.config = payload;
            this.started = true;
            //debugMe = this.config.debug;
            if (!self.accessToken) {
                await self.getAccessToken(); // Get inital access token
            }
            self.initiate();
        };
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
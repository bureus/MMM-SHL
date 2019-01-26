Module.register("MMM-SHL", {

    // Default module config.
    defaults: {
        clientId: "",
        clientSecret: "",
        debug: false,
        refreshRate: "60000",
    },
    
    getTranslations: function () {
        return {
            en: "translations/en.json",
            sv: "translations/sv.json"
        }
    },

    getStyles: function () {
        return [
            this.file('/css/mmm-shl-main.css')
        ]
    },

    start: function () {
        Log.info("Starting module: " + this.name);

        //Send config to node_helper
        Log.info("Send configs to node_helper..");
        this.sendSocketNotification("CONFIG", this.config);
        this.updateDom();
    },

    getDom: function () {
        Log.info("getDom triggered");
        let wrapper = document.createElement("div");
        wrapper.className = "stands-board";
        if (!this.loaded && !this.failure) {
            wrapper.innerHTML = "<img src='https://iof2.idrottonline.se/globalassets/svenska-ishockeyforbundet/logos/sif_logotyp_nyhet_800.jpg'></img>"
            return wrapper;
        }
        if (this.failure) {
            wrapper.innerHTML = "Connection to SHL failed. Please review logs";
            wrapper.className = "dimmed light small";
            return wrapper;
        }
        if (this.stands.length > 0) {
            let standsTable = this.generateStandsTable();
            wrapper.appendChild(standsTable);
            return wrapper;
        }
    },

    generateStandsTable: function(){
        let table = document.createElement("table");
        table.className = "small stands-table";
        let row = document.createElement("tr");
        let th = document.createElement("th");
        th.className = 'align-left';
        row.appendChild(th);
        th = document.createElement("th");
        row.appendChild(th);
        th = document.createElement("th");
        row.appendChild(th);
        th = document.createElement("th");
        th.innerText = "GP"
        row.appendChild(th);
        th = document.createElement("th");
        th.innerText = "+/-"
        row.appendChild(th);
        th = document.createElement("th");
        th.innerText = "P"
        row.appendChild(th);
        table.appendChild(row);
        for (let n = 0; n < this.stands.length; n++) {
            let team = this.stands[n];
            row = document.createElement("tr");
            let th = document.createElement("th");
            th.className = 'align-left';
            th.innerText =  team.rank;
            row.appendChild(th);
            let th = document.createElement("th");
            th.className = 'align-left';
            th.innerHTML =  "<img src='"+team.icon+"'></img>"
            row.appendChild(th);
            let th = document.createElement("th");
            th.className = 'align-left';
            th.innerText =  team.name;
            row.appendChild(th);
            let th = document.createElement("th");
            th.className = 'align-left';
            th.innerText =  team.gp;
            row.appendChild(th);
            let th = document.createElement("th");
            th.className = 'align-left';
            th.innerText =  team.diff;
            row.appendChild(th);
            let th = document.createElement("th");
            th.className = 'align-left';
            th.innerText =  team.points;
            row.appendChild(th);
            table.appendChild(row);
        };

        return table.outerHTML;
    },

    // --------------------------------------- Handle socketnotifications
    socketNotificationReceived: function (notification, payload) {
        Log.info("socketNotificationReceived: " + notification + ", payload: " + payload);
        if (notification === "STANDS") {
            this.loaded = true;
            this.failure = undefined;
            // Handle payload
            this.stands = payload;
            this.updateDom();
        }
        else if (notification == "SERVICE_FAILURE") {
            this.loaded = true;
            this.failure = payload;
            if (payload) {
                Log.info("Service failure: " + this.failure.resp.StatusCode + ':' + this.failure.resp.Message);
                this.updateDom();
            }
        }
    },
    notificationReceived: function (notification, payload, sender) {
        if (notification == "DOM_OBJECTS_CREATED") {
            this.domObjectCreated = true;
        }
    }
});
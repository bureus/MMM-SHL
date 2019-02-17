# MMM-SHL
[Magic Mirror](https://magicmirror.builders/) Module - That displays and lets you track standings from Svenska Hockey Ligan (SHL). This module use the API's provided by [SHL Open API](http://doc.openapi.shl.se/).

## Prerequisites
### Obtain required client id and secret
You need to obtain your own application key and secret from SHL Open API by following the process [here](http://doc.openapi.shl.se/).

## Install
1. Clone repository into ``../modules/`` inside your MagicMirror folder.
2. Run ``npm install`` inside ``../modules/MMM-SHL/`` folder
3. Add the module to the MagicMirror config

## Update
1. Run ``git pull`` inside ``../modules/MMM-SHL/`` folder.
2. Run ``npm install`` inside ``../modules/MMM-SHL/`` folder

## Configuration
```
modules: [
    ...
    {
            module: "MMM-SHL",
            position: "bottom_left",

            config: {
                clientId: "clientID", //Required, your own API client id
                clientSecret: "secret", //Required, your own API client secret
                teams: ['teamId'] //Optional, lets you filter out specific 
                                  teams in your stands board. See Filtered board below.
            }
        },
    ...
]
```
### Filtered board
If you dont want to show the complete stands table but rather filiter the board on your favorit teams. Then please use the config ```teams```. Below configuration will only show Djurgården, Frölunda and Mora in the stands table. Team codes are listed below. 

```
modules: [
    ...
    {
            module: "MMM-SHL",
            position: "bottom_left",

            config: {
                clientId: "clientID", 
                clientSecret: "secret", 
                teams: ['DIF', 'FHC', 'MIK'] 
            }
        },
    ...
]
```

![Example of filtered stands board](https://github.com/bureus/MMM-SHL/blob/master/docs/teamsFilter.PNG)

### Supported teams
| Team        | Code           
| ------------- |:-------------:| 
| Frölunda      | FHC | 
| Djurgården      | DIF      |
| Brynäs | BIF      |
| Färjestad | FBK      |
| HV71 | HV71      |
| Linköping | LHC      |
| Luleå | LHF      |
| Malmö | MIF      |
| Mora | MIK      |
| Örebro | OHK      |
| Rögle | RBK      |
| Skellefteå | SAIK      |
| Timerå | TIK      |
| Växjö | VLH      |


## Screenshot

![SHL Module](https://github.com/bureus/MMM-SHL/blob/master/docs/screenshot.PNG)


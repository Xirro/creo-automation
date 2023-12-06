async function creoRequest(creoJSONFunction) {

    const reqPromise = require('request-promise');
    let creoHttp = 'http://localhost:9056/creoson';
    let connectOptions = {
        method: 'POST',
        uri: creoHttp,
        body: {
            "command": "connection",
            "function": "connect"
        },
        json: true // Automatically stringifies the body to JSON
    };

    //initial CreoSON server connection request
    reqPromise(connectOptions)
        .then(reqConnectBody => {
            // POST succeeded...
            let functionOptions =  {
                method: 'POST',
                uri: creoHttp,
                body: {
                    "sessionId": reqConnectBody.sessionId,
                    "command": creoJSONFunction.command,
                    "function": creoJSONFunction.function,
                    "data": creoJSONFunction.data
                },
                json: true
            };

            return reqPromise(functionOptions)
        })
        .then(reqFunctionBody => {
            exports.creoResponse =  reqFunctionBody.data;
        })
        .catch(err => {
            console.log(err);
        });
}

module.exports.getCreoResponse = function(creoJSONFunction) {
    let cr = creoRequest(creoJSONFunction);
    console.log(cr.creoResponse);
};


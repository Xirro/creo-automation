async function creoRequest(creoJSONFunction) {
    if (process.env.CREOSON_ENABLED !== 'true') {
        console.log('Creoson disabled via CREOSON_ENABLED; skipping creoRequest');
        exports.creoResponse = null;
        return null;
    }
    const axios = require('axios');
    const creoHttp = 'http://localhost:9056/creoson';
    try {
        const connectResp = await axios.post(creoHttp, { command: 'connection', function: 'connect' });
        const sessionId = connectResp.data && connectResp.data.sessionId;
        if (!sessionId) throw new Error('Failed to obtain Creoson sessionId');

        const functionResp = await axios.post(creoHttp, {
            sessionId: sessionId,
            command: creoJSONFunction.command,
            function: creoJSONFunction.function,
            data: creoJSONFunction.data
        });

        exports.creoResponse = functionResp.data;
    } catch (err) {
        if (err.code === 'ECONNREFUSED') {
            console.log('Error: Creoson server is not running or not reachable at http://localhost:9056/creoson');
        } else {
            console.log('there was an error:', err);
        }
    }
}

module.exports.getCreoResponse = function(creoJSONFunction) {
    creoRequest(creoJSONFunction).then(() => {
        console.log(exports.creoResponse);
    });
};


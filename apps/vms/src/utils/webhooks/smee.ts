const SmeeClient = require("smee-client");

const smee = new SmeeClient({
    source: "https://smee.io/NEsyf7sKQOTJ8tO",
    target: "http://localhost:6804/webhooks",
    logger: console,
});

const events = smee.start();

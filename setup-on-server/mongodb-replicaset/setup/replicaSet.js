var rsconf = {
  _id: "rs0",
  version: 1,
  members: [
    { _id: 0, host: `${process.env.mongo1}:27017`, priority: 3 },
    { _id: 1, host: `${process.env.mongo2}:27017`, priority: 2 },
    { _id: 2, host: `${process.env.mongo3}:27017`, priority: 1 }
  ]
};

try {
  var status = rs.status();
  if (status.ok === 0) {
    // Replica set is not initialized
    rs.initiate(rsconf);
  } else {
    // Replica set is already initialized, reconfigure
    rs.reconfig(rsconf, { force: true });
  }
} catch (e) {
  if (e.code === 94) {
    // Replica set is not initialized
    rs.initiate(rsconf);
  } else {
    throw e;
  }
}

printjson(rs.status());
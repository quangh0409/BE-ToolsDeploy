db = db.getSiblingDB('admin');
db.grantRolesToUser('quangvt204299', [{ role: 'readAnyDatabase', db: 'admin' }]);

db = db.getSiblingDB("db_account");
db.createUser({
  user: "quangvt204299",
  pwd: "VgE5tSroz7n8AiiY",
  roles: [{ role: "readWrite", db: "db_account" }],
});

db = db.getSiblingDB("db_git");
db.createUser({
  user: "quangvt204299",
  pwd: "VgE5tSroz7n8AiiY",
  roles: [{ role: "readWrite", db: "db_git" }],
});

db = db.getSiblingDB("db_scan");
db.createUser({
  user: "quangvt204299",
  pwd: "VgE5tSroz7n8AiiY",
  roles: [{ role: "readWrite", db: "db_scan" }],
});

db = db.getSiblingDB("db_ticket");
db.createUser({
  user: "quangvt204299",
  pwd: "VgE5tSroz7n8AiiY",
  roles: [{ role: "readWrite", db: "db_ticket" }],
});

db = db.getSiblingDB("db_vms");
db.createUser({
  user: "quangvt204299",
  pwd: "VgE5tSroz7n8AiiY",
  roles: [{ role: "readWrite", db: "db_vms" }],
});

db = db.getSiblingDB("db_mail");
db.createUser({
  user: "quangvt204299",
  pwd: "VgE5tSroz7n8AiiY",
  roles: [{ role: "readWrite", db: "db_mail" }],
});




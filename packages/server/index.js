const express = require("express");

const app = express();
const port = 3000;
app.get("/", (req, res) => { //.get only responds to HTTP GET requests
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`)
});
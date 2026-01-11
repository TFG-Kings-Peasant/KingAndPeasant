const express = require("express");

const app = express();
const port = 3000;
app.get("/api", (req, res) => { //.get only responds to HTTP GET requests
    res.send("Hello World!");
});

app.get("/api/try", (req,res) => {
    res.json({message: "Prueba exitosa"});
});

app.get("/api/data", async (req, res) => {
    
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});
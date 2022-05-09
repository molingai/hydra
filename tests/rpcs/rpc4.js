const http = require("http");
const server = http.createServer((req, res) => {
    // console.log(req.url) // /?name=1
  res.end("ping1")
})
server.listen(3000)

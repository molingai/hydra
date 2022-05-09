const http = require('http');

function request() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000', (response) => {
      let data = '';

      // called when a data chunk is received.
      response.on('data', (chunk) => {
        data += chunk;
      });

      // called when the complete response is received.
      response.on('end', () => {
        // console.log(data);
        resolve(data)
      });
    }).on("error", (error) => {
      console.log("Error: " + error.message);
      reject(error)
    });
  })
}

async function test() {
  const s = Date.now();
  for (let i = 0; i < 3000; ++i) {
    await request();
  }
  const e = Date.now();
  console.log((e - s) / 1000);
}

test()

const data = require('./data.json');
const getImpulses = require('./impulse.js');

async function callFunction() {
  let output = await getImpulses(data);
  console.log(output.length);
}

callFunction();

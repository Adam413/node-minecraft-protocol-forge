var mc = require('minecraft-protocol');
var ProtoDef = require('protodef').ProtoDef;

if(process.argv.length < 4 || process.argv.length > 6) {
  console.log("Usage : node echo.js <host> <port> [<name>] [<password>]");
  process.exit(1);
}

var client = mc.createClient({
  forge: true,
  host: process.argv[2],
  port: parseInt(process.argv[3]),
  username: process.argv[4] ? process.argv[4] : "echo",
  password: process.argv[5]
});

client.on('connect', function() {
  console.info('connected');
});
client.on('disconnect', function(packet) {
  console.log('disconnected: '+ packet.reason);
});
client.on('chat', function(packet) {
  var jsonMsg = JSON.parse(packet.message);
  if(jsonMsg.translate == 'chat.type.announcement' || jsonMsg.translate == 'chat.type.text') {
    var username = jsonMsg.with[0].text;
    var msg = jsonMsg.with[1];
    if(username === client.username) return;
    client.write('chat', {message: msg});
  }
});

var proto = new ProtoDef();
// http://wiki.vg/Minecraft_Forge_Handshake
proto.addType('FML|HS', [
    'container',
    [
      {
        "name": "discriminator",
        "type": "byte"
      },
      {
        // ServerHello
        "name": "fmlProtocolVersion",
        "type": [
          "switch",
          {
            "compareTo": "discriminator",
            "fields": {
              "0": "byte"
            },
            "default": "void"
          },
        ]      }
    ]
]);

client.on('custom_payload', function(packet) {
  var channel = packet.channel;
  var data = packet.data;

  if (channel === 'REGISTER') {
    var channels = data.toString().split('\0');
    console.log('Server-side registered channels:',channels);
    // TODO: do something?
    // expect:  [ 'FML|HS', 'FML', 'FML|MP', 'FML', 'FORGE' ]
  } else if (channel === 'FML|HS') {
    var parsed = proto.parsePacketBuffer('FML|HS', data);
    console.log('FML|HS',parsed);
  }
});

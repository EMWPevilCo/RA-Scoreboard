"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Packets_1 = require("./Packets");
var Utils_1 = require("./Utils");
var BoardInfo_1 = require("./BoardInfo");
var ClientType;
(function (ClientType) {
    ClientType[ClientType["SCOREBOARD"] = 1] = "SCOREBOARD";
    ClientType[ClientType["REMOTE"] = 2] = "REMOTE";
})(ClientType = exports.ClientType || (exports.ClientType = {}));
var ClientHandler = /** @class */ (function () {
    function ClientHandler(server, sio) {
        var _this = this;
        this.type = ClientType.REMOTE;
        this.boardinfo = new BoardInfo_1.BoardInfo();
        this.sio = sio;
        this.server = server;
        //Scoreboard Registry Packets (sbr -> scoreboard registry)
        this.sio.on(Packets_1.Packet.Channels.Registry, function (packet) {
            if (packet.req === Packets_1.PacketScoreboardRegistry.Type.REGISTER) {
                if (packet.payload !== undefined) {
                    _this.boardinfo.accessKey = packet.payload;
                }
                else if (_this.boardinfo.accessKey == undefined) {
                    _this.boardinfo.accessKey = Utils_1.Utils.generateID();
                }
                console.log("Client at " + _this.getIP() + " announced as a scoreboard - ID: " + _this.boardinfo.accessKey);
                var packetOut = new Packets_1.PacketScoreboardRegistry();
                packetOut.req = Packets_1.PacketScoreboardRegistry.Type.ACKNOWLEDGE;
                packetOut.payload = _this.boardinfo.accessKey;
                _this.sio.emit(Packets_1.Packet.Channels.Registry, packetOut);
                _this.type = ClientType.SCOREBOARD;
            }
            if (packet.req === Packets_1.PacketScoreboardRegistry.Type.USE) {
                console.log("Client at " + _this.getIP() + " now bound to scoreboard " + packet.payload);
                _this.useScoreboard(packet.payload);
            }
        });
        var thisclient = this;
        this.sio.on(Packets_1.Packet.Channels.Score, function (msg) {
            if (thisclient.boardinfo.accessKey == null)
                return;
            //FORWARD MESSAGES
            if (thisclient.type === ClientType.REMOTE) {
                thisclient.getBoardHolder().sio.emit(Packets_1.Packet.Channels.Score, msg);
            }
            else if (thisclient.type === ClientType.SCOREBOARD) {
                thisclient.server.clientHandlers.forEach(function (client) {
                    if (client.type === ClientType.REMOTE && client.boardinfo.accessKey === thisclient.boardinfo.accessKey) {
                        client.sio.emit(Packets_1.Packet.Channels.Score, msg);
                    }
                });
            }
        });
    }
    ClientHandler.prototype.isAlive = function () {
        return this.sio.connected;
    };
    ClientHandler.prototype.getIP = function () {
        return this.sio.handshake.address;
    };
    ClientHandler.prototype.useScoreboard = function (key) {
        // For remote to link to scoreboard
        if (this.server.getBoardClient(key) == null)
            return false;
        this.boardinfo.accessKey = key;
        return true;
    };
    ClientHandler.prototype.getBoardHolder = function () {
        // For remote to get scoreboard's client handler
        return this.server.getBoardClient(this.boardinfo.accessKey);
    };
    return ClientHandler;
}());
exports.ClientHandler = ClientHandler;
//# sourceMappingURL=ClientHandler.js.map
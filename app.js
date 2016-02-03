var express = require('express');
var app = express();

// Launch capture
// You can launch the equivalent with : tcpdump -i en0 -w -
var macVendors = require('mac-lookup');
var pcap = require('pcap'),
	pcapDNS = require('./node_modules/pcap/decode/dns.js');
    //pcap_session = pcap.createOfflineSession("sample.pcap");

var macTable = {};

function startCapture()
{
	var pcap_session = pcap.createSession("en0", undefined, undefined, !true);
	pcap_session.on('packet', function (raw_packet) {
	    var packet = pcap.decode.packet(raw_packet);

	    if(packet.link_type == "LINKTYPE_ETHERNET")
	    {
	    	var ethPacket = packet.payload;
	    	var smac = ethPacket.shost.toString();
	    	var dmac = ethPacket.dhost.toString();

	    	// Extract MAC addresses
	    	if(!macTable[smac]) addDevice(smac);
	    	if(!macTable[dmac]) addDevice(dmac);

	    	touchDevice(smac);
	    	touchDevice(dmac);
	    	updateLink(smac, dmac, ""/*ethPacket.payload.constructor.name.toString()*/, ""/*packet.toString()*/);

	    	// If ARP reply/gratuitious, also extract associated IPs
	    	if(ethPacket.ethertype == 0x806)
	    	{
	    		var arpPacket = ethPacket.payload;
	    		var arp_mac = arpPacket.sender_ha.toString();
				var arp_ip = arpPacket.sender_pa.toString();

				// If not set, update
				if(macTable[arp_mac].ip == "")
				{
					macTable[arp_mac].ip = arp_ip;
					updateDevice(arp_mac);
				}
	    	}

	    	// If mDNS reply, also extract local hostname
	    	if(ethPacket.ethertype == 0x800) // IPv4
			{
				var ipPacket = ethPacket.payload;
				macTable[smac].lastSenderIp = ipPacket.saddr.toString();

				if(ipPacket.protocol == 17) // UDP
				{
					var udpPacket = ipPacket.payload;

					if(udpPacket.sport === 5353 || udpPacket.dport === 5353) // MDNS
					{
						var dnsPacket = new pcapDNS().decode(udpPacket.data, 0, udpPacket.data.length);

						if(dnsPacket.ancount) // Reply
						{
							var dns_ip = ipPacket.saddr.toString();
							var localdomain = dnsPacket.answer.rrs[dnsPacket.ancount-1].name;
							var hostname = localdomain.split('.')[0];

							// Find corresponding physical device
							for(var i in macTable) if(macTable[i].ip == dns_ip)
							{
								// If not set, update
								if(macTable[i].hostname == "")
								{
									macTable[i].hostname = hostname;
									updateDevice(i);
								}
							}
						}
					}
				}
			}
	    }
	});
}


function addDevice(mac)
{
	macTable[mac] = {mac: mac, vendor: 'Unknown Vendor', lastSenderIp: '', ip: '', hostname: '', lastAlive: 0};

	macPrefix = mac.split(':').slice(0, 3).join(':');
	macVendors.lookup(macPrefix, function (err, name) {
		if (err || !name) return;
		macTable[mac].vendor = name;
		updateDevice(mac);
	});

	updateDevice(mac);
}

function touchDevice(mac)
{
	// This device has interacted on the network recently
	macTable[mac].lastAlive = Date.now();
	updateDevice(mac);
}

function updateDevice(mac)
{
	// Called when a change has been made to a device (need a redraw)
	var o = {node: macTable[mac]};

	//console.log(o);

	if(socket)
		try { socket.send(JSON.stringify(o)); }
		catch(e) {socket = null; }
}

function updateLink(smac, dmac, type, data)
{
	var o = {link: {source: smac, dest: dmac, type: type, data: data}};
	console.log(o);
	if(socket) socket.send(JSON.stringify(o));
}


// Run local webserver
app.use(express.static(__dirname + '/public'));
console.log("Listening at " + 3000);
app.listen(3000);

// Run WebSocket server
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 3001});
var socket = null;

wss.on('connection', function connection(ws) {
	socket = ws;
	startCapture();

	/*ws.on('message', function incoming(message) {
	    console.log('received: %s', message);
	});*/

	//ws.send('something from server');
	//setInterval(function(){ ws.send('ping'); }, 2000);
});

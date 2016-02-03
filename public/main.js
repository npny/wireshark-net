var graph = {

}

console.log("init");
var cy;

var host = window.document.location.host.replace(/:.*/, '');
var ws = new WebSocket('ws://' + host + ':3001');

var macTable = {};
var edges = {};

var hideBroadcastAddress = true;
var feed = null;

var colorCode = 
{
	"Arp": "white",
	"IPv4": "yellow"
}

ws.onmessage = function (event)
{
	var obj = JSON.parse(event.data);

	if(cy && obj)
	{
		if(obj.node)
		{
			if(!macTable[obj.node.mac])
			{
				var id = obj.node.mac;
				if(hideBroadcastAddress && id == "ff:ff:ff:ff:ff:ff") return; // Special broadcast MAC address

				macTable[id] = obj.node
				cy.add({group: "nodes", data: {id: id, label: getDescription(obj.node)}});
			}
			else
			{
				macTable[obj.node.mac] = obj.node
				cy.getElementById(obj.node.mac).data('label', getDescription(obj.node));
				if(obj.node.hostname != '') cy.getElementById(obj.node.mac).style({'background-color': '#919DE8'});
			}
		}

		if(obj.link)
		{
			var id = obj.link.source+'-'+obj.link.dest;

			if(hideBroadcastAddress && obj.link.dest == "ff:ff:ff:ff:ff:ff") // Special broadcast MAC address
			{
				blinkBroadcast(obj.link.source, obj.link.type);
				return;
			}

			if(hideBroadcastAddress && obj.link.dest.split(":").slice(0,3).join(":") == "01:00:5e") // Special multicast range
			{
				blinkMulticast(obj.link.source, obj.link.type);
				return;
			}

			if(!edges[id])
			{
				edges[id] = obj.link;
				cy.getElementById(obj.link.source).restore(); // Restores nodes to give them a chance to link up
				cy.getElementById(obj.link.dest).restore();
				cy.add({group: "edges", data: {id: id, source: obj.link.source, target: obj.link.dest}});
			}
			else
			{
				blinkLink(id, obj.link.type);
				netLog(obj.link.type, obj.link.data);
			}
		}
	}
};




function blinkBroadcast(mac, type)
{
	var e = cy.getElementById(mac);
	e.style({
		'border-style': 'solid',
		'border-color': colorCode[type] || 'yellow',
	});

	setTimeout(function(){
		e.style({
			'border-style': 'solid',
			'border-color': '#666',
		});
	}, 1000);
	return;
}

function blinkMulticast(mac, type)
{
	var e = cy.getElementById(mac);
	e.style({
		'border-style': 'dashed',
		'border-color': colorCode[type] || 'yellow',
	});

	setTimeout(function(){
		e.style({
			'border-style': 'solid',
			'border-color': '#666',
		});
	}, 1000);
	return;
}


function blinkLink(id, type)
{
	var e = cy.getElementById(id);
	e.style({
		'line-color': 'yellow',
		'target-arrow-color': colorCode[type] || 'yellow',
	});
	e.data('label', type);

	setTimeout(function(){
		e.style({
			'line-color': '#ccc',
			'target-arrow-color': '#ccc',
		});
		e.data('label', '');
	}, 1000);
}


function netLog(type, data)
{
	console.log(type + ' :\n');
	//console.log(data);

	//feed.prepend('<li class="' + type + '">' + JSON.stringify(data) + '</li>');
	//feed.find("li:nth-child(n+300)").remove();
}

function getDescription(node)
{
	return (
	  node.hostname + '\n'
	+ node.ip + '\n'
	+ '('+node.lastSenderIp + ')\n'
	+ node.mac + '\n'
	+ node.vendor + '\n'
	+ 'Last alive ' + Math.round((Date.now() - node.lastAlive)/1000) + 's ago'
	);
}

setInterval(function(){
	cy.batch(function(){
		cy.nodes().forEach(function(ele){
			//console.log(macTable[ele.data('id')]);
			var node = macTable[ele.data('id')];
			
			ele.data('label', getDescription(node));

			// Fade out
			//if(Date.now() - node.lastAlive > 30000) ele.addClass('faded');
			//else ele.removeClass('faded');

			// Outright remove inactive nodes
			//if(Date.now() - node.lastAlive > 30000) { ele.remove(); delete macTable[node.mac]; };
			
			// Remove all unconnected nodes
			//console.log(ele.connectedEdges())
			//if(ele.connectedEdges() && ele.connectedEdges().length) ele.restore();
			//else ele.remove();
		});
	})
}, 2000);

$(window).on("contextmenu", function(e){
	e.preventDefault();
	cy.layout({name: 'cose'});
});


var style = cytoscape.stylesheet()
	.selector('node')
		.css({
			'background-color': '#666',
			'content': 'data(label)',
			'text-valign': 'bottom',
			'text-wrap': 'wrap',

			'color': 'black',
			'text-opacity': .8,
			'font-family': "Droid Sans Mono",
			'font-size': 8,
			'border-width': '1',
			'border-color': '#666',
		})
	.selector('edge')
		.css({
			'content': 'data(label)',
			'color': 'green',
			'text-opacity': .8,
			'font-family': "Droid Sans Mono",
			'font-size': 8,

			'width': 1,
			'line-color': '#ccc',
			'target-arrow-color': '#ccc',
			'target-arrow-shape': 'triangle'
		})
	.selector(':selected')
		.css({
			'line-color': 'yellow',
			'target-arrow-color': 'yellow',
		})
	.selector('.faded')
		.css({
			'opacity': 0.25,
			'text-opacity': 0
		});


$(function(){
	feed = $('.feed');
	cy = cytoscape({
	  container: $("#cy")[0],
	  //elements: elements,
	  layout: { name: 'cose' /* , ... */ },
	  //ready: function(evt){ /* ... */ },

	  zoom: 1,
	  pan: { x: 0, y: 0 },
	  wheelSensitivity: .2,

	  style: style,
	});
});
[wireshark-net](https://github.com/npny/wireshark-net)
===
A real-time glance into what's going on over your network

![Real-time network graph](http://i.imgur.com/9PtD1lV.png)

This is a really cool experiment I started working on while bored out of my mind in an airport terminal.

Once launched, it starts recording every ethernet packet your computer can hear over WiFi (depending on [promiscuous](https://en.wikipedia.org/wiki/Promiscuous_mode) or [monitor](https://en.wikipedia.org/wiki/Monitor_mode) mode support on your network card).
This is nothing new if you've used [wireshark](https://www.wireshark.org/) before, but it can be hard at times to get a high-level overview of what's going on.

This little app will draw a real-time network graph (using canvas), pop up a new visual node for every new MAC address it encounters, and flash an arrow when one device sends an ethernet packet to another. It will listen to ARP messages to try to discover new devices, and more importantly it will listen to general traffic and try to glean additional infos like device name, IP, vendor, last seen time, etc.

This allows you to quickly tell at a glance what devices are currently around, who they're communicating with, and what kind of traffic they're generating.

To run :  
`npm install express pcap mac-lookup`  
`sudo node app.js`

[Pierre Boyer](https://github.com/npny), 2015

---
This is still a work in progress, and there are many things to improve.

TODO :  
(in no particular order)

 - General performance improvements
 - General code clean-up (from what's still at the quick-and-dirty-hack quality level)
 - Pre-fill info on the current device
 - Nodes should spread themselves interactively (currently you can right-click to force a one-off layout reflow)
 - Popup "ARP","DNS","TLS", etc. as a fading tooltip on each link + show them in the feed
 - Work on the style of the graph and the different actions you can perform on it, with nice transitions (new users grow instantly into a new node, smoothly flashing a link, tooltips, less cluttered text, etc.)
 - Different icons for user devices / phones / routers / access points / yourself
 - Show network interface and AP name / properties in the corner somewhere
 - Improve the network log (the rightmost panel), wireshark-style
 - Allow users to pipe any pcap-style stream to the standard input. Right now the packet capture is launched manually server-side, but that doesn't offer many options for prefiltering, promiscuous mode, radio-level capture, replay, etc.
 - Show additionnal info for each node ; Total traffic in/out, leaked DNS requests, unencrypted HTTP traffic, active ports, other broadcasted infos, etc.

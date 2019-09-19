
const GATHER_TIMEOUT = 10000;

function callGatherHandler(tcall)
{
    const sdp = tcall.rtc.localDescription;

    if (tcall.tmr)
	clearTimeout(tcall.tmr);
    
    if (tcall.call_gatherh) {
	tcall.call_gatherh = false;
	if (tcall.gatherh)
	    tcall.gatherh(tcall, sdp);
    }
}

function sdpMap(sdp) {
    const sdpLines = [];
    const sdpSplit = sdp.split('\r\n');

    
    sdpSplit.forEach(function (sdpLine) {
        let outline = sdpLine;
        if (sdpLine.startsWith('m=audio')) {
	    const melems = sdpLine.split(' ');
	    const auline = melems.slice(0, 3);
	    
	    outline = auline.join(' ') + ' ' + '0';
	    
	    console.log('outline=' + outline);
        }
	else if (sdpLine.startsWith('a=rtpmap:')) {
	    const melems = sdpLine.split(' ');
	    const rtpmap = melems[0].split(':');
	    const pt = rtpmap[1];

	    if (pt != 0)
		outline = null;
	}
	else if (sdpLine.startsWith('a=rtcp-fb:')) {
	    outline = null;
	}
	else if (sdpLine.startsWith('a=fmtp:')) {
	    outline = null;
	}
	if (outline != null) {
	    sdpLines.push(outline);
        }
    });
    return sdpLines.join('\r\n');
}


function doLog(msg)
{
    console.log(msg);
}

function ccallGatheringHandler(tcall, type, sdp)
{
    doLog('gather done conv:' + tcall.convid + 'user=' + tcall.userid + '/' + tcall.clientid + 'SDP-' + type + ' ' + sdp);
}

function gatherTimeoutHandler(tcall)
{
    doLog('gather timeout: userid=' + tcall.userid);

    if (tcall.cands === 0) {
	if (tcall.errorh)
	    tcall.errorh(tcall, 'gather-timeout');
    }
    else {
	callGatherHandler(tcall);
    }
    
}

function gatheringHandler(tcall)
{
    const rtc = tcall.rtc;

    if (!rtc)
	return;
    
    const state = rtc.iceGatheringState;

    doLog('ice gathering userid=' + tcall.userid + ' state=' + state);

    switch (state) {
    case "new":
	break;
	
    case "gathering":
	break;
	
    case "complete":
	const sdp = rtc.localDescription;
	if (!sdp) {
            return;
	}
	//doLog('gatherHandler: SDP-' + sdp.type.toString() + ' =>' + sdp.sdp.toString());

	if (tcall.cands < 1) {
	    doLog('gatherHandler: SDP-' + sdp.type.toString() + ' not enough cands');
	}
	else {
	    callGatherHandler(tcall);
	}
	
	break;
    }
}

function connectionHandler(tcall) {
    const rtc = tcall.rtc;
    if (!rtc) {
	return;
    }
    const state = rtc.iceConnectionState;

    doLog('connectionHandler: userid=' + tcall.userid + ' state=' + state);
    if (state === 'connected') {
	if (tcall.connectedh)
	    tcall.connectedh(tcall);
    }
}

function candidateHandler(tcall, cand) {
    if (!tcall)
	return;
    
    const mindex = cand ? cand.sdpMLineIndex : null;
    const rtc = tcall.rtc;

    if (!rtc)
	return;
 
    if (cand && cand.candidate) {
	doLog('candidateHandler: cand=' + cand.candidate + ' type=' + cand.type + ' mindex=' + mindex);
	tcall.cands++;

	if (tcall.candh) {
	    tcall.candh(tcall, cand.candidate);
	}

	callGatherHandler(tcall);	
    }
    else {
	doLog('candidateHandler: end-of-candidates cands=' + tcall.cands);

	callGatherHandler(tcall);
	
	return;
    }

}

function negotiationHandler(tcall) {
    doLog('negotiationHandler: ' + tcall.userid);
}

function signallingHandler(tcall) {
    const rtc = tcall.rtc;

    const state = rtc.signalingState;
    doLog('signalingHandler: state=' + state);
}
    


function pc_Create(tcall)
{
    console.log('pc_Create:', tcall);
    
    const config = {
	bundlePolicy: 'max-bundle',
	iceServers: tcall.turn_servers.ice_servers,
	rtcpMuxPolicy: 'require',
	iceTransportPolicy: 'relay'
    };

    doLog('pc_Create: creating RTCPeerConnection');

    let rtc;

    rtc = new RTCPeerConnection(config);

    rtc.onicegatheringstatechange = () => gatheringHandler(tcall);
    rtc.oniceconnectionstatechange = () => connectionHandler(tcall);
    rtc.onicecandidate = (event) => candidateHandler(tcall, event.candidate);
    rtc.onsignalingstatechange = event => signallingHandler(tcall);
    rtc.ondatachannel = event => dataChannelHandler(tcall, event);
    rtc.onnegotiationneeded = () => negotiationHandler(tcall);

    rtc.ontrack = event => {
	const peer = tcall.peer;
	doLog('onTrack: convid=' + tcall.convid + ' userid=' + peer.userid + '/'
	    + peer.clientid + ' streams=' + event.streams.length);

	if (event.streams && event.streams.length > 0) {
	    for (const stream of event.streams) {
		doLog('onTrack: convid=' + tcall.convid + ' stream=' + stream);
		for (const track of stream.getTracks()) {
		    if (track)
			doLog('onTrack: convid=' + tcall.convid + ' track=' + track.kind);
		}
	    }
	}
    }

    tcall.rtc = rtc;
}

function tcall_new(cfg, convid, userid, clientid, gatherh, candh, connectedh, errorh, statsh)
{
    const tcall = {
	convid: convid,
	userid: userid,
	clientid: clientid,
	turn_servers: cfg,
	gatherh: gatherh,
	candh: candh,
	errorh: errorh,
	connectedh: connectedh,
	statsh: statsh,
	cands: 0,
	connected: 0,
	call_gatherh: true,
	stats: {
	    ploss: 0,
	    lastploss: 0,
	    bytes: 0,	    
	    lastbytes: 0,
	    packets: 0,
	    lastpackets: 0,
	    
	}
    }

    pc_Create(tcall);

    return tcall;
}



function tcall_start(tcall, convid, userid)
{
    const rtc = tcall.rtc;

    addMedia(rtc);
    
    rtc.createOffer().then((sdp) => {

	console.log('mapping sdp...');
	const newSdp = sdpMap(sdp.sdp);
	console.log('mapped sdp=' + newSdp);
	
	doLog('tcall_start: SDP-' + sdp.type + ' ' + newSdp);

	rtc.setLocalDescription({type: sdp.type, sdp: newSdp})
	    .then(() => {
		tcall.tmr = setTimeout(gatherTimeoutHandler, GATHER_TIMEOUT, tcall);
	    })
	    .catch((err) => {
		doLog('setLocalDescription: failed' + err);
	    });
    });
}

function tcall_answer(tcall, sdp)
{
    const rtc = tcall.rtc;

    doLog('tcall_answer: SDP-' + sdp.type + ' ' + sdp.sdp);

    /*
    const txs = rtc.getTransceivers();
    for (const tx of txs) {
	const sender = tx.sender;
	const params = sender.getParameters();
	
	console.log('sender=' + sender + ' params:', params);
	}
    */
    
    
    rtc.setRemoteDescription(sdp)
	.then(() => {
	    addMedia(rtc);
	    
	    rtc.createAnswer().then((answer) => {
		doLog('tcall_answer: generate SDP-' + answer.type + ' ' + answer.sdp);

		
		rtc.setLocalDescription(answer)
		    .then(() => {
			tcall.tmr = setTimeout(gatherTimeoutHandler, GATHER_TIMEOUT, tcall);
		    })
		    .catch((err) => {
			doLog('setLocalDescription: failed' + err);
		    });
	    })		
	})
	.catch((err) => {
	    doLog('setRemoteDescription: failed' + err);
	});
}

function tcall_update(tcall, sdp) {
    const rtc = tcall.rtc;

    if (!rtc)
	return;

    doLog('tcall_update: SDP-' + sdp.type + ' ' + sdp.sdp);
    
    rtc.setRemoteDescription(sdp)
	.then(() => {
	    doLog('tcall_update: answered!');

	    const senders = rtc.getSenders();
	    console.log('senders=' + senders.length);
	    for (const sender of senders) {
		//const sender = tx.sender;
		const params = sender.getParameters();
	
		console.log('sender=' + sender + ' params:', params);
	    }
	    
	})
	.catch((err) => {
	    doLog('tcall_update: setRemoteDescription: failed err: ' + err);
	});
}
	      

function addMedia(rtc)
{
    const audio_tracks = generateAudioTrack();
    //const video_tracks = generateVideoTrack();

    const stream = new MediaStream();
    
    for (const track of audio_tracks) {
	track.enabled = true;
	rtc.addTrack(track, stream);
    }

    /*
    for (const track of video_tracks) {
	track.enabled = true;
	rtc.addTrack(track, stream);
    }
    */
}


function tcall_stats(tcall)
{
    const rtc = tcall.rtc;

    if (!rtc)
	return;

    rtc.getStats()
	.then((stats) => {
	    stats.forEach(stat => {
		if (stat.type === 'inbound-rtp') {
		    //console.log('inbound-rtp: ', stat);
		    const ploss = stat.packetsLost;		    
		    tcall.stats.ploss = ploss - tcall.stats.lastploss;
		    tcall.stats.lastploss = ploss;
		    
		    const b = stat.bytesReceived;
		    tcall.stats.bytes = Math.round((b - tcall.stats.lastbytes) / 1024);
		    tcall.stats.lastbytes = b;

		    const p = stat.packetsReceived;
		    tcall.stats.packets = (p - tcall.stats.lastpackets);
		    tcall.stats.lastpackets = p;					 
		}
	    });
	})
	.catch((err) => console.log('SNDR stats failed: ' + err));
    
    
    /*
    const txs = rtc.getSenders();
    const rxs = rtc.getReceivers();

    for(const tx of txs) {
	tx.getStats()
	    .then((stats) => {
		console.log('SNDR stats: ', stats);
		stats.forEach(
		  
	    .catch((err) => console.log('SNDR stats failed: ' + err));
    }
    
    for(const rx of rxs) {
	rx.getStats()
	    .then((stats) => console.log('RCVR stats: ', stats))
	    .catch((err) => console.log('RCVR stats failed: ' + err));
    }    
    */
}


function tcall_close(tcall)
{
    doLog('tcall_close: userid=' + tcall.userid);
    
    if (tcall && tcall.rtc)
	tcall.rtc.close();
}


function generateAudioTrack()
{
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    oscillator.type = "sine"; // this is the default - also square, sawtooth, triangle
    oscillator.frequency.value = 100; // Hz
    oscillator.start(0);
    const dst = oscillator.connect(ctx.createMediaStreamDestination());
    
    return dst.stream.getAudioTracks();
}


function generateVideoTrack()
{
    const color = "green";
    const width = 1920;
    const height = 1080;
    const canvas = Object.assign(document.createElement('canvas'), {height, width});
    const ctx = canvas.getContext('2d');
    setInterval(() => {
        ctx.fillStyle = `#${color}`;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = `#000`;
        ctx.fillRect(0, 0, Math.random() * 10, Math.random() * 10);
    }, 40);
    const stream = canvas.captureStream(25);
    
    return stream.getVideoTracks();    
}

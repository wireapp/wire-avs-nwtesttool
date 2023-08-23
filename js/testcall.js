const GATHER_TIMEOUT = 10000;
let connectionState;

var statsJson = [];

function callGatherHandler(tcall) {
  const sdp = tcall.rtc.localDescription;

  if (tcall.tmr) {
    clearTimeout(tcall.tmr);
    tcall.tmr = null;
  }

  if (tcall.call_gatherh) {
    tcall.call_gatherh = false;
    if (tcall.gatherh) tcall.gatherh(tcall, sdp);
  }
}

function sdpMap(sdp) {
  const sdpLines = [];
  const sdpSplit = sdp.split("\r\n");

  sdpSplit.forEach(function (sdpLine) {
    let outline = sdpLine;
    if (sdpLine.startsWith("m=audio")) {
      const melems = sdpLine.split(" ");
      const auline = melems.slice(0, 3);

      outline = auline.join(" ") + " " + "0";
    } else if (sdpLine.startsWith("a=rtpmap:")) {
      const melems = sdpLine.split(" ");
      const rtpmap = melems[0].split(":");
      const pt = rtpmap[1];

      if (pt != 0) outline = null;
    } else if (sdpLine.startsWith("a=rtcp-fb:")) {
      outline = null;
    } else if (sdpLine.startsWith("a=fmtp:")) {
      outline = null;
    }
    if (outline != null) {
      sdpLines.push(outline);
    }
  });
  return sdpLines.join("\r\n");
}

function saveLog() {
  const filename = `log-${new Date().toLocaleDateString()}.txt`;
  const data = JSON.stringify(statsJson, null, 4);
  var file = new Blob([data], { type: "text/plain" });
  if (window.navigator.msSaveOrOpenBlob)
    // IE10+
    window.navigator.msSaveOrOpenBlob(file, filename);
  else {
    // Others
    var a = document.createElement("a"),
      url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }
}

function gatherTimeoutHandler(tcall) {
  if (tcall.cands === 0) {
    if (tcall.errorh) tcall.errorh(tcall, "gather-timeout");
  } else {
    callGatherHandler(tcall);
  }
}

function gatheringHandler(tcall) {
  const rtc = tcall.rtc;

  if (!rtc) return;

  const state = rtc.iceGatheringState;

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

      if (tcall.cands < 1) {
      } else {
        callGatherHandler(tcall);
      }

      break;
  }
}

function sftConnectionHandler(rtc, sftStatusHandler) {
  connectionState = rtc.iceConnectionState;
  if (sftStatusHandler) {
    sftStatusHandler(connectionState);
  }
}

function connectionHandler(tcall) {
  const rtc = tcall.rtc;
  if (!rtc) {
    return;
  }
  const state = rtc.iceConnectionState;

  sftStatusHandler(state);
  if (state === "connected") {
    if (tcall.connectedh) tcall.connectedh(tcall);
  }
}

function candidateHandler(tcall, cand) {
  if (!tcall) return;

  const mindex = cand ? cand.sdpMLineIndex : null;
  const rtc = tcall.rtc;

  if (!rtc) return;

  if (cand && cand.candidate) {
    tcall.cands++;

    if (tcall.candh) {
      tcall.candh(tcall, cand.candidate);
    }

    callGatherHandler(tcall);
  } else {
    callGatherHandler(tcall);

    return;
  }
}

function signallingHandler(tcall) {
  const rtc = tcall.rtc;

  const state = rtc.signalingState;
}

function pcCreate(tcall) {
  const config = {
    bundlePolicy: "max-bundle",
    iceServers: tcall.turn_servers.ice_servers,
    rtcpMuxPolicy: "require",
    iceTransportPolicy: "relay",
  };

  const pc = window.RTCPeerConnection;
  const rtc = new pc(config);

  rtc.onicegatheringstatechange = () => gatheringHandler(tcall);
  rtc.oniceconnectionstatechange = () => connectionHandler(tcall);
  rtc.onicecandidate = (event) => candidateHandler(tcall, event.candidate);
  rtc.onsignalingstatechange = (event) => signallingHandler(tcall);
  rtc.ondatachannel = (event) => dataChannelHandler(tcall, event);

  rtc.ontrack = (event) => {
    const peer = tcall.peer;

    if (event.streams && event.streams.length > 0) {
      for (const stream of event.streams) {
        for (const track of stream.getTracks()) {
          if (track)
            console.log(
              "onTrack: convid=" + tcall.convid + " track=" + track.kind
            );
        }
      }
    }
  };

  tcall.rtc = rtc;
}

function sftResponse(url, sdp) {
  const setup = {
    version: "3.0",
    type: "SETUP",
    sessid: "jtest",
    src_userid: "jtest",
    src_clientid: "_",
    dest_userid: "sft",
    dest_clientid: "_",
    resp: false,
    transient: false,

    sdp: sdp,
  };

  fetch(url, {
    method: "POST",
    body: JSON.stringify(setup), // data can be `string` or {object}!
    headers: {
      "Content-Type": "application/json",
    },
  }).then((resp) => {
    if (resp.ok) {
      resp.json().then((sftMsg) => {});
    } else {
      const error = resp.status.toString() + " " + resp.statusText;
    }
  });
}

function pcCreateSft(convid, sftMsg, sftStatusHandler) {
  const config = {
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require",
  };

  const pc = window.RTCPeerConnection;
  const rtc = new pc(config);

  rtc.oniceconnectionstatechange = () =>
    sftConnectionHandler(rtc, sftStatusHandler);

  rtc.setRemoteDescription({ type: "offer", sdp: sftMsg.sdp }).then(() => {
    rtc.createAnswer().then((answer) => {
      rtc.setLocalDescription(answer);
    });
  });

  return rtc;
}

function tcallNew(
  cfg,
  convid,
  userid,
  clientid,
  gatherh,
  candh,
  connectedh,
  errorh,
  statsh
) {
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
    peer: null,
    tmr: null,
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
      jitter: 0,
      lastjitter: 0,
    },
  };

  pcCreate(tcall);

  return tcall;
}

function tcallStart(tcall, convid, userid) {
  const rtc = tcall.rtc;

  addMedia(rtc);

  rtc.createOffer().then((sdp) => {
    const newSdp = sdpMap(sdp.sdp);

    rtc
      .setLocalDescription({ type: sdp.type, sdp: newSdp })
      .then(() => {
        tcall.tmr = setTimeout(gatherTimeoutHandler, GATHER_TIMEOUT, tcall);
      })
      .catch((err) => {});
  });
}

function tcallAnswer(tcall, sdp) {
  const rtc = tcall.rtc;

  rtc
    .setRemoteDescription(sdp)
    .then(() => {
      addMedia(rtc);

      rtc.createAnswer().then((answer) => {
        rtc
          .setLocalDescription(answer)
          .then(() => {
            tcall.tmr = setTimeout(gatherTimeoutHandler, GATHER_TIMEOUT, tcall);
          })
          .catch((err) => {});
      });
    })
    .catch((err) => {});
}

function tcallUpdate(tcall, sdp) {
  const rtc = tcall.rtc;

  if (!rtc) return;

  rtc
    .setRemoteDescription(sdp)
    .then(() => {
      const senders = rtc.getSenders();
      for (const sender of senders) {
        //const sender = tx.sender;
        const params = sender.getParameters();
      }
    })
    .catch((err) => {});
}

function addMedia(rtc) {
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

function tcallStats(tcall) {
  const rtc = tcall.rtc;

  if (!rtc) return;

  rtc
    .getStats()
    .then((stats) => {
      let statsObj = {};

      stats.forEach((stat) => {
        statsObj[stat.type] = stat;
        if (stat.type === "inbound-rtp") {
          const ploss = stat.packetsLost;
          tcall.stats.ploss = ploss - tcall.stats.lastploss;
          tcall.stats.lastploss = ploss;
          const b = stat.bytesReceived;
          tcall.stats.bytes = Math.round((b - tcall.stats.lastbytes) / 1024);
          tcall.stats.lastbytes = b;

          const p = stat.packetsReceived;
          tcall.stats.packets = p - tcall.stats.lastpackets;
          tcall.stats.lastpackets = p;

          const j = stat.jitter;
          tcall.stats.jitter = j - tcall.stats.lastjitter;
          tcall.stats.lastjitter = j;
        }
      });
      statsJson.push(statsObj);
    })
    .catch((err) => console.log("SNDR stats failed: " + err));
}

function tcallClose(tcall) {
  if (tcall.tmr) {
    clearTimeout(tcall.tmr);
    tcall.tmr = null;
  }

  if (tcall && tcall.rtc) tcall.rtc.close();
}

function generateAudioTrack() {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  oscillator.type = "sine"; // this is the default - also square, sawtooth, triangle
  oscillator.frequency.value = 100; // Hz
  oscillator.start(0);
  const dst = oscillator.connect(ctx.createMediaStreamDestination());

  return dst.stream.getAudioTracks();
}

function generateVideoTrack() {
  const color = "green";
  const width = 1920;
  const height = 1080;
  const canvas = Object.assign(document.createElement("canvas"), {
    height,
    width,
  });
  const ctx = canvas.getContext("2d");
  setInterval(() => {
    ctx.fillStyle = `#${color}`;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = `#000`;
    ctx.fillRect(0, 0, Math.random() * 10, Math.random() * 10);
  }, 40);
  const stream = canvas.captureStream(25);

  return stream.getVideoTracks();
}

function tcallSft(sftUrl, sftStatusHandler) {
  const confconn = {
    version: "3.0",
    type: "CONFCONN",
    sessid: "jtest",
    src_userid: "jtest",
    src_clientid: "_",
    dest_userid: "sft",
    dest_clientid: "_",
    resp: false,
    transient: false,
    tool: "nw_test_tool",
    toolver: "0.0.1",
    status: 0,
    selective_audio: true,
    selective_video: true,
    vstreams: 10,
  };

  const convid = (Math.random() + 1).toString(36).substring(7);
  const fullUrl = sftUrl + "/sft/" + convid;
  const sft = { url: "", convid: convid };
  fetch(fullUrl, {
    method: "POST",
    body: JSON.stringify(confconn), // data can be `string` or {object}!
  }).then((resp) => {
    if (resp.ok) {
      resp.json().then((sftMsg) => {
        if (sftMsg.type === "SETUP")
          pcCreateSft(convid, sftMsg, sftStatusHandler);
      });
    } else {
      const error = resp.status.toString() + " " + resp.statusText;
    }
  });
}

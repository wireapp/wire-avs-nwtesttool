let args = null;
let statsInterval = null;

const statusField = document.querySelector(".js-ok-nok-field");
const statusIndicator = document.querySelector(".js-status-indicator");

const calls = document.getElementById("calls");
const kbytes = document.getElementById("kbytes");
const packets = document.getElementById("packets");
const packetsLost = document.getElementById("packets-lost");
const jitterNumber = document.getElementById("jitter");

const CALLS_MAX = 100; // 50
const PCOEFF = 0.4;
const callset = {
  setup: true,
  nconns: 0,
  nattempts: 0,
  tcalls: [],
  is_running: true,
  ploss: 0.0,
  pf: 0.0,
  jitter: 0.0,
};

let wconfig;
const gatherCandidDiv = document.querySelector(".js-gathering-candidates");

function stopAllCalls() {
  for (const tcall of callset.tcalls) {
    tcallClose(tcall);
  }
  callset.nconns = 0;
  callset.nattempts = 0;
  callset.tcalls = [];
}

function restartClick() {
  const restartCheckbox = document.getElementById("collect-data");

  if (callset.is_running) {
    callset.is_running = false;

    if (statsInterval) {
      clearInterval(statsInterval);
    }

    stopAllCalls();
    restartCheckbox.checked = false;
  } else {
    callset.is_running = true;

    gatherCandidDiv.innerHTML = "";

    restartCheckbox.checked = true;
    doStart();
  }
}

function updateStats() {
  if (!callset.is_running) {
    return;
  }

  let ploss = 0;
  let jitter = 0;
  let bw = 0;
  let pkts = 0;
  for (const tcall of callset.tcalls) {
    bw += tcall.stats.bytes;
    pkts += tcall.stats.packets;
    ploss += tcall.stats.ploss;
    jitter += tcall.stats.jitter;
  }
  //measure Ploss packets

  callset.ploss = Math.round((ploss / pkts) * 10000.0) / 100;
  if (!isNaN(callset.ploss)) {
    const pf = PCOEFF * callset.ploss + (1.0 - PCOEFF) * callset.pf;
    callset.pf = Math.round(pf * 100) / 100;
  }

  callset.jitter = Math.round(jitter * 1000.0);
  if (callset.jitter < 0) {
    callset.jitter = 0;
  }
  calls.textContent = callset.nconns?.toString();
  kbytes.textContent = bw?.toString();
  packets.textContent = pkts?.toString();
  packetsLost.textContent = callset.pf?.toString();
  jitterNumber.textContent = callset.jitter?.toString();
}

function gatherAnswerHandler(tcall, sdp) {
  tcallUpdate(tcall.peer, sdp);
}

function gatherOfferHandler(tcall, sdp) {
  // stop timer
  const tcall2 = createCall(false);
  tcall2.peer = tcall;
  tcall.peer = tcall2;

  tcallAnswer(tcall2, sdp);
}

function candHandler(tcall, cand) {
  if (!callset.is_running || callset.nconns > 0) return;

  const span = document.createElement("span");
  span.textContent = "Cand[userid=" + tcall.userid + "]=" + cand?.toString();
  gatherCandidDiv.appendChild(span);
}

function gatherErrorHandler(tcall, err) {
  tcallClose(tcall);
}

function connectedHandler(tcall) {
  if (!callset.is_running) {
    tcallClose(tcall);
    return;
  }

  if (tcall.connected) return;

  tcall.connected = true;
  const peer = tcall.peer;

  if (peer) {
    if (peer.connected) {
      callset.nconns++;

      if (callset.nattempts < CALLS_MAX && callset.is_running) {
        if (isNaN(callset.pf) || callset.pf < 5.0) {
          callset.nattempts++;
          setTimeout(() => newCall(), 1000);
        }
      }
    }
  }
}

function createCall(offer) {
  const wconfig = window.localStorage.getItem("wcfg");
  const userid = callset.tcalls.length?.toString();
  const tcall = tcallNew(
    JSON.parse(wconfig || "{}"),
    "1",
    userid,
    "1",
    offer ? gatherOfferHandler : gatherAnswerHandler,
    candHandler,
    connectedHandler,
    gatherErrorHandler,
    null
  );
  callset.tcalls.push(tcall);

  return tcall;
}

function newCall() {
  const tcall = createCall(true);
  tcallStart(tcall, "1", tcall.userid);
}

function sftStatusHandler(connState) {
  if (connState === "connected" && statusIndicator?.textContent !== "OK") {
    setTimeout(() => {
      statusIndicator.textContent = "OK";
      statusField.style.backgroundColor = "#4A935C";
    }, 1500);
  }
}

function doStart() {
  statsInterval = setInterval(() => {
    for (const tcall of callset.tcalls) {
      tcallStats(tcall);
    }
    updateStats();
  }, 1000);
  callset.nattempts = 1;
  newCall();
}

login("show");
let backendUrl = window.backendHttpsUrl;
let args = null;
let statsInterval = null;

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
let candUl;

function stopAllCalls() {
  for (const tcall of callset.tcalls) {
    tcall_close(tcall);
  }
  callset.nconns = 0;
  callset.nattempts = 0;
  callset.tcalls = [];
}

function restartClick() {
  const restartButton = document.getElementById("restartBtn");
  console.log("restartClick");

  if (callset.is_running) {
    callset.is_running = false;

    if (statsInterval) {
      clearInterval(statsInterval);
    }

    stopAllCalls();
    restartButton.classList.remove("on");
  } else {
    callset.is_running = true;
    candUl.innerHTML = "";
    restartButton.classList.add("on");
    doStart();
  }
}

function backendLogin(username, password) {
  wlogin(backendUrl, username, password, loginSuccess, loginError);
}

function update_stats() {
  if (!callset.is_running) {
    return;
  }

  const logoutButton = document.createElement("button");
  logoutButton.classList.add("logout-button");
  logoutButton.innerText = "Log Out";
  logoutButton.onclick = logout;
  document.body.appendChild(logoutButton);

  const tb = document.getElementById("infoTable");
  const rows = tb.rows;

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

  rows[0].cells[1].textContent = callset.nconns?.toString();
  rows[0].cells[2].textContent = bw?.toString();
  rows[0].cells[3].textContent = pkts?.toString();
  rows[0].cells[4].textContent = callset.pf?.toString();
  rows[0].cells[5].textContent = callset.jitter?.toString();
  rows[0].cells[6].textContent = callset.SFT?.toString();
}

function gather_answer_handler(tcall, sdp) {
  console.log("tcall.userid: " + tcall.userid + " " + sdp.type + "-gathered");

  tcall_update(tcall.peer, sdp);
}

function gather_offer_handler(tcall, sdp) {
  // stop timer
  console.log("tcall.userid: " + tcall.userid + " " + sdp.type + "-gathered");
  const tcall2 = createCall(false);
  tcall2.peer = tcall;
  tcall.peer = tcall2;

  tcall_answer(tcall2, sdp);
}

function cand_handler(tcall, cand) {
  if (!callset.is_running || callset.nconns > 0) return;

  const li = document.createElement("li");
  li.textContent = "Cand[userid=" + tcall.userid + "]=" + cand?.toString();
  candUl.appendChild(li);
}

function gather_error_handler(tcall, err) {
  console.log("tcall.userid: " + tcall.userid + " gather error=" + err);

  tcall_close(tcall);
}

function connected_handler(tcall) {
  if (!callset.is_running) {
    tcall_close(tcall);
    return;
  }

  setupUi();

  if (tcall.connected) return;

  tcall.connected = true;
  const peer = tcall.peer;

  if (peer) {
    if (peer.connected) {
      console.log("*** CONNECTED: " + tcall.userid + "<->" + peer.userid);
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
  const userid = callset.tcalls.length?.toString();
  const tcall = tcall_new(
    wconfig,
    "1",
    userid,
    "1",
    offer ? gather_offer_handler : gather_answer_handler,
    cand_handler,
    connected_handler,
    gather_error_handler,
    null
  );
  callset.tcalls.push(tcall);
  console.log("createTcall=", tcall);

  return tcall;
}

function newCall() {
  const tcall = createCall(true);
  tcall_start(tcall, "1", tcall.userid);
}

function loginSuccess(wcfg) {
  const ul = document.createElement("ul");

  const turns = wcfg.ice_servers;
  for (const turn of turns) {
    const turl = turn.urls[0];
    const li = document.createElement("li");
    li.textContent = turl;
    ul.appendChild(li);
  }
  const sfts = wcfg.sft_servers;
  console.log("SFTS=" + JSON.stringify(sfts));
  if (sfts.length > 0) tcall_sft(sfts[0].urls[0], sftStatusHandler);

  const h3 = document.createElement("h3");

  h3.textContent = "Configured TURN server(s):";
  document.body.appendChild(h3);
  document.body.appendChild(ul);

  const h3a = document.createElement("h3");
  h3a.textContent = "Gathering candidates...";
  document.body.appendChild(h3a);

  candUl = document.createElement("ul");
  document.body.appendChild(candUl);

  wconfig = wcfg;

  doStart();
}

function loginError(error) {
  const h3 = document.createElement("h3");

  h3.textContent = "Login failed: " + error;
  document.body.appendChild(h3);
}

function sftStatusHandler(connState) {
  console.log("SFT status=", connState);
  if (connState === "connected") {
    setTimeout(() => {
      sftTd.textContent = "OK";
      sftTd.style.backgroundColor = "rgb(0, 197, 0)";
    }, 2000);
  }
}

function logout() {
  window.location.href = "https://wire-calling-testtool.wire.com/";
}

const logoutBtn = document.getElementById("logout-btn");
logoutBtn.addEventListener("click", logout);

function doStart() {
  statsInterval = setInterval(() => {
    for (const tcall of callset.tcalls) {
      tcall_stats(tcall);
    }
    update_stats();
  }, 1000);
  callset.nattempts = 1;
  newCall();
}

function setupUi() {
  if (!callset.setup) {
    return;
  }

  callset.setup = false;
  const tb = document.createElement("table");
  let th = document.createElement("th");
  th.textContent = "Media Type";
  tb.appendChild(th);

  th = document.createElement("th");
  th.textContent = "Number";
  tb.appendChild(th);

  th = document.createElement("th");
  th.textContent = "KBytes/s";
  tb.appendChild(th);

  th = document.createElement("th");
  th.textContent = "packets/s";
  tb.appendChild(th);

  th = document.createElement("th");
  th.textContent = "Lost (%)";
  tb.appendChild(th);

  th = document.createElement("th");
  th.textContent = "jitter (ms)";
  tb.appendChild(th);

  th = document.createElement("th");
  th.textContent = "SFT Status";
  tb.appendChild(th);

  let tr = document.createElement("tr");
  let td = document.createElement("td");
  td.textContent = "audio";
  tr.appendChild(td);

  td = document.createElement("td");
  td.textContent = "0";
  tr.appendChild(td);

  td = document.createElement("td");
  td.textContent = "0";
  tr.appendChild(td);

  td = document.createElement("td");
  td.textContent = "0";
  tr.appendChild(td);

  td = document.createElement("td");
  td.textContent = "0";
  tr.appendChild(td);

  td = document.createElement("td");
  td.textContent = "0";
  tr.appendChild(td);

  sftTd = document.createElement("td");
  sftTd.textContent = "NOT OK";
  sftTd.style.backgroundColor = "rgb(197, 0, 0)";
  tr.appendChild(sftTd);

  tb.appendChild(tr);
  tb.setAttribute("id", "infoTable");
  tb.setAttribute("align", "center");

  document.body.appendChild(tb);

  const restartb = document.createElement("div");
  restartb.setAttribute("id", "restartBtn");
  restartb.addEventListener("click", restartClick);
  document.body.appendChild(restartb);

  const checkbox = document.createElement("input");
  checkbox.setAttribute("type", "checkbox");
  checkbox.setAttribute("id", "enableLog");

  const logb = document.createElement("button");
  logb.setAttribute("id", "LogBtn");
  logb.setAttribute("disabled", true);
  logb.setAttribute("onclick", "saveLog();");
  logb.textContent = "Extract Log";

  const label = document.createElement("label");
  label.setAttribute("for", "enableLog");
  label.textContent =
    "By checking this box, I confirm that I understand that the log file contains potentially sensitive data like IP addresses";

  document.body.appendChild(logb);
  document.body.appendChild(label);
  document.body.appendChild(checkbox);

  checkbox.addEventListener("change", function () {
    if (this.checked) {
      logb.removeAttribute("disabled");
    } else {
      logb.setAttribute("disabled", true);
    }
  });
}

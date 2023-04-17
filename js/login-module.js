function login(showhide) {
  if (showhide === "show") {
    document.getElementById("popupbox").style.visibility = "visible";
  } else if (showhide === "hide") {
    document.getElementById("popupbox").style.visibility = "hidden";
  }

  const forgotPasswordLink = document.createElement("a");
  forgotPasswordLink.href = "https://account.wire.com/forgot/";
  forgotPasswordLink.innerText = "Forgot password?";
  document.getElementById("popupbox").appendChild(forgotPasswordLink);
}

function loginClick() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Clear login password in form
  document.getElementById("password").value = "";

  login("hide");
  backendLogin(username, password);
}

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

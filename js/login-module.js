let backendUrl = window.backendHttpsUrl;
function showPassword() {
  const togglePassword = document.querySelector("#togglePassword");
  const password = document.querySelector("#password");
  const type =
    password.getAttribute("type") === "password" ? "text" : "password";
  password.setAttribute("type", type);

  const showIcon = togglePassword.querySelector(".show-icon");
  const hideIcon = togglePassword.querySelector(".hide-icon");
  showIcon.classList.toggle("hidden");
  hideIcon.classList.toggle("hidden");
}

function validateInputs() {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("loginBtn");

  if (usernameInput.value && passwordInput.value) {
    loginButton.removeAttribute("disabled");
  } else {
    loginButton.setAttribute("disabled", true);
  }
}
/*
function login(showhide) {
  if (showhide === "show") {
    document.querySelector(".main-container").style.visibility = "visible";
  } else if (showhide === "hide") {
    document.querySelector(".main-container").style.visibility = "hidden";
  }
}*/

function loginClick() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Clear login password in form
  document.getElementById("password").value = "";

  //login("hide");
  backendLogin(username, password);
}

function backendLogin(username, password) {
  wlogin(backendUrl, username, password, loginSuccess, loginError);
}

function loginSuccess(wcfg) {
  window.location.href = "report.html";
  //const ul = document.createElement("ul");
  /*
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
*/
  // wconfig = wcfg;

  // doStart();
}

function loginError(error) {
  const errorMsgDiv = document.getElementById("errorMsg");
  errorMsgDiv.textContent = "Login failed: " + error;

  /*const h3 = document.createElement("h3");

  h3.textContent = "Login failed: " + error;
  document.body.appendChild(h3);*/
}

//Attach event listeners

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const togglePassword = document.querySelector("#togglePassword");

usernameInput.addEventListener("input", validateInputs);
passwordInput.addEventListener("input", validateInputs);
togglePassword.addEventListener("change", showPassword);

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

function loginClick() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Clear login password in form
  document.getElementById("password").value = "";

  backendLogin(username, password);
}

function backendLogin(username, password) {
  wlogin(backendUrl, username, password, loginSuccess, loginError);
}

function loginSuccess() {
  window.location.href = "report.html";
}

function loginError(error) {
  const errorMsgDiv = document.getElementById("errorMsg");
  errorMsgDiv.textContent = "Login failed: " + error;
}

//Attach event listeners
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const togglePassword = document.querySelector("#togglePassword");

usernameInput.addEventListener("input", validateInputs);
passwordInput.addEventListener("input", validateInputs);
togglePassword.addEventListener("change", showPassword);

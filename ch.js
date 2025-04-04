const axios = require('axios');
const fs = require('fs');
const readline = require('readline');

// ==================== Color Setup (Logical, Bright Colors Only) ==================== //
const COLORS = {
  info: "\x1b[96m",      // bright cyan for general info
  success: "\x1b[92m",   // bright green for success messages
  warning: "\x1b[93m",   // bright yellow for warnings
  error: "\x1b[91m",     // bright red for errors (always negative news)
  question: "\x1b[95m",  // bright magenta for questions/prompts
  reset: "\x1b[0m"       // reset color
};

const BORDER = "────────────────────────────";

// Bordered log functions
function logInfo(message) {
  console.log(COLORS.info + BORDER);
  console.log(message);
  console.log(BORDER + COLORS.reset);
}

function logSuccess(message) {
  console.log(COLORS.success + BORDER);
  console.log(message);
  console.log(BORDER + COLORS.reset);
}

function logWarning(message) {
  console.log(COLORS.warning + BORDER);
  console.log(message);
  console.log(BORDER + COLORS.reset);
}

function logError(message) {
  console.log(COLORS.error + BORDER);
  console.log(message);
  console.log(BORDER + COLORS.reset);
}

function logQuestion(message) {
  console.log(COLORS.question + BORDER);
  console.log(message);
  console.log(BORDER + COLORS.reset);
}

// ==================== API Headers ==================== //
const headers = {
  'user-agent': 'Dart/3.6 (dart:io)',
  'accept-encoding': 'gzip',
  'host': 'api.airdroptoken.com',
  'accept': '*/*',
  'content-type': 'application/json'
};

const firebaseHeaders = {
  'Content-Type': 'application/json',
  'X-Android-Package': 'com.lumira_mobile',
  'X-Android-Cert': '1A1F179100AAF62649EAD01C6870FDE2510B1BC2',
  'Accept-Language': 'en-US',
  'X-Client-Version': 'Android/Fallback/X22003001/FirebaseCore-Android',
  'X-Firebase-GMPID': '1:599727959790:android:5c819be0c7e7e3057a4dff',
  'X-Firebase-Client': 'H4sIAAAAAAAAAKtWykhNLCpJSk0sKVayio7VUSpLLSrOzM9TslIyUqoFAFyivEQfAAAA',
  'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 7.1.2; ASUS_Z01QD Build/N2G48H)',
  'Host': 'www.googleapis.com',
  'Connection': 'Keep-Alive',
  'Accept-Encoding': 'gzip'
};

// ==================== Utility Functions ==================== //

// Generate a random alphanumeric string (for email suffix, password, etc.)
function generateRandomString(length) {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Generate a random birthday between 1980 and 2005
function generateRandomBirthday() {
  const start = new Date(1980, 0, 1);
  const end = new Date(2005, 11, 31);
  const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  const year = randomDate.getFullYear();
  const month = String(randomDate.getMonth() + 1).padStart(2, '0');
  const day = String(randomDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Random sleep between 1 to 4 seconds
function randomSleep() {
  const min = 1000;
  const max = 4000;
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return sleep(delay);
}

// ==================== Username Handling ==================== //
// Read the next available username from usernames.txt and remove it from the file.
function getNextUsername() {
  const filename = 'usernames.txt';
  if (!fs.existsSync(filename)) {
    throw new Error("usernames.txt not found");
  }
  const data = fs.readFileSync(filename, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  if (data.length === 0) {
    throw new Error("No more usernames available in usernames.txt");
  }
  const nextUsername = data.shift();
  fs.writeFileSync(filename, data.join('\n'));
  return nextUsername;
}

// ==================== Account Generation & API Interaction ==================== //

// Generate account data using referral code from code.txt and a username from usernames.txt
function generateAccountData() {
  const username = getNextUsername();
  const randomStr = generateRandomString(4); // Suffix for email/password uniqueness
  const referralCode = fs.readFileSync('code.txt', 'utf8').trim();
  return {
    full_name: username,
    username: username,
    email: `${username}${randomStr}@gmail.com`,
    password: `Pass${randomStr}123`,
    phone: `+628${Math.floor(100000000 + Math.random() * 900000000)}`,
    referral_code: referralCode,
    country: 'ID',
    birthday: generateRandomBirthday()
  };
}

// Check if email is available
async function checkEmail(email) {
  try {
    const response = await axios.get(
      `https://api.airdroptoken.com/user/email-in-use?email=${encodeURIComponent(email)}`,
      { headers }
    );
    return !response.data.in_use;
  } catch (error) {
    logError('Error checking email: ' + error.message);
    return false;
  }
}

// Check if username is available
async function checkUsername(username) {
  try {
    const response = await axios.get(
      `https://api.airdroptoken.com/user/username-in-use?username=${username}`,
      { headers }
    );
    return !response.data.in_use;
  } catch (error) {
    logError('Error checking username: ' + error.message);
    return false;
  }
}

// Login using email and password
async function login(email, password) {
  try {
    const payload = {
      email: email,
      password: password,
      returnSecureToken: true,
      clientType: 'CLIENT_TYPE_ANDROID'
    };

    const response = await axios.post(
      'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=AIzaSyB0YXNLWl-mPWQNX-tvd7rp-HVNr_GhAmk',
      payload,
      { headers: firebaseHeaders }
    );
    return response.data.idToken;
  } catch (error) {
    logError('Login failed: ' + (error.response?.data?.error?.message || error.message));
    return null;
  }
}

// Start mining by enabling miner and disabling ads
async function startMining(token) {
  try {
    await axios.put(
      'https://api.airdroptoken.com/miners/miner',
      {},
      {
        headers: {
          ...headers,
          'authorization': `Bearer ${token}`,
          'content-length': 0
        }
      }
    );

    await axios.put(
      'https://api.airdroptoken.com/user/ads',
      'ads_enabled=false',
      {
        headers: {
          ...headers,
          'authorization': `Bearer ${token}`,
          'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
          'content-length': '17'
        }
      }
    );

    return true;
  } catch (error) {
    logError('Error starting mining: ' + error.message);
    return false;
  }
}

// Save account data to accounts.json (save after each new account is created)
function saveToFile(accounts) {
  fs.writeFileSync('accounts.json', JSON.stringify(accounts, null, 2));
  logSuccess("Accounts data saved to accounts.json");
}

// Load existing accounts from accounts.json (if exists and valid)
function loadExistingAccounts() {
  let accounts = [];
  if (fs.existsSync('accounts.json')) {
    try {
      const fileContent = fs.readFileSync('accounts.json', 'utf8').trim();
      accounts = fileContent ? JSON.parse(fileContent) : [];
      logInfo("Loaded " + accounts.length + " account(s) from accounts.json");
    } catch (e) {
      logError("Error reading accounts.json, starting with empty accounts array: " + e.message);
      accounts = [];
    }
  } else {
    logWarning("accounts.json not found. Starting with an empty accounts array.");
  }
  return accounts;
}

// Register an account using the provided account data
async function registerAccount(accountData) {
  try {
    const [emailAvailable, usernameAvailable] = await Promise.all([
      checkEmail(accountData.email),
      checkUsername(accountData.username)
    ]);

    if (!emailAvailable || !usernameAvailable) {
      throw new Error('Email or username already in use');
    }

    const response = await axios.post(
      'https://api.airdroptoken.com/user/register',
      accountData,
      {
        headers: {
          ...headers,
          'authorization': 'Bearer null',
          'content-length': JSON.stringify(accountData).length
        }
      }
    );

    return {
      success: true,
      data: accountData,
      response: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: accountData
    };
  }
}

// Create new accounts and add them to the existing accounts array
// Retries until the specified number of new accounts are successfully created.
async function createNewAccounts(numberToCreate) {
  let accounts = loadExistingAccounts();
  const initialTotal = accounts.length;
  let created = 0;
  while (created < numberToCreate) {
    const currentIndex = initialTotal + created + 1;
    logInfo(`Total saved accounts: ${initialTotal + created}`);
    logInfo(`Creating account ${created + 1} of ${numberToCreate}...`);
    let accountData;
    try {
      accountData = generateAccountData();
    } catch (e) {
      logError(e.message);
      break;
    }
    const result = await registerAccount(accountData);
    if (result.success) {
      logSuccess(`Account created: ${accountData.email}`);
      const token = await login(accountData.email, accountData.password);
      if (token) {
        accounts.push({
          email: accountData.email,
          username: accountData.username,
          password: accountData.password,
          phone: accountData.phone,
          birthday: accountData.birthday,
          token: token,
          mining_status: 'inactive',
          created_at: new Date().toISOString()
        });
        created++;
        saveToFile(accounts); // Save after each successful account creation
      } else {
        logError(`Failed login for ${accountData.email}. Retrying...`);
      }
    } else {
      logError(`Account creation failed: ${result.error}. Retrying...`);
    }
    // Random sleep between 1 to 4 seconds
    await randomSleep();
  }
  return accounts;
}

// Run one mining cycle for all accounts: re-login and start mining.
async function runMiningCycle(accounts) {
  logInfo("Starting a mining cycle for all accounts...");
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    logInfo(`Processing ${account.email}...`);
    const newToken = await login(account.email, account.password);
    if (newToken) {
      accounts[i].token = newToken;
      const miningStarted = await startMining(newToken);
      logSuccess(`Mining ${miningStarted ? 'started' : 'failed'} for ${account.email}`);
    } else {
      logError(`Could not re-login for ${account.email}`);
    }
  }
  saveToFile(accounts);
  logSuccess("Mining cycle completed!");
}

// ==================== User Input via Readline ==================== //
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

// ==================== Main Function ==================== //
async function main() {
  logQuestion("What do you want?");
  logQuestion("1: Create new accounts (without starting mining)");
  logQuestion("2: Start mining for saved accounts in accounts.json");

  const choice = await askQuestion("Enter 1 or 2: ");
  if (choice.trim() === "1") {
    const numInput = await askQuestion("How many new accounts do you want to create? ");
    const num = parseInt(numInput.trim(), 10);
    if (isNaN(num) || num <= 0) {
      logError("Invalid number entered. Exiting.");
      return;
    }
    await createNewAccounts(num);
    logSuccess("New accounts created and saved successfully.");
  } else if (choice.trim() === "2") {
    const accounts = loadExistingAccounts();
    if (accounts.length === 0) {
      logWarning("No accounts found in accounts.json. Please create new accounts first.");
      return;
    }
    await runMiningCycle(accounts);
  } else {
    logError("Invalid choice. Exiting.");
  }
  logInfo("Exiting after completing the operation. See you tomorrow!");
}

main().catch(error => {
  logError("An error occurred: " + error.message);
});
/* ============================================================
   FreeStudy Hub — shared auth layer (fsh-auth.js)
   Load AFTER firebase-app-compat.js + firebase-auth-compat.js.
   Talks to Realtime Database over REST with an auth token, so it
   matches the existing test/dashboard code (which uses fetch .json).
   ============================================================ */
(function () {
  var firebaseConfig = {
    apiKey: "AIzaSyCRFUH04Y_UccnsSYkcGW4IbJQd3wgxSYE",
    authDomain: "gregmat26-4ae92.firebaseapp.com",
    databaseURL: "https://gregmat26-4ae92-default-rtdb.firebaseio.com",
    projectId: "gregmat26-4ae92",
    storageBucket: "gregmat26-4ae92.firebasestorage.app",
    messagingSenderId: "799441579650",
    appId: "1:799441579650:web:58751d3fd6c1418117ce9b",
    measurementId: "G-K9W1XFD1VC"
  };
  var DB = firebaseConfig.databaseURL;
  var TEACHER_CODE = "GREEDU2026";        // teachers need this to register
  var LOGIN_PAGE = "index.html";

  if (window.firebase && !firebase.apps.length) firebase.initializeApp(firebaseConfig);
  var auth = firebase.auth();

  // ---- REST helpers that always carry a fresh ID token ----
  async function token() {
    var u = auth.currentUser;
    return u ? await u.getIdToken() : null;
  }
  async function url(path) {
    var t = await token();
    return DB + "/" + path + ".json" + (t ? "?auth=" + t : "");
  }
  var rest = {
    async get(path) {
      try { var r = await fetch(await url(path)); return await r.json(); }
      catch (e) { console.error("get " + path, e); return null; }
    },
    async put(path, data) {
      try { var r = await fetch(await url(path), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); return await r.json(); }
      catch (e) { console.error("put " + path, e); return null; }
    },
    async patch(path, data) {
      try { var r = await fetch(await url(path), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); return await r.json(); }
      catch (e) { console.error("patch " + path, e); return null; }
    }
  };

  function profilePath(uid) { return "users/" + uid; }

  // ---- auth state ----
  var _profile = null, _resolvedOnce = false, _waiters = [];
  auth.onAuthStateChanged(async function (user) {
    if (user) {
      var p = await rest.get(profilePath(user.uid));
      _profile = p || { name: user.email, email: user.email, role: "student" };
    } else {
      _profile = null;
    }
    _resolvedOnce = true;
    _waiters.splice(0).forEach(function (cb) { cb(user, _profile); });
  });

  function onReady(cb) {
    if (_resolvedOnce) cb(auth.currentUser, _profile);
    else _waiters.push(cb);
  }

  // Gate a page: ensure signed in (+ optional role). Otherwise redirect to login.
  // Returns a Promise<{user, profile}>; never resolves if it redirects.
  function gate(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      onReady(function (user, profile) {
        if (!user) {
          var next = encodeURIComponent(location.pathname.split("/").pop() + location.search);
          location.replace(LOGIN_PAGE + "?next=" + next);
          return;
        }
        if (opts.role && (!profile || profile.role !== opts.role)) {
          // wrong role — send to login which will route them correctly
          location.replace(LOGIN_PAGE + "?denied=" + opts.role);
          return;
        }
        resolve({ user: user, profile: profile });
      });
    });
  }

  async function signIn(email, password) {
    var cred = await auth.signInWithEmailAndPassword(email.trim(), password);
    return cred.user;
  }

  async function signUp(o) {
    // Everyone who self-registers is a STUDENT. Instructor access is granted
    // ONLY by an admin in the Firebase Console (users/<uid>/role = "teacher").
    // There is no teacher code in the app, so no one can self-promote.
    var cred = await auth.createUserWithEmailAndPassword(o.email.trim(), o.password);
    var profile = { name: o.name || o.email, email: o.email.trim(), role: "student", createdAt: Date.now() };
    await rest.put(profilePath(cred.user.uid), profile);
    _profile = profile;
    return { user: cred.user, profile: profile };
  }

  // Re-fetch the signed-in user's profile fresh from the database.
  async function refreshProfile() {
    var u = auth.currentUser;
    if (!u) { _profile = null; return null; }
    var p = await rest.get(profilePath(u.uid));
    _profile = p || { name: u.email, email: u.email, role: "student" };
    return _profile;
  }

  function signOut() { return auth.signOut(); }

  function homeFor(profile) {
    return (profile && profile.role === "teacher") ? "teacher.html" : "hub.html";
  }

  window.FSHAuth = {
    auth: auth, rest: rest, token: token,
    onReady: onReady, gate: gate,
    signIn: signIn, signUp: signUp, signOut: signOut, refreshProfile: refreshProfile,
    profile: function () { return _profile; },
    homeFor: homeFor,
    LOGIN_PAGE: LOGIN_PAGE
  };
})();

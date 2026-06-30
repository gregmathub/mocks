/* ============================================================
   FreeStudy Hub — platform data layer (fsh-data.js)
   Load AFTER fsh-auth.js. Builds on FSHAuth.rest (REST + token).

   Adds the classroom platform on top of the existing app:
     classes  → cohorts students join with a code
     mocks    → data-driven tests authored in the console
     assignments → a mock sent to a whole class or specific students
     resources   → shared study materials
     engagement  → who actually opened each resource (commitment)

   New mocks write results in the SAME shape the dashboard already
   reads:  results/<emailKey>/<testId>/<ts>  with questionResults.
   ============================================================ */
(function () {
  if (!window.FSHAuth) { console.error("fsh-data.js needs fsh-auth.js loaded first"); return; }
  var rest = FSHAuth.rest;

  // ---- helpers ----
  function emailKey(email) { return String(email || "").trim().toLowerCase().replace(/[.#$\[\]]/g, "-"); }
  function uid(prefix) {
    return (prefix || "id") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function classCode() {
    var c = "ABCDEFGHJKMNPQRSTUVWXYZ23456789", s = "";
    for (var i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)];
    return s;
  }
  function obj(v) { return v && typeof v === "object" ? v : {}; }
  function list(v) { return Object.entries(obj(v)).map(function (e) { return Object.assign({ _id: e[0] }, e[1]); }); }

  // ============================================================
  // CLASSES
  // ============================================================
  async function createClass(name) {
    var prof = FSHAuth.profile() || {};
    var u = FSHAuth.auth.currentUser;
    var id = uid("cls");
    var rec = { name: name || "Untitled class", code: classCode(), teacherId: u ? u.uid : null,
                teacherName: prof.name || "", createdAt: Date.now() };
    await rest.put("classes/" + id, rec);
    return Object.assign({ _id: id }, rec);
  }
  async function listClasses() {
    var u = FSHAuth.auth.currentUser;
    var all = list(await rest.get("classes"));
    if (u) all = all.filter(function (c) { return c.teacherId === u.uid; });
    return all.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
  }
  async function getClass(id) {
    var c = await rest.get("classes/" + id); return c ? Object.assign({ _id: id }, c) : null;
  }
  async function findClassByCode(code) {
    var all = list(await rest.get("classes"));
    code = String(code || "").trim().toUpperCase();
    return all.find(function (c) { return (c.code || "").toUpperCase() === code; }) || null;
  }
  async function renameClass(id, name) { await rest.patch("classes/" + id, { name: name }); }
  async function regenCode(id) { var code = classCode(); await rest.patch("classes/" + id, { code: code }); return code; }

  // ---- roster ----
  async function joinClass(classId, profile) {
    var k = emailKey(profile.email);
    await rest.put("roster/" + classId + "/" + k,
      { name: profile.name || profile.email, email: profile.email, joinedAt: Date.now() });
    await rest.put("studentClass/" + k, classId);
    return classId;
  }
  async function classRoster(classId) {
    return list(await rest.get("roster/" + classId))
      .map(function (r) { r.emailKey = r._id; return r; })
      .sort(function (a, b) { return (a.name || "").localeCompare(b.name || ""); });
  }
  async function removeFromClass(classId, ek) {
    await rest.put("roster/" + classId + "/" + ek, null);
    await rest.put("studentClass/" + ek, null);
  }
  async function studentClassId(email) { return await rest.get("studentClass/" + emailKey(email)); }

  // ============================================================
  // MOCKS  (the authored tests)
  // ============================================================
  // mock = { title, desc, section, timeLimit(min), questions:[ {id,type,passage,stem,
  //          quantA,quantB, options[], answer, explanation, tags[]} ] }
  async function saveMock(mock, existingId) {
    var u = FSHAuth.auth.currentUser;
    var id = existingId || uid("mock");
    var rec = {
      title: mock.title || "Untitled mock",
      desc: mock.desc || "",
      section: mock.section || "quant",
      timeLimit: Number(mock.timeLimit) || 0,
      questions: mock.questions || [],
      questionCount: (mock.questions || []).length,
      createdBy: u ? u.uid : null,
      createdAt: mock.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    await rest.put("mocks/" + id, rec);
    return Object.assign({ _id: id }, rec);
  }
  async function listMocks() {
    var u = FSHAuth.auth.currentUser;
    var all = list(await rest.get("mocks"));
    if (u) all = all.filter(function (m) { return !m.createdBy || m.createdBy === u.uid; });
    return all.sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
  }
  async function getMock(id) { var m = await rest.get("mocks/" + id); return m ? Object.assign({ _id: id }, m) : null; }
  async function deleteMock(id) { await rest.put("mocks/" + id, null); }

  // ============================================================
  // ASSIGNMENTS
  // ============================================================
  // assignment = { mockId, mockTitle, classId, createdAt,
  //                target:{ type:'class'|'students', emailKeys:{ek:true} } }
  async function assignMock(o) {
    var id = uid("asg");
    var emap = {};
    (o.emailKeys || []).forEach(function (k) { emap[k] = true; });
    var rec = {
      mockId: o.mockId, mockTitle: o.mockTitle || "", classId: o.classId || null,
      createdAt: Date.now(),
      target: { type: o.type || "class", emailKeys: emap }
    };
    await rest.put("assignments/" + id, rec);
    return Object.assign({ _id: id }, rec);
  }
  async function listAssignments(classId) {
    var all = list(await rest.get("assignments"));
    if (classId) all = all.filter(function (a) { return a.classId === classId; });
    return all.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
  }
  async function deleteAssignment(id) { await rest.put("assignments/" + id, null); }

  // assignments visible to a given student (their class, targeted to all or to them)
  async function assignmentsForStudent(email) {
    var ek = emailKey(email);
    var classId = await studentClassId(email);
    var all = list(await rest.get("assignments"));
    return all.filter(function (a) {
      if (a.classId && classId && a.classId !== classId) return false;
      if (!a.target || a.target.type === "class") return true;
      return a.target.emailKeys && a.target.emailKeys[ek];
    }).sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
  }

  // ============================================================
  // RESULTS  (compatible with the existing dashboard schema)
  // ============================================================
  async function saveResult(o) {
    // o: { name, email, testId, score, correct, wrong, skipped, timeUsed,
    //      questionResults:{1:true,...}, scaled?, tagResults?, assignmentId? }
    var ek = emailKey(o.email), ts = Date.now();
    var rec = {
      name: o.name, email: o.email, tier: "free", testId: o.testId,
      score: o.score, correct: o.correct, wrong: o.wrong, skipped: o.skipped,
      timeUsed: o.timeUsed || 0, timestamp: ts,
      questionResults: o.questionResults || {}
    };
    if (o.scaled != null) rec.scaled = o.scaled;
    if (o.tagResults) rec.tagResults = o.tagResults;
    if (o.assignmentId) rec.assignmentId = o.assignmentId;
    await rest.put("results/" + ek + "/" + o.testId + "/" + ts, rec);
    await rest.patch("students/" + ek, { name: o.name, email: o.email, tier: "free", lastSeen: ts });
    return rec;
  }
  async function resultsForStudent(email) {
    var data = obj(await rest.get("results/" + emailKey(email)));
    var out = [];
    Object.entries(data).forEach(function (t) {
      Object.entries(obj(t[1])).forEach(function (a) { out.push(Object.assign({ testId: t[0] }, a[1])); });
    });
    return out.sort(function (a, b) { return (b.timestamp || 0) - (a.timestamp || 0); });
  }
  async function bestResultFor(email, testId) {
    var data = obj(await rest.get("results/" + emailKey(email) + "/" + testId));
    var arr = Object.values(data).filter(function (r) { return r && typeof r.score === "number"; });
    if (!arr.length) return null;
    return arr.reduce(function (b, r) { return (!b || r.score > b.score) ? r : b; }, null);
  }

  // ============================================================
  // RESOURCES  +  ENGAGEMENT (the commitment tracker)
  // ============================================================
  async function addResource(o) {
    var id = uid("res");
    var rec = { title: o.title || "Resource", url: o.url || "", type: o.type || "link",
                note: o.note || "", classId: o.classId || null, createdAt: Date.now() };
    await rest.put("resources/" + id, rec);
    return Object.assign({ _id: id }, rec);
  }
  async function listResources(classId) {
    var all = list(await rest.get("resources"));
    if (classId) all = all.filter(function (r) { return !r.classId || r.classId === classId; });
    return all.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
  }
  async function deleteResource(id) { await rest.put("resources/" + id, null); }

  // student opened / completed a resource
  async function trackOpen(email, resId) {
    var ek = emailKey(email), path = "engagement/" + ek + "/" + resId;
    var cur = obj(await rest.get(path));
    await rest.put(path, {
      opens: (cur.opens || 0) + 1,
      firstAt: cur.firstAt || Date.now(),
      lastAt: Date.now(),
      completed: cur.completed || false,
      name: (FSHAuth.profile() || {}).name || email, email: email
    });
  }
  async function markComplete(email, resId, done) {
    await rest.patch("engagement/" + emailKey(email) + "/" + resId, { completed: done !== false, lastAt: Date.now() });
  }
  async function engagementFor(email) { return obj(await rest.get("engagement/" + emailKey(email))); }
  // full matrix: { emailKey: { resId: {opens,lastAt,completed,name,email} } }
  async function allEngagement() { return obj(await rest.get("engagement")); }

  window.FSHData = {
    emailKey: emailKey, uid: uid, list: list,
    createClass: createClass, listClasses: listClasses, getClass: getClass,
    findClassByCode: findClassByCode, renameClass: renameClass, regenCode: regenCode,
    joinClass: joinClass, classRoster: classRoster, removeFromClass: removeFromClass, studentClassId: studentClassId,
    saveMock: saveMock, listMocks: listMocks, getMock: getMock, deleteMock: deleteMock,
    assignMock: assignMock, listAssignments: listAssignments, deleteAssignment: deleteAssignment,
    assignmentsForStudent: assignmentsForStudent,
    saveResult: saveResult, resultsForStudent: resultsForStudent, bestResultFor: bestResultFor,
    addResource: addResource, listResources: listResources, deleteResource: deleteResource,
    trackOpen: trackOpen, markComplete: markComplete, engagementFor: engagementFor, allEngagement: allEngagement
  };
})();

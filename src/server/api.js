import { db } from './db.js';
import url from 'url';

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

function sendJson(res, statusCode, data, extraHeaders = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE, PUT',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Instructor-Token',
    ...extraHeaders
  });
  res.end(JSON.stringify(data));
}

function parseCookies(req) {
  const list = {};
  const rc = req.headers && req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      if (parts.length >= 2) {
        list[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('=').trim());
      }
    });
  }
  return list;
}

function getInstructorToken(req) {
  // 1. Authorization: Bearer <token>
  const authHeader = req.headers && (req.headers.authorization || req.headers.Authorization);
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  // 2. Custom header: X-Instructor-Token
  if (req.headers && req.headers['x-instructor-token']) {
    return String(req.headers['x-instructor-token']).trim();
  }
  // 3. Cookie: instructor_session
  const cookies = parseCookies(req);
  if (cookies.instructor_session) {
    return cookies.instructor_session.trim();
  }
  return null;
}

function requireInstructorAuth(req, res) {
  const token = getInstructorToken(req);
  if (!token) {
    sendJson(res, 401, {
      error: "UNAUTHORIZED",
      message: "Access denied. Valid instructor session required. Please sign in with your institutional credentials."
    });
    return null;
  }
  const session = db.validateSessionToken(token);
  if (!session) {
    sendJson(res, 401, {
      error: "SESSION_EXPIRED",
      message: "Instructor session has expired or is invalid. Please sign in again."
    });
    return null;
  }
  req.instructor = session;
  return session;
}

export async function handleApiRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE, PUT',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  try {
    // 1. TOPICS LIBRARY
    if (pathname === '/api/quiz/topics' && req.method === 'GET') {
      const topics = db.getTopics();
      const settings = db.getSettings();
      return sendJson(res, 200, {
        topics,
        minTopics: settings.minTopics || 2
      });
    }

    // 2. SIMPLIFIED STUDENT AUTH & ATTENDANCE VERIFICATION
    if (pathname === '/api/auth/student' && req.method === 'POST') {
      const body = await parseBody(req);
      const { rollNumber, name } = body;

      if (!rollNumber || !rollNumber.trim()) {
        return sendJson(res, 400, {
          error: "ROLL NUMBER REQUIRED",
          message: "Please enter your assigned Roll Number."
        });
      }

      if (!name || !name.trim()) {
        return sendJson(res, 400, {
          error: "NAME REQUIRED",
          message: "Please enter your full name."
        });
      }

      const cleanRoll = rollNumber.trim().toUpperCase();

      // Rule 1: Fixed Roll Number Format Check (YY-CP-NNN)
      const isValidFormat = db.validateRollNumberFormat(cleanRoll);
      if (!isValidFormat) {
        return sendJson(res, 400, {
          error: "INVALID ROLL NUMBER",
          message: "Please enter your Roll Number in the format 25-CP-001.",
          code: "INVALID_FORMAT"
        });
      }

      // Rule 2: Attendance Verification Check (Server-Side)
      const attendance = db.checkStudentAttendance(cleanRoll);
      if (!attendance.found || !attendance.isPresent) {
        return sendJson(res, 403, {
          error: "QUIZ ACCESS DENIED",
          message: "Your Roll Number is not on today's attendance list. Only students marked present by the instructor can take this assessment.",
          code: "NOT_PRESENT"
        });
      }

      // Rule 3: Single Attempt Rule Check (Server-Side)
      const existingAttempt = db.getAttemptByRollNumber(cleanRoll);
      if (existingAttempt) {
        if (
          existingAttempt.status === "SUBMITTED" ||
          existingAttempt.status === "TERMINATED" ||
          existingAttempt.status === "TIME_EXPIRED"
        ) {
          return sendJson(res, 403, {
            error: "ATTEMPT ALREADY USED",
            message: "You have already used your attempt for this assessment.",
            code: "ATTEMPT_COMPLETED",
            attempt: {
              status: existingAttempt.status,
              score: existingAttempt.score,
              maxScore: existingAttempt.maxScore,
              percentage: existingAttempt.percentage,
              submittedAt: existingAttempt.submittedAt,
              terminationReason: existingAttempt.terminationReason
            }
          });
        }

        // Active IN_PROGRESS attempt - resume directly!
        const now = Date.now();
        const deadlineMs = new Date(existingAttempt.deadline).getTime();
        const remainingSec = Math.max(0, Math.floor((deadlineMs - now) / 1000));

        if (remainingSec <= 0) {
          db.submitAssessment(existingAttempt.id);
          return sendJson(res, 403, {
            error: "ATTEMPT ALREADY USED",
            message: "Your assessment time has expired.",
            code: "ATTEMPT_COMPLETED"
          });
        }

        const safeQuestions = db.getQuestionsForStudentAttempt(existingAttempt);
        const existingAnswers = db.getAnswersForAttempt(existingAttempt.id);

        return sendJson(res, 200, {
          success: true,
          resumed: true,
          student: {
            rollNumber: cleanRoll,
            name: existingAttempt.studentName,
            officialName: attendance.record?.studentName || existingAttempt.studentName
          },
          attemptId: existingAttempt.id,
          remainingSeconds: remainingSec,
          selectedTopics: existingAttempt.selectedTopics || [],
          questions: safeQuestions,
          savedAnswers: existingAnswers.reduce((acc, a) => {
            acc[a.questionId] = a.studentAnswer;
            return acc;
          }, {})
        });
      }

      // Eligible student ready for Topic Selection
      return sendJson(res, 200, {
        success: true,
        resumed: false,
        student: {
          rollNumber: cleanRoll,
          name: name.trim(),
          officialName: attendance.record?.studentName || name.trim()
        }
      });
    }

    // 3. QUIZ START & UNIQUE QUESTION SET GENERATION FROM SELECTED TOPICS
    if (pathname === '/api/quiz/start' && req.method === 'POST') {
      const body = await parseBody(req);
      const { rollNumber, name, selectedTopicIds, sessionId } = body;

      if (!rollNumber || !name) {
        return sendJson(res, 400, { error: "Roll Number and Student Name required." });
      }

      const cleanRoll = rollNumber.trim().toUpperCase();

      // Validate Format & Attendance
      if (!db.validateRollNumberFormat(cleanRoll)) {
        return sendJson(res, 400, {
          error: "INVALID ROLL NUMBER",
          message: "Please enter your Roll Number in the format 25-CP-001."
        });
      }

      const attendance = db.checkStudentAttendance(cleanRoll);
      if (!attendance.found || !attendance.isPresent) {
        return sendJson(res, 403, {
          error: "QUIZ ACCESS DENIED",
          message: "Your Roll Number is not on today's attendance list."
        });
      }

      // Check if attempt already locked
      let attempt = db.getAttemptByRollNumber(cleanRoll);
      if (
        attempt &&
        (attempt.status === "SUBMITTED" || attempt.status === "TERMINATED" || attempt.status === "TIME_EXPIRED")
      ) {
        return sendJson(res, 403, {
          error: "ATTEMPT ALREADY USED",
          message: "You have already used your attempt for this assessment."
        });
      }

      // If new attempt, validate topic count requirement
      const settings = db.getSettings();
      const minTopics = settings.minTopics || 2;
      if (!attempt) {
        if (!selectedTopicIds || selectedTopicIds.length < minTopics) {
          return sendJson(res, 400, {
            error: "SELECT MORE TOPICS",
            message: `Please select at least ${minTopics} topics before continuing.`
          });
        }

        // Generate customized attempt with balanced questions from selected topics
        attempt = db.createAttemptWithTopics({
          rollNumber: cleanRoll,
          studentName: name,
          selectedTopicIds,
          sessionId
        });
      }

      const now = Date.now();
      const deadlineMs = new Date(attempt.deadline).getTime();
      const remainingSeconds = Math.max(0, Math.floor((deadlineMs - now) / 1000));

      const safeQuestions = db.getQuestionsForStudentAttempt(attempt);
      const existingAnswers = db.getAnswersForAttempt(attempt.id);

      return sendJson(res, 200, {
        success: true,
        attempt: {
          id: attempt.id,
          startedAt: attempt.startedAt,
          deadline: attempt.deadline,
          remainingSeconds,
          status: attempt.status,
          selectedTopics: attempt.selectedTopics,
          totalQuestions: safeQuestions.length
        },
        student: {
          rollNumber: cleanRoll,
          name: attempt.studentName,
          officialName: attendance.record?.studentName || attempt.studentName
        },
        questions: safeQuestions,
        savedAnswers: existingAnswers.reduce((acc, ans) => {
          acc[ans.questionId] = ans.studentAnswer;
          return acc;
        }, {}),
        settings: {
          durationMinutes: settings.durationMinutes,
          maxViolations: settings.maxViolations,
          fullscreenRequired: settings.fullscreenRequired,
          copyPasteDisabled: settings.copyPasteDisabled,
          rightClickDisabled: settings.rightClickDisabled
        }
      });
    }

    // 4. AUTOSAVE ANSWER
    if (pathname === '/api/quiz/autosave' && req.method === 'POST') {
      const body = await parseBody(req);
      const { attemptId, questionId, studentAnswer } = body;

      if (!attemptId || !questionId) {
        return sendJson(res, 400, { error: "Missing attemptId or questionId" });
      }

      try {
        const record = db.saveAnswer({ attemptId, questionId, studentAnswer });
        return sendJson(res, 200, { success: true, savedAt: record.savedAt });
      } catch (err) {
        return sendJson(res, 400, { error: err.message });
      }
    }

    // 5. SECURITY EVENT / VIOLATION
    if (pathname === '/api/quiz/security-event' && req.method === 'POST') {
      const body = await parseBody(req);
      const { attemptId, rollNumber, studentName, eventType, details, severity } = body;

      const result = db.logSecurityEvent({
        attemptId,
        rollNumber,
        studentName,
        eventType,
        details,
        severity: severity || 'DETECTED'
      });

      const isTerminated = result.attempt && result.attempt.status === "TERMINATED";

      return sendJson(res, 200, {
        success: true,
        violationCount: result.attempt ? result.attempt.violationCount : 1,
        securityStatus: result.attempt ? result.attempt.securityStatus : "WARNING",
        terminated: isTerminated,
        terminationReason: isTerminated ? result.attempt.terminationReason : null
      });
    }

    // 6. FINAL SUBMIT ASSESSMENT (Validates all questions answered)
    if (pathname === '/api/quiz/submit' && req.method === 'POST') {
      const body = await parseBody(req);
      const { attemptId } = body;

      if (!attemptId) {
        return sendJson(res, 400, { error: "Attempt ID required" });
      }

      try {
        const { attempt } = db.submitAssessment(attemptId);
        const settings = db.getSettings();

        const start = new Date(attempt.startedAt).getTime();
        const end = new Date(attempt.submittedAt).getTime();
        const totalSec = Math.max(0, Math.floor((end - start) / 1000));
        const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
        const ss = String(totalSec % 60).padStart(2, '0');

        return sendJson(res, 200, {
          success: true,
          attempt: {
            id: attempt.id,
            rollNumber: attempt.rollNumber,
            studentName: attempt.studentName,
            status: attempt.status,
            score: settings.showResultImmediately ? attempt.score : null,
            maxScore: settings.showResultImmediately ? attempt.maxScore : null,
            percentage: settings.showResultImmediately ? attempt.percentage : null,
            submittedAt: attempt.submittedAt,
            timeUsed: `${mm}:${ss}`,
            selectedTopics: attempt.selectedTopics,
            securityStatus: attempt.securityStatus,
            terminationReason: attempt.terminationReason
          }
        });
      } catch (err) {
        return sendJson(res, 400, { error: err.message });
      }
    }

    // 7. SESSION SYNC
    if (pathname === '/api/quiz/session-status' && req.method === 'GET') {
      const attemptId = query.attemptId;
      if (!attemptId) {
        return sendJson(res, 400, { error: "attemptId required" });
      }

      const attempt = db.getAttemptById(attemptId);
      if (!attempt) {
        return sendJson(res, 404, { error: "Attempt not found" });
      }

      const now = Date.now();
      const deadlineMs = new Date(attempt.deadline).getTime();
      const remainingSec = Math.max(0, Math.floor((deadlineMs - now) / 1000));

      if (remainingSec <= 0 && attempt.status === "IN_PROGRESS") {
        try {
          db.submitAssessment(attempt.id);
        } catch (e) {
          attempt.status = "TIME_EXPIRED";
        }
      }

      return sendJson(res, 200, {
        attemptId: attempt.id,
        status: attempt.status,
        remainingSeconds: remainingSec,
        serverTime: new Date().toISOString(),
        violationCount: attempt.violationCount || 0,
        terminationReason: attempt.terminationReason
      });
    }

    // 8. FACULTY PUBLIC INFO (Domain & Registered Examiners)
    if (pathname === '/api/admin/faculty-info' && req.method === 'GET') {
      return sendJson(res, 200, {
        domain: db.getUniversityDomain(),
        authorizedInstructors: db.getAuthorizedInstructors()
      });
    }

    // 9. STEP 1: REQUEST TEMPORARY PASSWORD
    if (pathname === '/api/admin/request-password' && req.method === 'POST') {
      const body = await parseBody(req);
      const { name, email } = body;
      const clientIp = req.socket?.remoteAddress || '127.0.0.1';

      try {
        const result = db.createTemporaryPassword(name, email, clientIp);
        return sendJson(res, 200, result);
      } catch (err) {
        return sendJson(res, 400, {
          error: "REQUEST_FAILED",
          message: err.message
        });
      }
    }

    // 10. STEP 2: VERIFY TEMPORARY PASSWORD & INSTRUCTOR LOGIN
    if (pathname === '/api/admin/login' && req.method === 'POST') {
      const body = await parseBody(req);
      const { email, temporaryPassword, password } = body;
      const pass = temporaryPassword || password;
      const clientIp = req.socket?.remoteAddress || '127.0.0.1';

      try {
        const result = db.verifyTemporaryPassword(email, pass, clientIp);
        return sendJson(res, 200, result, {
          'Set-Cookie': `instructor_session=${result.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800`
        });
      } catch (err) {
        const isLockout = err.message.includes('ACCOUNT LOCKED') || err.message.includes('LOCKED');
        const status = isLockout ? 429 : 401;
        return sendJson(res, status, {
          error: isLockout ? "ACCOUNT_LOCKED" : "AUTHENTICATION_FAILED",
          message: err.message
        });
      }
    }

    // 11. INSTRUCTOR SESSION VERIFICATION
    if (pathname === '/api/admin/verify-session' && req.method === 'GET') {
      const session = requireInstructorAuth(req, res);
      if (!session) return;

      return sendJson(res, 200, {
        success: true,
        sessionValid: true,
        instructor: {
          id: session.instructorId,
          name: session.name,
          email: session.email,
          role: session.role,
          department: session.department
        }
      });
    }

    // 12. INSTRUCTOR LOGOUT
    if (pathname === '/api/admin/logout' && req.method === 'POST') {
      const token = getInstructorToken(req);
      if (token) {
        db.invalidateSession(token);
      }
      return sendJson(res, 200, {
        success: true,
        message: "Instructor session terminated successfully."
      }, {
        'Set-Cookie': 'instructor_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
      });
    }

    // 13. INSTRUCTOR SCOREBOARD & ATTENDANCE DASHBOARD (PROTECTED)
    if (pathname === '/api/admin/scoreboard' && req.method === 'GET') {
      if (!requireInstructorAuth(req, res)) return;
      const scoreboardData = db.getAdminScoreboard();
      return sendJson(res, 200, scoreboardData);
    }

    // 14. INSTRUCTOR STUDENT DETAIL (PROTECTED)
    if (pathname === '/api/admin/student-detail' && req.method === 'GET') {
      if (!requireInstructorAuth(req, res)) return;
      const rollNumber = query.rollNumber || query.studentId;
      if (!rollNumber) {
        return sendJson(res, 400, { error: "rollNumber required" });
      }

      const detail = db.getStudentDetail(rollNumber);
      if (!detail) {
        return sendJson(res, 404, { error: "Student audit record not found." });
      }

      return sendJson(res, 200, detail);
    }

    // 15. ATTENDANCE MANAGEMENT (PROTECTED)
    if (pathname === '/api/admin/attendance') {
      if (!requireInstructorAuth(req, res)) return;

      if (req.method === 'GET') {
        return sendJson(res, 200, { attendance: db.getAttendanceRoster() });
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const { pasteText, rollNumber, studentName, isPresent } = body;

        if (pasteText) {
          const count = db.parseAndSaveAttendancePaste(pasteText);
          return sendJson(res, 200, { success: true, count, message: `${count} attendance records processed.` });
        }

        if (rollNumber) {
          db.setAttendanceRecord(rollNumber, studentName, isPresent ?? true);
          return sendJson(res, 200, { success: true });
        }

        return sendJson(res, 400, { error: "Invalid attendance payload" });
      }
      if (req.method === 'PUT') {
        const body = await parseBody(req);
        const { rollNumber } = body;
        const updated = db.toggleAttendance(rollNumber);
        return sendJson(res, 200, { success: true, updated });
      }
    }

    // 16. RESET ATTEMPT (PROTECTED)
    if (pathname === '/api/admin/reset-attempt' && req.method === 'POST') {
      if (!requireInstructorAuth(req, res)) return;
      const body = await parseBody(req);
      const { rollNumber, studentId } = body;
      const target = rollNumber || studentId;
      if (!target) {
        return sendJson(res, 400, { error: "Roll number required" });
      }

      const success = db.resetStudentAttempt(target);
      return sendJson(res, 200, { success, message: "Attempt cleared successfully." });
    }

    // 17. SETTINGS (PROTECTED)
    if (pathname === '/api/admin/settings') {
      if (!requireInstructorAuth(req, res)) return;

      if (req.method === 'GET') {
        return sendJson(res, 200, db.getSettings());
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const updated = db.updateSettings(body);
        return sendJson(res, 200, { success: true, settings: updated });
      }
    }

    // 18. CSV EXPORT (PROTECTED)
    if (pathname === '/api/admin/export' && req.method === 'GET') {
      if (!requireInstructorAuth(req, res)) return;

      const scoreboardData = db.getAdminScoreboard();
      const rows = scoreboardData.scoreboard;

      let csv = 'Rank,Roll Number,Student Name,Attendance,Topics Selected,Score,Max Score,Percentage,Time Used,Status,Security Status,Violations\n';
      for (const r of rows) {
        csv += `"${r.rank}","${r.rollNumber}","${r.name}","${r.isPresent ? 'PRESENT' : 'ABSENT'}",${r.topicsCount},${r.score},${r.maxScore},"${r.percentage}%","${r.duration}","${r.status}","${r.securityStatus}",${r.violationCount}\n`;
      }

      res.writeHead(200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="java_oop_quiz_attendance_results.csv"',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(csv);
      return;
    }

    return sendJson(res, 404, { error: "API route not found" });
  } catch (err) {
    console.error("API error:", err);
    return sendJson(res, 500, { error: "Internal server error", details: err.message });
  }
}

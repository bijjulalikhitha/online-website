import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  onValue,
  push,
  ref,
  remove,
  set,
  update,
} from "firebase/database";
import { auth, database, isFirebaseConfigured } from "./firebase.js";

const courses = [
  {
    id: "html",
    title: "HTML & CSS: Build your first website",
    category: "Web",
    level: "Beginner",
    lessons: 18,
    progress: 68,
    icon: "</>",
    cover: "html",
    tutor: "Alex Morgan",
    initials: "AM",
    duration: "4.5 hrs",
    videoId: "UB1O30fR-EE",
    lesson: "HTML & CSS Full Course for Beginners",
    notes: "https://developer.mozilla.org/en-US/docs/Learn/Forms",
    practice: "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
  },
  {
    id: "javascript",
    title: "JavaScript fundamentals",
    category: "Programming",
    level: "Beginner",
    lessons: 24,
    progress: 35,
    icon: "JS",
    cover: "js",
    tutor: "Jamie Lee",
    initials: "JL",
    duration: "6 hrs",
    videoId: "W6NZfCO5SIk",
    lesson: "JavaScript Tutorial for Beginners",
    notes: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
    practice: "https://javascript.info/first-steps",
  },
  {
    id: "python",
    title: "Python for curious beginners",
    category: "Programming",
    level: "Beginner",
    lessons: 20,
    progress: 12,
    icon: "Py",
    cover: "python",
    tutor: "Sam Rivera",
    initials: "SR",
    duration: "5 hrs",
    videoId: "kqtD5dpn9C8",
    lesson: "Python for Beginners",
    notes: "https://docs.python.org/3/tutorial/",
    practice: "https://www.learnpython.org/",
  },
  {
    id: "react",
    title: "React: interactive web apps",
    category: "Web",
    level: "Intermediate",
    lessons: 22,
    progress: 0,
    icon: "⚛",
    cover: "react",
    tutor: "Taylor Kim",
    initials: "TK",
    duration: "5.5 hrs",
    videoId: "w7ejDZ8SWv8",
    lesson: "React Crash Course for Beginners",
    notes: "https://react.dev/learn",
    practice: "https://react.dev/learn",
  },
  {
    id: "data",
    title: "Data science with Python",
    category: "Programming",
    level: "Intermediate",
    lessons: 16,
    progress: 0,
    icon: "▥",
    cover: "data",
    tutor: "Jordan Park",
    initials: "JP",
    duration: "4 hrs",
    videoId: "r-uOLxNrNk8",
    lesson: "Python Data Analysis for Beginners",
    notes: "https://pandas.pydata.org/docs/getting_started/",
    practice: "https://www.kaggle.com/learn",
  },
  {
    id: "git",
    title: "Git & GitHub essentials",
    category: "Web",
    level: "Beginner",
    lessons: 12,
    progress: 0,
    icon: "⑂",
    cover: "git",
    tutor: "Casey Chen",
    initials: "CC",
    duration: "3 hrs",
    videoId: "RGOj5yH7evk",
    lesson: "Git and GitHub for Beginners",
    notes: "https://git-scm.com/book/en/v2",
    practice: "https://skills.github.com/",
  },
];

const quizzes = [
  {
    question: "What does HTML help you create?",
    answers: [
      "The structure and content of a web page",
      "A computer's operating system",
      "A database server",
      "An image editing program",
    ],
    correct: 0,
  },
  {
    question: "Which HTML tag creates a link to another page?",
    answers: ["<link>", "<a>", "<href>", "<url>"],
    correct: 1,
  },
  {
    question: "What is a variable used for in programming?",
    answers: [
      "To store and reuse a value",
      "To style a heading",
      "To connect to Wi-Fi",
      "To delete a file",
    ],
    correct: 0,
  },
  {
    question: "Which one is a JavaScript data type?",
    answers: ["<section>", "stylesheet", "Boolean", "Browser tab"],
    correct: 2,
  },
  {
    question: "What does CSS primarily control on a web page?",
    answers: [
      "The page's visual style and layout",
      "The computer's memory",
      "The website's domain name",
      "How fast the internet is",
    ],
    correct: 0,
  },
];

const navigation = [
  { id: "home", icon: "⌂", label: "Overview" },
  { id: "courses", icon: "▤", label: "Explore courses" },
  { id: "lessons", icon: "▷", label: "Video lessons" },
  { id: "notes", icon: "▧", label: "My notes" },
  { id: "quiz", icon: "✎", label: "Quick quiz" },
];

const filters = ["All", "Beginner", "Intermediate", "Web", "Programming"];
const viewTitles = Object.fromEntries(navigation.map(({ id, label }) => [id, label]));

function getAuthErrorMessage(error) {
  const messages = {
    "auth/user-disabled": "This account has been disabled. Contact your instructor for help.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/operation-not-allowed": "Google sign-in is disabled. Enable it in Firebase Authentication settings.",
    "auth/unauthorized-domain": "This website domain isn't authorized for Google sign-in. Add it under Firebase Authentication settings.",
    "auth/popup-blocked": "Your browser blocked the Google sign-in window. Allow pop-ups and try again.",
    "auth/popup-closed-by-user": "The Google sign-in window was closed before login finished.",
    "auth/account-exists-with-different-credential": "An account already uses this email with a different login method. Log in with that method first.",
    "auth/network-request-failed": "Couldn't connect to Firebase. Check your internet connection and try again.",
  };
  return messages[error?.code] || error?.message || "Something went wrong. Please try again.";
}

function AuthPage({ configured, authError }) {
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");

  const continueWithGoogle = async () => {
    setError("");
    if (!configured || !auth) {
      setError("The learning app is not connected to Firebase yet.");
      return;
    }

    setGoogleBusy(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (authError) {
      if (authError.code !== "auth/popup-closed-by-user") {
        console.error("Google sign-in failed", authError);
      }
      setError(getAuthErrorMessage(authError));
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand"><span className="brand-mark">✦</span> brightpath</div>
        <div className="auth-art" aria-hidden="true">
          <span>✦</span>
          <strong>Big ideas<br />start here.</strong>
          <i>Learn a little. Grow a lot.</i>
        </div>
        <div className="auth-form-wrap">
          <p className="auth-eyebrow">YOUR CLASSROOM IS READY</p>
          <h1>Welcome to Brightpath</h1>
          <p className="auth-subtitle">Log in or create a free student account with Google to take quizzes and save your learning progress.</p>
          {!configured && (
            <div className="auth-message auth-error" role="alert">
              Firebase is not configured. Add your project settings to .env.local and restart the app.
            </div>
          )}
          {(error || authError) && <div className="auth-message auth-error" role="alert">{error || authError}</div>}
          <button className="google-button" type="button" onClick={continueWithGoogle} disabled={googleBusy || !configured}>
            <svg className="google-icon" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.89 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" transform="translate(0 5)" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94a11.05 11.05 0 0 1-4.8 7.24l7.73 5.99c4.51-4.16 7.11-10.29 7.11-17.7z" transform="translate(0 -5)" />
              <path fill="#FBBC05" d="M10.53 28.41A14.4 14.4 0 0 1 9.75 24c0-1.53.27-3.01.75-4.41l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.84.92 7.47 2.52 10.61l8.01-6.2z" transform="translate(0 5)" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-5.99c-2.14 1.43-4.89 2.29-8.17 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.2C6.51 42.62 14.62 48 24 48z" transform="translate(0 -5)" />
            </svg>
            {googleBusy ? "Connecting to Google…" : "Continue with Google"}
          </button>
          <div className="auth-benefits"><span>✓ Save exam results</span><span>✓ Pick up where you left off</span></div>
        </div>
      </section>
    </main>
  );
}

function CourseCard({ course, progress, onOpen }) {
  return (
    <article className="course-card">
      <div className={`course-cover cover-${course.cover}`}>
        <span className="cover-symbol">{course.icon}</span>
        <span className="course-level">{course.level}</span>
      </div>
      <div className="course-body">
        <div className="course-meta">
          <span>{course.category === "Web" ? "WEB DEVELOPMENT" : "PROGRAMMING"}</span>
          <span>★ 4.9</span>
        </div>
        <h3>{course.title}</h3>
        <div className="progress-row">
          <div
            className="progress-track"
            role="progressbar"
            aria-label={`${course.title} progress`}
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-text">{progress}%</span>
        </div>
        <div className="course-footer">
          <div className="instructor">
            <span className="instructor-avatar">{course.initials}</span>
            <span>{course.tutor}</span>
          </div>
          <button className="continue-btn" onClick={() => onOpen(course.id)}>
            {progress ? "Continue" : "Start course"} →
          </button>
        </div>
      </div>
    </article>
  );
}

function App() {
  const [view, setView] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeCourseId, setActiveCourseId] = useState("html");
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [authStateError, setAuthStateError] = useState("");
  const [connection, setConnection] = useState(
    isFirebaseConfigured ? "connecting" : "unconfigured",
  );
  const [syncError, setSyncError] = useState("");
  const [toast, setToast] = useState("");
  const [progress, setProgress] = useState({});
  const [notes, setNotes] = useState([]);
  const [quickNote, setQuickNote] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [quizResults, setQuizResults] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizSelection, setQuizSelection] = useState(null);
  const [quizLocked, setQuizLocked] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const toastTimer = useRef(null);

  const notify = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2600);
  }, []);

  const showError = useCallback((action, error) => {
    console.error(`Firebase ${action} failed`, error);
    setSyncError(
      `${action} failed: ${error?.message || "Check your Firebase connection and database rules."}`,
    );
    notify(`Couldn't ${action.toLowerCase()}. Check your Firebase connection.`);
  }, [notify]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setConnection("unconfigured");
      setAuthLoading(false);
      return undefined;
    }

    let active = true;
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (!active) return;
        if (user?.isAnonymous) {
          signOut(auth).catch((error) => {
            if (!active) return;
            setAuthLoading(false);
            setAuthStateError(getAuthErrorMessage(error));
          });
          return;
        }
        if (user) {
          setUserId(user.uid);
          setUserEmail(user.email || "");
          setAuthStateError("");
          setConnection("connecting");
          setAuthLoading(false);
          return;
        }
        setUserId(null);
        setUserEmail("");
        setConnection("signed-out");
        setAuthLoading(false);
      },
      (error) => {
        if (!active) return;
        setAuthLoading(false);
        setConnection("error");
        setAuthStateError(getAuthErrorMessage(error));
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [showError]);

  useEffect(() => {
    if (!userId || !database) return undefined;

    let loaded = 0;
    const markLoaded = () => {
      loaded += 1;
      if (loaded === 4) {
        setConnection("connected");
        setSyncError("");
      }
    };
    const watch = (path, onChange) =>
      onValue(
        ref(database, `users/${userId}/${path}`),
        (snapshot) => {
          onChange(snapshot.val());
          markLoaded();
        },
        (error) => {
          setConnection("error");
          showError(`read ${path}`, error);
        },
      );

    const unsubscribe = [
      watch("progress", (value) => setProgress(value || {})),
      watch("notes", (value) =>
        setNotes(
          value
            ? Object.entries(value)
                .map(([id, note]) => ({ ...note, id }))
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            : [],
        ),
      ),
      watch("quickNote", (value) => setQuickNote(value || "")),
      watch("quizResults", (value) =>
        setQuizResults(
          value
            ? Object.entries(value)
                .map(([id, result]) => ({ ...result, id }))
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            : [],
        ),
      ),
    ];

    return () => unsubscribe.forEach((stop) => stop());
  }, [showError, userId]);

  const requireDatabase = useCallback(() => {
    if (!isFirebaseConfigured) {
      throw new Error("Add your Firebase settings to .env.local, then restart Vite.");
    }
    if (!userId || !database) {
      throw new Error("Waiting for your secure Firebase sign-in. Please try again.");
    }
  }, [userId]);

  const courseProgress = (course) => progress[course.id] ?? course.progress;
  const activeCourses = courses.filter((course) => courseProgress(course) > 0);
  const overallProgress = Math.round(
    courses.reduce((total, course) => total + courseProgress(course), 0) /
      courses.length,
  );
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = `${course.title} ${course.category} ${course.level}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesFilter =
      activeFilter === "All" ||
      course.level === activeFilter ||
      course.category === activeFilter;
    return matchesSearch && matchesFilter;
  });
  const selectedCourse =
    courses.find((course) => course.id === activeCourseId) || courses[0];

  const changeView = (nextView) => {
    setView(nextView);
    setMenuOpen(false);
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      setProgress({});
      setNotes([]);
      setQuizResults([]);
      setQuickNote("");
      setSyncError("");
      notify("You have been logged out.");
    } catch (error) {
      showError("log out", error);
    }
  };

  const openCourse = (id) => {
    setActiveCourseId(id);
    changeView("lessons");
  };

  const saveQuickNote = async () => {
    try {
      requireDatabase();
      const noteRef = ref(database, `users/${userId}/quickNote`);
      if (quickNote.trim()) await set(noteRef, quickNote);
      else await remove(noteRef);
      setSyncError("");
      notify("Quick note saved to your account.");
    } catch (error) {
      showError("save quick note", error);
    }
  };

  const saveNote = async (event) => {
    event.preventDefault();
    const title = noteTitle.trim();
    const content = noteContent.trim();
    if (!title || !content) {
      notify("Add a title and some note content first.");
      return;
    }
    try {
      requireDatabase();
      await push(ref(database, `users/${userId}/notes`), {
        title,
        content,
        createdAt: Date.now(),
      });
      setNoteTitle("");
      setNoteContent("");
      setSyncError("");
      notify("Your note is saved.");
    } catch (error) {
      showError("save note", error);
    }
  };

  const deleteNote = async (id) => {
    try {
      requireDatabase();
      await remove(ref(database, `users/${userId}/notes/${id}`));
      setSyncError("");
      notify("Note deleted.");
    } catch (error) {
      showError("delete note", error);
    }
  };

  const completeLesson = async () => {
    try {
      requireDatabase();
      const nextProgress = Math.min(100, courseProgress(selectedCourse) + 5);
      await update(ref(database, `users/${userId}/progress`), {
        [selectedCourse.id]: nextProgress,
      });
      setSyncError("");
      notify("Nice work! Your course progress is saved.");
    } catch (error) {
      showError("save course progress", error);
    }
  };

  const advanceQuiz = () => {
    if (quizSelection === null) return;
    if (!quizLocked) {
      const isCorrect = quizSelection === quizzes[quizIndex].correct;
      if (isCorrect) setQuizScore((score) => score + 1);
      setQuizLocked(true);
      return;
    }
    if (quizIndex === quizzes.length - 1) {
      void finishQuizWithScore(quizScore);
      return;
    }
    setQuizIndex((index) => index + 1);
    setQuizSelection(null);
    setQuizLocked(false);
  };

  const finishQuizWithScore = async (score) => {
    setQuizComplete(true);
    setSavingQuiz(true);
    try {
      requireDatabase();
      await push(ref(database, `users/${userId}/quizResults`), {
        score,
        total: quizzes.length,
        createdAt: Date.now(),
      });
      setSyncError("");
      notify("Quiz result saved to your account.");
    } catch (error) {
      showError("save quiz result", error);
    } finally {
      setSavingQuiz(false);
    }
  };

  const restartQuiz = () => {
    setQuizIndex(0);
    setQuizScore(0);
    setQuizSelection(null);
    setQuizLocked(false);
    setQuizComplete(false);
  };

  const shareProgress = async () => {
    const text = `I'm learning to code with Brightpath! I've completed ${overallProgress}% of my learning goals.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My Brightpath progress", text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        notify("Progress copied to clipboard!");
      } else {
        notify(text);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        showError("share progress", error);
      }
    }
  };

  const renderQuiz = () => {
    if (quizComplete) {
      const percent = Math.round((quizScore / quizzes.length) * 100);
      return (
        <div className="quiz-card result">
          <div className="result-emoji">{percent >= 60 ? "🎉" : "🌱"}</div>
          <h2>{percent >= 60 ? "Great work!" : "Keep growing!"}</h2>
          <p>
            You got <strong>{quizScore} out of {quizzes.length}</strong>{" "}
            questions right ({percent}%). Every question is a chance to learn
            something new.
          </p>
          {savingQuiz && <p>Saving your result…</p>}
          <button className="primary-button" onClick={restartQuiz}>
            Try again
          </button>
        </div>
      );
    }

    const question = quizzes[quizIndex];
    return (
      <div className="quiz-card">
        <div className="quiz-top">
          <span>PROGRAMMING BASICS</span>
          <strong>Question {quizIndex + 1} of {quizzes.length}</strong>
        </div>
        <div className="quiz-progress">
          <div style={{ width: `${(quizIndex / quizzes.length) * 100}%` }} />
        </div>
        <h2>{question.question}</h2>
        <div className="answers">
          {question.answers.map((answer, index) => {
            const stateClass = quizLocked
              ? index === question.correct
                ? "correct"
                : index === quizSelection
                  ? "incorrect"
                  : ""
              : quizSelection === index
                ? "selected"
                : "";
            return (
              <button
                className={`answer ${stateClass}`}
                disabled={quizLocked}
                key={answer}
                onClick={() => setQuizSelection(index)}
              >
                {answer}
              </button>
            );
          })}
        </div>
        <div className="quiz-actions">
          <span className="quiz-feedback">
            {!quizLocked
              ? "Choose the best answer to continue."
              : quizSelection === question.correct
                ? "That's right—nice work!"
                : "Not quite. The highlighted answer is correct."}
          </span>
          <button
            className="primary-button"
            disabled={quizSelection === null}
            onClick={advanceQuiz}
          >
            {quizLocked
              ? quizIndex === quizzes.length - 1
                ? "See results"
                : "Next question →"
              : "Check answer"}
          </button>
        </div>
      </div>
    );
  };

  if (authLoading) {
    return (
      <main className="auth-page">
        <div className="auth-loading"><span className="brand-mark">✦</span><strong>Opening your learning space…</strong></div>
      </main>
    );
  }

  if (!userId) {
    return <AuthPage configured={isFirebaseConfigured} authError={authStateError} />;
  }

  return (
    <div className="app">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`} id="sidebar">
        <div className="brand"><span className="brand-mark">✦</span> brightpath</div>
        <div className="nav-label">Learning space</div>
        <nav className="nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              className={view === item.id ? "active" : ""}
              key={item.id}
              onClick={() => changeView(item.id)}
            >
              <span className="nav-icon">{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-card">
          <strong>Learning is better together</strong>
          <p>Share your progress and keep your study streak going.</p>
          <button onClick={shareProgress}>Share progress ↗</button>
        </div>
        <div className="user-row">
          <div className="avatar">S</div>
          <div className="user-info">
            <strong>Student</strong>
            <span title={userEmail}>{userEmail}</span>
          </div>
          <button className="signout-button" onClick={logOut}>Log out</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumbs">
            <strong>Learning space</strong> &nbsp;›&nbsp;
            <span>{viewTitles[view]}</span>
          </div>
          <div className="mobile-brand">
            <button
              className="menu-toggle"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              ☰
            </button>
            <span className="brand-mark">✦</span> brightpath
          </div>
          <div className="top-actions">
            <label className="search">
              <span>⌕</span>
              <input
                type="search"
                placeholder="Search courses..."
                aria-label="Search courses"
                value={search}
                onFocus={() => setView("courses")}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <button className="icon-button" aria-label="Notifications">♧<i className="dot" /></button>
          </div>
        </header>

        {connection === "unconfigured" && (
          <div className="firebase-banner" role="status">
            <strong>Connect Firebase to save your learning data.</strong>
            <span>Copy .env.example to .env.local, add your Firebase web app settings, enable email/password sign-in, and restart the app.</span>
          </div>
        )}
        {connection === "connecting" && (
          <div className="firebase-banner" role="status">
            Connecting to your secure learning space…
          </div>
        )}
        {syncError && (
          <div className="firebase-banner firebase-error" role="alert">
            {syncError}
          </div>
        )}

        {view === "home" && (
          <section className="view active">
            <div className="greeting">
              <h1>Good morning, Student <span aria-hidden="true">☀️</span></h1>
              <p>A little progress each day adds up to big results. Ready to learn?</p>
            </div>
            <div className="dashboard-grid">
              <section className="hero">
                <div className="hero-copy">
                  <span className="eyebrow">✦ &nbsp; YOUR NEXT BIG THING</span>
                  <h2>Make something amazing with code.</h2>
                  <p>Build real skills, one friendly lesson at a time. Your next chapter is waiting.</p>
                  <div className="hero-bottom">
                    <button className="primary-light" onClick={() => openCourse("html")}>Continue learning &nbsp;→</button>
                    <span className="hero-meta">⌚ &nbsp;12 min left in lesson</span>
                  </div>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <span className="art-spark spark-one">✦</span>
                  <span className="art-spark spark-two">✧</span>
                  <div className="art-book" />
                </div>
              </section>
              <section className="stats-card">
                <div className="card-heading"><h3>Your learning progress</h3><small>This week</small></div>
                <div className="stats-content">
                  <div className="ring" style={{ "--progress": `${overallProgress}%` }}>
                    <div className="ring-value"><span>{overallProgress}%</span><span>overall</span></div>
                  </div>
                  <div className="stat-lines">
                    <div className="stat-line"><span>Lessons completed</span><strong>{12 + Object.values(progress).filter((value) => value > 0).length}</strong></div>
                    <div className="stat-line"><span>Courses in progress</span><strong>{activeCourses.length}</strong></div>
                    <div className="stat-line"><span>Study time</span><strong>4.5 hrs</strong></div>
                  </div>
                </div>
                <div className="streak"><span>🔥 &nbsp;Your learning streak</span><strong>4 days</strong></div>
              </section>
            </div>

            <section className="content-section">
              <div className="section-heading">
                <h2>Pick up where you left off</h2>
                <button onClick={() => changeView("courses")}>Explore all courses &nbsp;→</button>
              </div>
              <div className="courses">
                {activeCourses.slice(0, 3).map((course) => (
                  <CourseCard key={course.id} course={course} progress={courseProgress(course)} onOpen={openCourse} />
                ))}
              </div>
            </section>

            <div className="bottom-grid">
              <section className="panel">
                <div className="card-heading"><h3>Up next for you</h3><button onClick={() => changeView("lessons")}>See all</button></div>
                <div className="lesson-list">
                  {courses.slice(0, 3).map((course, index) => (
                    <button className="lesson lesson-button" key={course.id} onClick={() => openCourse(course.id)}>
                      <span className="lesson-play">▷</span>
                      <span className="lesson-info"><strong>{index === 0 ? "HTML forms made simple" : index === 1 ? "JavaScript: your first functions" : "Python lists & loops"}</strong><span>{course.category === "Web" ? "Web development" : "Programming"} · Lesson {index + 4}</span></span>
                      <span className="lesson-time">{[12, 18, 15][index]} min</span>
                    </button>
                  ))}
                </div>
              </section>
              <section className="panel">
                <div className="card-heading"><h3>Quick notes</h3><small>Saved to Firebase</small></div>
                <textarea
                  className="quick-note"
                  placeholder="Jot down an idea, a question, or something you learned..."
                  value={quickNote}
                  onChange={(event) => setQuickNote(event.target.value)}
                  onBlur={saveQuickNote}
                />
                <div className="note-foot"><span>Save to your account when you leave this field</span><button onClick={() => changeView("notes")}>Open notes</button></div>
              </section>
            </div>
          </section>
        )}

        {view === "courses" && (
          <section className="view active">
            <div className="page-intro"><h1>Explore courses</h1><p>Curious minds welcome. Find a new skill to make your own.</p></div>
            <div className="filter-row">
              {filters.map((filter) => (
                <button className={`filter-chip ${activeFilter === filter ? "active" : ""}`} key={filter} onClick={() => setActiveFilter(filter)}>
                  {filter === "All" ? "All courses" : filter === "Web" ? "Web development" : filter === "Programming" ? "Programming" : filter}
                </button>
              ))}
            </div>
            <div className="courses">
              {filteredCourses.length ? filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} progress={courseProgress(course)} onOpen={openCourse} />
              )) : <div className="empty-state">No courses match that search. Try another keyword.</div>}
            </div>
          </section>
        )}

        {view === "lessons" && (
          <section className="view active">
            <div className="page-intro"><h1>Video lessons</h1><p>Watch, practice, and replay whenever you need a refresher.</p></div>
            <div className="page-panel">
              <div className="card-heading"><h3>Your next lesson: {selectedCourse.lesson}</h3><small>{selectedCourse.duration} · {selectedCourse.category === "Web" ? "Web development" : "Programming"}</small></div>
              <div style={{ marginTop: 16 }}>
                <iframe className="video-frame" src={`https://www.youtube-nocookie.com/embed/${selectedCourse.videoId}?rel=0`} title={selectedCourse.lesson} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
              </div>
              <div className="lesson-links">
                <a href={selectedCourse.notes} target="_blank" rel="noreferrer">Read the lesson notes ↗</a>
                <a href={selectedCourse.practice} target="_blank" rel="noreferrer">Practice this skill ↗</a>
              </div>
              <div className="lesson-complete">
                <div><strong>Ready for the next one?</strong><div>Complete a lesson to keep your progress moving.</div></div>
                <button className="primary-button" onClick={completeLesson}>Mark lesson complete ✓</button>
              </div>
            </div>
            <section className="panel playlist-panel">
              <div className="card-heading"><h3>Choose another video lesson</h3><small>Learn at your own pace</small></div>
              <div className="lesson-list">
                {courses.map((course) => (
                  <button className="lesson lesson-button" key={course.id} onClick={() => openCourse(course.id)}>
                    <span className="lesson-play">▷</span>
                    <span className="lesson-info"><strong>{course.lesson}</strong><span>{course.category === "Web" ? "Web development" : "Programming"} · {course.level}</span></span>
                    <span className="lesson-time">{course.duration}</span>
                  </button>
                ))}
              </div>
            </section>
            <div className="bottom-grid">
              <section className="panel">
                <div className="card-heading"><h3>Helpful learning links</h3></div>
                <div className="lesson-list">
                  <div className="lesson"><div className="lesson-play">↗</div><div className="lesson-info"><strong>MDN Web Docs</strong><span>Trusted references for web developers</span></div></div>
                  <div className="lesson"><div className="lesson-play">↗</div><div className="lesson-info"><strong>freeCodeCamp</strong><span>Free interactive coding practice</span></div></div>
                  <div className="lesson"><div className="lesson-play">↗</div><div className="lesson-info"><strong>Python for Everybody</strong><span>Free beginner-friendly Python course</span></div></div>
                </div>
              </section>
              <section className="panel">
                <div className="card-heading"><h3>Learn at your own pace</h3></div>
                <p className="learning-tip">Pause and replay a lesson whenever you like. Try the examples yourself, write down questions in your notes, and use the quick quiz to check what you remember.</p>
              </section>
            </div>
          </section>
        )}

        {view === "notes" && (
          <section className="view active">
            <div className="page-intro"><h1>My notes</h1><p>Your ideas, questions, and useful snippets—all in one place.</p></div>
            <form className="page-panel" onSubmit={saveNote}>
              <h3 className="form-heading">Create a note</h3>
              <input className="note-title" placeholder="Give your note a title" value={noteTitle} onChange={(event) => setNoteTitle(event.target.value)} />
              <textarea className="notes-area" placeholder="Write something you want to remember..." value={noteContent} onChange={(event) => setNoteContent(event.target.value)} />
              <div className="form-actions"><button className="primary-button" type="submit">Save note</button></div>
            </form>
            <div className="note-list">
              {notes.length ? notes.map((note) => (
                <article className="saved-note" key={note.id}>
                  <div><strong>{note.title}</strong><p>{note.content.length > 115 ? `${note.content.slice(0, 115)}…` : note.content}</p></div>
                  <button onClick={() => deleteNote(note.id)}>Delete</button>
                </article>
              )) : <div className="empty-state">{connection === "connected" ? "No saved notes yet. Add your first learning note above." : "Connect to Firebase to sync your notes."}</div>}
            </div>
          </section>
        )}

        {view === "quiz" && (
          <section className="view active">
            <div className="page-intro"><h1>Quick quiz</h1><p>A quick confidence boost: five friendly questions about programming basics.</p></div>
            {renderQuiz()}
            <section className="panel quiz-history">
              <div className="card-heading"><h3>Recent quiz results</h3><small>Synced with Firebase</small></div>
              {quizResults.length ? (
                <div className="lesson-list">
                  {quizResults.slice(0, 5).map((result) => (
                    <div className="lesson" key={result.id}>
                      <span className="lesson-play">✓</span>
                      <span className="lesson-info"><strong>{result.score} out of {result.total} correct</strong><span>{new Date(result.createdAt).toLocaleString()}</span></span>
                      <span className="lesson-time">{Math.round((result.score / result.total) * 100)}%</span>
                    </div>
                  ))}
                </div>
              ) : <p className="history-empty">Finish a quiz to see your saved results here.</p>}
            </section>
          </section>
        )}
      </main>
      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </div>
  );
}

export default App;

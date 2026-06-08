(function () {
  "use strict";

  const CONFIG = {
    securityEnabled: true,

    devtoolLibraryUrl: "https://cdn.jsdelivr.net/npm/disable-devtool@latest/disable-devtool.min.js",

    redirectOnDevTools: true,
    redirectUrl: "../kehamhai.html",

    blurPageOnDevTools: true,
    clearConsoleLoop: true,
    debuggerLoopOnDevTools: true,

    iframeBlockerEnabled: false,
    shortcutBlockerEnabled: true,
    rightClickBlockerEnabled: true,
    fallbackDevToolsDetectionEnabled: true,

    iframeRedirectUrl: "../kehamhai.html",

    // ✅ Origin / domain protection
    originProtectionEnabled: true,

    // ✅ Mtaiirus allowed domains
    allowedOrigins: [
      "https://mtaiirus.pages.dev",
      "https://www.mtaiirus.pages.dev",
      "https://mtaiirus.vercel.app",
      "https://www.mtaiirus.vercel.app",
      "http://localhost:5600",
      "http://localhost:5500"
    ],

    // ✅ Redirect for blocked origins
    blockedOriginRedirectUrl: "../kehamhai.html"
  };

  // Agar master switch OFF hai to pura code yahi ruk jayega
  if (!CONFIG.securityEnabled) {
    console.log("Mtaiirus security is disabled for development.");
    return;
  }

  function normalizeOrigin(origin) {
    try {
      return new URL(origin).origin;
    } catch (error) {
      return "";
    }
  }

  function isAllowedOrigin(origin) {
    const cleanOrigin = normalizeOrigin(origin);
    return CONFIG.allowedOrigins.includes(cleanOrigin);
  }

  function getAllowedHostnames() {
    return CONFIG.allowedOrigins
      .map(function (origin) {
        try {
          return new URL(origin).hostname;
        } catch (error) {
          return "";
        }
      })
      .filter(Boolean);
  }

  function redirectToOriginalSite() {
    try {
      if (window.location.href !== CONFIG.blockedOriginRedirectUrl) {
        window.location.replace(CONFIG.blockedOriginRedirectUrl);
      }
    } catch (error) {
      window.location.href = CONFIG.blockedOriginRedirectUrl;
    }
  }

  function checkOriginProtection() {
    if (!CONFIG.originProtectionEnabled) return;

    const currentOrigin = window.location.origin;
    const currentHostname = window.location.hostname;
    const allowedHostnames = getAllowedHostnames();

    const isCurrentOriginAllowed =
      isAllowedOrigin(currentOrigin) || allowedHostnames.includes(currentHostname);

    // ✅ Page khud sirf allowedOrigins wale domains par chalega
    if (!isCurrentOriginAllowed) {
      redirectToOriginalSite();
      return;
    }

    // ✅ Agar page iframe me hai to parent/referrer bhi allowedOrigins me hona chahiye
    if (window.top !== window.self) {
      const referrer = document.referrer;

      // Agar browser referrer de raha hai, to uska origin check karo
      if (referrer) {
        const referrerOrigin = normalizeOrigin(referrer);

        // ✅ Jo allowedOrigins me hai, usko iframe access milega
        if (isAllowedOrigin(referrerOrigin)) {
          return;
        }

        // ❌ Jo allowedOrigins me nahi hai, usko block/redirect
        redirectToOriginalSite();
        return;
      }

      // ⚠️ Referrer empty ho sakta hai agar parent ne no-referrer policy lagayi ho
      // Safe side: empty referrer ko block kar rahe hain
      redirectToOriginalSite();
      return;
    }
  }

  function blockIframe() {
    if (!CONFIG.iframeBlockerEnabled) return;

    if (window.top !== window.self) {
      try {
        const referrer = document.referrer;
        const referrerOrigin = referrer ? normalizeOrigin(referrer) : "";

        // ✅ Jo bhi allowedOrigins me hai, un sabko iframe access milega
        if (
          CONFIG.originProtectionEnabled &&
          referrerOrigin &&
          isAllowedOrigin(referrerOrigin)
        ) {
          return;
        }

        // ❌ Jo allowedOrigins me nahi hai, usko iframe access nahi milega
        window.top.location = CONFIG.iframeRedirectUrl;
      } catch (error) {
        window.self.location.href = CONFIG.iframeRedirectUrl;
      }
    }
  }

  function clearConsole() {
    try {
      console.clear();
      console.log(
        "%cProtected by Mtaiirus",
        "font-size:18px;font-weight:700;color:#D4540E;"
      );
    } catch (error) {}
  }

  function lockPage() {
    if (CONFIG.blurPageOnDevTools) {
      document.documentElement.style.filter = "blur(8px)";
      document.body.style.pointerEvents = "none";
      document.body.style.userSelect = "none";
    }

    if (CONFIG.redirectOnDevTools) {
      location.replace(CONFIG.redirectUrl);
    }
  }

  function unlockPage() {
    document.documentElement.style.filter = "";
    document.body.style.pointerEvents = "";
    document.body.style.userSelect = "";
  }

  let devToolsDetected = false;
  let debuggerTimer = null;

  function startDebuggerLoop() {
    if (!CONFIG.debuggerLoopOnDevTools) return;
    if (debuggerTimer) return;

    debuggerTimer = setInterval(function () {
      if (devToolsDetected) {
        debugger;
      }
    }, 500);
  }

  function stopDebuggerLoop() {
    if (debuggerTimer) {
      clearInterval(debuggerTimer);
      debuggerTimer = null;
    }
  }

  function handleDevToolsOpen() {
    devToolsDetected = true;
    clearConsole();
    lockPage();
    startDebuggerLoop();
  }

  function handleDevToolsClose() {
    devToolsDetected = false;
    unlockPage();
    stopDebuggerLoop();
  }

  function loadScript(src, callback) {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;

    script.onload = function () {
      if (typeof callback === "function") callback();
    };

    script.onerror = function () {
      console.warn("DevTool blocker library load nahi ho payi. Fallback active hai.");
    };

    document.head.appendChild(script);
  }

  function initDisableDevtoolLibrary() {
    if (!window.DisableDevtool) {
      return;
    }

    window.DisableDevtool({
      md5: "",
      url: CONFIG.redirectOnDevTools ? CONFIG.redirectUrl : "",
      tkName: "ddtk",

      disableMenu: true,
      disableSelect: false,
      disableCopy: false,
      disableCut: false,
      disablePaste: false,

      clearLog: true,
      detectors: "all",

      ondevtoolopen: function () {
        handleDevToolsOpen();
      },

      ondevtoolclose: function () {
        handleDevToolsClose();
      }
    });
  }

  function fallbackDevToolsDetection() {
    if (!CONFIG.fallbackDevToolsDetectionEnabled) return;

    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;

    if (widthDiff > 160 || heightDiff > 160) {
      if (!devToolsDetected) {
        handleDevToolsOpen();
      }
    } else {
      if (devToolsDetected) {
        handleDevToolsClose();
      }
    }
  }

  function blockShortcuts() {
    if (!CONFIG.shortcutBlockerEnabled) return;

    document.addEventListener(
      "keydown",
      function (event) {
        const key = event.key.toLowerCase();

        const blocked =
          event.key === "F12" ||
          (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key)) ||
          (event.ctrlKey && key === "u") ||
          (event.ctrlKey && key === "s");

        if (blocked) {
          event.preventDefault();
          event.stopPropagation();
          clearConsole();
          handleDevToolsOpen();
          return false;
        }
      },
      true
    );
  }

  function blockRightClick() {
    if (!CONFIG.rightClickBlockerEnabled) return;

    document.addEventListener(
      "contextmenu",
      function (event) {
        event.preventDefault();
        clearConsole();
        return false;
      },
      true
    );
  }

  function startSecurity() {
    // ✅ Sabse pehle origin check
    checkOriginProtection();

    // ✅ Iframe check
    blockIframe();

    clearConsole();
    blockShortcuts();
    blockRightClick();

    loadScript(CONFIG.devtoolLibraryUrl, function () {
      initDisableDevtoolLibrary();
    });

    if (CONFIG.originProtectionEnabled) {
      setInterval(checkOriginProtection, 1000);
    }

    if (CONFIG.iframeBlockerEnabled) {
      setInterval(blockIframe, 1000);
    }

    if (CONFIG.fallbackDevToolsDetectionEnabled) {
      setInterval(fallbackDevToolsDetection, 800);
    }

    if (CONFIG.clearConsoleLoop) {
      setInterval(clearConsole, 1500);
    }
  }

  // ✅ Page start hote hi immediate origin + iframe check
  checkOriginProtection();
  blockIframe();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startSecurity);
  } else {
    startSecurity();
  }
})();
